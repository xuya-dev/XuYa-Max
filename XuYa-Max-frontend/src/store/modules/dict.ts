/**
 * 字典数据缓存 Store
 *
 * 移植自 plus-ui/src/store/modules/dict.ts。
 * 使用内存 Map 缓存已加载的字典数据（按字典类型 key），页面刷新后失效。
 * 由 useDict 统一填充。
 *
 * @module store/modules/dict
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 字典数据项（与 plus-ui 约定一致，兼容 Element Plus 标签） */
export interface DictDataOption {
  /** 字典标签（显示文本） */
  label: string
  /** 字典值 */
  value: string | number
  /** Element Plus 标签类型（success/info/warning/danger/primary） */
  elTagType: string
  /** 标签自定义类名 */
  elTagClass: string
  /** 字典其他属性（listClass 回传的原始字段） */
  [key: string]: any
}

export const useDictStore = defineStore('dictStore', () => {
  const dict = ref<Map<string, DictDataOption[]>>(new Map())

  /** 获取字典数据 */
  const getDict = (key: string): DictDataOption[] | null => {
    if (!key) return null
    return dict.value.get(key) || null
  }

  /** 设置字典数据 */
  const setDict = (key: string, value: DictDataOption[]): boolean => {
    if (!key) return false
    try {
      dict.value.set(key, value)
      return true
    } catch (e) {
      console.error('Error in setDict:', e)
      return false
    }
  }

  /** 移除字典数据 */
  const removeDict = (key: string): boolean => {
    if (!key) return false
    try {
      return dict.value.delete(key)
    } catch (e) {
      console.error('Error in removeDict:', e)
      return false
    }
  }

  /** 清空所有字典数据 */
  const cleanDict = (): void => {
    dict.value.clear()
  }

  return { dict, getDict, setDict, removeDict, cleanDict }
})
