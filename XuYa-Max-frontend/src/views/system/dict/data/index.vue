<!--
  字典数据管理（从字典类型点击进入，URL: /system/dict/data?dictType=xxx）
-->
<template>
  <div class="dict-data-page xuya-full-height flex flex-col overflow-hidden">
    <ElCard class="mb-3">
      <div class="flex-cb mb-2">
        <span class="text-base font-medium">字典类型：<ElTag type="info">{{ dictType }}</ElTag></span>
      </div>
      <ElForm :inline="true" :model="searchForm">
        <ElFormItem label="字典标签"><ElInput v-model="searchForm.dictLabel" placeholder="字典标签" clearable @keyup.enter="getList" /></ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" placeholder="状态" clearable style="width:120px">
            <ElOption v-for="d in sys_normal_disable" :key="d.value" :label="d.label" :value="d.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem><ElButton type="primary" icon="Search" @click="getList">搜索</ElButton><ElButton icon="Refresh" @click="resetSearch">重置</ElButton></ElFormItem>
      </ElForm>
    </ElCard>
    <ElCard class="xuya-table-card">
      <XuyaTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="getList">
        <template #left>
          <ElButton icon="ArrowLeft" @click="handleBack">返回</ElButton>
          <ElButton type="primary" icon="Plus" v-auth="'system:dict:add'" @click="handleAdd">新增</ElButton>
          <ElButton type="warning" icon="Refresh" v-auth="'system:dict:remove'" @click="handleRefreshCache">刷新缓存</ElButton>
          <ElButton type="warning" icon="Download" v-auth="'system:dict:export'" @click="handleExport">导出</ElButton>
        </template>
      </XuyaTableHeader>
      <XuyaTable :loading="loading" :data="data" :columns="columns" :pagination="pagination"
        @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange" />
      <ElDialog v-model="dialog.visible" :title="dialog.title" width="600px" append-to-body>
        <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
          <ElFormItem label="数据标签" prop="dictLabel"><ElInput v-model="form.dictLabel" placeholder="请输入数据标签" /></ElFormItem>
          <ElFormItem label="数据键值" prop="dictValue"><ElInput v-model="form.dictValue" placeholder="请输入数据键值" /></ElFormItem>
          <ElFormItem label="显示排序" prop="dictSort"><ElInputNumber v-model="form.dictSort" :min="0" controls-position="right" style="width:100%" /></ElFormItem>
          <ElFormItem label="样式属性">
            <ElSelect v-model="form.listClass" placeholder="请选择" clearable style="width:100%">
              <ElOption label="默认" value="" /><ElOption label="主要(primary)" value="primary" /><ElOption label="成功(success)" value="success" />
              <ElOption label="信息(info)" value="info" /><ElOption label="警告(warning)" value="warning" /><ElOption label="危险(danger)" value="danger" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="状态"><ElRadioGroup v-model="form.status"><ElRadio v-for="d in sys_normal_disable" :key="d.value" :value="d.value">{{ d.label }}</ElRadio></ElRadioGroup></ElFormItem>
          <ElFormItem label="备注"><ElInput v-model="form.remark" type="textarea" placeholder="请输入" /></ElFormItem>
        </ElForm>
        <template #footer><ElButton @click="dialog.visible = false">取消</ElButton><ElButton type="primary" :loading="submitting" @click="handleSubmit">确定</ElButton></template>
      </ElDialog>
    </ElCard>
  </div>
</template>
<script setup lang="ts">
  import { h, ref, reactive, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import { useDict } from '@/hooks/core/useDict'
  import XuyaButtonTable from '@/components/core/forms/xuya-button-table/index.vue'
  import XuyaDictTag from '@/components/core/others/xuya-dict-tag/index.vue'
  import { listData, getData, addData, updateData, delData, exportData } from '@/api/system/dict/data'
  import { refreshCache } from '@/api/system/dict/type'
  import type { DictDataVO } from '@/api/system/dict/data/types'
  defineOptions({ name: 'DictData' })
  const route = useRoute()
  const router = useRouter()
  const { sys_normal_disable } = useDict('sys_normal_disable')
  const dictType = ref((route.query.dictType as string) || '')
  const searchForm = ref<any>({ dictLabel: undefined, status: undefined })
  const submitting = ref(false)
  const formRef = ref()
  const dialog = reactive<{ visible: boolean; title: string }>({ visible: false, title: '' })
  const form = reactive<any>({ dictSort: 0, status: '0' })
  const rules = { dictLabel: [{ required: true, message: '请输入数据标签', trigger: 'blur' }], dictValue: [{ required: true, message: '请输入数据键值', trigger: 'blur' }] }
  const { columns, columnChecks, data, loading, pagination, getData: getTableData, handleSizeChange, handleCurrentChange } = useTable({
    core: {
      apiFn: (params: any) => listData({ ...params, dictType: dictType.value }),
      apiParams: { ...searchForm.value },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        { prop: 'dictLabel', label: '数据标签' },
        { prop: 'dictValue', label: '数据键值' },
        { prop: 'listClass', label: '样式', formatter: (row: any) => row.listClass ? h(XuyaDictTag, { options: [{ label: row.listClass, value: row.listClass, elTagType: row.listClass }] as any, value: row.listClass }) : '默认' },
        { prop: 'status', label: '状态', formatter: (row: any) => h(XuyaDictTag, { options: sys_normal_disable as any, value: row.status }) },
        { prop: 'remark', label: '备注', showOverflowTooltip: true },
        { prop: 'createTime', label: '创建时间', width: 160 },
        { prop: 'operation', label: '操作', width: 150, fixed: 'right', formatter: (row: DictDataVO) => h('div', { class: 'flex gap-1' }, [h(XuyaButtonTable, { type: 'edit', onClick: () => handleUpdate(row) }), h(XuyaButtonTable, { type: 'delete', onClick: () => handleDelete(row) })]) }
      ]
    }
  })
  const getList = () => getTableData({ ...searchForm.value })
  const resetSearch = () => { searchForm.value = { dictLabel: undefined, status: undefined }; getTableData({ ...searchForm.value }) }
  const handleAdd = () => { Object.assign(form, { dictCode: undefined, dictLabel: '', dictValue: '', dictSort: 0, listClass: '', status: '0', remark: '', dictType: dictType.value }); dialog.title = '新增字典数据'; dialog.visible = true }
  const handleUpdate = async (row: any) => { try { const res: any = await getData(row.dictCode); Object.assign(form, res); form.status = String(form.status ?? '0'); dialog.title = '修改字典数据'; dialog.visible = true } catch (e) {} }
  const handleSubmit = async () => { if (!formRef.value) return; try { await formRef.value.validate(); submitting.value = true; if (form.dictCode) { await updateData(form) } else { await addData(form) }; ElMessage.success('操作成功'); dialog.visible = false; getList() } catch (e) {} finally { submitting.value = false } }
  const handleDelete = async (row: any) => { try { await ElMessageBox.confirm(`确认删除字典数据"${row.dictLabel}"?`, '提示', { type: 'warning' }); await delData(row.dictCode); ElMessage.success('删除成功'); getList() } catch (e) {} }
  const handleRefreshCache = async () => { try { await refreshCache(); ElMessage.success('刷新成功') } catch (e) {} }
  const handleExport = () => { exportData({ ...searchForm.value, dictType: dictType.value }) }
  /** 返回字典类型列表 */
  const handleBack = () => { router.push('/system/dict') }
  onMounted(() => { if (dictType.value) getList() })
</script>
