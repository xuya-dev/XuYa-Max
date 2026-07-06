<!-- 客户端新增/编辑弹窗 -->
<template>
  <ElDialog v-model="visibleRef" :title="title" width="680px" append-to-body @close="handleClose">
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
      <ElRow>
        <ElCol :span="12"><ElFormItem label="客户端key" prop="clientKey"><ElInput v-model="form.clientKey" placeholder="请输入客户端key" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="客户端秘钥" prop="clientSecret"><ElInput v-model="form.clientSecret" placeholder="请输入客户端秘钥" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="授权类型" prop="grantTypeList"><ElSelect v-model="form.grantTypeList" multiple placeholder="如 password,social" style="width:100%"><ElOption v-for="g in grantTypeOptions" :key="g" :label="g" :value="g" /></ElSelect></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="设备类型" prop="deviceType"><ElSelect v-model="form.deviceType" placeholder="请选择设备类型" style="width:100%"><ElOption v-for="d in sys_device_type" :key="d.value" :label="d.label" :value="d.value" /></ElSelect></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="活跃超时" prop="activeTimeout"><ElInputNumber v-model="form.activeTimeout" :min="0" controls-position="right" style="width:100%" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="固定超时" prop="timeout"><ElInputNumber v-model="form.timeout" :min="0" controls-position="right" style="width:100%" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="状态"><ElRadioGroup v-model="form.status"><ElRadio v-for="item in sys_normal_disable" :key="item.value" :value="item.value">{{ item.label }}</ElRadio></ElRadioGroup></ElFormItem></ElCol>
        <ElCol :span="24"><ElFormItem label="备注"><ElInput v-model="form.remark" type="textarea" placeholder="请输入内容" /></ElFormItem></ElCol>
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
  import { addClient, updateClient } from '@/api/system/client'
  import type { ClientForm } from '@/api/system/client/types'
  interface Props { visible: boolean; title: string; form: Partial<ClientForm> }
  interface Emits { (e: 'update:visible', value: boolean): void; (e: 'success'): void }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const { sys_normal_disable, sys_device_type } = useDict('sys_normal_disable', 'sys_device_type')
  const visibleRef = computed({ get: () => props.visible, set: (val) => emit('update:visible', val) })
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const form = reactive<Partial<ClientForm>>({ status: '0', grantTypeList: ['password'] })
  const grantTypeOptions = ['password', 'sms', 'social', 'email', 'xcx']
  watch(() => props.form, (val) => Object.assign(form, val), { immediate: true, deep: true })
  const rules: FormRules = {
    clientKey: [{ required: true, message: '请输入客户端key', trigger: 'blur' }],
    clientSecret: [{ required: true, message: '请输入客户端秘钥', trigger: 'blur' }],
    grantTypeList: [{ required: true, message: '请选择授权类型', trigger: 'change' }]
  }
  const handleSubmit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate(); submitting.value = true
      if ((form as any).id) { await updateClient(form as any); ElMessage.success('修改成功') } else { await addClient(form as any); ElMessage.success('新增成功') }
      visibleRef.value = false; emit('success')
    } catch (e) {} finally { submitting.value = false }
  }
  const handleClose = () => formRef.value?.resetFields()
</script>
