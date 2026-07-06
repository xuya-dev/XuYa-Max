/**
 * 路由全局前置守卫模块
 *
 * 提供完整的路由导航守卫功能
 *
 * ## 主要功能
 *
 * - 登录状态验证和重定向
 * - 动态路由注册和权限控制
 * - 菜单数据获取和处理（前端/后端模式）
 * - 用户信息获取和缓存
 * - 页面标题设置
 * - 工作标签页管理
 * - 进度条和加载动画
 * - 静态路由识别和处理
 * - 错误处理和异常跳转
 *
 * ## vue-router 5 适配说明
 *
 * vue-router 5 移除了 `next()` 回调，守卫必须通过 `return` 控制导航：
 * - `return true` / `return undefined` / 直接 `return` → 放行
 * - `return false` → 取消导航
 * - `return { path/name, replace }` → 重定向
 *
 * @module router/guards/beforeEach
 * @author XuYa-Max Team
 */
import type { Router, RouteLocationNormalized } from 'vue-router'
import { nextTick } from 'vue'
import NProgress from 'nprogress'
import { useSettingStore } from '@/store/modules/setting'
import { useUserStore } from '@/store/modules/user'
import { useMenuStore } from '@/store/modules/menu'
import { setWorktab } from '@/utils/navigation'
import { setPageTitle } from '@/utils/router'
import { RoutesAlias } from '../routesAlias'
import { staticRoutes } from '../routes/staticRoutes'
import { loadingService } from '@/utils/ui'
import { useCommon } from '@/hooks/core/useCommon'
import { useWorktabStore } from '@/store/modules/worktab'
import { ApiStatus } from '@/utils/http/status'
import { isHttpError } from '@/utils/http/error'
import { isSessionExpiredError } from '@/utils/http'
import { RouteRegistry, MenuProcessor, IframeRouteManager, RoutePermissionValidator } from '../core'

// 路由注册器实例
let routeRegistry: RouteRegistry | null = null

// 菜单处理器实例
const menuProcessor = new MenuProcessor()

// 跟踪是否需要关闭 loading
let pendingLoading = false

// 路由初始化失败标记，防止死循环
// 一旦设置为 true，只有刷新页面或重新登录才能重置
let routeInitFailed = false

// 路由初始化进行中标记，防止并发请求
let routeInitInProgress = false

/**
 * 获取 pendingLoading 状态
 */
export function getPendingLoading(): boolean {
  return pendingLoading
}

/**
 * 重置 pendingLoading 状态
 */
export function resetPendingLoading(): void {
  pendingLoading = false
}

/**
 * 获取路由初始化失败状态
 */
export function getRouteInitFailed(): boolean {
  return routeInitFailed
}

/**
 * 重置路由初始化状态（用于重新登录场景）
 */
export function resetRouteInitState(): void {
  routeInitFailed = false
  routeInitInProgress = false
}

/**
 * 设置路由全局前置守卫
 */
export function setupBeforeEachGuard(router: Router): void {
  // 初始化路由注册器
  routeRegistry = new RouteRegistry(router)

  router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    try {
      return await handleRouteGuard(to, from, router)
    } catch (error) {
      console.error('[RouteGuard] 路由守卫处理失败:', error)
      closeLoading()
      return { name: 'Exception500' }
    }
  })
}

/**
 * 关闭 loading 效果
 */
function closeLoading(): void {
  if (pendingLoading) {
    nextTick(() => {
      loadingService.hideLoading()
      pendingLoading = false
    })
  }
}

/**
 * 处理路由守卫逻辑
 *
 * 返回值约定（vue-router 5 风格）：
 * - `true` / `undefined`：放行
 * - `false`：取消导航
 * - 路由地址对象：重定向
 */
