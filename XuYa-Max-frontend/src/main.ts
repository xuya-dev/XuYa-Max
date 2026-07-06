import App from './App.vue'
import { createApp } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { initStore } from './store'                 // Store
import { initRouter } from './router'               // Router
import language from './locales'                    // 国际化
import '@styles/core/tailwind.css'                  // tailwind
import '@styles/index.scss'                         // 样式
import '@utils/sys/console.ts'                      // 控制台输出内容
import { setupGlobDirectives } from './directives'
import { setupErrorHandle } from './utils/sys/error-handle'
import { setupIconifyOffline } from '@/utils/ui/iconify-loader'

document.addEventListener(
  'touchstart',
  function () {},
  { passive: false }
)

// 注册离线 Iconify 图标集（Remix Icon），内网环境无需联网即可渲染菜单/按钮图标
setupIconifyOffline()

const app = createApp(App)
// 全局注册 Element Plus 所有图标组件
// 业务页面里按钮/菜单大量使用 `icon="Plus"` 这种「字符串图标名」形式，
// Element Plus 会用 <component :is="iconName"> 渲染，必须全局注册图标才能解析。
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
initStore(app)
initRouter(app)
setupGlobDirectives(app)
setupErrorHandle(app)

app.use(language)
app.mount('#app')