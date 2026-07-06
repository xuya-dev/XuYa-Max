<!-- 角色分配用户 -->
<template>
  <div class="auth-user-page p-4">
    <ElCard>
      <template #header><span>角色分配用户</span></template>
      <div class="flex-cb mb-3">
        <ElForm :inline="true" :model="searchForm">
          <ElFormItem label="用户名称"><ElInput v-model="searchForm.userName" placeholder="请输入用户名称" clearable @keyup.enter="getList" /></ElFormItem>
          <ElFormItem label="手机号码"><ElInput v-model="searchForm.phoneNumber" placeholder="请输入手机号码" clearable @keyup.enter="getList" /></ElFormItem>
          <ElFormItem><ElButton type="primary" icon="Search" @click="getList">搜索</ElButton></ElFormItem>
        </ElForm>
        <div><ElButton type="primary" @click="handleSelectUser">添加用户</ElButton><ElButton type="danger" :disabled="multiple" @click="handleCancelAuth">取消授权</ElButton></div>
      </div>
      <XuyaTable :loading="loading" :data="userList" :columns="columns" :pagination="pagination"
        @selection-change="handleSelectionChange" @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange" />
      <SelectUser ref="selectUserRef" :role-id="roleId" @ok="getList" />
    </ElCard>
  </div>
</template>
<script setup lang="ts">
  import { h, ref, reactive, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import XuyaButtonTable from '@/components/core/forms/xuya-button-table/index.vue'
  import { allocatedUserList, authUserCancel, authUserCancelAll } from '@/api/system/role'
  import { updateAuthRole } from '@/api/system/user'
  import SelectUser from './selectUser.vue'
  defineOptions({ name: 'AuthUser' })
  const route = useRoute()
  const router = useRouter()
  const roleId = route.params.roleId as string
  const selectUserRef = ref()
  const ids = ref<string[]>([])
  const multiple = ref(true)
  const searchForm = ref<any>({ userName: undefined, phoneNumber: undefined })
  const { columns, data: userList, loading, pagination, getData, handleSizeChange, handleCurrentChange } = useTable({
    core: {
      apiFn: (params: any) => allocatedUserList({ ...params, roleId }),
      apiParams: { ...searchForm.value },
      columnsFactory: () => [
        { type: 'selection' }, { type: 'index', width: 60, label: '序号' },
        { prop: 'userName', label: '用户名称' }, { prop: 'nickName', label: '用户昵称' },
        { prop: 'phoneNumber', label: '手机号码' }, { prop: 'deptName', label: '部门' },
        { prop: 'operation', label: '操作', width: 120, fixed: 'right', formatter: (row: any) => h(XuyaButtonTable, { type: 'delete', text: '取消授权', onClick: () => handleCancelAuthRow(row) }) }
      ]
    }
  })
  const getList = () => getData()
  const handleSelectionChange = (s: any[]) => { ids.value = s.map((i) => i.userId); multiple.value = !s.length }
  const handleSelectUser = () => selectUserRef.value?.show()
  const handleCancelAuth = async () => { try { await ElMessageBox.confirm(`确认要取消选中的 ${ids.value.length} 个用户授权吗？`, '系统提示', { type: 'warning' }); await authUserCancelAll({ roleId, userIds: ids.value.join(',') }); ElMessage.success('取消授权成功'); getList() } catch (e) {} }
  const handleCancelAuthRow = async (row: any) => { try { await ElMessageBox.confirm(`确认要取消用户 "${row.userName}" 的授权吗？`, '系统提示', { type: 'warning' }); await authUserCancel({ roleId, userId: row.userId }); ElMessage.success('取消授权成功'); getList() } catch (e) {} }
  onMounted(() => { getList() })
</script>
