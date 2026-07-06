<!-- 通知公告搜索栏 -->
<template>
  <XuyaSearchBar ref="searchBarRef" v-model="formData" :items="formItems" @reset="handleReset" @search="handleSearch" />
</template>
<script setup lang="ts">
  import { useDict } from '@/hooks/core/useDict'
  interface Props { modelValue: any }
  interface Emits { (e: 'update:modelValue', value: any): void; (e: 'search', params: any): void; (e: 'reset'): void }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const { sys_notice_type, sys_notice_status } = useDict('sys_notice_type', 'sys_notice_status')
  const searchBarRef = ref()
  const formData = computed({ get: () => props.modelValue, set: (val) => emit('update:modelValue', val) })
  const formItems = computed(() => [
    { label: '公告标题', key: 'noticeTitle', type: 'input', props: { placeholder: '请输入公告标题', clearable: true } },
    { label: '操作人员', key: 'createByName', type: 'input', props: { placeholder: '请输入操作人员', clearable: true } },
    { label: '公告类型', key: 'noticeType', type: 'select', props: { placeholder: '公告类型', clearable: true, options: (sys_notice_type as any[]).map((i) => ({ label: i.label, value: i.value })) } },
    { label: '状态', key: 'status', type: 'select', props: { placeholder: '状态', clearable: true, options: (sys_notice_status as any[]).map((i) => ({ label: i.label, value: i.value })) } }
  ])
  function handleReset() { emit('reset') }
  function handleSearch(params: any) { emit('search', params) }
</script>
