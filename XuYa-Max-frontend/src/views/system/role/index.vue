<!--
  角色管理页面（对接 XuYa-Max）
-->
<template>
  <div class="role-page xuya-full-height flex flex-col overflow-hidden">
    <RoleSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="xuya-table-card">
      <XuyaTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" icon="Plus" v-auth="'system:role:add'" @click="handleAdd">新增</ElButton>
            <ElButton type="success" icon="Edit" :disabled="single" v-auth="'system:role:edit'" @click="handleUpdate()"
              >修改</ElButton
            >
            <ElButton type="danger" icon="Delete" :disabled="multiple" v-auth="'system:role:remove'" @click="handleDelete()"
              >删除</ElButton
            >
            <ElButton type="warning" icon="Download" v-auth="'system:role:export'" @click="handleExport">导出</ElButton>
          </ElSpace>
        </template>
      </XuyaTableHeader>

      <XuyaTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />

      <RoleDialog
        v-model:visible="dialog.visible"
        :title="dialog.title"
        :form="dialog.form"
        :menu-tree="menuOptions"
        @success="refreshData"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h, ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox, ElSwitch } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import { useDict } from '@/hooks/core/useDict'
  import XuyaButtonTable from '@/components/core/forms/xuya-button-table/index.vue'
  import XuyaDictTag from '@/components/core/others/xuya-dict-tag/index.vue'
  import { listRole, delRole, getRole, changeRoleStatus } from '@/api/system/role'
  import { treeselect, roleMenuTreeselect } from '@/api/system/menu'
  import type { RoleVO, RoleForm } from '@/api/system/role/types'
  import { download } from '@/utils/http'
  import RoleSearch from './modules/role-search.vue'
  import RoleDialog from './modules/role-dialog.vue'

  defineOptions({ name: 'Role' })

  const { sys_normal_disable } = useDict('sys_normal_disable')

  const ids = ref<(string | number)[]>([])
  const single = ref(true)
  const multiple = ref(true)

  const searchForm = ref<any>({ roleName: undefined, roleKey: undefined, status: undefined })

  const menuOptions = ref<any[]>([])

  const dialog = reactive<{ visible: boolean; title: string; form: Partial<RoleForm> }>({
    visible: false,
    title: '',
    form: {}
  })

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: listRole,
      apiParams: { ...searchForm.value },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 60, label: '序号' },
        { prop: 'roleId', label: '角色编号' },
        { prop: 'roleName', label: '角色名称' },
        { prop: 'roleKey', label: '权限字符' },
        { prop: 'roleSort', label: '显示顺序' },
        {
          prop: 'status',
          label: '状态',
          formatter: (row: RoleVO) =>
            row.roleId === 1
              ? h(XuyaDictTag, { options: sys_normal_disable as any, value: row.status })
              : h(
                  ElSwitch,
                  {
                    modelValue: row.status,
                    activeValue: '0',
                    inactiveValue: '1',
                    inlinePrompt: true,
                    activeText: '正常',
                    inactiveText: '停用',
                    beforeChange: () => handleStatusChange(row)
                  },
                  () => ''
                )
        },
        { prop: 'createTime', label: '创建时间', width: 160 },
        {
          prop: 'operation',
          label: '操作',
          width: 220,
          fixed: 'right',
          formatter: (row: RoleVO) =>
            h('div', { class: 'flex gap-1' }, [
              h(XuyaButtonTable, { type: 'edit', onClick: () => handleUpdate(row) }),
              h(XuyaButtonTable, { type: 'delete', onClick: () => handleDelete(row) })
            ])
        }
      ]
    }
  })

  /** 加载菜单树（用于角色权限分配） */
  const getMenuTree = async () => {
    try {
      const res: any = await treeselect()
      menuOptions.value = res || []
    } catch (e) {
      console.error('获取菜单树失败', e)
    }
  }

  const handleSearch = (params: any) => {
    replaceSearchParams(params)
    getData()
  }

  const handleSelectionChange = (selection: RoleVO[]) => {
    ids.value = selection.map((item) => item.roleId)
    single.value = selection.length !== 1
    multiple.value = !selection.length
  }

  const handleAdd = () => {
    dialog.title = '新增角色'
    dialog.form = {
      roleName: '',
      roleKey: '',
      roleSort: 0,
      status: '0',
      dataScope: '1',
      menuIds: [],
      deptIds: [],
      menuCheckStrictly: true,
      deptCheckStrictly: true,
      remark: ''
    }
    dialog.visible = true
  }

  const handleUpdate = async (row?: RoleVO) => {
    const roleId = row?.roleId || ids.value[0]
    try {
      // 后端 GET /system/role/{roleId} 返回的 SysRoleVo 不含 menuIds，
      // 已勾选菜单需通过 roleMenuTreeselect 拿到 checkedKeys 回显，否则编辑保存会误清空权限
      const [res, menuRes]: any = await Promise.all([getRole(roleId), roleMenuTreeselect(roleId)])
      const role = res
      dialog.title = '修改角色'
      dialog.form = {
        roleId: role.roleId,
        roleName: role.roleName,
        roleKey: role.roleKey,
        roleSort: role.roleSort,
        status: String(role.status ?? '0'),
        dataScope: String(role.dataScope ?? '1'),
        menuIds: menuRes?.checkedKeys || [],
        deptIds: [],
        menuCheckStrictly: role.menuCheckStrictly !== false,
        deptCheckStrictly: role.deptCheckStrictly !== false,
        remark: role.remark
      }
      dialog.visible = true
    } catch (e) {
      console.error('获取角色详情失败', e)
    }
  }

  const handleDelete = async (row?: RoleVO) => {
    const roleIds = row ? [row.roleId] : ids.value
    try {
      await ElMessageBox.confirm(`是否确认删除角色编号为 "${roleIds}" 的数据项？`, '系统提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await delRole(roleIds.join(','))
      ElMessage.success('删除成功')
      refreshData()
    } catch (e) {}
  }

  /**
   * 角色状态切换（作为 ElSwitch.beforeChange 使用）
   * beforeChange 仅在用户实际点击时触发，数据初始化/刷新不会触发。
   */
  const handleStatusChange = (row: RoleVO): Promise<boolean> => {
    const willEnable = row.status !== '0'
    const text = willEnable ? '启用' : '停用'
    const targetStatus = willEnable ? '0' : '1'
    return ElMessageBox.confirm(`确认要"${text}""${row.roleName}"角色吗？`, '系统提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await changeRoleStatus(row.roleId, targetStatus)
        ElMessage.success(`${text}成功`)
        row.status = targetStatus
        return true
      })
      .catch(() => false)
  }

  const handleExport = () => {
    download('/system/role/export', { ...searchForm.value }, `role_${new Date().getTime()}.xlsx`)
  }

  onMounted(() => {
    getMenuTree()
  })
</script>
