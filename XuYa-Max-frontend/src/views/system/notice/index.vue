<!-- 通知公告 -->
<template>
  <div class="notice-page xuya-full-height flex flex-col overflow-hidden">
    <NoticeSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />
    <ElCard class="xuya-table-card">
      <XuyaTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" icon="Plus" v-auth="'system:notice:add'" @click="handleAdd">新增</ElButton>
            <ElButton type="success" icon="Edit" :disabled="single" v-auth="'system:notice:edit'" @click="handleUpdate()">修改</ElButton>
            <ElButton type="danger" icon="Delete" :disabled="multiple" v-auth="'system:notice:remove'" @click="handleDelete()">删除</ElButton>
          </ElSpace>
        </template>
      </XuyaTableHeader>
      <XuyaTable :loading="loading" :data="data" :columns="columns" :pagination="pagination"
        @selection-change="handleSelectionChange" @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange" />
      <NoticeDialog v-model:visible="dialog.visible" :title="dialog.title" :form="dialog.form" @success="refreshData" />

      <!-- 公告详情弹窗 -->
      <ElDialog v-model="detail.visible" title="公告详情" width="820px" append-to-body>
        <div v-loading="detail.loading" class="notice-detail">
          <div class="notice-detail__header">
            <div class="notice-detail__title">{{ detail.form.noticeTitle || '-' }}</div>
            <div class="notice-detail__meta">
              <div class="notice-detail__meta-item">
                <span class="notice-detail__meta-label">类型：</span>
                <XuyaDictTag :options="sys_notice_type as any" :value="(detail.form.noticeType as any) || ''" />
              </div>
              <div class="notice-detail__meta-item">
                <span class="notice-detail__meta-label">状态：</span>
                <XuyaDictTag :options="sys_notice_status as any" :value="(detail.form.status as any) || ''" />
              </div>
              <div class="notice-detail__meta-item">
                <span class="notice-detail__meta-label">创建者：</span>
                <span>{{ detail.form.createByName || '-' }}</span>
              </div>
              <div class="notice-detail__meta-item">
                <span class="notice-detail__meta-label">创建时间：</span>
                <span>{{ parseTime(detail.form.createTime) || '-' }}</span>
              </div>
            </div>
          </div>
          <ElDivider />
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="notice-detail__content prose max-w-none" v-html="safeDetailContent"></div>
        </div>
        <template #footer>
          <ElButton @click="detail.visible = false">关 闭</ElButton>
        </template>
      </ElDialog>
    </ElCard>
  </div>
