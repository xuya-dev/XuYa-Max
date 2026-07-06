/**
 * API 公共类型（与全局 d.ts 声明保持一致，提供 import 方式访问）
 *
 * 注意：PageQuery / PageResult / BaseEntity / ElTagType 已在 src/types/xuya.d.ts
 * 中作为全局 interface 声明，可直接使用。此文件仅为 import 场景提供具名导出。
 */

/** 登录请求参数 */
export interface LoginData {
  username?: string
  password?: string
  rememberMe?: boolean
  socialCode?: string
  socialState?: string
  source?: string
  code?: string
  uuid?: string
  clientId?: string
  grantType?: string
}

/** 登录响应 */
export interface LoginResult {
  access_token: string
  expire_in?: number
  client_id?: string
}

/** 验证码返回 */
export interface VerifyCodeResult {
  captchaEnabled: boolean
  uuid?: string
  img?: string
}

// 注：PageResult / PageQuery / BaseEntity / ElTagType 已在
// src/types/xuya.d.ts 作为全局 interface 声明，无需从此处导入，直接使用即可。
