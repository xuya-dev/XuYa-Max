<!-- 登录日志 -->
<template>
  <div class="logininfo-page xuya-full-height flex flex-col overflow-hidden">
    <LogininfoSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />
    <ElCard class="xuya-table-card">
      <XuyaTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="danger" icon="Delete" :disabled="multiple" v-auth="'monitor:logininfo:remove'" @click="handleDelete()">删除</ElButton>
            <ElButton type="warning" icon="Delete" v-auth="'monitor:logininfo:remove'" @click="handleClean">清空</ElButton>
            <ElButton type="success" icon="Unlock" :disabled="single" v-auth="'monitor:logininfo:unlock'" @click="handleUnlock">解锁</ElButton>
            <ElButton type="warning" icon="Download" v-auth="'monitor:logininfo:export'" @click="handleExport">导出</ElButton>
          </ElSpace>
        </template>
      </XuyaTableHeader>
      <XuyaTable :loading="loading" :data="data" :columns="columns" :pagination="pagination"
        @selection-change="handleSelectionChange" @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange" />
    </ElCard>
  </div>
</template>
<script setup lang="ts">
  import { h, ref, reactive } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import { useDict } from '@/hooks/core/useDict'
  import XuyaDictTag from '@/components/core/others/xuya-dict-tag/index.vue'
  import { list, delLoginInfo, cleanLoginInfo, unlockLoginInfo } from '@/api/monitor/loginInfo'
  import type { LoginInfoVO } from '@/api/monitor/loginInfo/types'
  import { download } from '@/utils/http'
  import LogininfoSearch from './modules/logininfo-search.vue'
  defineOptions({ name: 'Logininfo' })
  const { sys_common_status, sys_device_type } = useDict('sys_common_status', 'sys_device_type')
  const ids = ref<(string | number)[]>([])
  const selectedRows = ref<LoginInfoVO[]>([])
  const single = ref(true)
  const multiple = ref(true)
  const searchForm = ref<any>({})
  const { columns, columnChecks, data, loading, pagination, getData, replaceSearchParams, resetSearchParams, handleSizeChange, handleCurrentChange, refreshData } = useTable({
    core: {
      apiFn: list,
      apiParams: { orderByColumn: 'loginTime', isAsc: 'desc', ...searchForm.value },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 60, label: '序号' },
        { prop: 'infoId', label: '访问编号' },
        { prop: 'userName', label: '用户名称', sortable: true },
        { prop: 'ipaddr', label: '地址' },
        { prop: 'loginLocation', label: '登录地点' },
        { prop: 'browser', label: '浏览器' },
        { prop: 'os', label: '操作系统' },
        { prop: 'status', label: '登录状态', formatter: (row: LoginInfoVO) => h(XuyaDictTag, { options: sys_common_status as any, value: row.status }) },
        { prop: 'msg', label: '描述' },
        { prop: 'loginTime', label: '访问时间', width: 180, sortable: true }
      ]
    }
  })
  const handleSearch = (p: any) => { replaceSearchParams(p); getData() }
  const handleSelectionChange = (s: LoginInfoVO[]) => { ids.value = s.map((i: any) => i.infoId); selectedRows.value = s; single.value = s.length !== 1; multiple.value = !s.length }
  const handleDelete = async () => { try { await ElMessageBox.confirm(`是否确认删除访问编号为 "${ids.value}" 的数据项？`, '系统提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await delLoginInfo(ids.value.join(',')); ElMessage.success('删除成功'); refreshData() } catch (e) {} }
  const handleClean = async () => { try { await ElMessageBox.confirm('是否确认清空所有登录日志数据项？', '系统提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await cleanLoginInfo(); ElMessage.success('清空成功'); refreshData() } catch (e) {} }
  const handleUnlock = async () => {
    // 后端端点 GET /monitor/loginInfo/unlock/{userName}，需要传 userName 而非 infoId
    const userName = selectedRows.value[0]?.userName
    if (!userName) { ElMessage.warning('请选择要解锁的用户'); return }
    try { await unlockLoginInfo(userName); ElMessage.success('解锁成功') } catch (e) {}
  }
  const handleExport = () => download('/monitor/loginInfo/export', { ...searchForm.value }, `logininfo_${new Date().getTime()}.xlsx`)
</script>
