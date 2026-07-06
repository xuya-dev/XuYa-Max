---
name: frontend-crud-page
description: 前端标准 CRUD 页面专家。用于 XuYa-Max-frontend 中新建列表页、弹窗表单页、标准 API/types/index.vue 骨架，强调 useTable + ArtTable + ArtSearchBar + ArtTableHeader 三件套与 ArtDialog 表单模式。
---

你负责 XuYa-Max-frontend 中的标准 CRUD 页面实现。

## 核心原则

1. 先看当前模块最近似页面，再动代码。
2. 标准三件套同步维护：
   `src/api/<module>/<business>/index.ts`
   `src/api/<module>/<business>/types.ts`
   `src/views/<module>/<business>/index.vue`
3. 列表页统一使用 **useTable + ArtTable + ArtTableHeader + ArtSearchBar** 模式（详见下方「页面骨架」）。

## 页面骨架（参考 `src/views/system/notice/index.vue`）

```vue
<template>
  <div class="art-full-height flex flex-col overflow-hidden">
    <XxxSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />
    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" icon="Plus" v-auth="'xxx:add'" @click="handleAdd">新增</ElButton>
            <ElButton type="success" icon="Edit" :disabled="single" v-auth="'xxx:edit'" @click="handleUpdate()">修改</ElButton>
            <ElButton type="danger" icon="Delete" :disabled="multiple" v-auth="'xxx:remove'" @click="handleDelete()">删除</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>
      <ArtTable :loading="loading" :data="data" :columns="columns" :pagination="pagination"
        @selection-change="handleSelectionChange" @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange" />
      <XxxDialog v-model:visible="dialog.visible" :title="dialog.title" :form="dialog.form" @success="refreshData" />
    </ElCard>
  </div>
</template>
```

### useTable 配置

```ts
import { useTable } from '@/hooks/core/useTable'
import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
import ArtDictTag from '@/components/core/others/art-dict-tag/index.vue'

const { columns, columnChecks, data, loading, pagination, getData,
        replaceSearchParams, resetSearchParams,
        handleSizeChange, handleCurrentChange,
        refreshData, refreshCreate, refreshUpdate, refreshRemove } = useTable({
  core: {
    apiFn: listXxx,
    apiParams: { ...searchForm.value },
    columnsFactory: () => [
      { type: 'selection' },
      { type: 'index', width: 60, label: '序号' },
      { prop: 'xxxName', label: '名称' },
      { prop: 'status', label: '状态', formatter: (row) => h(ArtDictTag, { options: sys_xxx_status as any, value: row.status }) },
      { prop: 'operation', label: '操作', width: 180, fixed: 'right',
        formatter: (row) => h('div', { class: 'flex gap-1' }, [
          h(ArtButtonTable, { type: 'edit', onClick: () => handleUpdate(row) }),
          h(ArtButtonTable, { type: 'delete', onClick: () => handleDelete(row) })
        ]) }
    ]
  }
})
```

### handler 标准写法

```ts
const handleSearch = (p) => { replaceSearchParams(p); getData() }
const handleAdd = () => { dialog.title = '新增'; dialog.form = {}; dialog.visible = true }
const handleUpdate = async (row?) => {
  const id = row?.id || ids.value[0]
  const res = await getXxx(id)
  dialog.title = '修改'; dialog.form = { ...res }; dialog.visible = true
}
const handleDelete = async (row?) => {
  const delIds = row ? [row.id] : ids.value
  await ElMessageBox.confirm(`是否确认删除编号为 "${delIds}" 的数据项？`, '系统提示', { type: 'warning' })
  await delXxx(delIds.join(',')); ElMessage.success('删除成功'); refreshData()
}
```

## 弹窗组件模式（参考 `src/views/system/notice/modules/notice-dialog.vue`）

- `Props: { visible, title, form }`，`Emits: { 'update:visible', 'success' }`
- 用 `visibleRef = computed({ get, set })` 代理 visible
- **打开时整体重置 form 避免残留**：`watch(() => props.visible, open => { if(open) Object.assign(form, defaultForm(), props.form) }, { immediate: true })`
- `handleSubmit` 调 `formRef.value.validate()`，按主键判断 add/update，成功后关闭 + emit success
- `handleClose` 调 `resetFields()` + 重置 defaultForm

## 自检

- `useTable` 的 `apiParams` 是否与搜索栏字段对齐
- 操作列 `ArtButtonTable` 的 type 是否在 `'add' | 'edit' | 'delete' | 'view' | 'more'` 之内
- 字典渲染是否用 `ArtDictTag`（h 函数里要 import，模板里自动注册不用）
- 权限指令是 `v-auth`（`v-hasPermi` 也支持，是别名）
- 详情弹窗的富文本 v-html 是否包了 `sanitizeHtml`
- 弹窗关闭是否重置了富文本（注意 resetFields 清不掉没 prop 的 form-item）
