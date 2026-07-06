<!-- 岗位管理 -->
<template>
  <div class="post-page xuya-full-height flex flex-col overflow-hidden">
    <PostSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />
    <ElCard class="xuya-table-card">
      <XuyaTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" icon="Plus" v-auth="'system:post:add'" @click="handleAdd">新增</ElButton>
            <ElButton type="success" icon="Edit" :disabled="single" v-auth="'system:post:edit'" @click="handleUpdate()">修改</ElButton>
            <ElButton type="danger" icon="Delete" :disabled="multiple" v-auth="'system:post:remove'" @click="handleDelete()">删除</ElButton>
            <ElButton type="warning" icon="Download" v-auth="'system:post:export'" @click="handleExport">导出</ElButton>
          </ElSpace>
        </template>
      </XuyaTableHeader>
      <XuyaTable :loading="loading" :data="data" :columns="columns" :pagination="pagination"
        @selection-change="handleSelectionChange" @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange" />
      <PostDialog v-model:visible="dialog.visible" :title="dialog.title" :form="dialog.form" @success="refreshData" />
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
  import { listPost, delPost, getPost } from '@/api/system/post'
  import type { PostVO, PostForm } from '@/api/system/post/types'
  import { download } from '@/utils/http'
  import PostSearch from './modules/post-search.vue'
  import PostDialog from './modules/post-dialog.vue'
  defineOptions({ name: 'Post' })
  const { sys_normal_disable } = useDict('sys_normal_disable')
  const ids = ref<(string | number)[]>([])
  const single = ref(true)
  const multiple = ref(true)
  const searchForm = ref<any>({})
  const dialog = reactive<{ visible: boolean; title: string; form: Partial<PostForm> }>({ visible: false, title: '', form: {} })
  const { columns, columnChecks, data, loading, pagination, getData, replaceSearchParams, resetSearchParams, handleSizeChange, handleCurrentChange, refreshData } = useTable({
    core: {
      apiFn: listPost,
      apiParams: { ...searchForm.value },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 60, label: '序号' },
        { prop: 'postId', label: '岗位编号' },
        { prop: 'postCode', label: '岗位编码' },
        { prop: 'postName', label: '岗位名称' },
        { prop: 'postSort', label: '显示顺序' },
        { prop: 'status', label: '状态', formatter: (row: PostVO) => h(XuyaDictTag, { options: sys_normal_disable as any, value: row.status }) },
        { prop: 'createTime', label: '创建时间', width: 160 },
        { prop: 'operation', label: '操作', width: 150, fixed: 'right', formatter: (row: PostVO) => h('div', { class: 'flex gap-1' }, [h(XuyaButtonTable, { type: 'edit', onClick: () => handleUpdate(row) }), h(XuyaButtonTable, { type: 'delete', onClick: () => handleDelete(row) })]) }
      ]
    }
  })
  const handleSearch = (p: any) => { replaceSearchParams(p); getData() }
  const handleSelectionChange = (s: PostVO[]) => { ids.value = s.map((i: any) => i.postId); single.value = s.length !== 1; multiple.value = !s.length }
  const handleAdd = () => { dialog.title = '新增岗位'; dialog.form = { postSort: 0, status: '0' }; dialog.visible = true }
  const handleUpdate = async (row?: any) => {
    const id = row?.postId || ids.value[0]
    try { const res: any = await getPost(id); const d = res; dialog.title = '修改岗位'; dialog.form = { ...d, status: String(d.status ?? '0') }; dialog.visible = true } catch (e) { console.error(e) }
  }
  const handleDelete = async (row?: any) => {
    const delIds = row ? [row.postId] : ids.value
    try { await ElMessageBox.confirm(`是否确认删除岗位编号为 "${delIds}" 的数据项？`, '系统提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await delPost(delIds.join(',')); ElMessage.success('删除成功'); refreshData() } catch (e) {}
  }
  const handleExport = () => download('/system/post/export', { ...searchForm.value }, `post_${new Date().getTime()}.xlsx`)
</script>
