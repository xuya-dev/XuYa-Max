/**
 * HTTP 请求封装模块
 * 基于 Axios 封装，对接 XuYa-Max-Max 后端（Sa-Token + JWT + api-decrypt 加密）。
 *
 * ## 主要功能
 *
 * - 请求拦截器：自动注入 `Authorization: Bearer xxx` 与 `clientid` 头
 * - 接口加密：对标记 `isEncrypt: 'true'` 的 POST/PUT 请求体做 AES + RSA 加密（与后端 api-decrypt 对应）
 * - 防重复提交：POST/PUT 500ms 内相同 url+data 视为重复（`repeatSubmit: false` 可关闭）
 * - GET 参数序列化：使用 tansParams 支持嵌套对象 `prop[key]=val`
 * - 响应拦截器：按 XuYa-Max 业务 code 分流（200 成功 / 401 重登录 / 500 error / 601 warn / 其它 notify）
 * - 401 防抖：避免并发请求重复弹「重新登录」
 * - blob / arraybuffer 直接返回，支持文件下载
 * - 通用 download 方法
 *
 * ## 请求头开关（自定义 header）
 *
 * - `isToken: false`      本次请求不携带 token（如登录、验证码）
 * - `repeatSubmit: false` 关闭本次请求的防重复校验
 * - `isEncrypt: 'true'`   对本次请求体加密（需 VITE_APP_ENCRYPT=true，如登录 /auth/login）
 *
 * @module utils/http
 */
import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox, ElNotification, ElLoading } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { ApiStatus } from './status'
import { HttpError, handleError, showError, showSuccess } from './error'
import { $t } from '@/locales'
import { BaseResponse } from '@/types'
import { encryptBase64, encryptWithAes, decryptBase64, decryptWithAes, generateAesKey } from '@/utils/crypto'
import { decrypt, encrypt } from '@/utils/jsencrypt'
import { blobValidate, tansParams } from '@/utils/xuya-max'
import cache from '@/plugins/cache'
import { errorCode } from '@/utils/errorCode'
import { saveBlob } from '@/utils/save'
import { router } from '@/router'

/** 请求配置常量 */
const REQUEST_TIMEOUT = 60000
const LOGOUT_DELAY = 500
const MAX_RETRIES = 0
const RETRY_DELAY = 1000
const UNAUTHORIZED_DEBOUNCE_TIME = 3000
/** 防重复提交间隔（ms） */
const REPEAT_SUBMIT_INTERVAL = 500
/** AES 密钥的请求头标识 */
const ENCRYPT_HEADER = 'encrypt-key'

/** 扩展 AxiosRequestConfig，支持业务消息控制与 XuYa 自定义请求头开关 */
export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  /** 错误时是否自动提示（默认 true） */
  showErrorMessage?: boolean
  /** 成功时是否自动提示（默认 false） */
  showSuccessMessage?: boolean
}

/** XuYa-Max 业务状态码 */
const BizCode = {
  SUCCESS: 200,
  UNAUTHORIZED: 401,
  SERVER_ERROR: 500,
  WARN: 601
} as const

const { VITE_API_URL, VITE_WITH_CREDENTIALS, VITE_APP_ENCRYPT, VITE_APP_CLIENT_ID } = import.meta.env

/** Axios 实例 */
const axiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT,
  baseURL: VITE_API_URL,
  withCredentials: VITE_WITH_CREDENTIALS === 'true',
  validateStatus: (status) => status >= 200 && status < 300,
  transformResponse: [
    (data, headers) => {
      const contentType = headers?.['content-type'] as string | undefined
      if (contentType?.includes('application/json')) {
        try {
          return JSON.parse(data)
        } catch {
          return data
        }
      }
      return data
    }
  ]
})

axiosInstance.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

/** 401 防抖状态 */
let isUnauthorizedErrorShown = false
let unauthorizedTimer: ReturnType<typeof setTimeout> | null = null

// 401「重新登录」弹框状态：用独立无依赖模块管理，避免与路由守卫的循环依赖。
// isRelogin 对象保留导出仅为向后兼容（外部若有引用），内部逻辑改用函数式 API。
import {
  setReloginShowing,
  isReloginShowing,
  isReloginSuppressed,
  setReloginSuppress
} from './relogin-state'
export const isRelogin = {
  get show() {
    return isReloginShowing()
  },
  set show(v: boolean) {
    setReloginShowing(v)
  }
}
export { setReloginSuppress, isReloginSuppressed }

/**
 * 创建一个「已被 UI 处理」的错误，便于上层静默处理
 * @param message 错误消息
 * @param code 可选业务码（如 401 表示会话过期，路由守卫据此区分跳登录页还是 500 页）
 */
function createHandledError(message: string, code?: number) {
  const error = new Error(message) as Error & { isHandled?: boolean; code?: number }
  error.isHandled = true
  if (code !== undefined) {
    error.code = code
  }
  return error
}

