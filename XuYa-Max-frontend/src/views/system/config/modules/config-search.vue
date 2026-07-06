<!-- 参数搜索栏 -->
<template>
  <XuyaSearchBar ref="searchBarRef" v-model="formData" :items="formItems" @reset="handleReset" @search="handleSearch" />
</template>
<script setup lang="ts">
  import { useDict } from '@/hooks/core/useDict'
  interface Props { modelValue: any }
  interface Emits { (e: 'update:modelValue', value: any): void; (e: 'search', params: any): void; (e: 'reset'): void }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const { sys_yes_no } = useDict('sys_yes_no')
  const searchBarRef = ref()
  const formData = computed({ get: () => props.modelValue, set: (val) => emit('update:modelValue', val) })
  const formItems = computed(() => [
    { label: '参数名称', key: 'configName', type: 'input', props: { placeholder: '请输入参数名称', clearable: true } },
    { label: '参数键名', key: 'configKey', type: 'input', props: { placeholder: '请输入参数键名', clearable: true } },
    { label: '系统内置', key: 'configType', type: 'select', props: { placeholder: '系统内置', clearable: true, options: (sys_yes_no as any[]).map((i) => ({ label: i.label, value: i.value })) } }
  ])
  function handleReset() { emit('reset') }
  function handleSearch(params: any) { emit('search', params) }
</script>
