<!--
  未分配用户选择弹窗（移植自 plus-ui role/selectUser.vue）
  - 查询未分配某角色的用户列表
  - 多选后批量授权
  expose: show() 打开
  emit: ok() 授权成功
-->
<template>
  <ElDialog v-model="visible" title="选择用户" width="800px" top="5vh" append-to-body>
    <ElForm :inline="true" :model="query" class="mb-3">
      <ElFormItem label="用户名称"><ElInput v-model="query.userName" placeholder="用户名称" clearable @keyup.enter="getList" /></ElFormItem>
      <ElFormItem label="手机号码"><ElInput v-model="query.phoneNumber" placeholder="手机号码" clearable @keyup.enter="getList" /></ElFormItem>
      <ElFormItem><ElButton type="primary" icon="Search" @click="getList">搜索</ElButton><ElButton icon="Refresh" @click="resetQuery">重置</ElButton></ElFormItem>
    </ElForm>
    <ElTable :data="userList" border height="320" @selection-change="handleSelectionChange">
      <ElTableColumn type="selection" width="55" />
      <ElTableColumn prop="userName" label="用户名称" show-overflow-tooltip />
      <ElTableColumn prop="nickName" label="用户昵称" show-overflow-tooltip />
      <ElTableColumn prop="phoneNumber" label="手机" show-overflow-tooltip />
      <ElTableColumn prop="status" label="状态" align="center">
        <template #default="{ row }"><XuyaDictTag :options="sys_normal_disable as any" :value="row.status" /></template>
      </ElTableColumn>
    </ElTable>
    <XuyaTable :data="[]" :columns="[]" :pagination="pagination" v-show="pagination.total > 0"
      @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange" />
    <template #footer><ElButton @click="visible = false">取消</ElButton><ElButton type="primary" @click="handleSelectUser">确定</ElButton></template>
  </ElDialog>
</template>
<script setup lang="ts">
  import { ref, reactive } from 'vue'
  import { ElMessage } from 'element-plus'
  import { useDict } from '@/hooks/core/useDict'
  import XuyaDictTag from '@/components/core/others/xuya-dict-tag/index.vue'
  import { authUserSelectAll, unallocatedUserList } from '@/api/system/role'
  defineOptions({ name: 'SelectUser' })
  const props = defineProps<{ roleId: string | number }>()
  const emit = defineEmits(['ok'])
  const { sys_normal_disable } = useDict('sys_normal_disable')
  const visible = ref(false)
  const userList = ref<any[]>([])
  const userIds = ref<(string | number)[]>([])
  const query = reactive<any>({ pageNum: 1, pageSize: 10, roleId: undefined, userName: undefined, phoneNumber: undefined })
  const pagination = reactive({ current: 1, size: 10, total: 0 })
  const getList = async () => {
    try { const res: any = await unallocatedUserList(query); userList.value = res?.rows || []; pagination.total = res?.total || res?.data?.total || 0 } catch (e) { console.error(e) }
  }
  const handleSelectionChange = (s: any[]) => { userIds.value = s.map((i) => i.userId) }
  const handleSizeChange = (v: number) => { query.pageSize = v; getList() }
  const handleCurrentChange = (v: number) => { query.pageNum = v; getList() }
  const resetQuery = () => {
    query.pageNum = 1
    query.userName = undefined
    query.phoneNumber = undefined
    getList()
  }
  const handleSelectUser = async () => {
    if (!userIds.value.length) { ElMessage.error('请选择要分配的用户'); return }
    try { await authUserSelectAll({ roleId: props.roleId, userIds: userIds.value.join(',') }); ElMessage.success('分配成功'); emit('ok'); visible.value = false } catch (e) {}
  }
  const show = () => {
    if (!props.roleId) { ElMessage.warning('角色ID缺失'); return }
    query.roleId = props.roleId
    query.pageNum = 1
    getList()
    visible.value = true
  }
  defineExpose({ show })
</script>
