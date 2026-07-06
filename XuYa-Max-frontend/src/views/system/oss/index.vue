<!-- OSS 文件管理 -->
<template>
  <div class="oss-page xuya-full-height flex flex-col overflow-hidden">
    <OssSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />
    <ElCard class="xuya-table-card">
      <XuyaTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" icon="Upload" v-auth="'system:oss:upload'" @click="handleImage">上传图片</ElButton>
            <ElButton type="primary" plain icon="Upload" v-auth="'system:oss:upload'" @click="handleFile">上传文件</ElButton>
            <ElButton type="danger" icon="Delete" :disabled="multiple" v-auth="'system:oss:remove'" @click="handleDelete()">删除</ElButton>
            <ElButton type="info" icon="Operation" v-auth="'system:ossConfig:list'" @click="handleOssConfig">配置管理</ElButton>
          </ElSpace>
        </template>
      </XuyaTableHeader>
      <XuyaTable :loading="loading" :data="data" :columns="columns" :pagination="pagination"
        @selection-change="handleSelectionChange" @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange" />
      <!-- 上传弹窗 -->
      <ElDialog v-model="uploadDialog" :title="uploadType === 1 ? '上传图片' : '上传文件'" width="500px" append-to-body>
        <XuyaImageUpload v-if="uploadType === 1" v-model="uploadFileId" :limit="5" />
        <XuyaFileUpload v-else v-model="uploadFileId" :limit="5" />
        <template #footer><ElButton @click="uploadDialog = false">关闭</ElButton></template>
      </ElDialog>
    </ElCard>
  </div>
</template>
<script setup lang="ts">
  import { h, ref, reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import XuyaButtonTable from '@/components/core/forms/xuya-button-table/index.vue'
  import XuyaImageUpload from '@/components/core/media/xuya-image-upload/index.vue'
  import XuyaImagePreview from '@/components/core/media/xuya-image-preview/index.vue'
  import XuyaFileUpload from '@/components/core/others/xuya-file-upload/index.vue'
  import { listOss, delOss, downloadOss } from '@/api/system/oss'
  import type { OssVO } from '@/api/system/oss/types'
  import OssSearch from './modules/oss-search.vue'
  defineOptions({ name: 'Oss' })
  /** 判断文件后缀是否为图片 */
  const isImage = (suffix?: string) => {
    if (!suffix) return false
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(suffix)
  }
  const router = useRouter()
  const ids = ref<(string | number)[]>([])
  const multiple = ref(true)
  const searchForm = ref<any>({})
  const uploadDialog = ref(false)
  const uploadType = ref(0)
  const uploadFileId = ref('')
  const { columns, columnChecks, data, loading, pagination, getData, replaceSearchParams, resetSearchParams, handleSizeChange, handleCurrentChange, refreshData } = useTable({
    core: {
      apiFn: listOss, apiParams: { ...searchForm.value },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 60, label: '序号' },
        { prop: 'fileName', label: '文件名' },
        { prop: 'originalName', label: '原名' },
        { prop: 'fileSuffix', label: '后缀' },
        {
          prop: 'url',
          label: '预览',
          width: 90,
          align: 'center',
          formatter: (row: OssVO) => isImage(row.fileSuffix)
            ? h(XuyaImagePreview, { src: row.url, width: 48, height: 48 })
            : h('span', { class: 'text-xs text-g-500' }, row.fileSuffix || '-')
        },
        { prop: 'service', label: '服务商' },
        { prop: 'createByName', label: '上传人' },
        { prop: 'createTime', label: '创建时间', width: 160 },
        { prop: 'operation', label: '操作', width: 150, fixed: 'right', formatter: (row: OssVO) => h('div', { class: 'flex gap-1' }, [h(XuyaButtonTable, { text: '下载', icon: 'Download', onClick: () => handleDownload(row) }), h(XuyaButtonTable, { type: 'delete', onClick: () => handleDelete(row) })]) }
      ]
    }
  })
  const handleSearch = (p: any) => { replaceSearchParams(p); getData() }
  const handleSelectionChange = (s: OssVO[]) => { ids.value = s.map((i: any) => i.ossId); multiple.value = !s.length }
  const handleImage = () => { uploadType.value = 1; uploadFileId.value = ''; uploadDialog.value = true }
  const handleFile = () => { uploadType.value = 0; uploadFileId.value = ''; uploadDialog.value = true }
  const handleOssConfig = () => router.push('/system/oss-config/index')
  const handleDownload = (row: OssVO) => downloadOss(row.ossId, row.fileName)
  const handleDelete = async (row?: any) => {
    const ossIds = row ? [row.ossId] : ids.value
    try { await ElMessageBox.confirm(`是否确认删除 OSS 文件编号为 "${ossIds}" 的数据项？`, '系统提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await delOss(ossIds.join(',')); ElMessage.success('删除成功'); refreshData() } catch (e) {}
  }
</script>
