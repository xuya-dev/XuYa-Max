<!-- OSS 配置新增/编辑弹窗 -->
<template>
  <ElDialog v-model="visibleRef" :title="title" width="720px" append-to-body @close="handleClose">
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
      <ElRow>
        <ElCol :span="12"><ElFormItem label="配置key" prop="configKey"><ElInput v-model="form.configKey" placeholder="请输入配置key" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="访问站点" prop="endpoint"><ElInput v-model="form.endpoint" placeholder="请输入访问站点" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="自定义域名" prop="domainUrl"><ElInput v-model="form.domainUrl" placeholder="请输入自定义域名" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="accessKey" prop="accessKey"><ElInput v-model="form.accessKey" placeholder="请输入accessKey" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="secretKey" prop="secretKey"><ElInput v-model="form.secretKey" placeholder="请输入秘钥" show-password /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="桶名称" prop="bucketName"><ElInput v-model="form.bucketName" placeholder="请输入桶名称" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="前缀" prop="prefix"><ElInput v-model="form.prefix" placeholder="请输入前缀" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="域" prop="region"><ElInput v-model="form.region" placeholder="请输入域" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="是否HTTPS"><ElRadioGroup v-model="form.isHttps"><ElRadio v-for="d in sys_yes_no" :key="d.value" :value="d.value">{{ d.label }}</ElRadio></ElRadioGroup></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="桶权限"><ElRadioGroup v-model="form.accessPolicy"><ElRadio value="0">私有</ElRadio><ElRadio value="1">公共</ElRadio><ElRadio value="2">自定义</ElRadio></ElRadioGroup></ElFormItem></ElCol>
        <ElCol :span="24"><ElFormItem label="备注"><ElInput v-model="form.remark" type="textarea" placeholder="请输入内容" /></ElFormItem></ElCol>
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
  import { addOssConfig, updateOssConfig } from '@/api/system/ossConfig'
  import type { OssConfigForm } from '@/api/system/ossConfig/types'
  interface Props { visible: boolean; title: string; form: Partial<OssConfigForm> }
  interface Emits { (e: 'update:visible', value: boolean): void; (e: 'success'): void }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const { sys_yes_no } = useDict('sys_yes_no')
  const visibleRef = computed({ get: () => props.visible, set: (val) => emit('update:visible', val) })
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const form = reactive<Partial<OssConfigForm>>({ accessPolicy: '1', isHttps: 'N', status: 'N' })
  watch(() => props.form, (val) => Object.assign(form, val), { immediate: true, deep: true })
  const rules: FormRules = {
    configKey: [{ required: true, message: 'configKey不能为空', trigger: 'blur' }],
    accessKey: [{ required: true, message: 'accessKey不能为空', trigger: 'blur' }],
    secretKey: [{ required: true, message: 'secretKey不能为空', trigger: 'blur' }],
    bucketName: [{ required: true, message: 'bucketName不能为空', trigger: 'blur' }],
    endpoint: [{ required: true, message: 'endpoint不能为空', trigger: 'blur' }]
  }
  const handleSubmit = async () => { if (!formRef.value) return; try { await formRef.value.validate(); submitting.value = true; if ((form as any).ossConfigId) { await updateOssConfig(form as any); ElMessage.success('修改成功') } else { await addOssConfig(form as any); ElMessage.success('新增成功') }; visibleRef.value = false; emit('success') } catch (e) {} finally { submitting.value = false } }
  const handleClose = () => formRef.value?.resetFields()
</script>
