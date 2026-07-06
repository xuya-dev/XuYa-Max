<!--
  XuyaRoleSelect 角色选择器（移植自 plus-ui RoleSelect，去除 vxe-table 依赖）
  - 弹窗形式：角色列表（搜索/分页/多选）
  - 支持单选/多选（multiple），v-model 绑定已选角色数组
  - 用法：
      <XuyaRoleSelect ref="roleSelectRef" v-model="selectedRoles" :multiple="true" />
      // 打开：roleSelectRef.value?.open()
      // 设置默认选中：roleSelectRef.value?.open([1, 2])
-->
<template>
  <ElDialog v-model="visible" title="角色选择" width="720px" append-to-body destroy-on-close>
    <div class="role-select-body">
      <!-- 搜索栏 -->
      <div class="xuya-card-sm mb-3 p-3">
        <ElForm :inline="true" :model="queryParams" class="!mb-0">
          <ElFormItem label="角色名称" class="!mb-0">
            <ElInput v-model="queryParams.roleName" placeholder="请输入角色名称" clearable @keyup.enter="handleQuery" />
          </ElFormItem>
          <ElFormItem label="权限字符" class="!mb-0">
            <ElInput v-model="queryParams.roleKey" placeholder="请输入权限字符" clearable @keyup.enter="handleQuery" />
          </ElFormItem>
          <ElFormItem class="!mb-0">
            <ElButton type="primary" :icon="Search" @click="handleQuery">搜索</ElButton>
            <ElButton :icon="Refresh" @click="resetQuery">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </div>

      <!-- 已选标签 -->
      <div v-if="multiple && selectedRoles.length" class="xuya-card-sm mb-3 p-3">
        <div class="flex-c flex-wrap gap-2">
          <span class="text-xs text-g-600">已选 {{ selectedRoles.length }} 个：</span>
          <ElTag v-for="r in selectedRoles" :key="r.roleId" closable size="small" @close="removeSelected(r)">
            {{ r.roleName }}
          </ElTag>
        </div>
      </div>

      <!-- 角色表格 -->
      <div class="xuya-card-sm">
        <ElTable
          v-loading="loading"
          :data="roleList"
          border
          height="340"
          @selection-change="handleSelectionChange"
        >
          <ElTableColumn v-if="multiple" type="selection" width="45" />
          <ElTableColumn v-else label="选择" width="55" align="center">
            <template #default="{ row }">
              <ElRadio :model-value="singleSelectedId" :value="String(row.roleId)" @change="handleSingleSelect(row)">&nbsp;</ElRadio>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="roleName" label="角色名称" min-width="120" show-overflow-tooltip />
          <ElTableColumn prop="roleKey" label="权限字符" min-width="120" show-overflow-tooltip />
          <ElTableColumn prop="roleSort" label="显示顺序" width="90" align="center" />
          <ElTableColumn label="状态" width="80" align="center">
            <template #default="{ row }">
              <XuyaDictTag :options="sys_normal_disable" :value="row.status" />
            </template>
          </ElTableColumn>
          <ElTableColumn prop="createTime" label="创建时间" width="160" show-overflow-tooltip />
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

    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" @click="confirm">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue'
  import { Search, Refresh } from '@element-plus/icons-vue'
  import XuyaDictTag from '@/components/core/others/xuya-dict-tag/index.vue'
  import { useDict } from '@/hooks/core/useDict'
  import { listRole } from '@/api/system/role'
  import type { RoleVO } from '@/api/system/role/types'

  defineOptions({ name: 'XuyaRoleSelect' })

  const props = withDefaults(
    defineProps<{
      /** 是否多选 */
      multiple?: boolean
      /** 绑定值（已选角色数组） */
      modelValue?: RoleVO[]
    }>(),
    {
      multiple: true,
      modelValue: () => []
    }
  )

  const emit = defineEmits<{
    'update:modelValue': [roles: RoleVO[]]
    confirm: [roles: RoleVO[]]
  }>()

  const { sys_normal_disable } = useDict('sys_normal_disable')

  const visible = ref(false)
  const loading = ref(false)
  const roleList = ref<RoleVO[]>([])
  const total = ref(0)
  const selectedRoles = ref<RoleVO[]>([])
  const singleSelectedId = ref('')

  const queryParams = reactive({
    pageNum: 1,
    pageSize: 10,
    roleName: '',
    roleKey: ''
  })

  const getList = async () => {
    loading.value = true
    try {
      const res: any = await listRole({ ...queryParams } as any)
      roleList.value = res?.rows || []
      total.value = res?.total || 0
    } catch (e) {
      console.error('获取角色列表失败', e)
    } finally {
      loading.value = false
    }
  }

  const handleQuery = () => {
    queryParams.pageNum = 1
    getList()
  }
  const resetQuery = () => {
    queryParams.roleName = ''
    queryParams.roleKey = ''
    queryParams.pageNum = 1
    handleQuery()
  }

  /** 多选：跨页累积 */
  const handleSelectionChange = (rows: RoleVO[]) => {
    const currentPageIds = roleList.value.map((r) => String(r.roleId))
    const kept = selectedRoles.value.filter((r) => !currentPageIds.includes(String(r.roleId)))
    selectedRoles.value = [...kept, ...rows]
  }

  /** 单选 */
  const handleSingleSelect = (row: RoleVO | any) => {
    singleSelectedId.value = String(row.roleId)
    selectedRoles.value = [row]
  }

  const removeSelected = (role: RoleVO) => {
    selectedRoles.value = selectedRoles.value.filter((r) => r.roleId !== role.roleId)
    if (!props.multiple) singleSelectedId.value = ''
  }

  const confirm = () => {
    emit('update:modelValue', selectedRoles.value)
    emit('confirm', selectedRoles.value)
    visible.value = false
  }

  /**
   * 打开弹窗
   * @param defaultIds 默认选中的 roleId 数组
   */
  const open = async (defaultIds?: (string | number)[]) => {
    visible.value = true
    selectedRoles.value = []
    singleSelectedId.value = ''
    queryParams.pageNum = 1
    queryParams.roleName = ''
    queryParams.roleKey = ''
    await getList()
    if (defaultIds && defaultIds.length) {
      const matched = roleList.value.filter((r) => defaultIds.map(String).includes(String(r.roleId)))
      if (props.multiple) {
        selectedRoles.value = matched
      } else if (matched.length) {
        selectedRoles.value = [matched[0]]
        singleSelectedId.value = String(matched[0].roleId)
      }
    } else if (props.modelValue?.length) {
      selectedRoles.value = [...props.modelValue]
      if (!props.multiple && selectedRoles.value[0]) {
        singleSelectedId.value = String(selectedRoles.value[0].roleId)
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

  .role-select-body {
    min-height: 420px;
  }
  .role-select-body :deep(.el-table) {
    cursor: pointer;
  }
</style>
