/**
 * v-roles / v-hasRoles 角色权限指令（对接 XuYa-Max）
 *
 * 基于用户角色控制 DOM 元素的显示和隐藏。
 * 只要用户拥有指定角色中的任意一个，元素就会显示，否则从 DOM 中移除。
 * 拥有 `admin` / `superadmin` 角色视为全权（XuYa 约定）。
 *
 * ## 主要功能
 *
 * - 角色验证：检查 userStore.roles 是否包含指定角色
 * - 超管通配：拥有 admin / superadmin 角色视为全权
 * - 多角色支持：传入数组时满足其一即可
 * - DOM 控制：无权限时自动移除元素，而非隐藏
 *
 * ## 使用示例
 *
 * ```vue
 * <!-- 单个角色 -->
 * <el-button v-roles="'admin'">管理员功能</el-button>
 *
 * <!-- 多个角色（满足其一即可） -->
 * <el-button v-roles="['admin', 'common']">管理员功能</el-button>
 *
 * <!-- 兼容 plus-ui 写法的别名 -->
 * <el-button v-hasRoles="['admin']">管理员功能</el-button>
 * ```
 *
 * @module directives/roles
 */
import { useUserStore } from '@/store/modules/user'
import { App, Directive, DirectiveBinding } from 'vue'

export type RolesDirective = Directive<HTMLElement, string | string[]>

/** 超级管理员角色（拥有其一即视为全权） */
const SUPER_ADMIN_ROLES = ['admin', 'superadmin']

function checkRolePermission(el: HTMLElement, binding: DirectiveBinding<string | string[]>): void {
  const userStore = useUserStore()
  const userRoles = userStore.roles || []

  // 如果用户角色为空或未定义，移除元素
  if (!userRoles.length) {
    removeElement(el)
    return
  }

  // 确保指令值为数组格式
  const requiredRoles = Array.isArray(binding.value) ? binding.value : [binding.value]

  // 拥有超管角色 或 包含任一所需角色即视为有权限
  const hasPermission = userRoles.some(
    (role: string) => SUPER_ADMIN_ROLES.includes(role) || requiredRoles.includes(role)
  )

  // 如果没有权限，安全地移除元素
  if (!hasPermission) {
    removeElement(el)
  }
}

function removeElement(el: HTMLElement): void {
  if (el.parentNode) {
    el.parentNode.removeChild(el)
  }
}

const rolesDirective: RolesDirective = {
  mounted: checkRolePermission,
  updated: checkRolePermission
}

export function setupRolesDirective(app: App): void {
  app.directive('roles', rolesDirective)
  // 兼容 plus-ui 的 v-hasRoles 写法
  app.directive('hasRoles', rolesDirective)
}