</template>
<script setup lang="ts">
  import { h, ref, reactive, computed, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import { useDict } from '@/hooks/core/useDict'
  import XuyaButtonTable from '@/components/core/forms/xuya-button-table/index.vue'
  import XuyaDictTag from '@/components/core/others/xuya-dict-tag/index.vue'
  import { listNotice, delNotice, getNotice } from '@/api/system/notice'
  import { parseTime } from '@/utils/xuya-max'
  import { sanitizeHtml } from '@/utils/sanitize'
  import { resolveOssContent } from '@/utils/ossContent'
  import type { NoticeVO, NoticeForm } from '@/api/system/notice/types'
  import NoticeSearch from './modules/notice-search.vue'
  import NoticeDialog from './modules/notice-dialog.vue'
  defineOptions({ name: 'Notice' })
  const route = useRoute()
  const router = useRouter()
  const { sys_notice_type, sys_notice_status } = useDict('sys_notice_type', 'sys_notice_status')
  const ids = ref<(string | number)[]>([])
  const single = ref(true)
  const multiple = ref(true)
  const searchForm = ref<any>({})
  const dialog = reactive<{ visible: boolean; title: string; form: Partial<NoticeForm> }>({ visible: false, title: '', form: {} })
  // 详情弹窗状态
  const detail = reactive<{ visible: boolean; loading: boolean; form: Partial<NoticeVO> }>({
    visible: false,
    loading: false,
    form: {}
  })
  // 详情正文（OSS 占位已解析、XSS 已净化；缺省占位）
  const EMPTY_NOTICE_CONTENT = '<p>暂无公告内容</p>'
  const safeDetailContent = computed(() =>
    sanitizeHtml(detail.form.noticeContent || EMPTY_NOTICE_CONTENT)
  )
  const { columns, columnChecks, data, loading, pagination, getData, replaceSearchParams, resetSearchParams, handleSizeChange, handleCurrentChange, refreshData } = useTable({
    core: {
      apiFn: listNotice,
      apiParams: { ...searchForm.value },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 60, label: '序号' },
        { prop: 'noticeTitle', label: '公告标题', showOverflowTooltip: true },
        { prop: 'noticeType', label: '公告类型', formatter: (row: NoticeVO) => h(XuyaDictTag, { options: sys_notice_type as any, value: row.noticeType }) },
        { prop: 'status', label: '状态', formatter: (row: NoticeVO) => h(XuyaDictTag, { options: sys_notice_status as any, value: row.status }) },
        { prop: 'createByName', label: '创建者' },
        { prop: 'createTime', label: '创建时间', width: 160 },
        { prop: 'operation', label: '操作', width: 180, fixed: 'right', formatter: (row: NoticeVO) => h('div', { class: 'flex gap-1' }, [h(XuyaButtonTable, { type: 'view', onClick: () => handleDetail(row) }), h(XuyaButtonTable, { type: 'edit', onClick: () => handleUpdate(row) }), h(XuyaButtonTable, { type: 'delete', onClick: () => handleDelete(row) })]) }
      ]
    }
  })
  const handleSearch = (p: any) => { replaceSearchParams(p); getData() }
  const handleSelectionChange = (s: NoticeVO[]) => { ids.value = s.map((i: any) => i.noticeId); single.value = s.length !== 1; multiple.value = !s.length }
  const handleAdd = () => { dialog.title = '新增公告'; dialog.form = { status: '0' }; dialog.visible = true }
  const handleUpdate = async (row?: any) => {
    const id = row?.noticeId || ids.value[0]
    try { const res: any = await getNotice(id); const d = res; dialog.title = '修改公告'; dialog.form = { ...d, status: String(d.status ?? '0') }; dialog.visible = true } catch (e) { console.error(e) }
  }
  /** 打开详情弹窗：解析 OSS 私有图占位后再回显 */
  const openDetail = async (noticeId: string | number) => {
    if (!noticeId) return
    detail.loading = true
    detail.visible = true
    detail.form = {}
    try {
      const res: any = await getNotice(noticeId)
      const d = res || {}
      // 富文本中 oss://{ossId} 占位 → 真实预签名 URL（失败回退原文）
      if (d.noticeContent) {
        d.noticeContent = await resolveOssContent(d.noticeContent)
      }
      detail.form = d
    } catch (e) {
      console.error(e)
    } finally {
      detail.loading = false
    }
  }
  const handleDetail = (row: NoticeVO) => openDetail(row.noticeId)
  const handleDelete = async (row?: any) => {
    const delIds = row ? [row.noticeId] : ids.value
    try { await ElMessageBox.confirm(`是否确认删除公告编号为 "${delIds}" 的数据项？`, '系统提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await delNotice(delIds.join(',')); ElMessage.success('删除成功'); refreshData() } catch (e) {}
  }

  // 监听路由 query.noticeId：SSE 通知跳转过来时自动打开详情弹窗
  let routeSyncing = false
  watch(
    () => route.query.noticeId,
    async (noticeId) => {
      if (routeSyncing || !noticeId) return
      await openDetail(String(noticeId))
    },
    { immediate: true }
  )
  // 详情关闭后清理路由参数
  watch(
    () => detail.visible,
    async (visible) => {
      if (visible || !route.query.noticeId) return
      routeSyncing = true
      await router.replace({ path: route.path, query: { ...route.query, noticeId: undefined } })
      routeSyncing = false
    }
  )
</script>
<style scoped>
  .notice-detail__header {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .notice-detail__title {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.4;
    color: var(--el-text-color-primary);
  }
  .notice-detail__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 20px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }
  .notice-detail__meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .notice-detail__meta-label {
    white-space: nowrap;
  }
  .notice-detail__content {
    max-height: 60vh;
    overflow: auto;
    color: var(--el-text-color-primary);
    line-height: 1.8;
    word-break: break-word;
  }
</style>
