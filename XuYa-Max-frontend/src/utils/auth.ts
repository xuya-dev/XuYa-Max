/**
 * Token 存取工具
 *
 * 移植自 plus-ui/src/utils/auth.ts，使用 VueUse 的 useStorage（响应式 localStorage）。
 * 仅存储 access_token 字符串本身，Authorization 头的 "Bearer " 前缀在 HTTP 请求拦截器拼接。
 *
 * @module utils/auth
 */
import { useStorage } from '@vueuse/core'

const TokenKey = 'Admin-Token'

const tokenStorage = useStorage<string | null>(TokenKey, null)

/** 获取 token */
export const getToken = (): string | null => tokenStorage.value

/** 设置 token */
export const setToken = (access_token: string | null): void => {
  tokenStorage.value = access_token
}

/** 移除 token */
export const removeToken = (): void => {
  tokenStorage.value = null
}
