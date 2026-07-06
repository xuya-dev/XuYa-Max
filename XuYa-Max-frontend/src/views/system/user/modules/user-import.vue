<!--
  用户导入弹窗（对接 XuYa-Max）
  - el-upload 直传 POST /system/user/importData（multipart/form-data），带 Authorization + clientid
  - 勾选"是否更新已经存在的用户数据"对应后端 updateSupport 参数
  - 模板下载走 POST /system/user/importTemplate
-->
<template>
  <ElDialog v-model="visibleRef" title="用户导入" width="460px" append-to-body @close="handleClose">
    <div class="mb-3">
      <ElUpload
        ref="uploadRef"
        :limit="1"
        accept=".xlsx, .xls"
        :headers="headers"
        :action="uploadUrl"
        :data="{ updateSupport: updateSupport ? 'true' : 'false' }"
        :disabled="uploading"
        :before-upload="handleBeforeUpload"
        :on-success="handleSuccess"
        :on-error="handleError"
        :auto-upload="false"
        drag
      >
        <XuyaSvgIcon icon="ri:upload-cloud-2-line" class="text-3xl text-g-400" />
        <div class="el-upload__text mt-2">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip text-g-400">仅允许导入 xlsx / xls 格式文件</div>
        </template>
      </ElUpload>
    </div>
    <div class="mb-2">
      <ElCheckbox v-model="updateSupport">是否更新已经存在的用户数据</ElCheckbox>
    </div>
    <div class="text-sm">
      <span class="text-g-500">提示：仅允许导入“用户导入模板.xlsx”，</span>
      <ElButton type="primary" link @click="handleDownloadTemplate">下载模板</ElButton>
    </div>
    <template #footer>
      <ElButton @click="visibleRef = false">取 消</ElButton>
      <ElButton type="primary" :loading="uploading" @click="handleSubmit">确 定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import type { UploadInstance } from 'element-plus'
  import XuyaSvgIcon from '@/components/core/base/xuya-svg-icon/index.vue'
  import { globalHeaders } from '@/utils/globalHeaders'
  import { userImportUrl, downloadUserImportTemplate } from '@/api/system/user'

  defineOptions({ name: 'UserImport' })

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }
  const props = defineProps<{ visible: boolean }>()
  const emit = defineEmits<Emits>()

  const visibleRef = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const uploadUrl = userImportUrl
  const headers = computed(() => globalHeaders())
  const uploadRef = ref<UploadInstance>()
  const updateSupport = ref(false)
  const uploading = ref(false)

  /** 提交上传 */
  const handleSubmit = () => {
    uploadRef.value?.submit()
  }

  /** 上传前校验：el-upload 在 submit 时触发，返回 false 中止上传 */
  const handleBeforeUpload = (file: File) => {
    const isExcel = ['.xlsx', '.xls'].some((ext) => file.name.toLowerCase().endsWith(ext))
    if (!isExcel) {
      ElMessage.error('仅允许导入 xlsx / xls 格式文件')
      return false
    }
    uploading.value = true
    return true
  }

  /** 上传成功（el-upload 透传原始响应，未经过 axios 拦截器） */
  const handleSuccess = (res: any) => {
    uploading.value = false
    if (res?.code === 200) {
      ElMessage.success(res?.msg || '导入成功')
      visibleRef.value = false
      emit('success')
    } else {
      ElMessage.error(res?.msg || '导入失败')
    }
  }

  /** 上传失败 */
  const handleError = () => {
    uploading.value = false
    ElMessage.error('导入失败，请检查文件格式或网络')
  }

  /** 下载导入模板 */
  const handleDownloadTemplate = () => {
    downloadUserImportTemplate()
  }

  /** 关闭重置 */
  const handleClose = () => {
    updateSupport.value = false
    uploading.value = false
    uploadRef.value?.clearFiles()
  }
</script>