async function handleRouteGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  router: Router
): Promise<boolean | undefined | Record<string, any>> {
  const settingStore = useSettingStore()
  const userStore = useUserStore()

  // 启动进度条
  if (settingStore.showNprogress) {
    NProgress.start()
  }

  // 1. 检查登录状态
  const loginRedirect = handleLoginStatus(to, userStore)
  if (loginRedirect !== true) {
    return loginRedirect
  }

  // 2. 检查路由初始化是否已失败（防止死循环）
  if (routeInitFailed) {
    // 已经失败过，直接放行到错误页面，不再重试
    if (to.matched.length > 0) {
      return true
    }
    // 未匹配到路由，跳转到 500 页面
    return { name: 'Exception500', replace: true }
  }

  // 3. 处理动态路由注册
  if (!routeRegistry?.isRegistered() && userStore.isLogin) {
    // 防止并发请求（快速连续导航场景）
    if (routeInitInProgress) {
      // 正在初始化中，等待完成后重新导航
      return false
    }
    return await handleDynamicRoutes(to, router)
  }

  // 4. 处理根路径重定向
  const rootRedirect = handleRootPathRedirect(to)
  if (rootRedirect !== false) {
    return rootRedirect
  }

  // 5. 处理已匹配的路由
  if (to.matched.length > 0) {
    setWorktab(to)
    setPageTitle(to)
    return true
  }

  // 6. 未匹配到路由，跳转到 404
  return { name: 'Exception404' }
}

/**
 * 处理登录状态
 * @returns true 表示放行；路由地址对象表示需重定向
 */
function handleLoginStatus(
  to: RouteLocationNormalized,
  userStore: ReturnType<typeof useUserStore>
): true | Record<string, any> {
  // 已登录或访问登录页或静态路由，直接放行
  if (userStore.isLogin || to.path === RoutesAlias.Login || isStaticRoute(to.path)) {
    return true
  }

  // 未登录且访问需要权限的页面，跳转到登录页并携带 redirect 参数
  // 注意：用 to.path 而非 to.fullPath，避免把目标路由自身的 query（可能含 redirect）带入导致嵌套
  userStore.logOut()
  return {
    name: 'Login',
    query: { redirect: to.path }
  }
}

/**
 * 检查路由是否为静态路由
 */
function isStaticRoute(path: string): boolean {
  const checkRoute = (routes: any[], targetPath: string): boolean => {
    return routes.some((route) => {
      // 404 catch-all 路由不应视为可匿名访问的静态页，
      // 否则未登录时手动输入任意地址会直接落到 404，无法跳转登录页。
      if (route.name === 'Exception404') {
        return false
      }

      // 处理动态路由参数匹配
      const routePath = route.path
      const pattern = routePath.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*')
      const regex = new RegExp(`^${pattern}$`)

      if (regex.test(targetPath)) {
        return true
      }
      if (route.children && route.children.length > 0) {
        return checkRoute(route.children, targetPath)
      }
      return false
    })
  }

  return checkRoute(staticRoutes, path)
}

/**
 * 处理动态路由注册
 *
 * @returns 路由地址对象（重定向）或 false（取消导航）
 */
