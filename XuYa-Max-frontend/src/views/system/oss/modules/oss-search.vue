<!-- OSS 搜索栏 -->
<template>
  <XuyaSearchBar ref="searchBarRef" v-model="formData" :items="formItems" @reset="handleReset" @search="handleSearch" />
</template>
<script setup lang="ts">
  interface Props { modelValue: any }
  interface Emits { (e: 'update:modelValue', value: any): void; (e: 'search', params: any): void; (e: 'reset'): void }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const searchBarRef = ref()
  const formData = computed({ get: () => props.modelValue, set: (val) => emit('update:modelValue', val) })
  const formItems = computed(() => [
    { label: '文件名', key: 'fileName', type: 'input', props: { placeholder: '请输入文件名', clearable: true } },
    { label: '原名', key: 'originalName', type: 'input', props: { placeholder: '请输入原名', clearable: true } },
    { label: '文件后缀', key: 'fileSuffix', type: 'input', props: { placeholder: '请输入后缀', clearable: true } },
    { label: '服务商', key: 'service', type: 'input', props: { placeholder: '请输入服务商', clearable: true } },
    { label: '创建时间', key: 'dateRange', type: 'daterange', props: { valueFormat: 'YYYY-MM-DD', startPlaceholder: '开始', endPlaceholder: '结束' } }
  ])
  function handleReset() { emit('reset') }
  function handleSearch(params: any) { const p = { ...params }; if (Array.isArray(params.dateRange) && params.dateRange.length === 2) { p.beginTime = params.dateRange[0]; p.endTime = params.dateRange[1] }; delete p.dateRange; emit('search', p) }
</script>
