/**
 * 401「重新登录」弹框状态（独立模块，避免循环依赖）
 *
 * 路由守卫在动态路由初始化期间会预占此标记（setReloginSuppress(true)），
 * 让 axios 401 拦截器跳过 confirm 框弹窗 —— 由守卫统一处理跳转登录页。
 * 初始化成功或失败后释放标记。
 *
 * 为什么独立成模块：http/index.ts 导入了 router（@/router），
 * 而 router 守卫又需要导入 http 的状态，形成循环依赖。
 * 独立的无依赖模块可避免循环引用导致的实例不一致问题。
 */

/** 是否抑制 401 弹框（路由初始化期间为 true） */
let suppressed = false

/** 标记是否已有「重新登录」弹框正在显示（防抖，避免并发请求重复弹） */
let showing = false

export function setReloginSuppress(value: boolean): void {
  suppressed = value
}

export function isReloginSuppressed(): boolean {
  return suppressed
}

export function setReloginShowing(value: boolean): void {
  showing = value
}

export function isReloginShowing(): boolean {
  return showing
}
