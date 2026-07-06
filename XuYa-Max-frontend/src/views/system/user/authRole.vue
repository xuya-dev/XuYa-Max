<!-- 用户分配角色 -->
<template>
  <div class="auth-role-page p-4">
    <ElCard>
      <template #header><span>用户分配角色</span></template>
      <ElDescriptions :column="2" border class="mb-4">
        <ElDescriptionsItem label="用户名称">{{ user.userName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="用户昵称">{{ user.nickName }}</ElDescriptionsItem>
      </ElDescriptions>
      <div class="flex-cb mb-3">
        <ElInput v-model="roleName" placeholder="筛选角色" prefix-icon="Search" clearable style="width: 240px" />
      </div>
      <ElTable :data="filteredRoles" @selection-change="handleSelectionChange" row-key="roleId">
        <ElTableColumn type="selection" width="55" :reserve-selection="true" />
        <ElTableColumn prop="roleId" label="角色编号" />
        <ElTableColumn prop="roleName" label="角色名称" />
        <ElTableColumn prop="roleKey" label="权限字符" />
        <ElTableColumn prop="roleSort" label="显示顺序" />
        <ElTableColumn prop="status" label="状态" />
      </ElTable>
      <div class="mt-4"><ElButton type="primary" @click="handleSave">提交</ElButton><ElButton @click="handleBack">返回</ElButton></div>
    </ElCard>
  </div>
</template>
<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { getAuthRole, updateAuthRole } from '@/api/system/user'
  import type { RoleVO } from '@/api/system/role/types'
  defineOptions({ name: 'AuthRole' })
  const route = useRoute()
  const router = useRouter()
  const user = ref<any>({})
  const roles = ref<RoleVO[]>([])
  const selectedRoleIds = ref<string[]>([])
  const roleName = ref('')
  const filteredRoles = computed(() => roles.value.filter((r) => !roleName.value || r.roleName?.includes(roleName.value)))
  const getAuthRoleData = async () => {
    const userId = route.params.userId as string
    try { const res: any = await getAuthRole(userId); user.value = res?.user || {}; roles.value = res?.roles || [] } catch (e) { console.error(e) }
  }
  const handleSelectionChange = (s: RoleVO[]) => { selectedRoleIds.value = s.map((r: any) => r.roleId) }
  const handleSave = async () => { try { const userId = route.params.userId as string; await updateAuthRole({ userId, roleIds: selectedRoleIds.value.join(',') }); ElMessage.success('分配成功'); handleBack() } catch (e) {} }
  const handleBack = () => router.push('/system/user')
  onMounted(() => { getAuthRoleData() })
</script>
