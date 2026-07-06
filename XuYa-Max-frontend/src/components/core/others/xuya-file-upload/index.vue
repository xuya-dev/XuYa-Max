<!--
  XuyaFileUpload 文件上传组件（对接 XuYa-Max OSS）

  通过 el-upload 直传后端 /resource/oss/upload，modelValue 存储逗号分隔的 ossId 字符串。
  用法：
    <XuyaFileUpload v-model="form.fileIds" :file-size="10" />
-->
<template>
  <div class="upload-file">
    <ElUpload
      ref="fileUploadRef"
      multiple
      :action="uploadFileUrl"
      :before-upload="handleBeforeUpload"
      :data="uploadData"
      :file-list="fileList"
      :limit="limit"
      :accept="fileAccept"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :on-success="handleUploadSuccess"
      :show-file-list="false"
      :headers="headers"
      class="upload-file-uploader"
      v-if="!disabled"
    >
      <ElButton type="primary">选取文件</ElButton>
    </ElUpload>
    <!-- 上传提示 -->
    <div v-if="showTip && !disabled" class="el-upload__tip">
      请上传
      <template v-if="fileSize">大小不超过<b style="color: #f56c6c">{{ fileSize }}MB</b></template>
      <template v-if="fileType">格式为<b style="color: #f56c6c">{{ fileType.join('/') }}</b></template>
      的文件
    </div>
    <!-- 文件列表 -->
    <transition-group
      class="upload-file-list el-upload-list el-upload-list--text"
      name="el-fade-in-linear"
      tag="ul"
    >
      <li
        v-for="(file, index) in fileList"
        :key="file.uid"
        class="el-upload-list__item ele-upload-list__item-content"
      >
        <ElLink :href="`${file.url}`" underline="never" target="_blank">
          <span class="el-icon-document">{{ getFileName(file.name) }}</span>
        </ElLink>
        <div class="ele-upload-list__item-content-action">
          <ElButton type="danger" v-if="!disabled" link @click="handleDelete(index)">删除</ElButton>
        </div>
      </li>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { delOss, listByIds } from '@/api/system/oss'
  import type { SysOssExt } from '@/api/system/oss/types'
  import modal from '@/plugins/modal'
  import { globalHeaders } from '@/utils/globalHeaders'

  defineOptions({ name: 'XuyaFileUpload' })

  interface Props {
    modelValue?: string | any[]
    /** 数量限制 */
    limit?: number
    /** 大小限制（MB） */
    fileSize?: number
    /** 文件类型 */
    fileType?: string[]
    /** 是否显示提示 */
    isShowTip?: boolean
    /** 禁用（仅查看） */
    disabled?: boolean
    /** 上传扩展属性 */
    ossExt?: SysOssExt
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    limit: 5,
    fileSize: 5,
    fileType: () => ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'pdf'],
    isShowTip: true,
    disabled: false,
    ossExt: undefined
  })

  const emit = defineEmits(['update:modelValue'])
  const number = ref(0)
  const uploadList = ref<any[]>([])

  const baseUrl = import.meta.env.VITE_API_URL
  const uploadFileUrl = ref(baseUrl + '/resource/oss/upload')
  const headers = computed(() => globalHeaders())

  const fileList = ref<any[]>([])
  const fileUploadRef = ref()
  const showTip = computed(() => props.isShowTip && (props.fileType.length > 0 || !!props.fileSize))
  const fileAccept = computed(() => props.fileType.map((type) => `.${type}`).join(','))

  // 上传附加数据
  const uploadData = computed(() => {
    if (!props.ossExt) return {}
    return { ossExt: JSON.stringify(props.ossExt) }
  })

  watch(
    () => props.modelValue,
    async (val: any) => {
      if (val) {
        let temp = 1
        let list: any[] = []
        if (Array.isArray(val)) {
          list = val
        } else if (typeof val === 'string' || typeof val === 'number') {
          const res = await listByIds(val as string)
          list = (res || []).map((oss: any) => ({
            name: oss.originalName,
            url: oss.url,
            ossId: oss.ossId
          }))
        } else {
          list = []
        }
        fileList.value = list.map((item: any) => {
          item = { name: item.name, url: item.url, ossId: item.ossId }
          item.uid = item.uid || new Date().getTime() + temp++
          return item
        })
      } else {
        fileList.value = []
      }
    },
    { deep: true, immediate: true }
  )

  /** 上传前校验 */
  const handleBeforeUpload = (file: File) => {
    if (props.fileType.length) {
      const fileName = file.name.split('.')
      const fileExt = fileName[fileName.length - 1]
      const isTypeOk = props.fileType.indexOf(fileExt) >= 0
      if (!isTypeOk) {
        modal.msgError(`文件格式不正确，请上传 ${props.fileType.join('/')} 格式文件！`)
        return false
      }
    }
    if (file.name.includes(',')) {
      modal.msgError('文件名不正确，不能包含英文逗号！')
      return false
    }
    if (props.fileSize) {
      const isLt = file.size / 1024 / 1024 < props.fileSize
      if (!isLt) {
        modal.msgError(`上传文件大小不能超过 ${props.fileSize} MB！`)
        return false
      }
    }
    modal.loading('正在上传文件，请稍候...')
    number.value++
    return true
  }

  const handleExceed = () => {
    modal.msgError(`上传文件数量不能超过 ${props.limit} 个！`)
  }

  const handleUploadError = () => {
    modal.msgError('上传文件失败')
    modal.closeLoading()
  }

  const handleUploadSuccess = (res: any, file: any) => {
    if (res.code === 200) {
      uploadList.value.push({
        name: res.data.fileName,
        url: res.data.url,
        ossId: res.data.ossId
      })
      uploadedSuccessfully()
    } else {
      number.value--
      modal.closeLoading()
      modal.msgError(res.msg)
      fileUploadRef.value?.handleRemove(file)
      uploadedSuccessfully()
    }
  }

  const handleDelete = (index: number) => {
    const ossId = fileList.value[index].ossId
    delOss(ossId)
    fileList.value.splice(index, 1)
    emit('update:modelValue', listToString(fileList.value))
  }

  const uploadedSuccessfully = () => {
    if (number.value > 0 && uploadList.value.length === number.value) {
      fileList.value = fileList.value.filter((f) => f.url !== undefined).concat(uploadList.value)
      uploadList.value = []
      number.value = 0
      emit('update:modelValue', listToString(fileList.value))
      modal.closeLoading()
    }
  }

  const getFileName = (name: string) => {
    if (name.lastIndexOf('/') > -1) {
      return name.slice(name.lastIndexOf('/') + 1)
    }
    return name
  }

  const listToString = (list: any[], separator = ','): string => {
    let strs = ''
    list.forEach((item) => {
      if (item.ossId) strs += item.ossId + separator
    })
    return strs !== '' ? strs.substring(0, strs.length - 1) : ''
  }
</script>

<style lang="scss" scoped>
  .upload-file-uploader {
    margin-bottom: 5px;
  }
  .upload-file-list .el-upload-list__item {
    border: 1px solid #e4e7ed;
    line-height: 2;
    margin-bottom: 10px;
    position: relative;
  }
  .upload-file-list .ele-upload-list__item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: inherit;
  }
  .ele-upload-list__item-content-action .el-link {
    margin-right: 10px;
  }
</style>
