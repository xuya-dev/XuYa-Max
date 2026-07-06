/**
 * 菜单/路由接口（对接 XuYa-Max）
 *
 * 后端 GET /system/menu/getRouters 返回 RouterVo[]（树形），这里递归转换为
 * XuYa-Max 的 AppRouteRecord[]，供后端权限模式直接使用。
 *
 * ## 字段映射
 *
 * | RouterVo           | AppRouteRecord        | 说明                                       |
 * |--------------------|-----------------------|--------------------------------------------|
 * | name               | name                  | 路由名（唯一）                             |
 * | path               | path                  | 路由地址（一级以 / 开头，子级相对）         |
 * | hidden             | meta.isHide           | 是否在菜单隐藏                             |
 * | redirect           | redirect              | 重定向                                     |
 * | component          | component             | 组件路径（见下文转换规则）                 |
 * | query              | meta.query            | 路由参数                                   |
 * | alwaysShow         | meta.alwaysShow       | 是否始终显示                               |
 * | meta.title         | meta.title            | 标题                                       |
 * | meta.icon          | meta.icon             | 图标                                       |
 * | meta.noCache       | meta.keepAlive=!noCache | 缓存取反                                |
 * | meta.link(http)    | meta.isIframe+meta.link | 内链转 iframe                          |
 * | meta.activeMenu    | meta.activePath       | 激活菜单                                   |
 * | children           | children              | 子路由                                     |
 *
 * ## component 转换规则
 *
 * - `'Layout'` 或空 → 顶级用 art Layout（一级路由由 RouteTransformer 自动套 Layout，故置空）
 * - `'ParentView'` → 置空（由 RouteTransformer 作为中间层 RouterView 处理）
 * - `'InnerLink'` → 置空 + meta.isIframe=true，meta.link 取路由 path（内链地址）
 * - `'system/user/index'` → `/system/user`（匹配 views/system/user/index.vue）
 *
 * @module api/menu
 */
import request from '@/utils/http'
import type { AppRouteRecord, RouteMeta } from '@/types/router'
import { mapXuYaMaxIcon } from '@/utils/iconMap'

/** XuYa-Max 后端 RouterVo 原始结构 */
interface RouterVo {
  name?: string
  path?: string
  hidden?: boolean
  redirect?: string
  component?: string
  query?: string
  ext?: string
  alwaysShow?: boolean
  meta?: RouterMetaVo
  children?: RouterVo[]
}

/** XuYa-Max 后端 MetaVo 原始结构 */
interface RouterMetaVo {
  title?: string
  icon?: string
  noCache?: boolean
  /** 内链地址（http(s) 开头才赋值） */
  link?: string
  /** 激活菜单路径 */
  activeMenu?: string
}

/** XuYa-Max 的布局容器组件标识 */
const LAYOUT = 'Layout'
/** 父级视图占位组件标识 */
const PARENT_VIEW = 'ParentView'
/** 内链 iframe 组件标识 */
const INNER_LINK = 'InnerLink'

/**
 * 将单个 RouterVo 节点转换为 AppRouteRecord
 */
function transformRouterNode(router: RouterVo): AppRouteRecord {
  const meta = router.meta || {}
  const isInnerLink = router.component === INNER_LINK
  // 外链：path 本身是 http(s) URL（如"PLUS官网"），或 meta.link 是 http 但非 InnerLink
  const isOuterLink = isHttpUrl(router.path) || (!!meta.link && isHttpUrl(meta.link) && !isInnerLink)

  // 构造 art 的 RouteMeta
  const routeMeta: RouteMeta = {
    title: meta.title || '',
    // 图标映射：XuYa-Max 的 svg 图标名（如 user/peoples）转换为 Iconify 格式（ri:xxx）
    icon: mapXuYaMaxIcon(meta.icon),
    isHide: router.hidden === true,
    // noCache 取反：XuYa noCache=true 表示不缓存，art keepAlive=true 表示缓存
    keepAlive: meta.noCache === true ? false : true,
    // 外链地址：外链与内链 iframe 都通过 link 携带 URL
    link: isOuterLink ? meta.link || router.path : isInnerLink ? router.path : meta.link,
    // 仅内链 InnerLink 走 iframe 嵌入；外链由 art 当新标签打开
    isIframe: isInnerLink,
    // 激活菜单路径
    activePath: meta.activeMenu || undefined,
    // 透传 alwaysShow（art 不直接使用，但保留以备扩展）
    ...({ alwaysShow: router.alwaysShow } as any)
  }

  // 清理 undefined 字段，避免污染 meta
  Object.keys(routeMeta).forEach((key) => {
    if (routeMeta[key as keyof RouteMeta] === undefined) {
      delete routeMeta[key as keyof RouteMeta]
    }
  })

  // 外链：art 约定外链菜单 path/component 为空，仅靠 meta.link 跳转（新标签打开）
  if (isOuterLink) {
    return {
      name: router.name || generateRouteName(meta.title),
      path: '',
      component: '',
      meta: routeMeta,
      ...({ query: router.query } as any)
    }
  }

  // component 转换
  let component: string | undefined
  if (router.component === LAYOUT) {
    // Layout：映射为 art 的布局容器标识 /index/index（对应 views/index/index.vue）
    // 不能用空字符串，否则 RouteValidator 会判定"一级菜单缺少 component"导致注册失败
    component = '/index/index'
  } else if (router.component === PARENT_VIEW) {
    // ParentView：多级菜单中间层目录，需提供带 router-view 的容器组件
    component = '/parent-view'
  } else if (isInnerLink) {
    // InnerLink：iframe 由 RouteTransformer.loadIframe 处理，component 置空
    component = ''
  } else if (router.component) {
    // 普通业务组件：system/user/index → /system/user
    component = normalizeComponentPath(router.component)
  }

  // XuYa 约定 redirect: "noRedirect" 表示目录菜单不重定向（面包屑不可点击），
  // 但直接传给 Vue Router 会误重定向到名为 noRedirect 的路由，需转为 undefined
  const redirect = router.redirect && router.redirect !== 'noRedirect' ? router.redirect : undefined

  return {
    name: router.name || generateRouteName(router.path),
    path: router.path || '',
    redirect,
    component,
    meta: routeMeta,
    // XuYa 路由参数，附加到节点上（AppRouteRecord 未显式声明，用 as any 兼容）
    ...({ query: router.query } as any),
    children: router.children?.map((child) => transformRouterNode(child))
  }
}

