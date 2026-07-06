<!-- 参数配置 -->
<template>
  <div class="config-page xuya-full-height flex flex-col overflow-hidden">
    <ConfigSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />
    <ElCard class="xuya-table-card">
      <XuyaTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" icon="Plus" v-auth="'system:config:add'" @click="handleAdd">新增</ElButton>
            <ElButton type="success" icon="Edit" :disabled="single" v-auth="'system:config:edit'" @click="handleUpdate()">修改</ElButton>
            <ElButton type="danger" icon="Delete" :disabled="multiple" v-auth="'system:config:remove'" @click="handleDelete()">删除</ElButton>
            <ElButton type="warning" icon="Refresh" v-auth="'system:config:remove'" @click="handleRefreshCache">刷新缓存</ElButton>
            <ElButton type="warning" icon="Download" v-auth="'system:config:export'" @click="handleExport">导出</ElButton>
          </ElSpace>
        </template>
      </XuyaTableHeader>
      <XuyaTable :loading="loading" :data="data" :columns="columns" :pagination="pagination"
        @selection-change="handleSelectionChange" @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange" />
      <ConfigDialog v-model:visible="dialog.visible" :title="dialog.title" :form="dialog.form" @success="refreshData" />
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
  import { listConfig, delConfig, getConfig, refreshCache } from '@/api/system/config'
  import type { ConfigVO, ConfigForm } from '@/api/system/config/types'
  import { download } from '@/utils/http'
  import ConfigSearch from './modules/config-search.vue'
  import ConfigDialog from './modules/config-dialog.vue'
  defineOptions({ name: 'Config' })
  const { sys_yes_no } = useDict('sys_yes_no')
  const ids = ref<(string | number)[]>([])
  const single = ref(true)
  const multiple = ref(true)
  const searchForm = ref<any>({})
  const dialog = reactive<{ visible: boolean; title: string; form: Partial<ConfigForm> }>({ visible: false, title: '', form: {} })
  const { columns, columnChecks, data, loading, pagination, getData, replaceSearchParams, resetSearchParams, handleSizeChange, handleCurrentChange, refreshData } = useTable({
    core: {
      apiFn: listConfig,
      apiParams: { ...searchForm.value },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 60, label: '序号' },
        { prop: 'configId', label: '参数主键' },
        { prop: 'configName', label: '参数名称' },
        { prop: 'configKey', label: '参数键名' },
        { prop: 'configValue', label: '参数键值' },
        { prop: 'configType', label: '系统内置', formatter: (row: ConfigVO) => h(XuyaDictTag, { options: sys_yes_no as any, value: row.configType }) },
        { prop: 'remark', label: '备注' },
        { prop: 'createTime', label: '创建时间', width: 160 },
        { prop: 'operation', label: '操作', width: 150, fixed: 'right', formatter: (row: ConfigVO) => h('div', { class: 'flex gap-1' }, [h(XuyaButtonTable, { type: 'edit', onClick: () => handleUpdate(row) }), h(XuyaButtonTable, { type: 'delete', onClick: () => handleDelete(row) })]) }
      ]
    }
  })
  const handleSearch = (p: any) => { replaceSearchParams(p); getData() }
  const handleSelectionChange = (s: ConfigVO[]) => { ids.value = s.map((i: any) => i.configId); single.value = s.length !== 1; multiple.value = !s.length }
  const handleAdd = () => { dialog.title = '新增参数'; dialog.form = { configType: 'Y' }; dialog.visible = true }
  const handleUpdate = async (row?: any) => {
    const id = row?.configId || ids.value[0]
    try { const res: any = await getConfig(id); const d = res; dialog.title = '修改参数'; dialog.form = { ...d }; dialog.visible = true } catch (e) { console.error(e) }
  }
  const handleDelete = async (row?: any) => {
    const delIds = row ? [row.configId] : ids.value
    try { await ElMessageBox.confirm(`是否确认删除参数编号为 "${delIds}" 的数据项？`, '系统提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await delConfig(delIds.join(',')); ElMessage.success('删除成功'); refreshData() } catch (e) {}
  }
  const handleRefreshCache = async () => { try { await refreshCache(); ElMessage.success('刷新缓存成功') } catch (e) {} }
  const handleExport = () => download('/system/config/export', { ...searchForm.value }, `config_${new Date().getTime()}.xlsx`)
</script>
