<!-- OSS 配置管理 -->
<template>
  <div class="oss-config-page xuya-full-height flex flex-col overflow-hidden">
    <ElCard class="mb-3">
      <ElForm :inline="true" :model="searchForm">
        <ElFormItem label="配置key"><ElInput v-model="searchForm.configKey" placeholder="配置key" clearable @keyup.enter="getList" /></ElFormItem>
        <ElFormItem label="桶名称"><ElInput v-model="searchForm.bucketName" placeholder="桶名称" clearable @keyup.enter="getList" /></ElFormItem>
        <ElFormItem label="是否默认"><ElSelect v-model="searchForm.status" placeholder="状态" clearable style="width:120px"><ElOption v-for="d in sys_yes_no" :key="d.value" :label="d.label" :value="d.value" /></ElSelect></ElFormItem>
        <ElFormItem><ElButton type="primary" icon="Search" @click="getList">搜索</ElButton><ElButton icon="Refresh" @click="resetSearch">重置</ElButton></ElFormItem>
      </ElForm>
    </ElCard>
    <ElCard class="xuya-table-card">
      <XuyaTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="getList">
        <template #left><ElSpace wrap><ElButton type="primary" icon="Plus" v-auth="'system:ossConfig:add'" @click="handleAdd">新增</ElButton><ElButton type="danger" icon="Delete" :disabled="multiple" v-auth="'system:ossConfig:remove'" @click="handleDelete()">删除</ElButton></ElSpace></template>
      </XuyaTableHeader>
      <XuyaTable :loading="loading" :data="tableData" :columns="columns" :pagination="pagination"
        @selection-change="handleSelectionChange" @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange" />
      <OssConfigDialog v-model:visible="dialog.visible" :title="dialog.title" :form="dialog.form" @success="getList" />
    </ElCard>
  </div>
</template>
<script setup lang="ts">
  import { h, ref, reactive, onMounted, computed } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useDict } from '@/hooks/core/useDict'
  import XuyaButtonTable from '@/components/core/forms/xuya-button-table/index.vue'
  import { listOssConfig, delOssConfig, getOssConfig, changeOssConfigStatus } from '@/api/system/ossConfig'
  import type { OssConfigVO, OssConfigForm } from '@/api/system/ossConfig/types'
  import OssConfigDialog from './modules/oss-config-dialog.vue'
  import { useTable } from '@/hooks/core/useTable'
  defineOptions({ name: 'OssConfig' })
  const { sys_yes_no } = useDict('sys_yes_no')
  const ids = ref<(string | number)[]>([])
  const single = ref(true)
  const multiple = ref(true)
  const searchForm = ref<any>({ configKey: undefined, bucketName: undefined, status: undefined })
  const dialog = reactive<{ visible: boolean; title: string; form: Partial<OssConfigForm> }>({ visible: false, title: '', form: {} })
  const { columns, columnChecks, data: tableData, loading, pagination, getData, handleSizeChange, handleCurrentChange } = useTable({
    core: {
      apiFn: listOssConfig, apiParams: { ...searchForm.value },
      columnsFactory: () => [
        { type: 'selection' }, { type: 'index', width: 60, label: '序号' },
        { prop: 'configKey', label: '配置key' },
        { prop: 'endpoint', label: '访问站点', showOverflowTooltip: true },
        { prop: 'bucketName', label: '桶名称' },
        { prop: 'accessPolicy', label: '权限', formatter: (row: OssConfigVO) => h(ElTag, { type: row.accessPolicy === '0' ? 'warning' : row.accessPolicy === '1' ? 'success' : 'info' }, () => ({ '0': '私有', '1': '公共', '2': '自定义' }[row.accessPolicy] || '')) },
        { prop: 'status', label: '是否默认', formatter: (row: OssConfigVO) => h(ElSwitch as any, { modelValue: row.status, activeValue: 'Y', inactiveValue: 'N', beforeChange: () => handleStatusChange(row) }) },
        { prop: 'operation', label: '操作', width: 150, fixed: 'right', formatter: (row: OssConfigVO) => h('div', { class: 'flex gap-1' }, [h(XuyaButtonTable, { type: 'edit', onClick: () => handleUpdate(row) }), h(XuyaButtonTable, { type: 'delete', onClick: () => handleDelete(row) })]) }
      ]
    }
  })
  const getList = () => getData()
  const resetSearch = () => { searchForm.value = { configKey: undefined, bucketName: undefined, status: undefined }; getData() }
  const handleSelectionChange = (s: OssConfigVO[]) => { ids.value = s.map((i: any) => i.ossConfigId); single.value = s.length !== 1; multiple.value = !s.length }
  const handleAdd = () => { dialog.title = '新增配置'; dialog.form = { accessPolicy: '1', isHttps: 'N', status: 'N' }; dialog.visible = true }
  const handleUpdate = async (row: OssConfigVO) => { try { const res: any = await getOssConfig(row.ossConfigId); dialog.title = '修改配置'; dialog.form = { ...(res) }; dialog.visible = true } catch (e) {} }
  const handleDelete = async (row?: any) => { const delIds = row ? [row.ossConfigId] : ids.value; try { await ElMessageBox.confirm(`是否确认删除配置编号为 "${delIds}" 的数据项？`, '系统提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await delOssConfig(delIds.join(',')); ElMessage.success('删除成功'); getList() } catch (e) {} }
  const handleStatusChange = (row: OssConfigVO): Promise<boolean> => {
    const willEnable = row.status !== 'Y'
    const targetStatus = willEnable ? 'Y' : 'N'
    return ElMessageBox.confirm(`确认要${willEnable ? '启用' : '停用'} "${row.configKey}" 配置吗?`, '系统提示', { type: 'warning' })
      .then(async () => { await changeOssConfigStatus(row.ossConfigId, targetStatus, row.configKey); ElMessage.success('操作成功'); row.status = targetStatus; return true })
      .catch(() => false)
  }
  onMounted(() => { getList() })
</script>
