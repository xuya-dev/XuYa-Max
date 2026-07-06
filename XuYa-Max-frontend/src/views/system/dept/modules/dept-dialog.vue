<!-- 部门新增/编辑弹窗 -->
<template>
  <ElDialog v-model="visibleRef" :title="title" width="680px" append-to-body @close="handleClose">
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElRow>
        <ElCol :span="24"><ElFormItem label="上级部门" prop="parentId"><ElTreeSelect v-model="form.parentId" :data="deptOptions" :props="({ value: 'id', label: 'label', children: 'children' } as any)" value-key="id" placeholder="选择上级部门" check-strictly style="width:100%" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="部门名称" prop="deptName"><ElInput v-model="form.deptName" placeholder="请输入部门名称" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="显示排序" prop="orderNum"><ElInputNumber v-model="form.orderNum" :min="0" controls-position="right" style="width:100%" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="负责人" prop="leader"><ElInput v-model="form.leader" placeholder="请输入负责人" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="联系电话" prop="phone"><ElInput v-model="form.phone" placeholder="请输入联系电话" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="邮箱" prop="email"><ElInput v-model="form.email" placeholder="请输入邮箱" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="部门状态"><ElRadioGroup v-model="form.status"><ElRadio v-for="d in sys_normal_disable" :key="d.value" :value="d.value">{{ d.label }}</ElRadio></ElRadioGroup></ElFormItem></ElCol>
      </ElRow>
    </ElForm>
    <template #footer><ElButton @click="visibleRef = false">取 消</ElButton><ElButton type="primary" :loading="submitting" @click="handleSubmit">确 定</ElButton></template>
  </ElDialog>
</template>
<script setup lang="ts">
  import { ref, reactive, watch, computed } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { useDict } from '@/hooks/core/useDict'
  import { addDept, updateDept } from '@/api/system/dept'
  import type { DeptForm } from '@/api/system/dept/types'
  interface Props { visible: boolean; title: string; form: Partial<DeptForm>; deptOptions: any[] }
  interface Emits { (e: 'update:visible', value: boolean): void; (e: 'success'): void }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const { sys_normal_disable } = useDict('sys_normal_disable')
  const visibleRef = computed({ get: () => props.visible, set: (val) => emit('update:visible', val) })
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const form = reactive<Partial<DeptForm>>({ orderNum: 0, status: '0' })
  watch(() => props.form, (val) => Object.assign(form, val), { immediate: true, deep: true })
  const rules: FormRules = {
    deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
    orderNum: [{ required: true, message: '请输入显示排序', trigger: 'blur' }],
    email: [{ type: 'email' as const, message: '请输入正确的邮箱', trigger: ['blur', 'change'] }],
    phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }]
  }
  const handleSubmit = async () => {
    if (!formRef.value) return
    try { await formRef.value.validate(); submitting.value = true; if ((form as any).deptId) { await updateDept(form as any); ElMessage.success('修改成功') } else { await addDept(form as any); ElMessage.success('新增成功') }; visibleRef.value = false; emit('success') } catch (e) {} finally { submitting.value = false }
  }
  const handleClose = () => formRef.value?.resetFields()
</script>
