<!-- 操作日志搜索栏 -->
<template>
  <XuyaSearchBar ref="searchBarRef" v-model="formData" :items="formItems" @reset="handleReset" @search="handleSearch" />
</template>
<script setup lang="ts">
  import { useDict } from '@/hooks/core/useDict'
  interface Props { modelValue: any }
  interface Emits { (e: 'update:modelValue', value: any): void; (e: 'search', params: any): void; (e: 'reset'): void }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const { sys_oper_type, sys_common_status, sys_device_type } = useDict('sys_oper_type', 'sys_common_status', 'sys_device_type')
  const searchBarRef = ref()
  const formData = computed({ get: () => props.modelValue, set: (val) => emit('update:modelValue', val) })
  const formItems = computed(() => [
    { label: '系统模块', key: 'title', type: 'input', props: { placeholder: '请输入系统模块', clearable: true } },
    { label: '操作人员', key: 'operName', type: 'input', props: { placeholder: '请输入操作人员', clearable: true } },
    { label: '操作地址', key: 'operIp', type: 'input', props: { placeholder: '请输入操作地址', clearable: true } },
    { label: '操作类型', key: 'businessType', type: 'select', props: { placeholder: '操作类型', clearable: true, options: (sys_oper_type as any[]).map((i) => ({ label: i.label, value: i.value })) } },
    { label: '状态', key: 'status', type: 'select', props: { placeholder: '操作状态', clearable: true, options: (sys_common_status as any[]).map((i) => ({ label: i.label, value: i.value })) } },
    { label: '操作时间', key: 'dateRange', type: 'daterange', props: { valueFormat: 'YYYY-MM-DD', startPlaceholder: '开始', endPlaceholder: '结束' } }
  ])
  function handleReset() { emit('reset') }
  function handleSearch(params: any) { const p = { ...params }; if (Array.isArray(params.dateRange) && params.dateRange.length === 2) { p.beginTime = params.dateRange[0]; p.endTime = params.dateRange[1] }; delete p.dateRange; emit('search', p) }
</script>
