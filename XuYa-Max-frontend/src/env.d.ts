/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 系统名称（侧边栏 / 登录页 / 水印显示） */
  readonly VITE_APP_NAME?: string
  /** 页面标题（浏览器 tab 后缀） */
  readonly VITE_APP_TITLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'nprogress'

declare module 'crypto-js'

declare module 'vue-img-cutter'

declare module 'file-saver'

declare module 'qrcode.vue' {
  export type Level = 'L' | 'M' | 'Q' | 'H'
  export type RenderAs = 'canvas' | 'svg'
  export type GradientType = 'linear' | 'radial'
  export interface ImageSettings {
    src: string
    height: number
    width: number
    excavate: boolean
  }
  export interface QRCodeProps {
    value: string
    size?: number
    level?: Level
    background?: string
    foreground?: string
    renderAs?: RenderAs
  }
  const QrcodeVue: any
  export default QrcodeVue
}

// 全局变量声明
declare const __APP_VERSION__: string // 版本号

// @wangeditor/editor-for-vue 的 package.json "exports" 未声明 "types"，
// 导致 TS 无法解析其类型声明，这里手动补充模块声明。
declare module '@wangeditor/editor-for-vue' {
  import type { DefineComponent } from 'vue'
  export const Editor: DefineComponent<Record<string, any>>
  export const Toolbar: DefineComponent<Record<string, any>>
}
