<!-- 操作日志 -->
<template>
  <div class="operlog-page xuya-full-height flex flex-col overflow-hidden">
    <OperlogSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />
    <ElCard class="xuya-table-card">
      <XuyaTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="danger" icon="Delete" :disabled="multiple" v-auth="'monitor:operlog:remove'" @click="handleDelete()">删除</ElButton>
            <ElButton type="warning" icon="Delete" v-auth="'monitor:operlog:remove'" @click="handleClean">清空</ElButton>
            <ElButton type="warning" icon="Download" v-auth="'monitor:operlog:export'" @click="handleExport">导出</ElButton>
          </ElSpace>
        </template>
      </XuyaTableHeader>
      <XuyaTable :loading="loading" :data="data" :columns="columns" :pagination="pagination"
        @selection-change="handleSelectionChange" @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange" />
      <OperInfoDialog ref="operInfoRef" />
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
  import { list, delOperlog, cleanOperlog } from '@/api/monitor/operlog'
  import type { OperLogVO } from '@/api/monitor/operlog/types'
  import { download } from '@/utils/http'
  import OperlogSearch from './modules/operlog-search.vue'
  import OperInfoDialog from './operInfoDialog.vue'
  defineOptions({ name: 'Operlog' })
  const { sys_oper_type, sys_common_status, sys_device_type } = useDict('sys_oper_type', 'sys_common_status', 'sys_device_type')
  const ids = ref<(string | number)[]>([])
  const multiple = ref(true)
  const searchForm = ref<any>({})
  const operInfoRef = ref()
  const { columns, columnChecks, data, loading, pagination, getData, replaceSearchParams, resetSearchParams, handleSizeChange, handleCurrentChange, refreshData } = useTable({
    core: {
      apiFn: list,
      apiParams: { orderByColumn: 'operTime', isAsc: 'desc', ...searchForm.value },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 60, label: '序号' },
        { prop: 'operId', label: '日志编号' },
        { prop: 'title', label: '系统模块' },
        { prop: 'businessType', label: '操作类型', formatter: (row: OperLogVO) => h(XuyaDictTag, { options: sys_oper_type as any, value: row.businessType }) },
        { prop: 'operName', label: '操作人员', sortable: true },
        { prop: 'operIp', label: '操作地址' },
        { prop: 'status', label: '操作状态', formatter: (row: OperLogVO) => h(XuyaDictTag, { options: sys_common_status as any, value: row.status }) },
        { prop: 'operTime', label: '操作时间', width: 180, sortable: true },
        { prop: 'costTime', label: '消耗(ms)', sortable: true },
        { prop: 'operation', label: '操作', width: 120, fixed: 'right', formatter: (row: OperLogVO) => h(XuyaButtonTable, { type: 'view', text: '详情', onClick: () => handleView(row) }) }
      ]
    }
  })
  const handleSearch = (p: any) => { replaceSearchParams(p); getData() }
  const handleSelectionChange = (s: OperLogVO[]) => { ids.value = s.map((i: any) => i.operId); multiple.value = !s.length }
  const handleView = (row: OperLogVO) => operInfoRef.value?.openDialog(row)
  const handleDelete = async () => { try { await ElMessageBox.confirm(`是否确认删除日志编号为 "${ids.value}" 的数据项？`, '系统提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await delOperlog(ids.value.join(',')); ElMessage.success('删除成功'); refreshData() } catch (e) {} }
  const handleClean = async () => { try { await ElMessageBox.confirm('是否确认清空所有操作日志数据项？', '系统提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await cleanOperlog(); ElMessage.success('清空成功'); refreshData() } catch (e) {} }
  const handleExport = () => download('/monitor/operlog/export', { ...searchForm.value }, `operlog_${new Date().getTime()}.xlsx`)
</script>
