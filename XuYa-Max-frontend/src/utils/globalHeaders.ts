/**
 * 全局请求头工具
 *
 * 用于 el-upload 等绕过 axios 拦截器直传后端的场景，手动注入鉴权头。
 * 对应 plus-ui request.ts 的 globalHeaders。
 *
 * @module utils/globalHeaders
 */
import { useUserStore } from '@/store/modules/user'

/**
 * 获取全局鉴权头（Authorization + clientid）
 * 用于 el-upload 的 :headers
 */
export const globalHeaders = (): Record<string, string> => {
  const { accessToken } = useUserStore()
  const headers: Record<string, string> = {
    clientid: import.meta.env.VITE_APP_CLIENT_ID
  }
  if (accessToken) {
    headers['Authorization'] = 'Bearer ' + accessToken
  }
  return headers
}
