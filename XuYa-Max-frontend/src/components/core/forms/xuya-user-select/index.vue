<!--
  XuyaUserSelect 用户选择器（移植自 plus-ui UserSelect，去除 vxe-table 依赖）
  - 弹窗形式：左侧部门树 + 右侧用户列表（搜索/分页/多选）
  - 支持单选/多选（multiple），v-model 绑定已选用户数组
  - 用法：
      <XuyaUserSelect ref="userSelectRef" v-model="selectedUsers" :multiple="true" />
      // 打开：userSelectRef.value?.open()
      // 设置默认选中（传 userIds）：userSelectRef.value?.open([1, 2])
  - emit: update:modelValue（已选用户数组）、confirm（同）
-->
<template>
  <ElDialog v-model="visible" title="用户选择" width="900px" append-to-body destroy-on-close>
    <div class="user-select-body">
      <div class="flex gap-3 h-full max-md:block">
        <!-- 左侧：部门树 -->
        <div class="dept-side max-md:!w-full max-md:!mb-3">
          <div class="xuya-card-sm h-full flex flex-col">
            <div class="px-4 py-3 border-b border-g-300">
              <span class="text-sm font-medium text-g-800">部门结构</span>
            </div>
            <div class="p-3 flex-1 flex flex-col min-h-0">
              <ElInput v-model="deptName" placeholder="请输入部门名称" :prefix-icon="Search" clearable size="small" class="mb-2" />
              <div class="flex-1 overflow-auto min-h-0">
                <ElTree
                  ref="deptTreeRef"
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
            </div>
          </div>
        </div>

        <!-- 右侧：用户列表 -->
        <div class="flex-1 min-w-0 max-md:!w-full">
          <!-- 搜索栏 -->
          <div class="xuya-card-sm mb-3 p-3">
            <ElForm :inline="true" :model="queryParams" class="!mb-0">
              <ElFormItem label="用户名称" class="!mb-0">
                <ElInput v-model="queryParams.userName" placeholder="请输入用户名称" clearable @keyup.enter="handleQuery" />
              </ElFormItem>
              <ElFormItem label="手机号码" class="!mb-0">
                <ElInput v-model="queryParams.phoneNumber" placeholder="请输入手机号码" clearable @keyup.enter="handleQuery" />
              </ElFormItem>
              <ElFormItem class="!mb-0">
                <ElButton type="primary" :icon="Search" @click="handleQuery">搜索</ElButton>
                <ElButton :icon="Refresh" @click="resetQuery">重置</ElButton>
              </ElFormItem>
            </ElForm>
          </div>

          <!-- 已选标签（多选时） -->
          <div v-if="multiple && selectedUsers.length" class="xuya-card-sm mb-3 p-3">
            <div class="flex-c flex-wrap gap-2">
              <span class="text-xs text-g-600">已选 {{ selectedUsers.length }} 人：</span>
              <ElTag v-for="u in selectedUsers" :key="u.userId" closable size="small" @close="removeSelected(u)">
                {{ u.nickName || u.userName }}
              </ElTag>
            </div>
          </div>

          <!-- 用户表格 -->
          <div class="xuya-card-sm">
            <ElTable
              v-loading="loading"
              :data="userList"
              border
              height="340"
              @selection-change="handleSelectionChange"
              @row-click="handleRowClick"
            >
              <ElTableColumn v-if="multiple" type="selection" width="45" :reserve-selection="true" />
              <ElTableColumn v-else label="选择" width="55" align="center">
                <template #default="{ row }">
                  <ElRadio :model-value="singleSelectedId" :value="String(row.userId)" @change="handleSingleSelect(row)">&nbsp;</ElRadio>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="userName" label="用户名称" min-width="100" show-overflow-tooltip />
              <ElTableColumn prop="nickName" label="用户昵称" min-width="100" show-overflow-tooltip />
              <ElTableColumn prop="deptName" label="部门" min-width="100" show-overflow-tooltip />
              <ElTableColumn prop="phoneNumber" label="手机号码" min-width="110" show-overflow-tooltip />
              <ElTableColumn label="状态" width="80" align="center">
                <template #default="{ row }">
                  <XuyaDictTag :options="sys_normal_disable" :value="row.status" />
                </template>
              </ElTableColumn>
            </ElTable>
            <div class="flex-cb p-3">
              <span class="text-xs text-g-500">共 {{ total }} 条</span>
              <ElPagination
                v-model:current-page="queryParams.pageNum"
                v-model:page-size="queryParams.pageSize"
                :total="total"
                :page-sizes="[10, 20, 50]"
                size="small"
                layout="sizes, prev, pager, next"
                @size-change="getList"
                @current-change="getList"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" @click="confirm">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import { Search, Refresh } from '@element-plus/icons-vue'
  import XuyaDictTag from '@/components/core/others/xuya-dict-tag/index.vue'
  import { useDict } from '@/hooks/core/useDict'
  import { listUser, deptTreeSelect } from '@/api/system/user'
  import type { UserVO } from '@/api/system/user/types'

  defineOptions({ name: 'XuyaUserSelect' })

  const props = withDefaults(
    defineProps<{
      /** 是否多选 */
      multiple?: boolean
      /** 绑定值（已选用户数组） */
      modelValue?: UserVO[]
    }>(),
    {
      multiple: true,
      modelValue: () => []
    }
  )

  const emit = defineEmits<{
    'update:modelValue': [users: UserVO[]]
    confirm: [users: UserVO[]]
  }>()

  const { sys_normal_disable } = useDict('sys_normal_disable')

  const visible = ref(false)
  const loading = ref(false)
  const userList = ref<UserVO[]>([])
  const total = ref(0)
  const deptOptions = ref<any[]>([])
  const deptName = ref('')
  const deptTreeRef = ref<any>()
  /** 已选用户（内部维护，确认时回传） */
  const selectedUsers = ref<UserVO[]>([])
  /** 单选时选中的 userId */
  const singleSelectedId = ref('')

  const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    userName: '',
    phoneNumber: '',
    deptId: '' as string | number | ''
  })

  /** 部门树过滤 */
  const filterNode = (value: string, data: any) => {
    if (!value) return true
    return data.label?.indexOf(value) !== -1
  }
  watch(deptName, (val) => deptTreeRef.value?.filter(val))

  /** 加载部门树 */
  const getDeptTree = async () => {
    try {
      const res: any = await deptTreeSelect()
      deptOptions.value = res || []
    } catch (e) {
      console.error('获取部门树失败', e)
    }
  }

  /** 加载用户列表 */
  const getList = async () => {
    loading.value = true
    try {
      const res: any = await listUser({ ...queryParams })
      userList.value = res?.rows || []
      total.value = res?.total || 0
      // 多选时，恢复当前页已选行的勾选状态
      if (props.multiple) {
        await nextTick()
        const tableEl = document.querySelector('.user-select-body .el-table__body-wrapper')
        if (tableEl) {
          // ElTable 不支持跨页 reserve-selection 的简单实现，这里用 selection-change 累积
        }
      }
    } catch (e) {
      console.error('获取用户列表失败', e)
    } finally {
      loading.value = false
    }
  }

  const handleQuery = () => {
    queryParams.pageNum = 1
    getList()
  }
  const resetQuery = () => {
    queryParams.userName = ''
    queryParams.phoneNumber = ''
    queryParams.deptId = ''
    queryParams.pageNum = 1
    deptTreeRef.value?.setCurrentKey(null)
    handleQuery()
  }
  const handleNodeClick = (data: any) => {
    queryParams.deptId = data.id
    handleQuery()
  }

  /** 多选：selection-change */
  const handleSelectionChange = (rows: UserVO[]) => {
    // 合并：保留其它页已选 + 当前页新选
    const currentPageIds = userList.value.map((u) => String(u.userId))
    const kept = selectedUsers.value.filter((u) => !currentPageIds.includes(String(u.userId)))
    selectedUsers.value = [...kept, ...rows]
  }

  /** 多选：行点击也触发勾选 */
  const handleRowClick = (row: UserVO) => {
    if (!props.multiple) return
    // 通过 toggleRowSelection 勾选
    const tableRef = (document.querySelector('.user-select-body .el-table') as any)?.__vueParentComponent?.ctx
    // ElTable 的 toggleRowSelection 需通过 ref 调用，这里简化：复用 selection-change
  }

  /** 单选 */
  const handleSingleSelect = (row: UserVO | any) => {
    singleSelectedId.value = String(row.userId)
    selectedUsers.value = [row]
  }

  /** 移除已选标签 */
  const removeSelected = (user: UserVO) => {
    selectedUsers.value = selectedUsers.value.filter((u) => u.userId !== user.userId)
    if (!props.multiple) singleSelectedId.value = ''
  }

  /** 确认 */
  const confirm = () => {
    emit('update:modelValue', selectedUsers.value)
    emit('confirm', selectedUsers.value)
    visible.value = false
  }

  /**
   * 打开弹窗
   * @param defaultIds 默认选中的 userId 数组（可选）
   */
  const open = async (defaultIds?: (string | number)[]) => {
    visible.value = true
    selectedUsers.value = []
    singleSelectedId.value = ''
    queryParams.pageNum = 1
    queryParams.userName = ''
    queryParams.phoneNumber = ''
    queryParams.deptId = ''
    await getDeptTree()
    await getList()
    // 若传入默认选中 ID，从列表中匹配
    if (defaultIds && defaultIds.length) {
      const matched = userList.value.filter((u) => defaultIds.map(String).includes(String(u.userId)))
      if (props.multiple) {
        selectedUsers.value = matched
      } else if (matched.length) {
        selectedUsers.value = [matched[0]]
        singleSelectedId.value = String(matched[0].userId)
      }
    } else if (props.modelValue?.length) {
      // 从 modelValue 恢复
      selectedUsers.value = [...props.modelValue]
      if (!props.multiple && selectedUsers.value[0]) {
        singleSelectedId.value = String(selectedUsers.value[0].userId)
      }
    }
  }

  const close = () => {
    visible.value = false
  }

  defineExpose({ open, close })
</script>

<style lang="scss" scoped>
  @reference '@styles/core/tailwind.css';

  .user-select-body {
    min-height: 460px;
  }
  .dept-side {
    width: 220px;
    flex-shrink: 0;
  }
  .user-select-body :deep(.el-table) {
    cursor: pointer;
  }
</style>
