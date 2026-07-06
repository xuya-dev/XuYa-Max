<!-- 操作日志详情弹窗 -->
<template>
  <ElDialog v-model="visible" title="操作日志详细" width="760px" append-to-body>
    <ElDescriptions :column="1" border v-if="row">
      <ElDescriptionsItem label="操作状态">
        <XuyaDictTag :options="sys_common_status" :value="row.status" />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="操作人员">{{ row.operName }} ({{ row.deptName }})</ElDescriptionsItem>
      <ElDescriptionsItem label="客户端">{{ row.clientKey }}</ElDescriptionsItem>
      <ElDescriptionsItem label="设备类型">
        <XuyaDictTag :options="sys_device_type" :value="row.deviceType" />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="浏览器">{{ row.browser }} / {{ row.os }}</ElDescriptionsItem>
      <ElDescriptionsItem label="操作地址">{{ row.operIp }} {{ row.operLocation }}</ElDescriptionsItem>
      <ElDescriptionsItem label="请求方法">{{ row.requestMethod }}</ElDescriptionsItem>
      <ElDescriptionsItem label="请求 URL">{{ row.operUrl }}</ElDescriptionsItem>
      <ElDescriptionsItem label="操作模块">{{ row.title }} - {{ row.businessType }}</ElDescriptionsItem>
      <ElDescriptionsItem label="操作方法">{{ row.method }}</ElDescriptionsItem>
      <ElDescriptionsItem label="请求参数"><pre class="json-pretty">{{ prettyJSON(row.operParam) }}</pre></ElDescriptionsItem>
      <ElDescriptionsItem label="返回参数"><pre class="json-pretty">{{ prettyJSON(row.jsonResult) }}</pre></ElDescriptionsItem>
      <ElDescriptionsItem label="消耗时间">{{ row.costTime }} 毫秒</ElDescriptionsItem>
      <ElDescriptionsItem label="操作时间">{{ parseTime(row.operTime) }}</ElDescriptionsItem>
      <ElDescriptionsItem label="异常信息" v-if="row.status === '1'"><pre style="white-space: pre-wrap; word-break: break-all; margin:0">{{ row.errorMsg }}</pre></ElDescriptionsItem>
    </ElDescriptions>
  </ElDialog>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import { parseTime } from '@/utils/xuya-max'
  import { useDict } from '@/hooks/core/useDict'
  import XuyaDictTag from '@/components/core/others/xuya-dict-tag/index.vue'
  const { sys_common_status, sys_device_type } = useDict('sys_common_status', 'sys_device_type')
  const visible = ref(false)
  const row = ref<any>(null)
  /** JSON 美化（内联实现，替代 vue-json-pretty 组件） */
  const prettyJSON = (str: string): string => {
    if (!str) return ''
    try {
      return JSON.stringify(JSON.parse(str), null, 2)
    } catch {
      return str
    }
  }
  const openDialog = (data: any) => { row.value = data; visible.value = true }
  const closeDialog = () => { visible.value = false }
  defineExpose({ openDialog, closeDialog })
</script>

<style scoped>
  .json-pretty {
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
    padding: 8px;
    background: var(--el-fill-color-light);
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    line-height: 1.6;
    max-height: 240px;
    overflow: auto;
  }
</style>
