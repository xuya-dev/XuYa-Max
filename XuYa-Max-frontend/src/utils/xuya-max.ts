/**
 * XuYa 通用工具方法
 * 提供参数序列化、树形结构转换、字典回显、时间格式化等通用能力。
 *
 * @module utils/xuya-max
 */

/**
 * 日期格式化（支持时间戳、字符串、Date 对象）
 * @param time 时间
 * @param pattern 格式模板，默认 {y}-{m}-{d} {h}:{i}:{s}
 */
export function parseTime(time: any, pattern?: string): string | null {
  if (arguments.length === 0 || !time) return null
  const format = pattern || '{y}-{m}-{d} {h}:{i}:{s}'
  let date: Date
  if (typeof time === 'object') {
    date = time
  } else {
    if (typeof time === 'string' && /^[0-9]+$/.test(time)) {
      time = parseInt(time)
    } else if (typeof time === 'string') {
      time = time.replace(/-/gm, '/').replace('T', ' ').replace(/\.[\d]{3}/gm, '')
    }
    if (typeof time === 'number' && time.toString().length === 10) time = time * 1000
    date = new Date(time)
  }
  const formatObj: { [key: string]: any } = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  return format.replace(/{(y|m|d|h|i|s|a)+}/g, (result: string, key: string) => {
    let value = formatObj[key]
    if (key === 'a') return ['日', '一', '二', '三', '四', '五', '六'][value]
    if (result.length > 0 && value < 10) value = '0' + value
    return value || 0
  })
}

/**
 * 添加日期范围参数
 * @param params 原始查询参数
 * @param dateRange 日期范围 [begin, end]
 * @param propName 属性名前缀（可选）
 */
export const addDateRange = (params: any, dateRange: any[], propName?: string) => {
  const search = params
  search.params =
    typeof search.params === 'object' && search.params !== null && !Array.isArray(search.params)
      ? search.params
      : {}
  dateRange = Array.isArray(dateRange) ? dateRange : []
  if (typeof propName === 'undefined') {
    search.params['beginTime'] = dateRange[0]
    search.params['endTime'] = dateRange[1]
  } else {
    search.params['begin' + propName] = dateRange[0]
    search.params['end' + propName] = dateRange[1]
  }
  return search
}

/**
 * 回显数据字典（单个值）
 */
export const selectDictLabel = (datas: any[], value: number | string | undefined): string => {
  if (value === undefined) return ''
  const actions: Array<string | number> = []
  datas?.some((item: any) => {
    if (item.value == '' + value) {
      actions.push(item.label)
      return true
    }
  })
  if (actions.length === 0) actions.push(String(value))
  return actions.join('')
}

/**
 * 回显数据字典（多个值，逗号分隔）
 */
export const selectDictLabels = (datas: any[], value: any, separator?: string): string => {
  if (value === undefined || value.length === 0) return ''
  if (Array.isArray(value)) value = value.join(',')
  const actions: any[] = []
  const currentSeparator = separator === undefined ? ',' : separator
  const temp = value.split(currentSeparator)
  Object.keys(value.split(currentSeparator)).some((val) => {
    let match = false
    Object.keys(datas).some((key) => {
      const dictItem = (datas as any)[key]
      if (dictItem.value == '' + temp[val as any]) {
        actions.push(dictItem.label + currentSeparator)
        match = true
      }
    })
    if (!match) actions.push(temp[val] + currentSeparator)
  })
  return actions.join('').substring(0, actions.join('').length - 1)
}

/**
 * 字符串格式化（%s 占位）
 */
export function sprintf(str: string, ...args: any[]): string {
  if (args.length !== 0) {
    let flag = true
    let i = 0
    str = str.replace(/%s/g, function () {
      const arg = args[i++]
      if (typeof arg === 'undefined') {
        flag = false
        return ''
      }
      return arg
    })
    return flag ? str : ''
  }
  return str
}

/**
 * 转换字符串，undefined/null 等转化为 ""
 */
export const parseStrEmpty = (str: any): string => {
  if (!str || str == 'undefined' || str == 'null') return ''
  return str
}

/**
 * 数据深度合并
 */
export const mergeRecursive = (source: any, target: any) => {
  for (const p in target) {
    try {
      if (target[p].constructor == Object) source[p] = mergeRecursive(source[p], target[p])
      else source[p] = target[p]
    } catch (e) {
      source[p] = target[p]
    }
  }
  return source
}

/**
 * 构造树型结构数据
 * @param data 扁平数组
 * @param id 主键字段名（默认 id）
 * @param parentId 父级字段名（默认 parentId）
 * @param children 子级字段名（默认 children）
 */
export const handleTree = <T = any>(data: any[], id?: string, parentId?: string, children?: string): T[] => {
  const config = {
    id: id || 'id',
    parentId: parentId || 'parentId',
    childrenList: children || 'children'
  }
  const childrenListMap: any = {}
  const tree: T[] = []
  for (const d of data) {
    const dId = d[config.id]
    childrenListMap[dId] = d
    if (!d[config.childrenList]) d[config.childrenList] = []
  }
  for (const d of data) {
    const pId = d[config.parentId]
    const parentObj = childrenListMap[pId]
    if (!parentObj) tree.push(d)
    else parentObj[config.childrenList].push(d)
  }
  return tree
}

/**
 * GET 请求参数序列化（支持嵌套对象 obj[key]=val，跳过空值）
 * 与 XuYa-Max 后端 PageQuery 兼容
 */
export const tansParams = (params: any): string => {
  let result = ''
  for (const propName of Object.keys(params)) {
    const value = params[propName]
    const part = encodeURIComponent(propName) + '='
    if (value !== null && value !== '' && typeof value !== 'undefined') {
      if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
          if (value[key] !== null && value[key] !== '' && typeof value[key] !== 'undefined') {
            const params = propName + '[' + key + ']'
            const subPart = encodeURIComponent(params) + '='
            result += subPart + encodeURIComponent(value[key]) + '&'
          }
        }
      } else {
        result += part + encodeURIComponent(value) + '&'
      }
    }
  }
  return result
}

/**
 * 规范化项目路径（去除多余斜杠、末尾斜杠）
 */
export const getNormalPath = (p: string): string => {
  if (p.length === 0 || !p || p === 'undefined') return p
  const res = p.replace('//', '/')
  if (res[res.length - 1] === '/') return res.slice(0, res.length - 1)
  return res
}

/**
 * 校验是否为 blob 数据（非 JSON 错误响应）
 */
export const blobValidate = (data: any): boolean => data.type !== 'application/json'

export default { handleTree, parseTime, tansParams }
