<!-- 通知公告新增/编辑弹窗 -->
<template>
  <ElDialog v-model="visibleRef" :title="title" width="780px" append-to-body @close="handleClose">
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElRow>
        <ElCol :span="12"><ElFormItem label="公告标题" prop="noticeTitle"><ElInput v-model="form.noticeTitle" placeholder="请输入公告标题" /></ElFormItem></ElCol>
        <ElCol :span="12"><ElFormItem label="公告类型" prop="noticeType"><ElSelect v-model="form.noticeType" placeholder="请选择" style="width:100%"><ElOption v-for="item in sys_notice_type" :key="item.value" :label="item.label" :value="item.value" /></ElSelect></ElFormItem></ElCol>
        <ElCol :span="24"><ElFormItem label="状态"><ElRadioGroup v-model="form.status"><ElRadio v-for="item in sys_notice_status" :key="item.value" :value="item.value">{{ item.label }}</ElRadio></ElRadioGroup></ElFormItem></ElCol>
        <ElCol :span="24"><ElFormItem label="内容"><XuyaWangEditor v-model="contentRef" v-if="visibleRef" /></ElFormItem></ElCol>
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
  import { addNotice, updateNotice } from '@/api/system/notice'
  import type { NoticeForm } from '@/api/system/notice/types'
  interface Props { visible: boolean; title: string; form: Partial<NoticeForm> }
  interface Emits { (e: 'update:visible', value: boolean): void; (e: 'success'): void }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const { sys_notice_type, sys_notice_status } = useDict('sys_notice_type', 'sys_notice_status')
  const visibleRef = computed({ get: () => props.visible, set: (val) => emit('update:visible', val) })
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  // 表单初始默认值（每次重置都回到这个状态，避免上一次编辑内容残留）
  const defaultForm = (): Partial<NoticeForm> => ({ noticeTitle: '', noticeType: '', noticeContent: '', status: '0', remark: '' })
  const form = reactive<Partial<NoticeForm>>(defaultForm())
  // 弹窗打开时整体重置 form 后再合并父组件传入的字段，关闭旧字段不残留
  watch(
    () => props.visible,
    (open) => {
      if (open) {
        // 先清空，再赋值；防止 Object.assign 累加导致新增时残留上次编辑的内容
        Object.assign(form, defaultForm(), props.form)
      }
    },
    { immediate: true }
  )
  // 富文本内容代理（XuyaWangEditor 要求 string，form.noticeContent 可能 undefined）
  const contentRef = computed({
    get: () => (form as any).noticeContent || '',
    set: (v: string) => { (form as any).noticeContent = v }
  })
  const rules: FormRules = {
    noticeTitle: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
    noticeType: [{ required: true, message: '请选择公告类型', trigger: 'change' }]
  }
  const handleSubmit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate(); submitting.value = true
      if ((form as any).noticeId) { await updateNotice(form as any); ElMessage.success('修改成功') } else { await addNotice(form as any); ElMessage.success('新增成功') }
      visibleRef.value = false; emit('success')
    } catch (e) {} finally { submitting.value = false }
  }
  // 关闭时彻底重置（含富文本 noticeContent，它没有 form-item prop，resetFields 清不掉）
  const handleClose = () => {
    formRef.value?.resetFields()
    Object.assign(form, defaultForm())
  }
</script>
