<!-- 客户端管理 -->
<template>
  <div class="client-page xuya-full-height flex flex-col overflow-hidden">
    <ClientSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />
    <ElCard class="xuya-table-card">
      <XuyaTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" icon="Plus" v-auth="'system:client:add'" @click="handleAdd">新增</ElButton>
            <ElButton type="success" icon="Edit" :disabled="single" v-auth="'system:client:edit'" @click="handleUpdate()">修改</ElButton>
            <ElButton type="danger" icon="Delete" :disabled="multiple" v-auth="'system:client:remove'" @click="handleDelete()">删除</ElButton>
            <ElButton type="warning" icon="Download" v-auth="'system:client:export'" @click="handleExport">导出</ElButton>
          </ElSpace>
        </template>
      </XuyaTableHeader>
      <XuyaTable :loading="loading" :data="data" :columns="columns" :pagination="pagination"
        @selection-change="handleSelectionChange" @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange" />
      <ClientDialog v-model:visible="dialog.visible" :title="dialog.title" :form="dialog.form" @success="refreshData" />
    </ElCard>
  </div>
</template>
<script setup lang="ts">
  import { h, ref, reactive } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import { useDict } from '@/hooks/core/useDict'
  import XuyaButtonTable from '@/components/core/forms/xuya-button-table/index.vue'
  import XuyaDictTag from '@/components/core/others/xuya-dict-tag/index.vue'
  import { listClient, delClient, getClient } from '@/api/system/client'
  import type { ClientVO, ClientForm } from '@/api/system/client/types'
  import { download } from '@/utils/http'
  import ClientSearch from './modules/client-search.vue'
  import ClientDialog from './modules/client-dialog.vue'
  defineOptions({ name: 'Client' })
  const { sys_normal_disable } = useDict('sys_normal_disable')
  const ids = ref<(string | number)[]>([])
  const single = ref(true)
  const multiple = ref(true)
  const searchForm = ref<any>({})
  const dialog = reactive<{ visible: boolean; title: string; form: Partial<ClientForm> }>({ visible: false, title: '', form: {} })
  const { columns, columnChecks, data, loading, pagination, getData, replaceSearchParams, resetSearchParams, handleSizeChange, handleCurrentChange, refreshData } = useTable({
    core: {
      apiFn: listClient,
      apiParams: { ...searchForm.value },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 60, label: '序号' },
        { prop: 'clientId', label: '客户端id' },
        { prop: 'clientKey', label: '客户端key' },
        { prop: 'clientSecret', label: '客户端秘钥' },
        { prop: 'grantTypeList', label: '授权类型', formatter: (row: ClientVO) => (row.grantTypeList || []).join(',') },
        { prop: 'deviceType', label: '设备类型' },
        { prop: 'activeTimeout', label: '活跃超时' },
        { prop: 'timeout', label: '固定超时' },
        { prop: 'status', label: '状态', formatter: (row: ClientVO) => h(XuyaDictTag, { options: sys_normal_disable as any, value: row.status }) },
        { prop: 'operation', label: '操作', width: 150, fixed: 'right', formatter: (row: ClientVO) => h('div', { class: 'flex gap-1' }, [h(XuyaButtonTable, { type: 'edit', onClick: () => handleUpdate(row) }), h(XuyaButtonTable, { type: 'delete', onClick: () => handleDelete(row) })]) }
      ]
    }
  })
  const handleSearch = (p: any) => { replaceSearchParams(p); getData() }
  const handleSelectionChange = (s: ClientVO[]) => { ids.value = s.map((i: any) => i.id); single.value = s.length !== 1; multiple.value = !s.length }
  const handleAdd = () => { dialog.title = '新增客户端'; dialog.form = { status: '0', grantTypeList: ['password'] }; dialog.visible = true }
  const handleUpdate = async (row?: any) => {
    const id = row?.id || ids.value[0]
    try { const res: any = await getClient(id); const d = res; dialog.title = '修改客户端'; dialog.form = { ...d, status: String(d.status ?? '0') }; dialog.visible = true } catch (e) { console.error(e) }
  }
  const handleDelete = async (row?: any) => {
    const delIds = row ? [row.id] : ids.value
    try { await ElMessageBox.confirm(`是否确认删除客户端编号为 "${delIds}" 的数据项？`, '系统提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await delClient(delIds.join(',')); ElMessage.success('删除成功'); refreshData() } catch (e) {}
  }
  const handleExport = () => { download('/system/client/export', { ...searchForm.value }, `client_${new Date().getTime()}.xlsx`) }
</script>