/** 判断字符串是否为 http(s) 外链 URL */
function isHttpUrl(str?: string): boolean {
  return !!str && /^https?:\/\//i.test(str)
}

/**
 * 规范化组件路径
 * 后端返回如 `system/user/index`，art 的 ComponentLoader 匹配 `/system/user` 或 `/system/user/index`
 * 统一转换为以 / 开头、去掉末尾 /index 的形式，匹配 views 目录下的 vue 文件（import.meta.glob）
 */
function normalizeComponentPath(component: string): string {
  let path = component
  // 去除末尾的 /index 或 index
  path = path.replace(/\/?index$/i, '')
  // 确保以 / 开头
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  return path
}

/**
 * 根据路径生成路由 name（去重处理由调用方保证）
 */
function generateRouteName(path?: string): string {
  if (!path) return `route_${Date.now()}`
  // 取路径最后一段作为 name 候选
  const segments = path.split('/').filter(Boolean)
  return segments.length ? segments.join('_') : `route_${Date.now()}`
}

/**
 * 获取动态路由（对接 XuYa-Max GET /system/menu/getRouters）
 * 返回已转换为 AppRouteRecord 的菜单树，供后端权限模式直接使用
 */
export function fetchGetMenuList(): Promise<AppRouteRecord[]> {
  return request.get<RouterVo[]>({
    url: '/system/menu/getRouters'
  }).then((list: RouterVo[] = []) => {
    const menuList = (Array.isArray(list) ? list : []).map((router) => transformRouterNode(router))

    // 前端固定首页：仪表盘（概览页），作为系统首页注入到菜单最前面。
    // 后端菜单不返回 dashboard，这里前端注入；console 子页 fixedTab=true 使其标签固定首位且不可关闭。
    // getFirstMenuPath 会自动把首个可导航项（/dashboard/console）识别为 homePath。
    const hasDashboard = menuList.some((m) => m.path === '/dashboard')
    if (!hasDashboard) {
      menuList.unshift({
        name: 'Dashboard',
        path: '/dashboard',
        component: '/index/index',
        redirect: '/dashboard/console',
        meta: {
          title: 'menus.dashboard.title',
          icon: 'ri:pie-chart-line'
        },
        children: [
          {
            path: 'console',
            name: 'Console',
            component: '/dashboard/console',
            meta: {
              title: 'menus.dashboard.console',
              icon: 'ri:home-smile-2-line',
              keepAlive: false,
              fixedTab: true
            }
          },
          {
            path: 'analysis',
            name: 'Analysis',
            component: '/dashboard/analysis',
            meta: {
              title: 'menus.dashboard.analysis',
              icon: 'ri:align-item-bottom-line',
              keepAlive: false
            }
          },
          {
            path: 'ecommerce',
            name: 'Ecommerce',
            component: '/dashboard/ecommerce',
            meta: {
              title: 'menus.dashboard.ecommerce',
              icon: 'ri:bar-chart-box-line',
              keepAlive: false
            }
          }
        ]
      })
    }

    // 补充 XuYa-Max 内部跳转页面（后端菜单不返回，但前端会 router.push 访问）
    // 字典数据页：从字典类型点击跳转 /system/dict/data
    const systemMenu = menuList.find((m) => m.path === '/system')
    if (systemMenu && systemMenu.children) {
      const hasDictData = systemMenu.children.some((c) => c.path === 'dict/data' || c.path === 'dict/data/index')
      if (!hasDictData) {
        systemMenu.children.push({
          name: 'SystemDictData',
          path: 'dict/data',
          component: '/system/dict/data',
          meta: { title: '字典数据', isHide: true, keepAlive: true }
        })
      }
      // 消息中心页：从通知铃铛 / 通知面板跳转，后端菜单不返回，前端兜底注册为隐藏路由
      const hasMessage = systemMenu.children.some((c) => c.path === 'message' || c.path === 'message/index')
      if (!hasMessage) {
        systemMenu.children.push({
          name: 'SystemMessage',
          path: 'message',
          component: '/system/message',
          meta: { title: '消息中心', isHide: true, keepAlive: true }
        })
      }
      // 个人中心页：art 原生布局，对接后端 profile 接口，后端菜单不返回，前端兜底注册为隐藏路由
      const hasUserCenter = systemMenu.children.some((c) => c.path === 'user-center' || c.path === 'user-center/index')
      if (!hasUserCenter) {
        systemMenu.children.push({
          name: 'UserCenter',
          path: 'user-center',
          component: '/system/user-center',
          meta: { title: '个人中心', isHide: true, keepAlive: false, isHideTab: true }
        })
      }
    }
    return menuList
  })
}