export function isHandledRequestError(error: unknown) {
  return Boolean((error as { isHandled?: boolean } | undefined)?.isHandled)
}

/**
 * 判断错误是否为会话过期（401）
 * 用于路由守卫区分：会话过期应跳登录页，其它错误才跳 500。
 */
export function isSessionExpiredError(error: unknown): boolean {
  const code = (error as { code?: number } | undefined)?.code
  return code === BizCode.UNAUTHORIZED
}

/**
 * 请求拦截器
 *
 * 处理：token 注入、clientid、Content-Language、GET 参数序列化、防重复提交、请求体加密
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const headers = config.headers as any
    // 是否携带 token（默认携带，isToken:false 时跳过）
    const isToken = headers?.isToken === false
    // 是否开启防重复提交（默认开启，repeatSubmit:false 时跳过）
    const isRepeatSubmit = headers?.repeatSubmit === false
    // 是否加密请求体
    const isEncrypt = headers?.isEncrypt === 'true'

    // 统一注入 clientid（XuYa-Max 后端每个请求必传）
    headers['clientid'] = VITE_APP_CLIENT_ID
    headers['Content-Language'] = 'zh-cn'

    // token 注入：Authorization: Bearer xxx
    // token 来源统一为 user store（已持久化），避免双数据源
    const { accessToken } = useUserStore()
    if (accessToken && !isToken) {
      headers['Authorization'] = 'Bearer ' + accessToken
    }

    // GET 请求：用 tansParams 序列化 params（支持嵌套对象）
    if (config.method === 'get' && config.params) {
      let url = config.url + '?' + tansParams(config.params)
      url = url.slice(0, -1)
      config.params = {}
      config.url = url
    }

    // 防重复提交（仅 POST / PUT）
    if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
      const requestObj = {
        url: config.url,
        data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
        time: new Date().getTime()
      }
      const sessionObj = cache.session.getJSON('sessionObj')
      if (sessionObj === undefined || sessionObj === null || sessionObj === '') {
        cache.session.setJSON('sessionObj', requestObj)
      } else {
        const interval = REPEAT_SUBMIT_INTERVAL
        if (
          sessionObj.data === requestObj.data &&
          requestObj.time - sessionObj.time < interval &&
          sessionObj.url === requestObj.url
        ) {
          const message = '数据正在处理，请勿重复提交'
          console.warn(`[${sessionObj.url}]: ` + message)
          return Promise.reject(new Error(message))
        } else {
          cache.session.setJSON('sessionObj', requestObj)
        }
      }
    }

    // 请求体加密：仅当全局开启加密且接口标记 isEncrypt
    if (VITE_APP_ENCRYPT === 'true' && isEncrypt && (config.method === 'post' || config.method === 'put')) {
      const aesKey = generateAesKey()
      headers[ENCRYPT_HEADER] = encrypt(encryptBase64(aesKey))
      config.data =
        typeof config.data === 'object'
          ? encryptWithAes(JSON.stringify(config.data), aesKey)
          : encryptWithAes(config.data, aesKey)
    }

    // FormData 时移除默认 Content-Type，由浏览器自动设置 boundary
    if (config.data instanceof FormData) {
      delete headers['Content-Type']
    }

    return config
  },
  (error) => {
    showError(createHttpError($t('httpMsg.requestConfigError'), ApiStatus.error))
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 *
 * 处理：响应解密、业务 code 分流、blob 直返、401 防抖重登录
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const headers = response.headers as any
    // 响应解密：若后端返回加密的 AES 密钥，则解密响应体
    if (VITE_APP_ENCRYPT === 'true') {
      const keyStr = headers[ENCRYPT_HEADER]
      if (keyStr != null && keyStr !== '') {
        const base64Str = decrypt(keyStr as string)
        if (base64Str) {
          const aesKey = decryptBase64(base64Str.toString())
          const decryptData = decryptWithAes(response.data, aesKey)
          response.data = JSON.parse(decryptData)
        }
      }
    }

    // 二进制响应直接返回（文件下载）
    if (response.request?.responseType === 'blob' || response.request?.responseType === 'arraybuffer') {
      return response.data
    }

    const code = response.data?.code || BizCode.SUCCESS
    const msg = response.data?.msg || errorCode[code] || errorCode['default']

    // 业务码分流
    if (code === BizCode.SUCCESS) {
      return response
    } else if (code === BizCode.UNAUTHORIZED) {
      // 会话过期处理：
      // - 路由初始化期间（isReloginSuppressed）不弹框，由守卫统一跳登录页
      // - 正常请求期间弹「重新登录」框（防抖，避免并发请求重复弹）
      if (!isReloginSuppressed() && !isReloginShowing()) {
        setReloginShowing(true)
        ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            setReloginShowing(false)
            // 清理本地登录态
            useUserStore().resetLoginState()
            // 跳转登录页，携带当前路径作为 redirect（vue-router 会自动编码，不要手动 encodeURIComponent）
            // 用 currentRoute.path 而非 fullPath，避免把已有的 query（含旧 redirect）再带进去导致嵌套
            router.replace({
              name: 'Login',
              query: { redirect: router.currentRoute.value.path || '/' }
            })
          })
          .catch(() => {
            setReloginShowing(false)
          })
      }
      // reject 带标记的错误对象（而非裸字符串），路由守卫据此识别会话过期，
      // 跳转登录页而非 500 错误页（否则刷新页面时 token 失效会误跳 500）。
      return Promise.reject(createHandledError('无效的会话，或者会话已过期，请重新登录。', BizCode.UNAUTHORIZED))
    } else if (code === BizCode.SERVER_ERROR) {
      ElMessage({ message: msg, type: 'error' })
      return Promise.reject(createHandledError(msg))
    } else if (code === BizCode.WARN) {
      ElMessage({ message: msg, type: 'warning' })
      return Promise.reject(createHandledError(msg))
    } else {
      ElNotification.error({ title: msg })
      return Promise.reject(createHandledError(msg))
    }
  },
  async (error: any) => {
    // HTTP 401
    if (error.response?.status === ApiStatus.unauthorized) {
      handleUnauthorizedError()
    }
    // 提取后端返回的错误信息
    const responseMessage = await parseResponseErrorData(error?.response?.data)
    const message =
      responseMessage ||
      normalizeErrorMessage(error?.message) ||
      errorCode['default']
    ElMessage({ message, type: 'error', duration: 5000 })
    error.isHandled = true
    return Promise.reject(error)
  }
)

/** 规范化网络层错误信息 */
function normalizeErrorMessage(message?: string): string | undefined {
  if (!message) return undefined
  if (message === 'Network Error') return '后端接口连接异常'
  if (message.includes('timeout')) return '系统接口请求超时'
  if (message.includes('Request failed with status code')) {
    return '系统接口' + message.slice(-3) + '异常'
  }
  return message
}

