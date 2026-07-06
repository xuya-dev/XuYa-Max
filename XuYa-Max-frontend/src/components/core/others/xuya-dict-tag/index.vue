<!--
  DictTag 字典标签组件（对接 XuYa-Max）

  根据字典数据 options 与当前 value，渲染对应的 Element Plus 标签或纯文本。
  颜色由字典项的 elTagType 决定（success / info / warning / danger / primary）。

  用法：
    const { sys_normal_disable } = useDict('sys_normal_disable')
    <DictTag :options="sys_normal_disable" :value="row.status" />
-->
<template>
  <div class="xuya-dict-tag">
    <template v-for="(item, index) in options" :key="`${item.value}-${index}`">
      <template v-if="isValueMatch(item.value)">
        <span
          v-if="
            ((item.elTagType as string) === 'default' || (item.elTagType as string) === '') &&
            (item.elTagClass === '' || item.elTagClass == null)
          "
          :class="item.elTagClass"
        >
          {{ item.label + ' ' }}
        </span>
        <ElTag
          v-else
          :disable-transitions="true"
          :type="resolveTagType(item.elTagType)"
          :class="item.elTagClass"
        >
          {{ item.label + ' ' }}
        </ElTag>
      </template>
    </template>
    <template v-if="unmatch && showValue">
      {{ unmatchArray }}
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { DictDataOption } from '@/store/modules/dict'

  defineOptions({ name: 'XuyaDictTag' })

  interface Props {
    /** 字典数据选项 */
    options: Array<DictDataOption>
    /** 当前值（支持单值、数组、分隔字符串） */
    value: number | string | Array<number | string>
    /** 未匹配时是否显示原始值 */
    showValue?: boolean
    /** 分隔符（value 为字符串时按此拆分） */
    separator?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    showValue: true,
    separator: ','
  })

  /** 标准化为字符串数组 */
  const values = computed(() => {
    if (props.value === '' || props.value === null || typeof props.value === 'undefined') return []
    if (typeof props.value === 'number' || typeof props.value === 'boolean') return [props.value]
    return Array.isArray(props.value)
      ? props.value.map((item) => '' + item)
      : String(props.value).split(props.separator)
  })

  /** 是否存在未匹配项 */
  const unmatch = computed(() => {
    if (!props.options?.length || props.value === '' || props.value === null || typeof props.value === 'undefined') {
      return false
    }
    return values.value.some((item) => !props.options.some((v) => v.value == item))
  })

  /** 未匹配项拼接文本 */
  const unmatchArray = computed(() => {
    const itemUnmatchArray: Array<string | number> = []
    if (props.value !== '' && props.value !== null && typeof props.value !== 'undefined') {
      values.value.forEach((item) => {
        if (!props.options.some((v) => v.value === item)) {
          itemUnmatchArray.push(item)
        }
      })
    }
    if (itemUnmatchArray.length === 0) return ''
    return itemUnmatchArray.join(' ')
  })

  /** 解析 el-tag 的 type（仅允许 Element 合法值，否则回退 primary） */
  const resolveTagType = (tagType: string) => {
    return ['primary', 'success', 'info', 'warning', 'danger'].includes(tagType) ? (tagType as any) : 'primary'
  }

  /** 判断字典项 value 是否匹配当前值 */
  const isValueMatch = (itemValue: any) => {
    return values.value.some((val) => val == itemValue)
  }
</script>

<style lang="scss" scoped>
  .xuya-dict-tag {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }
</style>
