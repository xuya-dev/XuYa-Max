<!-- 菜单管理（树形表格） -->
<template>
  <div class="menu-page xuya-full-height flex flex-col overflow-hidden">
    <ElCard class="mb-3">
      <ElForm :inline="true" :model="searchForm">
        <ElFormItem label="菜单名称"><ElInput v-model="searchForm.menuName" placeholder="请输入菜单名称" clearable @keyup.enter="getList" /></ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" placeholder="菜单状态" clearable style="width:160px">
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
          <ElButton type="primary" icon="Plus" v-auth="'system:menu:add'" @click="handleAdd()">新增</ElButton>
          <ElButton :icon="isExpandAll ? 'Fold' : 'Expand'" @click="toggleExpandAll">{{ isExpandAll ? '折叠' : '展开' }}</ElButton>
        </ElSpace>
      </div>
      <div class="menu-table-wrapper">
      <ElTable
        v-if="refreshTable"
        v-loading="loading"
        :data="menuList"
        row-key="menuId"
        border
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <ElTableColumn prop="menuName" label="菜单名称" width="240" header-align="center">
          <template #default="{ row }">
            <span class="menu-name-cell">
              <XuyaSvgIcon :icon="mapXuYaMaxIcon(row.icon)" class="menu-name-icon" v-if="mapXuYaMaxIcon(row.icon)" />
              <span>{{ row.menuName }}</span>
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="menuType" label="类型" align="center" width="80">
          <template #default="{ row }">
            <ElTag :type="getMenuTypeMeta(row).type" size="small">{{ getMenuTypeMeta(row).label }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="orderNum" label="排序" align="center" width="80" />
        <ElTableColumn prop="perms" label="权限标识" align="center" :show-overflow-tooltip="true" />
        <ElTableColumn prop="component" label="组件路径" align="center" :show-overflow-tooltip="true" />
        <ElTableColumn prop="status" label="状态" align="center" width="90">
          <template #default="{ row }"><XuyaDictTag :options="sys_normal_disable as any" :value="row.status" /></template>
        </ElTableColumn>
        <ElTableColumn label="操作" align="center" width="180" class-name="small-padding fixed-width">
          <template #default="{ row }">
            <div class="flex-c justify-center gap-1">
              <ElTooltip content="修改" placement="top" v-auth="'system:menu:edit'">
                <XuyaButtonTable type="edit" @click="handleUpdate(row)" />
              </ElTooltip>
              <ElTooltip content="新增" placement="top" v-auth="'system:menu:add'">
                <XuyaButtonTable type="add" @click="handleAdd(row)" />
              </ElTooltip>
              <ElTooltip content="删除" placement="top" v-auth="'system:menu:remove'">
                <XuyaButtonTable type="delete" @click="handleDelete(row)" />
              </ElTooltip>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
      </div>
      <MenuDialog v-model:visible="dialog.visible" :title="dialog.title" :form="dialog.form" :menu-options="menuOptions" @success="getList" />
    </ElCard>
  </div>
</template>
<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useDict } from '@/hooks/core/useDict'
  import XuyaDictTag from '@/components/core/others/xuya-dict-tag/index.vue'
  import { listMenu, delMenu, cascadeDelMenu, getMenu, treeselect } from '@/api/system/menu'
  import type { MenuVO, MenuForm } from '@/api/system/menu/types'
  import { parseTime, handleTree } from '@/utils/xuya-max'
  import { mapXuYaMaxIcon } from '@/utils/iconMap'
  import { MenuTypeEnum } from '@/enums/MenuTypeEnum'
  import XuyaButtonTable from '@/components/core/forms/xuya-button-table/index.vue'
  import MenuDialog from './modules/menu-dialog.vue'
  defineOptions({ name: 'Menu' })
  const { sys_normal_disable } = useDict('sys_normal_disable')
  const menuList = ref<any[]>([])
  const menuOptions = ref<any[]>([])
  const loading = ref(false)
  // 默认折叠树表，避免菜单数量多时一次性展开撑爆页面（对齐 plus-ui default-expand-all=false）
  const isExpandAll = ref(false)
  const refreshTable = ref(true)

  /** 菜单类型元信息：目录 / 菜单 / 按钮 / 外链（移植自 plus-ui getMenuTypeMeta） */
  const getMenuTypeMeta = (menu: any): { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' } => {
    if (menu.menuType === MenuTypeEnum.F) {
      return { label: '按钮', type: 'warning' }
    }
    if (menu.isFrame === 'Y' || menu.isFrame === '0') {
      return { label: '外链', type: 'danger' }
    }
    if (menu.menuType === MenuTypeEnum.M) {
      return { label: '目录', type: 'primary' }
    }
    return { label: '菜单', type: 'success' }
  }
  const searchForm = ref<any>({ menuName: undefined, status: undefined })
  const dialog = reactive<{ visible: boolean; title: string; form: Partial<MenuForm> }>({ visible: false, title: '', form: {} })

  const getList = async () => {
    loading.value = true
    try {
      const res: any = await listMenu(searchForm.value)
      // handleTree 默认用 'id' 作为标识字段，但菜单数据的主键是 menuId，必须显式传入
      menuList.value = handleTree<any>(res || [], 'menuId', 'parentId', 'children')
    } catch (e) { console.error(e) } finally { loading.value = false }
  }
  const getTreeselect = async () => {
    try {
      const res: any = await treeselect()
      menuOptions.value = [{ id: 0, label: '主类目', children: res || [] }]
    } catch (e) { console.error(e) }
  }
  const resetSearch = () => { searchForm.value = { menuName: undefined, status: undefined }; getList() }
  const toggleExpandAll = () => { refreshTable.value = false; isExpandAll.value = !isExpandAll.value; nextTick(() => (refreshTable.value = true)) }
  const handleAdd = async (row?: any) => {
    await getTreeselect()
    dialog.title = '新增菜单'
    dialog.form = { parentId: row?.menuId || 0, menuType: 'M' as any, orderNum: 0, visible: '0', status: '0', isFrame: '1', isCache: '0' }
    dialog.visible = true
  }
  const handleUpdate = async (row: any) => {
    await getTreeselect()
    try {
      const res: any = await getMenu(row.menuId)
      const d = res
      dialog.title = '修改菜单'
      dialog.form = { ...d, visible: String(d.visible ?? '0'), status: String(d.status ?? '0'), isFrame: String(d.isFrame ?? '1'), isCache: String(d.isCache ?? '0') }
      dialog.visible = true
    } catch (e) { console.error(e) }
  }
  const handleDelete = async (row: any) => {
    const hasChildren = Array.isArray(row.children) && row.children.length > 0
    try {
      if (hasChildren) {
        // 存在子菜单：询问是否级联删除（级联删除会一并删除所有子孙菜单）
        const action = await ElMessageBox.confirm(
          `菜单 "${row.menuName}" 存在子菜单，普通删除将失败。\n点击「级联删除」将一并删除其所有子孙菜单，是否继续？`,
          '系统提示',
          {
            confirmButtonText: '级联删除',
            cancelButtonText: '取消',
            type: 'warning',
            distinguishCancelAndClose: true
          }
        ).then(() => 'cascade')
          .catch((action: string) => (action === 'cancel' ? 'cancel' : 'close'))
        if (action !== 'cascade') return
        await cascadeDelMenu([row.menuId])
        ElMessage.success('级联删除成功')
        getList()
      } else {
        // 叶子菜单：普通删除
        await ElMessageBox.confirm(`是否确认删除菜单名称为 "${row.menuName}" 的数据项？`, '系统提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
        await delMenu(row.menuId)
        ElMessage.success('删除成功')
        getList()
      }
    } catch (e) {
      // 取消或失败
    }
  }
  onMounted(() => { getList() })
</script>

<style lang="scss" scoped>
  .menu-page {
    /* 覆盖 xuya-full-height 的 flex-direction:column（该值本身即纵向，无需覆盖），
       主要确保整体高度受限，表格卡片内部可滚动 */
  }
  /* 卡片 body 纵向撑满，工具栏固定、表格区域可滚动 */
  .xuya-table-card :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  /* 表格外层容器：占满剩余高度，内部纵向滚动 */
  .menu-table-wrapper {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  /* 菜单名称单元格：用 inline-flex 与 ElTable 的展开箭头保持同一行，
     避免 div 块级元素把箭头挤到上一行 */
  .menu-name-cell {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    vertical-align: middle;
  }
  .menu-name-icon {
    font-size: 16px;
    flex-shrink: 0;
  }
  /* 展开箭头与文字垂直对齐微调：Element Plus 默认箭头视觉偏上约 1px，
     用 relative top 让箭头下移，与图标/文字视觉中心对齐 */
  :deep(.el-table__expand-icon) {
    position: relative;
    top: 1px;
  }
</style>
