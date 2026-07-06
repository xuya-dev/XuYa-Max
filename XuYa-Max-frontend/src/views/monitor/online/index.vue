<!-- 在线用户（前端分页 + 强制退出） -->
<template>
  <div class="online-page xuya-full-height flex flex-col overflow-hidden">
    <ElCard class="mb-3">
      <ElForm :inline="true" :model="searchForm">
        <ElFormItem label="登录地址"><ElInput v-model="searchForm.ipaddr" placeholder="请输入登录地址" clearable @keyup.enter="getList" /></ElFormItem>
        <ElFormItem label="用户名称"><ElInput v-model="searchForm.userName" placeholder="请输入用户名称" clearable @keyup.enter="getList" /></ElFormItem>
        <ElFormItem><ElButton type="primary" icon="Search" @click="getList">搜索</ElButton><ElButton icon="Refresh" @click="resetSearch">重置</ElButton></ElFormItem>
      </ElForm>
    </ElCard>
    <ElCard class="xuya-table-card flex-1">
      <XuyaTable :loading="loading" :data="pagedData" :columns="columns" :pagination="pagination"
        @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange" />
    </ElCard>
  </div>
</template>
<script setup lang="ts">
  import { h, ref, reactive, computed, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import XuyaButtonTable from '@/components/core/forms/xuya-button-table/index.vue'
  import XuyaDictTag from '@/components/core/others/xuya-dict-tag/index.vue'
  import { list, forceLogout } from '@/api/monitor/online'
  import { useDict } from '@/hooks/core/useDict'
  defineOptions({ name: 'Online' })
  const { sys_device_type } = useDict('sys_device_type')
  const loading = ref(false)
  const tableData = ref<any[]>([])
  const searchForm = ref<any>({ ipaddr: undefined, userName: undefined })
  const pagination = reactive({ current: 1, size: 10, total: 0 })
  const pagedData = computed(() => {
    const start = (pagination.current - 1) * pagination.size
    return tableData.value.slice(start, start + pagination.size)
  })
  const handleSizeChange = (s: number) => { pagination.size = s }
  const handleCurrentChange = (c: number) => { pagination.current = c }
  const columns: any[] = [
    { type: 'index', width: 60, label: '序号' },
    { prop: 'tokenId', label: '会话编号', showOverflowTooltip: true },
    { prop: 'userName', label: '登录名称' },
    { prop: 'ipaddr', label: '主机' },
    { prop: 'loginLocation', label: '登录地点' },
    { prop: 'browser', label: '浏览器' },
    { prop: 'os', label: '操作系统' },
    { prop: 'deviceType', label: '设备类型', formatter: (row: any) => h(XuyaDictTag, { options: sys_device_type as any, value: row.deviceType }) },
    { prop: 'loginTime', label: '登录时间', width: 180 },
    { prop: 'operation', label: '操作', width: 120, fixed: 'right', formatter: (row: any) => h(XuyaButtonTable, { type: 'delete', text: '强退', onClick: () => handleForceLogout(row) }) }
  ]
  const getList = async () => {
    loading.value = true
    // 后端 GET /monitor/online/list 返回 PageResult<SysUserOnline> = {rows, total}
    // request 已解包 res.data.data，res 即 {rows: [...], total: N}
    try {
      const res: any = await list(searchForm.value)
      tableData.value = res?.rows || []
      pagination.total = res?.total ?? tableData.value.length
    } catch (e) { console.error(e) } finally { loading.value = false }
  }
  const resetSearch = () => { searchForm.value = { ipaddr: undefined, userName: undefined }; getList() }
  const handleForceLogout = async (row: any) => {
    try { await ElMessageBox.confirm(`是否确认强制退出用户 "${row.userName}"？`, '系统提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await forceLogout(row.tokenId); ElMessage.success('强退成功'); getList() } catch (e) {}
  }
  onMounted(() => { getList() })
</script>
