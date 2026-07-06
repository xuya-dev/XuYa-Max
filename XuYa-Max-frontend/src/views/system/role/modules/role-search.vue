<!-- 角色搜索栏 -->
<template>
  <XuyaSearchBar ref="searchBarRef" v-model="formData" :items="formItems" @reset="handleReset" @search="handleSearch" />
</template>

<script setup lang="ts">
  import { useDict } from '@/hooks/core/useDict'

  interface Props {
    modelValue: any
  }
  interface Emits {
    (e: 'update:modelValue', value: any): void
    (e: 'search', params: any): void
    (e: 'reset'): void
  }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const { sys_normal_disable } = useDict('sys_normal_disable')
  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const formItems = computed(() => [
    { label: '角色名称', key: 'roleName', type: 'input', props: { placeholder: '请输入角色名称', clearable: true } },
    { label: '权限字符', key: 'roleKey', type: 'input', props: { placeholder: '请输入权限字符', clearable: true } },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '角色状态',
        clearable: true,
        options: (sys_normal_disable as any[]).map((i) => ({ label: i.label, value: i.value }))
      }
    },
    {
      label: '创建时间',
      key: 'dateRange',
      type: 'daterange',
      props: { valueFormat: 'YYYY-MM-DD', startPlaceholder: '开始日期', endPlaceholder: '结束日期' }
    }
  ])

  function handleReset() {
    emit('reset')
  }
  async function handleSearch(params: any) {
    const p = { ...params }
    if (Array.isArray(params.dateRange) && params.dateRange.length === 2) {
      p.beginTime = params.dateRange[0]
      p.endTime = params.dateRange[1]
    }
    delete p.dateRange
    emit('search', p)
  }
</script>
