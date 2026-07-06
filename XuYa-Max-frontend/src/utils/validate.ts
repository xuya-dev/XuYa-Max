/**
 * 通用校验工具（移植自 plus-ui/src/utils/validate.ts）
 */

/** 判断字符串是否为外链（http/https） */
export const isHttp = (url: string): boolean => {
  return url.indexOf('http://') !== -1 || url.indexOf('https://') !== -1
}

/** 判断字符串是否为外链或邮件 */
export const isExternal = (path: string): boolean => {
  return /^(https?:|mailto:|tel:)/.test(path)
}

/** 判断是否为合法数组 */
export const isArray = (arg: any): boolean => {
  return Array.isArray(arg)
}

/** 判断是否为有效 URL */
export function validURL(url: string): boolean {
  const reg = /^(https?|ftp):\/\/([^\s:/?#]+)(:[0-9]+)?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i
  return reg.test(url)
}

/** 判断是否为小写字母 */
export function validLowerCase(str: string): boolean {
  const reg = /^[a-z]+$/
  return reg.test(str)
}

/** 判断是否为大写字母 */
export function validUpperCase(str: string): boolean {
  const reg = /^[A-Z]+$/
  return reg.test(str)
}

/** 判断是否为字母 */
export function validAlphabets(str: string): boolean {
  const reg = /^[A-Za-z]+$/
  return reg.test(str)
}

/** 判断是否为邮箱 */
export function validEmail(email: string): boolean {
  const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return reg.test(email)
}

/** 判断是否为字符串 */
export function isString(str: any): boolean {
  return typeof str === 'string' || str instanceof String
}

/** 判断是否为数字 */
export function isNumber(str: any): boolean {
  return typeof str === 'number' && !isNaN(str)
}

/**
 * 路径模式匹配（支持 * 通配符）
 * 用于路由白名单校验，如 '/register*' 匹配 '/register'、'/register/xxx'
 * @param pattern 模式串
 * @param path 实际路径
 */
export function isPathMatch(pattern: string, path: string): boolean {
  const regexPattern = pattern.replace(/\*/g, '.*')
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(path)
}
