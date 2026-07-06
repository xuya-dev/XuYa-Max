<!-- 岗位新增/编辑弹窗 -->
<template>
  <ElDialog v-model="visibleRef" :title="title" width="600px" append-to-body @close="handleClose">
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElRow>
        <ElCol :span="12"><ElFormItem label="岗位名称" prop="postName"><ElInput v-model="form.postName" placeholder="请输入岗位名称" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="岗位编码" prop="postCode"><ElInput v-model="form.postCode" placeholder="请输入岗位编码" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="显示顺序" prop="postSort"><ElInputNumber v-model="form.postSort" :min="0" controls-position="right" style="width:100%" /></ElFormItem></ElCol>
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
  import { addPost, updatePost } from '@/api/system/post'
  import type { PostForm } from '@/api/system/post/types'
  interface Props { visible: boolean; title: string; form: Partial<PostForm> }
  interface Emits { (e: 'update:visible', value: boolean): void; (e: 'success'): void }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const { sys_normal_disable } = useDict('sys_normal_disable')
  const visibleRef = computed({ get: () => props.visible, set: (val) => emit('update:visible', val) })
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const form = reactive<Partial<PostForm>>({ postSort: 0, status: '0' })
  watch(() => props.form, (val) => Object.assign(form, val), { immediate: true, deep: true })
  const rules: FormRules = {
    postName: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
    postCode: [{ required: true, message: '请输入岗位编码', trigger: 'blur' }],
    postSort: [{ required: true, message: '请输入显示顺序', trigger: 'blur' }]
  }
  const handleSubmit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate(); submitting.value = true
      if ((form as any).postId) { await updatePost(form as any); ElMessage.success('修改成功') } else { await addPost(form as any); ElMessage.success('新增成功') }
      visibleRef.value = false; emit('success')
    } catch (e) {} finally { submitting.value = false }
  }
  const handleClose = () => formRef.value?.resetFields()
</script>
