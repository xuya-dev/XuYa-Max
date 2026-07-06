<!-- 字典类型新增/编辑弹窗 -->
<template>
  <ElDialog v-model="visibleRef" :title="title" width="600px" append-to-body @close="handleClose">
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElFormItem label="字典名称" prop="dictName"><ElInput v-model="form.dictName" placeholder="请输入字典名称" /></ElFormItem>
      <ElFormItem label="字典类型" prop="dictType"><ElInput v-model="form.dictType" placeholder="请输入字典类型" /></ElFormItem>
      <ElFormItem label="备注"><ElInput v-model="form.remark" type="textarea" placeholder="请输入内容" /></ElFormItem>
    </ElForm>
    <template #footer><ElButton @click="visibleRef = false">取 消</ElButton><ElButton type="primary" :loading="submitting" @click="handleSubmit">确 定</ElButton></template>
  </ElDialog>
</template>
<script setup lang="ts">
  import { ref, reactive, watch, computed } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { addType, updateType } from '@/api/system/dict/type'
  import type { DictTypeForm } from '@/api/system/dict/type/types'
  interface Props { visible: boolean; title: string; form: Partial<DictTypeForm> }
  interface Emits { (e: 'update:visible', value: boolean): void; (e: 'success'): void }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const visibleRef = computed({ get: () => props.visible, set: (val) => emit('update:visible', val) })
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const form = reactive<Partial<DictTypeForm>>({})
  watch(() => props.form, (val) => Object.assign(form, val), { immediate: true, deep: true })
  const rules: FormRules = {
    dictName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
    dictType: [{ required: true, message: '请输入字典类型', trigger: 'blur' }]
  }
  const handleSubmit = async () => { if (!formRef.value) return; try { await formRef.value.validate(); submitting.value = true; if ((form as any).dictId) { await updateType(form as any); ElMessage.success('修改成功') } else { await addType(form as any); ElMessage.success('新增成功') }; visibleRef.value = false; emit('success') } catch (e) {} finally { submitting.value = false } }
  const handleClose = () => formRef.value?.resetFields()
</script>
