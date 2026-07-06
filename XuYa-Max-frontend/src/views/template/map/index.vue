<template>
  <div class="page-content mb-5" element-loading-text="加载中...">
    <XuyaMapChart />
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'TemplateMap' })

  /**
   * 异步加载地图组件
   * 减少初始加载体积
   */
  const XuyaMapChart = defineAsyncComponent(
    () => import('@/components/core/charts/xuya-map-chart/index.vue')
  )
</script>
