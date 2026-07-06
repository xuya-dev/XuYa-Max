<!-- 字典类型搜索栏 -->
<template>
  <XuyaSearchBar ref="searchBarRef" v-model="formData" :items="formItems" @reset="handleReset" @search="handleSearch" />
</template>
<script setup lang="ts">
  import { useDict } from '@/hooks/core/useDict'
  interface Props { modelValue: any }
  interface Emits { (e: 'update:modelValue', value: any): void; (e: 'search', params: any): void; (e: 'reset'): void }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const { sys_normal_disable } = useDict('sys_normal_disable')
  const searchBarRef = ref()
  const formData = computed({ get: () => props.modelValue, set: (val) => emit('update:modelValue', val) })
  const formItems = computed(() => [
    { label: '字典名称', key: 'dictName', type: 'input', props: { placeholder: '请输入字典名称', clearable: true } },
    { label: '字典类型', key: 'dictType', type: 'input', props: { placeholder: '请输入字典类型', clearable: true } },
    { label: '状态', key: 'status', type: 'select', props: { placeholder: '状态', clearable: true, options: (sys_normal_disable as any[]).map((i) => ({ label: i.label, value: i.value })) } }
  ])
  function handleReset() { emit('reset') }
  function handleSearch(params: any) { emit('search', params) }
</script>
