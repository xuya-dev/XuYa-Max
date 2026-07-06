<!-- 字典类型管理 -->
<template>
  <div class="dict-page xuya-full-height flex flex-col overflow-hidden">
    <DictSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />
    <ElCard class="xuya-table-card">
      <XuyaTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" icon="Plus" v-auth="'system:dict:add'" @click="handleAdd">新增</ElButton>
            <ElButton type="success" icon="Edit" :disabled="single" v-auth="'system:dict:edit'" @click="handleUpdate()">修改</ElButton>
            <ElButton type="danger" icon="Delete" :disabled="multiple" v-auth="'system:dict:remove'" @click="handleDelete()">删除</ElButton>
            <ElButton type="warning" icon="Refresh" v-auth="'system:dict:remove'" @click="handleRefreshCache">刷新缓存</ElButton>
            <ElButton type="warning" icon="Download" v-auth="'system:dict:export'" @click="handleExport">导出</ElButton>
          </ElSpace>
        </template>
      </XuyaTableHeader>
      <XuyaTable :loading="loading" :data="data" :columns="columns" :pagination="pagination"
        @selection-change="handleSelectionChange" @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange" />
      <DictDialog v-model:visible="dialog.visible" :title="dialog.title" :form="dialog.form" @success="refreshData" />
    </ElCard>
  </div>
</template>
<script setup lang="ts">
  import { h, ref, reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import XuyaButtonTable from '@/components/core/forms/xuya-button-table/index.vue'
  import { listType, delType, getType, refreshCache } from '@/api/system/dict/type'
  import type { DictTypeVO, DictTypeForm } from '@/api/system/dict/type/types'
  import { download } from '@/utils/http'
  import DictSearch from './modules/dict-search.vue'
  import DictDialog from './modules/dict-dialog.vue'
  defineOptions({ name: 'Dict' })
  const router = useRouter()
  const ids = ref<(string | number)[]>([])
  const single = ref(true)
  const multiple = ref(true)
  const searchForm = ref<any>({})
  const dialog = reactive<{ visible: boolean; title: string; form: Partial<DictTypeForm> }>({ visible: false, title: '', form: {} })
  const { columns, columnChecks, data, loading, pagination, getData, replaceSearchParams, resetSearchParams, handleSizeChange, handleCurrentChange, refreshData } = useTable({
    core: {
      apiFn: listType,
      apiParams: { ...searchForm.value },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 60, label: '序号' },
        { prop: 'dictId', label: '字典主键' },
        { prop: 'dictName', label: '字典名称' },
        { prop: 'dictType', label: '字典类型', formatter: (row: DictTypeVO) => h(ElLink, { type: 'primary', onClick: () => goDictData(row) }, () => row.dictType) },
        { prop: 'createTime', label: '创建时间', width: 160 },
        { prop: 'remark', label: '备注' },
        { prop: 'operation', label: '操作', width: 150, fixed: 'right', formatter: (row: DictTypeVO) => h('div', { class: 'flex gap-1' }, [h(XuyaButtonTable, { type: 'edit', onClick: () => handleUpdate(row) }), h(XuyaButtonTable, { type: 'delete', onClick: () => handleDelete(row) })]) }
      ]
    }
  })
  const goDictData = (row: DictTypeVO) => { router.push({ path: '/system/dict/data', query: { dictType: row.dictType, dictId: row.dictId } }) }
  const handleSearch = (p: any) => { replaceSearchParams(p); getData() }
  const handleSelectionChange = (s: DictTypeVO[]) => { ids.value = s.map((i: any) => i.dictId); single.value = s.length !== 1; multiple.value = !s.length }
  const handleAdd = () => { dialog.title = '新增字典类型'; dialog.form = {}; dialog.visible = true }
  const handleUpdate = async (row?: any) => { const id = row?.dictId || ids.value[0]; try { const res: any = await getType(id); const d = res; dialog.title = '修改字典类型'; dialog.form = { ...d }; dialog.visible = true } catch (e) { console.error(e) } }
  const handleDelete = async (row?: any) => { const delIds = row ? [row.dictId] : ids.value; try { await ElMessageBox.confirm(`是否确认删除字典编号为 "${delIds}" 的数据项？`, '系统提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await delType(delIds.join(',')); ElMessage.success('删除成功'); refreshData() } catch (e) {} }
  const handleRefreshCache = async () => { try { await refreshCache(); ElMessage.success('刷新缓存成功') } catch (e) {} }
  const handleExport = () => download('/system/dict/type/export', { ...searchForm.value }, `dict_type_${new Date().getTime()}.xlsx`)
</script>
