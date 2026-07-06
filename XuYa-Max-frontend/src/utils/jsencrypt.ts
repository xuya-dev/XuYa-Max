/**
 * RSA 加密工具（对接 XuYa-Max-Max 后端 api-decrypt）
 *
 * 约定：
 * - 前端用 RSA 公钥加密 AES 密钥，放入 encrypt-key 请求头；后端用对应私钥解出 AES 密钥。
 * - 前端用 RSA 私钥解密响应中的 AES 密钥；后端用对应公钥加密。
 * - 密钥需与后端 application.yml 的 api-decrypt.publicKey / privateKey 严格配对。
 *
 * @module utils/jsencrypt
 */
import { JSEncrypt } from 'jsencrypt'

const publicKey = import.meta.env.VITE_APP_RSA_PUBLIC_KEY
const privateKey = import.meta.env.VITE_APP_RSA_PRIVATE_KEY

/** 使用公钥加密 */
export const encrypt = (txt: string): string | false => {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKey)
  return encryptor.encrypt(txt)
}

/** 使用私钥解密 */
export const decrypt = (txt: string): string | false => {
  const encryptor = new JSEncrypt()
  encryptor.setPrivateKey(privateKey)
  return encryptor.decrypt(txt)
}
