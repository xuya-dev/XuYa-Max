<!--
  XuyaImagePreview 图片预览组件（移植自 plus-ui ImagePreview）
  - src 支持单个 URL 或逗号分隔的多个 URL
  - 显示第一张作为缩略图，点击预览全部
  - 加载失败显示占位图标
  - 用法：<XuyaImagePreview :src="row.url" :width="50" :height="50" />
-->
<template>
  <ElImage
    :src="realSrc"
    fit="cover"
    :style="{ width: realWidth, height: realHeight }"
    :preview-src-list="realSrcList"
    preview-teleported
    :hide-on-click-modal="true"
    class="xuya-image-preview"
  >
    <template #error>
      <div class="image-slot">
        <XuyaSvgIcon icon="ri:image-line" class="text-2xl text-g-400" />
      </div>
    </template>
    <template #placeholder>
      <div class="image-slot">
        <XuyaSvgIcon icon="ri:loader-4-line" class="text-xl text-g-400 animate-spin" />
      </div>
    </template>
  </ElImage>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import XuyaSvgIcon from '@/components/core/base/xuya-svg-icon/index.vue'

  defineOptions({ name: 'XuyaImagePreview' })

  const props = withDefaults(
    defineProps<{
      /** 图片地址，逗号分隔支持多图预览 */
      src?: string
      /** 宽度（数字按 px，字符串原样） */
      width?: number | string
      /** 高度（数字按 px，字符串原样） */
      height?: number | string
    }>(),
    {
      src: '',
      width: 50,
      height: 50
    }
  )

  /** 缩略图：取第一张 */
  const realSrc = computed(() => {
    if (!props.src) return ''
    return props.src.split(',')[0]?.trim() || ''
  })

  /** 预览列表：拆分逗号分隔的多个 URL */
  const realSrcList = computed(() => {
    if (!props.src) return [] as string[]
    return props.src
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  })

  const realWidth = computed(() => (typeof props.width === 'string' ? props.width : `${props.width}px`))
  const realHeight = computed(() => (typeof props.height === 'string' ? props.height : `${props.height}px`))
</script>

<style lang="scss" scoped>
  .xuya-image-preview {
    border-radius: 5px;
    overflow: hidden;

    :deep(.el-image__inner) {
      transition: transform 0.25s;
      cursor: pointer;

      &:hover {
        transform: scale(1.15);
      }
    }

    :deep(.image-slot) {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: var(--el-fill-color-light);
    }
  }
</style>
