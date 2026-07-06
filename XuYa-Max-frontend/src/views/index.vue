<!-- 首页（XuYa 控制台） -->
<template>
  <div class="home p-4">
    <ElCard class="mb-4">
      <div class="flex-cb">
        <div>
          <h1 class="text-2xl font-bold mb-2">{{ greeting }}，{{ userStore.info.nickName || userStore.info.userName || '管理员' }}</h1>
          <p class="text-gray-500">欢迎使用 {{ AppConfig.systemInfo.name }} 后台管理系统</p>
        </div>
      </div>
    </ElCard>

    <ElRow :gutter="16">
      <ElCol :xs="24" :sm="12" :md="6" v-for="card in statCards" :key="card.title">
        <ElCard class="mb-4">
          <div class="flex-cb">
            <div>
              <p class="text-gray-400 text-sm">{{ card.title }}</p>
              <p class="text-2xl font-bold mt-2">{{ card.value }}</p>
            </div>
            <XuyaSvgIcon :icon="card.icon" style="font-size: 36px; color: var(--el-color-primary)" />
          </div>
        </ElCard>
      </ElCol>
    </ElRow>

    <ElCard>
      <template #header><span>项目信息</span></template>
      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="项目名称">{{ AppConfig.systemInfo.name }}</ElDescriptionsItem>
        <ElDescriptionsItem label="版本号">v{{ version }}</ElDescriptionsItem>
        <ElDescriptionsItem label="后端框架">Spring Boot 4.1 + Sa-Token + Mybatis-Plus</ElDescriptionsItem>
        <ElDescriptionsItem label="前端框架">Vue 3 + Element Plus + TypeScript + Vite</ElDescriptionsItem>
        <ElDescriptionsItem label="认证方式">Sa-Token + JWT</ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>
  </div>
</template>
<script setup lang="ts">
  import { computed } from 'vue'
  import { useUserStore } from '@/store/modules/user'
  import AppConfig from '@/config'
  defineOptions({ name: 'Index' })
  const userStore = useUserStore()
  const version = import.meta.env.VITE_VERSION || '1.0.0'
  const greeting = computed(() => {
    const h = new Date().getHours()
    if (h < 6) return '凌晨好'
    if (h < 9) return '早上好'
    if (h < 12) return '上午好'
    if (h < 14) return '中午好'
    if (h < 18) return '下午好'
    if (h < 22) return '晚上好'
    return '夜深了'
  })
  const statCards = [
    { title: '当前版本', value: `v${version}`, icon: 'ri:rocket-line' },
    { title: '用户角色', value: userStore.roles?.length || 0, icon: 'ri:shield-user-line' },
    { title: '权限数量', value: userStore.permissions?.length || 0, icon: 'ri:key-2-line' },
    { title: '菜单数量', value: '动态', icon: 'ri:menu-line' }
  ]
</script>