async function handleDynamicRoutes(
  to: RouteLocationNormalized,
  router: Router
): Promise<Record<string, any> | boolean> {
  // 标记初始化进行中
  routeInitInProgress = true

  // 显示 loading
  pendingLoading = true
  loadingService.showLoading()

  try {
    // 1. 获取用户信息
    await fetchUserInfo()

    // 2. 获取菜单数据
    const menuList = await menuProcessor.getMenuList()

    // 3. 验证菜单数据
    if (!menuProcessor.validateMenuList(menuList)) {
      throw new Error('获取菜单列表失败，请重新登录')
    }

    // 4. 注册动态路由
    routeRegistry?.register(menuList)

    // 5. 保存菜单数据到 store
    const menuStore = useMenuStore()
    menuStore.setMenuList(menuList)
    menuStore.addRemoveRouteFns(routeRegistry?.getRemoveRouteFns() || [])

    // 6. 保存 iframe 路由
    IframeRouteManager.getInstance().save()

    // 7. 验证工作标签页
    useWorktabStore().validateWorktabs(router)

    // 8. 静态路由不依赖菜单权限，初始化后直接恢复目标地址。
    if (isStaticRoute(to.path)) {
      routeInitInProgress = false
      return {
        path: to.path,
        query: to.query,
        hash: to.hash,
        replace: true
      }
    }

    // 9. 验证目标路径权限
    const { homePath } = useCommon()
    const { path: validatedPath, hasPermission } = RoutePermissionValidator.validatePath(
      to.path,
      menuList,
      homePath.value || '/'
    )

    // 初始化成功，重置进行中标记
    routeInitInProgress = false

    // 10. 重新导航到目标路由
    if (!hasPermission) {
      // 无权限访问，跳转到首页
      closeLoading()

      // 输出警告信息
      console.warn(`[RouteGuard] 用户无权限访问路径: ${to.path}，已跳转到首页`)

      // 直接跳转到首页
      return {
        path: validatedPath,
        replace: true
      }
    }
    // 有权限，正常导航
    return {
      path: to.path,
      query: to.query,
      hash: to.hash,
      replace: true
    }
  } catch (error) {
    console.error('[RouteGuard] 动态路由注册失败:', error)

    // 关闭 loading
    closeLoading()

    // 会话过期（401）：刷新页面时 token 已失效，axios 拦截器会弹「重新登录」confirm 框。
    // 这里主动重置登录态、直接跳登录页，保证用户点「重新登录」后能立即看到登录入口，
    // 而不是跳到 500 错误页。
    if (isSessionExpiredError(error) || isUnauthorizedError(error)) {
      routeInitInProgress = false
      // 重置登录态（清 token、清 isLogin、清路由），避免下次又走到这里
      useUserStore().resetLoginState()
      // 跳登录页，携带原目标地址作为 redirect（用 path 不用 fullPath，避免嵌套）
      return {
        name: 'Login',
        query: { redirect: to.path }
      }
    }

    // 标记初始化失败，防止死循环
    routeInitFailed = true
    routeInitInProgress = false

    // 输出详细错误信息，便于排查
    if (isHttpError(error)) {
      console.error(`[RouteGuard] 错误码: ${error.code}, 消息: ${error.message}`)
    }

    // 跳转到 500 页面，使用 replace 避免产生历史记录
    return { name: 'Exception500', replace: true }
  }
}

/**
 * 获取用户信息
 *
 * 使用 userStore.getInfo() 而非直接调用 fetchGetUserInfo + setUserInfo，
 * 因为 getInfo() 会同时填充 permissions / roles（用于 v-auth 按钮权限、v-roles 角色判断）。
 * 仅 setUserInfo 只写入 info，会导致权限按钮全部被隐藏。
 */
async function fetchUserInfo(): Promise<void> {
  const userStore = useUserStore()
  await userStore.getInfo()
  // 检查并清理工作台标签页（如果是不同用户登录）
  userStore.checkAndClearWorktabs()
}

/**
 * 重置路由相关状态
 */
export function resetRouterState(delay: number): void {
  setTimeout(() => {
    routeRegistry?.unregister()
    IframeRouteManager.getInstance().clear()

    const menuStore = useMenuStore()
    menuStore.removeAllDynamicRoutes()
    menuStore.setMenuList([])

    // 重置路由初始化状态，允许重新登录后再次初始化
    resetRouteInitState()
  }, delay)
}

/**
 * 处理根路径重定向到首页
 * @returns false 表示无需跳转；路由地址对象表示需重定向
 */
function handleRootPathRedirect(
  to: RouteLocationNormalized
): false | Record<string, any> {
  if (to.path !== '/') {
    return false
  }

  const { homePath } = useCommon()
  if (homePath.value && homePath.value !== '/') {
    return { path: homePath.value, replace: true }
  }

  return false
}

/**
 * 判断是否为未授权错误（401）
 */
function isUnauthorizedError(error: unknown): boolean {
  return isHttpError(error) && error.code === ApiStatus.unauthorized
}
