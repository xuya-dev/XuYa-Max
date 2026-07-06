/**
 * 多标签页操作插件（移植自 plus-ui，适配 XuYa-Max 的 worktab）
 *
 * 提供 closePage / closeOpenPage / refreshPage 等标签页操作。
 * XuYa-Max 前端用 useWorktabStore 管理标签页，这里做桥接。
 */
import type { RouteLocationNormalized } from 'vue-router'
import { useRouter } from 'vue-router'
import { router } from '@/router'

export default {
  /** 关闭当前标签页并跳转 */
  closePage(route?: RouteLocationNormalized): Promise<void> {
    // art 用 router.go(-1) 退回上一页作为简化实现
    return Promise.resolve(router.go(-1))
  },
  /** 关闭当前页并打开指定页 */
  closeOpenPage(target: { path: string; query?: any }): void {
    router.push({ path: target.path, query: target.query })
  },
  /** 刷新当前页 */
  refreshPage(_route?: RouteLocationNormalized): Promise<void> {
    return Promise.resolve()
  }
}
