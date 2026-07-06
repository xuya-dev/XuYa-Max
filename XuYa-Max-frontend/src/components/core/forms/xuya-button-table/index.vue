<!-- 表格按钮 -->
<template>
  <div
    :class="[
      'inline-flex items-center justify-center min-w-8 h-8 px-2.5 mr-2.5 text-sm c-p rounded-md align-middle',
      buttonClass
    ]"
    :style="{ backgroundColor: buttonBgColor, color: iconColor }"
    @click="handleClick"
  >
    <XuyaSvgIcon :icon="iconContent" />
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'XuyaButtonTable' })

  interface Props {
    /** 按钮类型 */
    type?: 'add' | 'edit' | 'delete' | 'more' | 'view'
    /** 按钮图标 */
    icon?: string
    /** 按钮样式类 */
    iconClass?: string
    /** icon 颜色 */
    iconColor?: string
    /** 按钮背景色 */
    buttonBgColor?: string
  }

  const props = withDefaults(defineProps<Props>(), {})

  const emit = defineEmits<{
    (e: 'click'): void
  }>()

  // 默认按钮配置
  const defaultButtons = {
    add: { icon: 'ri:add-fill', class: 'bg-theme/12 text-theme' },
    edit: { icon: 'ri:pencil-line', class: 'bg-secondary/12 text-secondary' },
    delete: { icon: 'ri:delete-bin-5-line', class: 'bg-error/12 text-error' },
    view: { icon: 'ri:eye-line', class: 'bg-info/12 text-info' },
    more: { icon: 'ri:more-2-fill', class: '' }
  } as const

  /**
   * 业务页面里有时会把 Element Plus 图标名（如 'Key'、'Download'、'Refresh'、'Edit'）
   * 当作 icon 字符串直接传入。XuyaSvgIcon 走的是 Iconify（@iconify/vue），只认
   * `prefix:name` 格式，纯单词名会渲染成空。
   * 这里把常见 Element Plus 图标名映射为 Iconify（Remix Icon）等价图标，
   * 保证不依赖网络/离线包也能渲染。
   */
  const EP_ICON_ALIAS: Record<string, string> = {
    Key: 'ri:key-2-line',
    Lock: 'ri:lock-line',
    Unlock: 'ri:lock-unlock-line',
    Download: 'ri:download-2-line',
    Upload: 'ri:upload-2-line',
    Refresh: 'ri:refresh-line',
    Edit: 'ri:edit-line',
    Delete: 'ri:delete-bin-6-line',
    View: 'ri:eye-line',
    Search: 'ri:search-line',
    Plus: 'ri:add-line',
    Setting: 'ri:settings-line',
    Document: 'ri:file-text-line',
    Link: 'ri:link'
  }

  // 获取图标内容
  const iconContent = computed(() => {
    const raw = props.icon || (props.type ? defaultButtons[props.type]?.icon : '') || ''
    // 已经是 iconify 格式（含冒号）直接用；否则查 EP 图标别名表兜底
    return raw.includes(':') ? raw : EP_ICON_ALIAS[raw] || raw
  })

  // 获取按钮样式类
  const buttonClass = computed(() => {
    return props.iconClass || (props.type ? defaultButtons[props.type]?.class : '') || ''
  })

  const handleClick = () => {
    emit('click')
  }
</script>
