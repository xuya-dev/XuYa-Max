/**
 * v-auth / v-hasPermi 权限指令（对接 XuYa-Max）
 *
 * 基于 userStore.permissions（按钮权限标识集合）控制 DOM 元素的显示和隐藏。
 * 如果用户没有对应权限，元素将从 DOM 中移除。
 *
 * ## 主要功能
 *
 * - 权限验证：根据 userStore.permissions 校验用户是否拥有指定权限
 * - 通配支持：拥有 `*:*:*` 通配权限视为全权
 * - 多权限支持：传入数组时满足其一即可
 * - DOM 控制：无权限时自动移除元素，而非隐藏
 *
 * ## 使用示例
 *
 * ```vue
 * <!-- 单个权限标识 -->
 * <el-button v-auth="'system:user:add'">新增</el-button>
 *
 * <!-- 多个权限标识（满足其一即可） -->
 * <el-button v-auth="['system:user:add', 'system:user:edit']">操作</el-button>
 *
 * <!-- 兼容 plus-ui 写法的别名 -->
 * <el-button v-hasPermi="['system:user:add']">新增</el-button>
 * ```
 *
 * @module directives/auth
 */
import { useUserStore } from '@/store/modules/user'
import { App, Directive, DirectiveBinding } from 'vue'

export type AuthDirective = Directive<HTMLElement, string | string[]>

/** 通配权限：拥有该权限视为全权 */
const ALL_PERMISSION = '*:*:*'

function checkAuthPermission(el: HTMLElement, binding: DirectiveBinding<string | string[]>): void {
  const { permissions } = useUserStore()

  // 确保指令值为数组格式
  const requiredPermissions = Array.isArray(binding.value) ? binding.value : [binding.value]

  if (!requiredPermissions.length) {
    console.warn(`[v-auth] 需要传入权限标识，如 v-auth="'system:user:add'"`)
    removeElement(el)
    return
  }

  // 拥有通配权限 或 包含任一所需权限即视为有权限
  const hasPermission = permissions.some(
    (permi: string) => permi === ALL_PERMISSION || requiredPermissions.includes(permi)
  )

  // 无权限则移除元素
  if (!hasPermission) {
    removeElement(el)
  }
}

function removeElement(el: HTMLElement): void {
  if (el.parentNode) {
    el.parentNode.removeChild(el)
  }
}

const authDirective: AuthDirective = {
  mounted: checkAuthPermission,
  updated: checkAuthPermission
}

export function setupAuthDirective(app: App): void {
  app.directive('auth', authDirective)
  // 兼容 plus-ui 的 v-hasPermi / v-hasPermi 写法
  app.directive('hasPermi', authDirective)
}
