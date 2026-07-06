<!--
  用户搜索栏（配置式 XuyaSearchBar）
-->
<template>
  <XuyaSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    @reset="handleReset"
    @search="handleSearch"
  />
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
    {
      label: '用户名称',
      key: 'userName',
      type: 'input',
      props: { placeholder: '请输入用户名称', clearable: true }
    },
    {
      label: '手机号码',
      key: 'phoneNumber',
      type: 'input',
      props: { placeholder: '请输入手机号码', clearable: true }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: (sys_normal_disable as any[]).map((item: any) => ({ label: item.label, value: item.value }))
      }
    },
    {
      label: '创建时间',
      key: 'dateRange',
      type: 'daterange',
      props: {
        placeholder: '请选择创建时间',
        valueFormat: 'YYYY-MM-DD',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期'
      }
    }
  ])

  function handleReset() {
    emit('reset')
  }

  async function handleSearch(params: any) {
    // 将 dateRange 转为 beginTime / endTime
    const searchParams = { ...params }
    if (Array.isArray(params.dateRange) && params.dateRange.length === 2) {
      searchParams.beginTime = params.dateRange[0]
      searchParams.endTime = params.dateRange[1]
    }
    delete searchParams.dateRange
    emit('search', searchParams)
  }
</script>
