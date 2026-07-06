/**
 * AES 加密工具（对接 XuYa-Max-Max 后端 api-decrypt）
 *
 * 后端约定：AES 模式为 ECB / PKCS5Padding（与 PKCS7 等价），无 IV。
 * 对应后端 EncryptUtils.encryptByAes：SecureUtil.aes(key).encryptBase64(data)
 *
 * @module utils/crypto
 */
import * as CryptoJSModule from 'crypto-js'

// 兼容 crypto-js 的 CJS/ESM 默认导出差异
const CryptoJS = ('default' in CryptoJSModule ? CryptoJSModule.default : CryptoJSModule) as typeof CryptoJSModule

/**
 * 随机生成 32 位字符串（即 16 字节 AES 密钥的 hex 表示）
 */
const generateRandomString = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

/**
 * 随机生成 AES 密钥（WordArray）
 */
export const generateAesKey = (): any => {
  return CryptoJS.enc.Utf8.parse(generateRandomString())
}

/**
 * Base64 编码（WordArray → base64 字符串）
 */
export const encryptBase64 = (str: any): string => {
  return CryptoJS.enc.Base64.stringify(str)
}

/**
 * Base64 解码（base64 字符串 → WordArray）
 */
export const decryptBase64 = (str: string) => {
  return CryptoJS.enc.Base64.parse(str)
}

/**
 * 使用 AES 密钥加密数据（ECB / PKCS7）
 */
export const encryptWithAes = (message: string, aesKey: any): string => {
  const encrypted = CryptoJS.AES.encrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.toString()
}

/**
 * 使用 AES 密钥解密数据（ECB / PKCS7）
 */
export const decryptWithAes = (message: string, aesKey: any): string => {
  const decrypted = CryptoJS.AES.decrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}
