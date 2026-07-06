/**
 * 认证相关接口（对接 XuYa-Max）
 *
 * - POST /auth/login   登录（请求体加密，不携带 token）
 * - GET  /auth/code    获取图片验证码（不携带 token）
 * - POST /auth/logout  登出
 * - GET  /system/user/getInfo  获取当前登录用户信息（含 permissions / roles）
 *
 * @module api/auth
 */
import request from '@/utils/http'

/** PC 端客户端授权 id（后端 sys_client 表对应值） */
const CLIENT_ID = import.meta.env.VITE_APP_CLIENT_ID

/**
 * 登录
 * @param params 登录参数 { username, password, code, uuid }
 * @returns 登录响应（含 access_token）
 */
export function fetchLogin(params: Api.Auth.LoginParams): Promise<Api.Auth.LoginResponse> {
  const data = {
    ...params,
    clientId: params.clientId || CLIENT_ID,
    grantType: params.grantType || 'password'
  }
  return request.post<Api.Auth.LoginResponse>({
    url: '/auth/login',
    data,
    headers: { isToken: false, isEncrypt: 'true', repeatSubmit: false }
  })
}

/**
 * 获取图片验证码
 * @returns { captchaEnabled, uuid, img(base64) }
 */
export function fetchGetCaptcha(): Promise<Api.Auth.CaptchaResult> {
  return request.get<Api.Auth.CaptchaResult>({
    url: '/auth/code',
    headers: { isToken: false },
    timeout: 20000
  })
}

/**
 * 登出
 */
export function fetchLogout(): Promise<void> {
  return request.post<void>({
    url: '/auth/logout'
  })
}

/**
 * 注册
 * @param data 注册参数
 */
export function fetchRegister(data: Partial<Api.Auth.LoginParams>): Promise<void> {
  const params = {
    ...data,
    clientId: CLIENT_ID,
    grantType: 'password'
  }
  return request.post<void>({
    url: '/auth/register',
    headers: { isToken: false, isEncrypt: 'true', repeatSubmit: false },
    data: params
  })
}

/**
 * 获取当前登录用户信息
 *
 * 后端返回 { user, permissions, roles }，这里映射为 art 的 UserInfo 结构：
 * - permissions → buttons
 * - roles → roles
 * - user 字段拍平到顶层
 */
export function fetchGetUserInfo(): Promise<Api.Auth.UserInfo> {
  return request.get<any>({
    url: '/system/user/getInfo'
  }).then((data: any) => {
    const user = data?.user || {}
    return {
      buttons: data?.permissions || [],
      roles: data?.roles || [],
      userId: user.userId,
      userName: user.userName,
      nickName: user.nickName,
      email: user.email,
      phonenumber: user.phonenumber,
      avatar: user.avatar,
      deptId: user.deptId,
      deptName: user.deptName
    } as Api.Auth.UserInfo
  })
}
