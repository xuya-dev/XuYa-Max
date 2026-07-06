<!--
  ParentView 父级视图容器（对应 XuYa 的 ParentView 组件）

  用于多级菜单的中间层目录（如"日志管理"包含"操作日志/登录日志"）。
  仅提供一个 <router-view> 占位，让子路由得以渲染。
-->
<template>
  <RouterView />
</template>

<script setup lang="ts">
  defineOptions({ name: 'ParentView' })
</script>
