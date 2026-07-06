<!-- 布局容器 -->
<template>
  <div class="app-layout">
    <aside id="app-sidebar">
      <XuyaSidebarMenu />
    </aside>

    <main id="app-main">
      <div id="app-header">
        <XuyaHeaderBar />
      </div>
      <div id="app-content">
        <XuyaPageContent />
      </div>
    </main>

    <div id="app-global">
      <XuyaGlobalComponent />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'AppLayout' })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
