<template>
  <div class="page-content space-y-5">
    <!-- 基础用法 -->
    <XuyaTextScroll
      text="XuYa-Max 是一套前后端分离的后台管理系统 <a target='_blank' href='https://github.com/xuya-dev/XuYa-Max'>点击我 </a>访问项目仓库"
      showClose
    />

    <!-- 使用不同的类型 -->
    <XuyaTextScroll type="success" text="这是一条成功类型的滚动公告" />

    <XuyaTextScroll type="warning" text="这是一条警告类型的滚动公告" />

    <XuyaTextScroll type="danger" text="这是一条危险类型的滚动公告" />

    <XuyaTextScroll type="info" text="这是一条信息类型的滚动公告" />

    <!-- 可关闭 -->
    <XuyaTextScroll text="这是一条可关闭的滚动公告" @close="handleClose" />

    <!-- 自定义速度和方向 -->
    <XuyaTextScroll
      type="warning"
      text="这是一条速度较慢、向右滚动的公告"
      :speed="30"
      direction="right"
    />

    <XuyaTextScroll
      text="这是一条文字溢出才会滚动的公告，当文本内容超出容器宽度时才会开始滚动显示，否则保持静止状态"
      @close="handleClose"
      :alwaysScroll="false"
    />

    <XuyaTextScroll type="danger" direction="up" :speed="30" text="这是一条向上滚动的公告" />

    <XuyaTextScroll type="info" direction="down" :speed="30" text="这是一条向下滚动的公告" />
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'WidgetsTextScroll' })

  /**
   * 处理关闭事件
   */
  const handleClose = () => {
    console.log('文本滚动组件已关闭')
    ElMessage.info('已关闭')
  }
</script>
