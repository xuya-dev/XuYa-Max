<!--
  用户管理页面（对接 XuYa-Max）

  标准 CRUD 范式：XuyaSearchBar + XuyaTableHeader + XuyaTable + useTable + 弹窗
  - 左侧部门树筛选
  - 字典：sys_normal_disable / sys_user_gender
  - 权限：v-auth="'system:user:add'" 等
-->
<template>
  <div class="user-page xuya-full-height flex gap-3">
    <!-- 部门树 -->
    <ElCard class="dept-tree-card" v-if="showDeptTree">
      <template #header>
        <div class="flex-cb">
          <span>部门结构</span>
          <ElIcon class="cursor-pointer" @click="showDeptTree = false"><Fold /></ElIcon>
        </div>
      </template>
      <ElInput v-model="deptName" placeholder="请输入部门名称" :prefix-icon="Search" clearable size="small" />
      <div class="dept-tree-wrapper">
        <ElTree
          ref="deptTreeRef"
          class="mt-2"
          node-key="id"
          :data="deptOptions"
          :props="{ label: 'label', children: 'children' }"
          :expand-on-click-node="false"
          :filter-node-method="filterNode"
          highlight-current
          default-expand-all
          @node-click="handleNodeClick"
        />
      </div>
    </ElCard>

    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 搜索栏 -->
      <UserSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

      <ElCard class="xuya-table-card">
        <!-- 表格头部 -->
        <XuyaTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
          <template #left>
            <ElSpace wrap>
              <ElButton icon="Expand" v-if="!showDeptTree" @click="showDeptTree = true">部门树</ElButton>
              <ElButton type="primary" icon="Plus" v-auth="'system:user:add'" @click="handleAdd">新增</ElButton>
              <ElButton
                type="success"
                icon="Edit"
                :disabled="single"
                v-auth="'system:user:edit'"
                @click="handleUpdate()"
                >修改</ElButton
              >
              <ElButton
                type="danger"
                icon="Delete"
                :disabled="multiple"
                v-auth="'system:user:remove'"
                @click="handleDelete()"
                >删除</ElButton
              >
              <ElButton type="info" icon="Upload" v-auth="'system:user:import'" @click="handleImport">导入</ElButton>
              <ElButton type="warning" icon="Download" v-auth="'system:user:export'" @click="handleExport"
                >导出</ElButton
              >
            </ElSpace>
          </template>
        </XuyaTableHeader>

        <!-- 表格 -->
        <XuyaTable
          :loading="loading"
          :data="data"
          :columns="columns"
          :pagination="pagination"
          @selection-change="handleSelectionChange"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />

        <!-- 用户弹窗 -->
        <UserDialog
          v-model:visible="dialog.visible"
          :title="dialog.title"
          :form="dialog.form"
          :dept-options="deptOptions"
          :post-options="postOptions"
          :role-options="roleOptions"
          @success="refreshData"
        />

        <!-- 用户导入弹窗 -->
        <UserImport v-model:visible="importDialog" @success="refreshData" />
      </ElCard>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { h, ref, reactive, onMounted, watch, nextTick } from 'vue'
  import { ElMessage, ElMessageBox, ElSwitch } from 'element-plus'
  import { Fold, Search } from '@element-plus/icons-vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useDict } from '@/hooks/core/useDict'
  import XuyaButtonTable from '@/components/core/forms/xuya-button-table/index.vue'
  import XuyaDictTag from '@/components/core/others/xuya-dict-tag/index.vue'
  import {
    listUser,
    delUser,
    getUser,
    addUser,
    updateUser,
    deptTreeSelect,
    resetUserPwd,
    changeUserStatus,
    unlockUser
  } from '@/api/system/user'
  import { listPost } from '@/api/system/post'
  import { listRole } from '@/api/system/role'
  import type { UserVO, UserForm } from '@/api/system/user/types'
  import { download } from '@/utils/http'
  import UserSearch from './modules/user-search.vue'
  import UserDialog from './modules/user-dialog.vue'
  import UserImport from './modules/user-import.vue'

  defineOptions({ name: 'User' })

  // 字典：性别 / 状态
  const { sys_user_gender, sys_normal_disable } = useDict('sys_user_gender', 'sys_normal_disable')
  // 是否展示部门树（移动端可隐藏）
  const showDeptTree = ref(true)

  // 选中行
  const ids = ref<(string | number)[]>([])
  const single = ref(true)
  const multiple = ref(true)

  // 搜索表单
  const searchForm = ref<any>({
    userName: undefined,
    phoneNumber: undefined,
    status: undefined,
    deptId: undefined,
    beginTime: undefined,
    endTime: undefined
  })

  // 部门树
  const deptName = ref('')
  const deptOptions = ref<any[]>([])
  const deptTreeRef = ref()

  // 岗位/角色选项（新增/编辑弹窗用）
  const postOptions = ref<any[]>([])
  const roleOptions = ref<any[]>([])

  // 弹窗状态
  const dialog = reactive<{ visible: boolean; title: string; form: Partial<UserForm> }>({
    visible: false,
    title: '',
    form: {}
  })

  /** 用户导入弹窗显隐 */
  const importDialog = ref(false)

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
      apiFn: listUser,
      apiParams: { ...searchForm.value },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 60, label: '序号' },
        {
          prop: 'userName',
          label: '用户名称',
          formatter: (row: UserVO) =>
            h('div', { class: 'text-center' }, [
              h('p', { class: 'font-medium' }, row.userName),
              h('p', { class: 'text-xs text-gray-400' }, row.deptName || '')
            ])
        },
        { prop: 'nickName', label: '用户昵称' },
        {
          prop: 'gender',
          label: '性别',
          formatter: (row: UserVO) =>
            h(XuyaDictTag, { options: sys_user_gender as any, value: row.gender })
        },
        { prop: 'phoneNumber', label: '手机号' },
        {
          prop: 'status',
          label: '状态',
          formatter: (row: UserVO) =>
            row.userId === 1
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
          formatter: (row: UserVO) =>
            h('div', { class: 'flex gap-1' }, [
              h(XuyaButtonTable, { type: 'edit', onClick: () => handleUpdate(row) }),
              h(XuyaButtonTable, { type: 'delete', onClick: () => handleDelete(row) }),
              row.userId !== 1 && row.userId !== 2
                ? h(XuyaButtonTable, {
                    text: '重置密码',
                    icon: 'Key',
                    onClick: () => handleResetPwd(row)
                  })
                : null,
              row.userId !== 1 && row.userId !== 2
                ? h(XuyaButtonTable, {
                    text: '解锁',
                    icon: 'LockOpen',
                    onClick: () => handleUnlock(row)
                  })
                : null
            ])
        }
      ]
    }
  })

  /** 加载部门树 */
  const getDeptTree = async () => {
    const res = await deptTreeSelect()
    deptOptions.value = res || []
  }

  /** 加载岗位/角色选项 */
  const getOptions = async () => {
    try {
      const [posts, roles] = await Promise.all([
        listPost({ pageNum: 1, pageSize: 100 } as any),
        listRole({ pageNum: 1, pageSize: 100 } as any)
      ])
      postOptions.value = posts?.rows || []
      roleOptions.value = roles?.rows || []
    } catch (e) {
      console.error('获取岗位/角色选项失败', e)
    }
  }

  /** 部门树筛选 */
  watch(deptName, (val) => {
    deptTreeRef.value?.filter(val)
  })
  const filterNode = (value: string, data: any) => {
    if (!value) return true
    return data.label.indexOf(value) !== -1
  }

  /** 点击部门节点 */
  const handleNodeClick = (data: any) => {
    searchForm.value.deptId = data.id
    handleSearch(searchForm.value)
  }

  /** 搜索 */
  const handleSearch = (params: any) => {
    replaceSearchParams(params)
    getData()
  }

  /** 选中行变化 */
  const handleSelectionChange = (selection: UserVO[]) => {
    ids.value = selection.map((item) => item.userId)
    single.value = selection.length !== 1
    multiple.value = !selection.length
  }

  /** 新增 */
  const handleAdd = () => {
    dialog.title = '新增用户'
    dialog.form = {
      userName: '',
      nickName: '',
      password: '',
      phoneNumber: '',
      email: '',
      gender: '0',
      status: '0',
      deptId: undefined,
      postIds: [],
      roleIds: [],
      remark: ''
    }
    dialog.visible = true
  }

  /** 修改 */
  const handleUpdate = async (row?: UserVO) => {
    const userId = row?.userId || ids.value[0]
    try {
      const res: any = await getUser(userId)
      const user = res?.user || res
      dialog.title = '修改用户'
      dialog.form = {
        userId: user.userId,
        userName: user.userName,
        nickName: user.nickName,
        password: '',
        phoneNumber: user.phoneNumber,
        email: user.email,
        gender: String(user.gender ?? '0'),
        status: String(user.status ?? '0'),
        deptId: user.deptId,
        postIds: res?.postIds || [],
        roleIds: res?.roleIds || [],
        remark: user.remark
      }
      dialog.visible = true
    } catch (e) {
      console.error('获取用户详情失败', e)
    }
  }

  /** 删除 */
  const handleDelete = async (row?: UserVO) => {
    const userIds = row ? [row.userId] : ids.value
    try {
      await ElMessageBox.confirm(`是否确认删除用户编号为 "${userIds}" 的数据项？`, '系统提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await delUser(userIds.join(','))
      ElMessage.success('删除成功')
      refreshData()
    } catch (e) {
      // 取消或失败
    }
  }

  /** 重置密码 */
  const handleResetPwd = async (row: UserVO) => {
    try {
      const { value } = await ElMessageBox.prompt(`请输入 "${row.userName}" 的新密码`, '系统提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^.{5,20}$/,
        inputErrorMessage: '密码长度必须介于 5 和 20 之间'
      })
      await resetUserPwd(row.userId, value)
      ElMessage.success('修改成功')
    } catch (e) {
      // 取消
    }
  }

  /**
   * 用户状态切换（作为 ElSwitch.beforeChange 使用）
   * beforeChange 仅在用户实际点击时触发，数据初始化/刷新不会触发。
   * 返回 true 允许切换，返回 false（或 reject）阻止切换。
   */
  const handleStatusChange = (row: UserVO): Promise<boolean> => {
    // 当前 status 即旧值，目标值取反
    const willEnable = row.status !== '0'
    const text = willEnable ? '启用' : '停用'
    const targetStatus = willEnable ? '0' : '1'
    return ElMessageBox.confirm(`确认要"${text}"用户 "${row.userName}" 吗？`, '系统提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await changeUserStatus(row.userId, targetStatus)
        ElMessage.success(`${text}成功`)
        row.status = targetStatus
        return true
      })
      .catch(() => false)
  }

  /** 解锁用户 */
  const handleUnlock = async (row: UserVO) => {
    try {
      await ElMessageBox.confirm(`确认要解锁用户 "${row.userName}" 吗？`, '系统提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await unlockUser(row.userId)
      ElMessage.success('解锁成功')
    } catch (e) {
      // 取消
    }
  }

  /** 导入 */
  const handleImport = () => {
    importDialog.value = true
  }

  /** 导出 */
  const handleExport = () => {
    download('/system/user/export', { ...searchForm.value }, `user_${new Date().getTime()}.xlsx`)
  }

  onMounted(() => {
    getDeptTree()
    getOptions()
  })
</script>

<style lang="scss" scoped>
  .user-page {
    /* 撑满除顶栏/标签页外的剩余高度 */
    height: 100%;
    min-height: 0;
    /* xuya-full-height 全局类设置了 flex-direction: column（用于纵向撑满），
       这里覆盖为 row，实现「左侧部门树 + 右侧表格」的左右布局 */
    flex-direction: row;
  }
  .dept-tree-card {
    width: 240px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  /* 右侧主区域：允许收缩，防止表格撑破整体宽度 */
  .user-page > .flex-1 {
    min-width: 0;
    flex: 1;
  }
  /* 卡片 body 弹性布局，部门树区域可滚动 */
  .dept-tree-card :deep(.el-card__body) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .dept-tree-wrapper {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
  :deep(.el-tree) {
    background: transparent;
  }
</style>
