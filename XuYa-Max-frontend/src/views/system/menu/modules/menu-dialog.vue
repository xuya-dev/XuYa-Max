<!-- 菜单新增/编辑弹窗 -->
<template>
  <ElDialog v-model="visibleRef" :title="title" width="720px" append-to-body @close="handleClose">
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElRow>
        <ElCol :span="24">
          <ElFormItem label="上级菜单" prop="parentId">
            <ElTreeSelect v-model="form.parentId" :data="menuOptions" :props="({ value: 'id', label: 'label', children: 'children' } as any)" value-key="id" placeholder="选择上级菜单" check-strictly style="width:100%" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="24">
          <ElFormItem label="菜单类型" prop="menuType">
            <ElRadioGroup v-model="form.menuType">
              <ElRadio value="M">目录</ElRadio>
              <ElRadio value="C">菜单</ElRadio>
              <ElRadio value="F">按钮</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12"><ElFormItem label="菜单名称" prop="menuName"><ElInput v-model="form.menuName" placeholder="请输入菜单名称" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="显示排序" prop="orderNum"><ElInputNumber v-model="form.orderNum" :min="0" controls-position="right" style="width:100%" /></ElFormItem></ElCol>
        <ElCol :span="12" v-if="form.menuType !== 'F'"><ElFormItem label="路由地址" prop="path"><ElInput v-model="form.path" placeholder="请输入路由地址" /></ElFormItem></ElCol>
        <ElCol :span="12" v-if="form.menuType === 'C'"><ElFormItem label="组件路径" prop="component"><ElInput v-model="form.component" placeholder="如 system/user/index" /></ElFormItem></ElCol>
        <ElCol :span="12" v-if="form.menuType !== 'M'"><ElFormItem label="权限字符" prop="perms"><ElInput v-model="form.perms" placeholder="如 system:user:list" /></ElFormItem></ElCol>
        <ElCol :span="12" v-if="form.menuType !== 'F'"><ElFormItem label="图标" prop="icon"><XuyaIconSelect v-model="form.icon" width="100%" /></ElFormItem></ElCol>
        <ElCol :span="12" v-if="form.menuType !== 'F'"><ElFormItem label="是否外链"><ElRadioGroup v-model="form.isFrame"><ElRadio value="0">是</ElRadio><ElRadio value="1">否</ElRadio></ElRadioGroup></ElFormItem></ElCol>
        <ElCol :span="12" v-if="form.menuType !== 'F'"><ElFormItem label="是否缓存"><ElRadioGroup v-model="form.isCache"><ElRadio value="0">缓存</ElRadio><ElRadio value="1">不缓存</ElRadio></ElRadioGroup></ElFormItem></ElCol>
        <ElCol :span="12" v-if="form.menuType !== 'F'"><ElFormItem label="显示状态"><ElRadioGroup v-model="form.visible"><ElRadio v-for="d in sys_show_hide" :key="d.value" :value="d.value">{{ d.label }}</ElRadio></ElRadioGroup></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="菜单状态"><ElRadioGroup v-model="form.status"><ElRadio v-for="d in sys_normal_disable" :key="d.value" :value="d.value">{{ d.label }}</ElRadio></ElRadioGroup></ElFormItem></ElCol>
      </ElRow>
    </ElForm>
    <template #footer>
      <ElButton @click="visibleRef = false">取 消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确 定</ElButton>
    </template>
  </ElDialog>
</template>
<script setup lang="ts">
  import { ref, reactive, watch, computed } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { useDict } from '@/hooks/core/useDict'
  import { addMenu, updateMenu } from '@/api/system/menu'
  import type { MenuForm } from '@/api/system/menu/types'
  interface Props { visible: boolean; title: string; form: Partial<MenuForm>; menuOptions: any[] }
  interface Emits { (e: 'update:visible', value: boolean): void; (e: 'success'): void }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const { sys_normal_disable, sys_show_hide } = useDict('sys_normal_disable', 'sys_show_hide')
  const visibleRef = computed({ get: () => props.visible, set: (val) => emit('update:visible', val) })
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const form = reactive<Partial<MenuForm>>({ menuType: 'M' as any, orderNum: 0, visible: '0', status: '0', isFrame: '1', isCache: '0' })
  watch(() => props.form, (val) => Object.assign(form, val), { immediate: true, deep: true })
  const rules: FormRules = {
    menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
    menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
    orderNum: [{ required: true, message: '请输入显示排序', trigger: 'blur' }]
  }
  const handleSubmit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate(); submitting.value = true
      if ((form as any).menuId) { await updateMenu(form as any); ElMessage.success('修改成功') } else { await addMenu(form as any); ElMessage.success('新增成功') }
      visibleRef.value = false; emit('success')
    } catch (e) {} finally { submitting.value = false }
  }
  const handleClose = () => formRef.value?.resetFields()
</script>