/** 从响应体中解析后端错误信息 */
async function parseResponseErrorData(data: unknown): Promise<string | undefined> {
  if (!data) return undefined
  if (data instanceof Blob) return parseResponseErrorData(await data.text())
  if (data instanceof ArrayBuffer) return parseResponseErrorData(new TextDecoder().decode(data))
  if (typeof data === 'string') {
    const text = data.trim()
    if (!text) return undefined
    try {
      return parseResponseErrorData(JSON.parse(text))
    } catch {
      return text
    }
  }
  if (typeof data === 'object') {
    const payload = data as Record<string, any>
    return payload.msg || payload.message || errorCode[payload.code] || undefined
  }
  return undefined
}

/** 统一创建 HttpError */
function createHttpError(message: string, code: number) {
  return new HttpError(message, code)
}

/** 处理 401 错误（带防抖） */
function handleUnauthorizedError(message?: string): never {
  const error = createHttpError(message || $t('httpMsg.unauthorized'), ApiStatus.unauthorized)

  if (!isUnauthorizedErrorShown) {
    isUnauthorizedErrorShown = true
    logOut()
    unauthorizedTimer = setTimeout(resetUnauthorizedError, UNAUTHORIZED_DEBOUNCE_TIME)
    showError(error, true)
    throw error
  }
  throw error
}

/** 重置 401 防抖状态 */
function resetUnauthorizedError() {
  isUnauthorizedErrorShown = false
  if (unauthorizedTimer) clearTimeout(unauthorizedTimer)
  unauthorizedTimer = null
}

/** 退出登录函数 */
function logOut() {
  setTimeout(() => {
    useUserStore().logOut()
  }, LOGOUT_DELAY)
}

/** 是否需要重试 */
function shouldRetry(statusCode: number) {
  return [
    ApiStatus.requestTimeout,
    ApiStatus.badGateway,
    ApiStatus.serviceUnavailable,
    ApiStatus.gatewayTimeout
  ].includes(statusCode)
}

/** 请求重试逻辑 */
async function retryRequest<T>(config: ExtendedAxiosRequestConfig, retries: number = MAX_RETRIES): Promise<T> {
  try {
    return await request<T>(config)
  } catch (error) {
    if (retries > 0 && error instanceof HttpError && shouldRetry(error.code)) {
      await delay(RETRY_DELAY)
      return retryRequest<T>(config, retries - 1)
    }
    throw error
  }
}

/** 延迟函数 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 请求函数
 *
 * 注：响应拦截器已对业务码做了分流，到这里 response 必然是成功的。
 * 默认返回 `res.data.data`（业务数据）；分页接口返回 `{ rows, total }` 也作为 data 返回。
 */
