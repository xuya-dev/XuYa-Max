// 权限指令文档：参考 src/directives/core/auth.ts 的实现
import { AppRouteRecord } from '@/types/router'
import { routeModules } from '../modules'

/**
 * 动态路由（需要权限才能访问的路由）
 * 用于渲染菜单以及根据菜单权限动态加载路由，如果没有权限无法访问
 */
export const asyncRoutes: AppRouteRecord[] = routeModules
