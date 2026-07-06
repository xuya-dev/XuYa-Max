/**
 * useDict 字典数据 Hook（对接 XuYa-Max）
 *
 * 移植自 plus-ui/src/utils/dict.ts。
 * 用法：const { sys_user_gender, sys_normal_disable } = useDict('sys_user_gender', 'sys_normal_disable')
 *
 * 机制：
 * 1. 先查内存缓存（useDictStore，Pinia Map 结构）
 * 2. 未命中则调 GET /system/dict/data/type/{dictType}，映射为 { label, value, elTagType, elTagClass }
 * 3. 用 pendingRequests Map 做并发去重（同一字典类型并发只请求一次）
 *
 * @module hooks/core/useDict
 */
import { reactive } from 'vue'
import { getDicts } from '@/api/system/dict/data'
import { useDictStore, type DictDataOption } from '@/store/modules/dict'

/** 并发去重：同一字典类型的进行中请求 */
const pendingRequests = new Map<string, Promise<DictDataOption[]>>()

/**
 * 获取字典数据
 * @param args 字典类型列表，如 'sys_user_gender', 'sys_normal_disable'
 * @returns 以字典类型为 key 的响应式字典数据对象
 */
export const useDict = (...args: string[]): Record<string, DictDataOption[]> => {
  const res = reactive<Record<string, DictDataOption[]>>({})

  args.forEach(async (dictType) => {
    // 初始化为空数组（注意：后续用 splice 原地替换内容，而不是整体赋值，
    // 这样解构出来的 res[dictType] 引用能保持响应式，异步加载完成后自动更新 UI）
    res[dictType] = []

    const dictStore = useDictStore()
    // 1. 先查内存缓存
    const cached = dictStore.getDict(dictType)
    if (cached) {
      res[dictType].splice(0, res[dictType].length, ...cached)
      return
    }

    // 2. 未命中则发起请求（并发去重）
    if (!pendingRequests.has(dictType)) {
      const request = getDicts(dictType)
        .then((resp) => {
          const data = (resp || []).map(
            (p): DictDataOption => ({
              label: p.dictLabel,
              value: p.dictValue,
              elTagType: p.listClass,
              elTagClass: p.cssClass
            })
          )
          dictStore.setDict(dictType, data)
          return data
        })
        .finally(() => {
          pendingRequests.delete(dictType)
        })
      pendingRequests.set(dictType, request)
    }

    const data = await pendingRequests.get(dictType)!
    // 原地替换数组内容，保持解构引用的响应性
    res[dictType].splice(0, res[dictType].length, ...(data || []))
  })

  return res
}
