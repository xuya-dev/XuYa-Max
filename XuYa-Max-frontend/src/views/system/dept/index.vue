<!-- 部门管理（树形表格） -->
<template>
  <div class="dept-page xuya-full-height flex flex-col overflow-hidden">
    <ElCard class="mb-3">
      <ElForm :inline="true" :model="searchForm">
        <ElFormItem label="部门名称"><ElInput v-model="searchForm.deptName" placeholder="请输入部门名称" clearable @keyup.enter="getList" /></ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" placeholder="部门状态" clearable style="width:160px">
            <ElOption v-for="item in sys_normal_disable" :key="item.value" :label="item.label" :value="item.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" icon="Search" @click="getList">搜索</ElButton>
          <ElButton icon="Refresh" @click="resetSearch">重置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
    <ElCard class="xuya-table-card flex-1 min-h-0">
      <div class="flex-cb mb-3">
        <ElSpace wrap>
          <ElButton type="primary" icon="Plus" v-auth="'system:dept:add'" @click="handleAdd()">新增</ElButton>
          <ElButton :icon="isExpandAll ? 'Fold' : 'Expand'" @click="toggleExpandAll">{{ isExpandAll ? '折叠' : '展开' }}</ElButton>
        </ElSpace>
      </div>
      <div class="dept-table-wrapper">
        <ElTable
          v-if="refreshTable"
          v-loading="loading"
          :data="deptList"
          row-key="deptId"
          border
          :default-expand-all="isExpandAll"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        >
          <ElTableColumn prop="deptName" label="部门名称" width="240" header-align="center">
            <template #default="{ row }">
              <span class="dept-name-cell">
                <XuyaSvgIcon icon="ri:building-line" class="dept-name-icon" />
                <span>{{ row.deptName }}</span>
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="orderNum" label="排序" align="center" width="100" />
          <ElTableColumn prop="status" label="状态" align="center" width="90">
            <template #default="{ row }"><XuyaDictTag :options="sys_normal_disable as any" :value="row.status" /></template>
          </ElTableColumn>
          <ElTableColumn prop="createTime" label="创建时间" align="center" min-width="180">
            <template #default="{ row }"><span>{{ parseTime(row.createTime) }}</span></template>
          </ElTableColumn>
          <ElTableColumn label="操作" align="center" width="180" class-name="small-padding fixed-width">
            <template #default="{ row }">
              <div class="flex-c justify-center gap-1">
                <ElTooltip content="修改" placement="top" v-auth="'system:dept:edit'">
                  <XuyaButtonTable type="edit" @click="handleUpdate(row)" />
                </ElTooltip>
                <ElTooltip content="新增" placement="top" v-auth="'system:dept:add'">
                  <XuyaButtonTable type="add" @click="handleAdd(row)" />
                </ElTooltip>
                <ElTooltip content="删除" placement="top" v-auth="'system:dept:remove'">
                  <XuyaButtonTable type="delete" @click="handleDelete(row)" />
                </ElTooltip>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
      <DeptDialog v-model:visible="dialog.visible" :title="dialog.title" :form="dialog.form" :dept-options="deptOptions" @success="getList" />
    </ElCard>
  </div>
</template>
<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useDict } from '@/hooks/core/useDict'
  import XuyaDictTag from '@/components/core/others/xuya-dict-tag/index.vue'
  import XuyaSvgIcon from '@/components/core/base/xuya-svg-icon/index.vue'
  import { listDept, delDept, getDept } from '@/api/system/dept'
  import type { DeptVO, DeptForm } from '@/api/system/dept/types'
  import { parseTime, handleTree } from '@/utils/xuya-max'
  import XuyaButtonTable from '@/components/core/forms/xuya-button-table/index.vue'
  import DeptDialog from './modules/dept-dialog.vue'
  defineOptions({ name: 'Dept' })
  const { sys_normal_disable } = useDict('sys_normal_disable')
  const deptList = ref<any[]>([])
  const deptOptions = ref<any[]>([])
  const loading = ref(false)
  // 默认折叠树表，避免部门数量多时一次性展开撑爆页面（对齐菜单页 default-expand-all=false）
  const isExpandAll = ref(false)
  const refreshTable = ref(true)
  const searchForm = ref<any>({ deptName: undefined, status: undefined })
  const dialog = reactive<{ visible: boolean; title: string; form: Partial<DeptForm> }>({ visible: false, title: '', form: {} })
  const getList = async () => {
    loading.value = true
    try { const res: any = await listDept(searchForm.value); deptList.value = handleTree<any>(res || [], 'deptId', 'parentId', 'children') } catch (e) { console.error(e) } finally { loading.value = false }
  }
  const getDeptTree = async () => {
    try { const res: any = await listDept(); const tree = handleTree<any>((res || []).map((d: any) => ({ ...d, label: d.deptName })), 'deptId', 'parentId'); deptOptions.value = [{ id: 0, label: '顶级部门', deptId: 0, children: tree }] } catch (e) { console.error(e) }
  }
  const resetSearch = () => { searchForm.value = { deptName: undefined, status: undefined }; getList() }
  const toggleExpandAll = () => { refreshTable.value = false; isExpandAll.value = !isExpandAll.value; nextTick(() => (refreshTable.value = true)) }
  const handleAdd = async (row?: any) => { await getDeptTree(); dialog.title = '新增部门'; dialog.form = { parentId: row?.deptId || 0, orderNum: 0, status: '0' }; dialog.visible = true }
  const handleUpdate = async (row: any) => { await getDeptTree(); try { const res: any = await getDept(row.deptId); const d = res; dialog.title = '修改部门'; dialog.form = { ...d, status: String(d.status ?? '0') }; dialog.visible = true } catch (e) { console.error(e) } }
  const handleDelete = async (row: any) => { try { await ElMessageBox.confirm(`是否确认删除部门名称为 "${row.deptName}" 的数据项？`, '系统提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await delDept(row.deptId); ElMessage.success('删除成功'); getList() } catch (e) {} }
  onMounted(() => { getList() })
</script>

<style lang="scss" scoped>
  /* 卡片 body 纵向撑满，工具栏固定、表格区域可滚动 */
  .xuya-table-card :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  /* 表格外层容器：占满剩余高度，内部纵向滚动 */
  .dept-table-wrapper {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  /* 部门名称单元格：用 inline-flex 与 ElTable 的展开箭头保持同一行 */
  .dept-name-cell {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    vertical-align: middle;
  }
  .dept-name-icon {
    font-size: 16px;
    flex-shrink: 0;
  }
  /* 展开箭头与文字垂直对齐微调 */
  :deep(.el-table__expand-icon) {
    position: relative;
    top: 1px;
  }
</style>
