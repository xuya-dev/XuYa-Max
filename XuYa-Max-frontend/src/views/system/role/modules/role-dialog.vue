<!-- 角色新增/编辑弹窗 -->
<template>
  <ElDialog v-model="visibleRef" :title="title" width="680px" append-to-body @close="handleClose">
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElRow>
        <ElCol :span="12">
          <ElFormItem label="角色名称" prop="roleName">
            <ElInput v-model="form.roleName" placeholder="请输入角色名称" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="权限字符" prop="roleKey">
            <ElInput v-model="form.roleKey" placeholder="请输入权限字符" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow>
        <ElCol :span="12">
          <ElFormItem label="角色顺序" prop="roleSort">
            <ElInputNumber v-model="form.roleSort" :min="0" controls-position="right" style="width: 100%" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="状态">
            <ElRadioGroup v-model="form.status">
              <ElRadio v-for="item in sys_normal_disable" :key="item.value" :value="item.value">{{ item.label }}</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElFormItem label="菜单权限">
        <div style="height: 240px; overflow: auto; border: 1px solid var(--el-border-color); border-radius: 6px; padding: 8px; width: 100%">
          <ElTree
            ref="menuTreeRef"
            :data="menuTree"
            show-checkbox
            node-key="id"
            :props="{ label: 'label', children: 'children' }"
            :check-strictly="form.menuCheckStrictly"
          />
        </div>
      </ElFormItem>
      <ElFormItem label="数据权限">
        <ElSelect v-model="form.dataScope" placeholder="请选择数据权限" style="width: 100%">
          <ElOption v-for="item in dataScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="form.dataScope === '2'" label="数据权限">
        <div style="height: 200px; overflow: auto; border: 1px solid var(--el-border-color); border-radius: 6px; padding: 8px; width: 100%">
          <ElTree
            ref="deptTreeRef"
            :data="deptOptions"
            show-checkbox
            node-key="id"
            :props="{ label: 'label', children: 'children' }"
            :check-strictly="form.deptCheckStrictly"
          />
        </div>
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="form.remark" type="textarea" placeholder="请输入内容" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="visibleRef = false">取 消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确 定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, computed, nextTick } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { useDict } from '@/hooks/core/useDict'
  import { addRole, updateRole, updateRolePermission, deptTreeSelect } from '@/api/system/role'
  import type { RoleForm } from '@/api/system/role/types'

  interface Props {
    visible: boolean
    title: string
    form: Partial<RoleForm>
    menuTree: any[]
  }
  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const { sys_normal_disable } = useDict('sys_normal_disable')
  const visibleRef = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const formRef = ref<FormInstance>()
  const menuTreeRef = ref()
  const deptTreeRef = ref()
  const submitting = ref(false)
  const deptOptions = ref<any[]>([])
  const form = reactive<Partial<RoleForm>>({})

  /**
   * 数据权限范围选项（对应 sys_role.data_scope 字段）
   * 1=全部 2=自定义 3=本部门 4=本部门及以下 5=仅本人 6=部门及以下或本人
   * 仅 dataScope='2'（自定义）时才需勾选部门树
   */
  const dataScopeOptions = [
    { value: '1', label: '全部数据权限' },
    { value: '2', label: '自定义数据权限' },
    { value: '3', label: '本部门数据权限' },
    { value: '4', label: '本部门及以下数据权限' },
    { value: '6', label: '部门及以下或本人' },
    { value: '5', label: '仅本人数据权限' }
  ]

  watch(
    () => props.form,
    async (val) => {
      Object.assign(form, val)
      // 数据范围默认全部
      if (form.dataScope === undefined || form.dataScope === '') {
        form.dataScope = '1'
      }
      // 同步菜单勾选
      await nextTick()
      if (menuTreeRef.value && val.menuIds) {
        menuTreeRef.value.setCheckedKeys(val.menuIds)
      }
      // 编辑自定义数据范围时，按角色加载部门树并回显已勾选部门
      if (form.roleId && form.dataScope === '2') {
        await loadDeptTree(form.roleId)
      }
    },
    { immediate: true, deep: true }
  )

  /**
   * 加载角色对应的部门树（含已勾选回显）
   * 后端 GET /system/role/deptTree/{roleId} 返回 { checkedKeys, depts }
   */
  const loadDeptTree = async (roleId: string | number) => {
    try {
      const res: any = await deptTreeSelect(roleId)
      deptOptions.value = res?.depts || []
      await nextTick()
      if (deptTreeRef.value && res?.checkedKeys) {
        deptTreeRef.value.setCheckedKeys(res.checkedKeys)
      }
    } catch (e) {
      console.error('获取角色部门树失败', e)
    }
  }

  const rules: FormRules = {
    roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
    roleKey: [{ required: true, message: '请输入权限字符', trigger: 'blur' }],
    roleSort: [{ required: true, message: '请输入角色顺序', trigger: 'blur' }]
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
      submitting.value = true
      // 收集菜单勾选
      if (menuTreeRef.value) {
        const checked = menuTreeRef.value.getCheckedKeys()
        const halfChecked = menuTreeRef.value.getHalfCheckedKeys()
        form.menuIds = [...checked, ...halfChecked]
      }
      // 收集数据权限勾选（仅自定义范围生效，其余范围清空 deptIds）
      if (form.dataScope === '2' && deptTreeRef.value) {
        const deptChecked = deptTreeRef.value.getCheckedKeys()
        const deptHalfChecked = deptTreeRef.value.getHalfCheckedKeys()
        form.deptIds = [...deptChecked, ...deptHalfChecked]
      } else {
        form.deptIds = []
      }
      if (form.roleId) {
        // 编辑：updateRole(基础信息) 只更新角色本体，不会写 role_menu；
        // 菜单/数据权限必须走 updateRolePermission 才会重建 role_menu，否则权限被静默清空。
        await updateRole(form as RoleForm)
        await updateRolePermission(form as RoleForm)
        ElMessage.success('修改成功')
      } else {
        await addRole(form as RoleForm)
        ElMessage.success('新增成功')
      }
      visibleRef.value = false
      emit('success')
    } catch (e) {
    } finally {
      submitting.value = false
    }
  }

  const handleClose = () => {
    formRef.value?.resetFields()
    menuTreeRef.value?.setCheckedKeys([])
    deptTreeRef.value?.setCheckedKeys([])
    deptOptions.value = []
  }
</script>
