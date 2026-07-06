<!-- 参数新增/编辑弹窗 -->
<template>
  <ElDialog v-model="visibleRef" :title="title" width="600px" append-to-body @close="handleClose">
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElRow>
        <ElCol :span="12"><ElFormItem label="参数名称" prop="configName"><ElInput v-model="form.configName" placeholder="请输入参数名称" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="参数键名" prop="configKey"><ElInput v-model="form.configKey" placeholder="请输入参数键名" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="参数键值" prop="configValue"><ElInput v-model="form.configValue" placeholder="请输入参数键值" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="系统内置"><ElRadioGroup v-model="form.configType"><ElRadio v-for="item in sys_yes_no" :key="item.value" :value="item.value">{{ item.label }}</ElRadio></ElRadioGroup></ElFormItem></ElCol>
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
  import { addConfig, updateConfig } from '@/api/system/config'
  import type { ConfigForm } from '@/api/system/config/types'
  interface Props { visible: boolean; title: string; form: Partial<ConfigForm> }
  interface Emits { (e: 'update:visible', value: boolean): void; (e: 'success'): void }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const { sys_yes_no } = useDict('sys_yes_no')
  const visibleRef = computed({ get: () => props.visible, set: (val) => emit('update:visible', val) })
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const form = reactive<Partial<ConfigForm>>({ configType: 'Y' })
  watch(() => props.form, (val) => Object.assign(form, val), { immediate: true, deep: true })
  const rules: FormRules = {
    configName: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
    configKey: [{ required: true, message: '请输入参数键名', trigger: 'blur' }],
    configValue: [{ required: true, message: '请输入参数键值', trigger: 'blur' }]
  }
  const handleSubmit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate(); submitting.value = true
      if ((form as any).configId) { await updateConfig(form as any); ElMessage.success('修改成功') } else { await addConfig(form as any); ElMessage.success('新增成功') }
      visibleRef.value = false; emit('success')
    } catch (e) {} finally { submitting.value = false }
  }
  const handleClose = () => formRef.value?.resetFields()
</script>