async function request<T = any>(config: ExtendedAxiosRequestConfig): Promise<T> {
  // POST | PUT：若传了 params 但没传 data，自动将 params 移到 data
  if (
    ['POST', 'PUT'].includes(config.method?.toUpperCase() || '') &&
    config.params &&
    !config.data
  ) {
    config.data = config.params
    config.params = undefined
  }

  try {
    const res = await axiosInstance.request<BaseResponse<T>>(config)

    // 二进制响应（下载）直接返回 res.data
    if (res instanceof Blob || res instanceof ArrayBuffer) {
      return res as unknown as T
    }

    // 显示成功消息
    if (config.showSuccessMessage && res.data?.msg) {
      showSuccess(res.data.msg)
    }

    // 默认返回业务数据 res.data.data
    // 对于分页接口，data 即 { rows, total }，由 useTable 的 responseAdapter 解析
    return res.data.data as T
  } catch (error) {
    if (error instanceof HttpError && error.code !== ApiStatus.unauthorized) {
      const showMsg = config.showErrorMessage !== false
      showError(error, showMsg)
    }
    return Promise.reject(error)
  }
}

/**
 * 通用下载方法
 * @param url 请求地址
 * @param params 请求参数
 * @param fileName 保存的文件名
 */
let downloadLoadingInstance: { close: () => void } | undefined
export function download(url: string, params: any, fileName: string) {
  downloadLoadingInstance = ElLoading.service({
    text: '正在下载数据，请稍候',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  return axiosInstance
    .post(url, params, {
      transformRequest: [(params) => tansParams(params)],
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      responseType: 'blob'
    })
    .then(async (resp: any) => {
      const blobData = resp // responseType=blob 时拦截器返回 response.data
      const isLogin = blobValidate(blobData)
      if (isLogin) {
        const blob = new Blob([blobData])
        saveBlob(blob, fileName)
      } else {
        const blob = new Blob([blobData])
        const resText = await blob.text()
        const rspObj = JSON.parse(resText)
        const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode['default']
        ElMessage.error(errMsg)
      }
      downloadLoadingInstance?.close()
    })
    .catch((r: any) => {
      console.error(r)
      downloadLoadingInstance?.close()
    })
}

/**
 * 通用下载方法（GET 版本）
 *
 * 用于后端用 @GetMapping 暴露的下载接口（如 OSS `/resource/oss/download/{ossId}`），
 * 与上面的 `download`（POST）的区别仅在于 HTTP 方法，其余 loading / blob 校验 / 保存逻辑一致。
 *
 * @param url 请求地址（GET）
 * @param fileName 保存的文件名
 */
export function downloadGet(url: string, fileName: string) {
  downloadLoadingInstance = ElLoading.service({
    text: '正在下载数据，请稍候',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  return axiosInstance
    .get(url, {
      responseType: 'blob'
    })
    .then(async (resp: any) => {
      const blobData = resp // responseType=blob 时拦截器返回 response.data
      const isLogin = blobValidate(blobData)
      if (isLogin) {
        const blob = new Blob([blobData])
        saveBlob(blob, fileName)
      } else {
        const blob = new Blob([blobData])
        const resText = await blob.text()
        const rspObj = JSON.parse(resText)
        const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode['default']
        ElMessage.error(errMsg)
      }
      downloadLoadingInstance?.close()
    })
    .catch((r: any) => {
      console.error(r)
      downloadLoadingInstance?.close()
    })
}

/**
 * API 方法集合
 *
 * 兼容两种调用方式：
 * - art 原生风格：request.get<T>({ url, params }) / request.post / request.put / request.del
 * - 通用/plus-ui 风格：request<T>({ url, method, params/data })（直接调用，透传 method）
 *
 * 前者会在内部强制覆盖 method；后者直接使用 config 里的 method。
 */
function api<T = any>(config: ExtendedAxiosRequestConfig): Promise<T> {
  return retryRequest<T>(config)
}

api.get = function <T>(config: ExtendedAxiosRequestConfig): Promise<T> {
  return retryRequest<T>({ ...config, method: 'GET' })
}
api.post = function <T>(config: ExtendedAxiosRequestConfig): Promise<T> {
  return retryRequest<T>({ ...config, method: 'POST' })
}
api.put = function <T>(config: ExtendedAxiosRequestConfig): Promise<T> {
  return retryRequest<T>({ ...config, method: 'PUT' })
}
api.del = function <T>(config: ExtendedAxiosRequestConfig): Promise<T> {
  return retryRequest<T>({ ...config, method: 'DELETE' })
}
api.request = function <T>(config: ExtendedAxiosRequestConfig): Promise<T> {
  return retryRequest<T>(config)
}
/** axios 实例（供 download 等场景使用） */
api.instance = axiosInstance
/** 通用下载方法 */
api.download = download

export default api
