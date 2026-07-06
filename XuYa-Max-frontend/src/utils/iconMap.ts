/**
 * XuYa-Max 图标名 → Iconify 图标名映射表
 *
 * XuYa-Max 后端菜单的 icon 字段存的是项目自带的 svg 图标名（如 user/peoples/tree），
 * 而 XuYa-Max 使用 Iconify（@iconify/vue）渲染图标，需要 ri:xxx / ep:xxx 格式。
 * 这里建立映射，未命中的回退到一个通用图标。
 *
 * @module utils/iconMap
 */

const ICON_MAP: Record<string, string> = {
  // 系统类
  system: 'ri:dashboard-line',
  dashboard: 'ri:dashboard-2-line',
  user: 'ri:user-3-line',
  peoples: 'ri:team-line',
  tree: 'ri:organization-chart',
  'tree-table': 'ri:node-tree',
  post: 'ri:briefcase-line',
  dict: 'ri:book-open-line',
  edit: 'ri:edit-2-line',
  message: 'ri:notification-3-line',
  log: 'ri:file-list-3-line',
  form: 'ri:file-text-line',
  logininfo: 'ri:login-circle-line',
  upload: 'ri:upload-cloud-2-line',
  international: 'ri:global-line',
  // 监控类
  monitor: 'ri:computer-line',
  online: 'ri:wifi-line',
  redis: 'ri:database-2-line',
  job: 'ri:timer-line',
  checkbox: 'ri:checkbox-circle-line',
  // 工具类
  tool: 'ri:tools-line',
  code: 'ri:code-s-slash-line',
  // 其他
  star: 'ri:star-line',
  guide: 'ri:guide-line',
  // 通用操作图标（plus-ui 也用到的 element 图标名）
  search: 'ri:search-line',
  refresh: 'ri:refresh-line',
  download: 'ri:download-2-line',
  add: 'ri:add-line',
  delete: 'ri:delete-bin-line',
  setting: 'ri:settings-3-line'
}

/** 通用回退图标（未命中映射时使用） */
const FALLBACK_ICON = 'ri:menu-line'

/**
 * 将 XuYa-Max 图标名转换为 Iconify 图标名
 * @param xuyaMaxIcon XuYa-Max 后端返回的图标名（如 'user'、'peoples'、'#'）
 * @returns Iconify 图标名（如 'ri:user-3-line'），空值或 '#' 返回 undefined
 */
export function mapXuYaMaxIcon(xuyaMaxIcon?: string | null): string | undefined {
  if (!xuyaMaxIcon || xuyaMaxIcon === '#') {
    return undefined
  }
  // 如果已经是 iconify 格式（含冒号），直接返回
  if (xuyaMaxIcon.includes(':')) {
    return xuyaMaxIcon
  }
  return ICON_MAP[xuyaMaxIcon] || FALLBACK_ICON
}

export default mapXuYaMaxIcon
