<!--
  XuyaImageUpload 图片上传组件（对接 XuYa-Max OSS）

  通过 el-upload 直传后端 /resource/oss/upload，modelValue 存储逗号分隔的 ossId 字符串。
  上传头通过 globalHeaders() 注入 Authorization + clientid（绕过 axios 拦截器）。

  用法：
    <XuyaImageUpload v-model="form.avatar" :file-size="5" :limit="1" />

  Props:
    - modelValue: 逗号分隔的 ossId 字符串（或 OssVO 数组）
    - limit: 图片数量上限（默认 5）
    - fileSize: 单张大小上限 MB（默认 5）
    - fileType: 允许的扩展名（默认 ['png','jpg','jpeg']）
-->
<template>
  <div class="component-upload-image">
    <ElUpload
      ref="imageUploadRef"
      multiple
      :action="uploadImgUrl"
      list-type="picture-card"
      :on-success="handleUploadSuccess"
      :before-upload="handleBeforeUpload"
      :data="uploadData"
      :limit="limit"
      :accept="fileAccept"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :before-remove="handleDelete"
      :show-file-list="true"
      :headers="headers"
      :file-list="fileList"
      :on-preview="handlePictureCardPreview"
      :class="{ hide: fileList.length >= limit }"
    >
      <ElIcon class="avatar-uploader-icon"><Plus /></ElIcon>
    </ElUpload>
    <!-- 上传提示 -->
    <div v-if="showTip" class="el-upload__tip">
      请上传
      <template v-if="fileSize">大小不超过<b style="color: #f56c6c">{{ fileSize }}MB</b></template>
      <template v-if="fileType">格式为<b style="color: #f56c6c">{{ fileType.join('/') }}</b></template>
      的文件
    </div>

    <ElDialog v-model="dialogVisible" title="预览" width="800px" append-to-body>
      <img :src="dialogImageUrl" style="display: block; max-width: 100%; margin: 0 auto" />
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { Plus } from '@element-plus/icons-vue'
  import { listByIds, delOss } from '@/api/system/oss'
  import type { OssVO, SysOssExt } from '@/api/system/oss/types'
  import modal from '@/plugins/modal'
  import { globalHeaders } from '@/utils/globalHeaders'

  defineOptions({ name: 'XuyaImageUpload' })

  interface Props {
    modelValue?: string | OssVO[] | any[]
    /** 图片数量限制 */
    limit?: number
    /** 大小限制（MB） */
    fileSize?: number
    /** 允许的文件类型 */
    fileType?: string[]
    /** 是否显示提示 */
    isShowTip?: boolean
    /** 上传扩展属性 */
    ossExt?: SysOssExt
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    limit: 5,
    fileSize: 5,
    fileType: () => ['png', 'jpg', 'jpeg'],
    isShowTip: true,
    ossExt: undefined
  })

  const emit = defineEmits(['update:modelValue'])
  const number = ref(0)
  const uploadList = ref<any[]>([])
  const dialogImageUrl = ref('')
  const dialogVisible = ref(false)

  const baseUrl = import.meta.env.VITE_API_URL
  // 上传地址（el-upload 直传，不经过 axios 拦截器）
  const uploadImgUrl = ref(baseUrl + '/resource/oss/upload')
  const headers = computed(() => globalHeaders())

  const fileList = ref<any[]>([])
  const imageUploadRef = ref()
  const showTip = computed(() => props.isShowTip && (props.fileType.length > 0 || !!props.fileSize))
  const fileAccept = computed(() => props.fileType.map((type) => `.${type}`).join(','))

  // 上传附加数据（ossExt 扩展属性）
  const uploadData = computed(() => {
    if (!props.ossExt) return {}
    return { ossExt: JSON.stringify(props.ossExt) }
  })

  // 监听 modelValue 变化，回显图片
  watch(
    () => props.modelValue,
    async (val: any) => {
      if (val) {
        let list: any[] = []
        if (Array.isArray(val)) {
          list = val
        } else if (typeof val === 'string' && val) {
          // 字符串 ossId 串，调接口查出 url
          const res = await listByIds(val)
          list = res || []
        }
        fileList.value = list.map((item: any) => {
          if (typeof item === 'string') {
            return { name: item, url: item }
          }
          return { name: item.ossId, url: item.url, ossId: item.ossId }
        })
      } else {
        fileList.value = []
      }
    },
    { deep: true, immediate: true }
  )

  /** 上传前校验 */
  const handleBeforeUpload = (file: File) => {
    let isImg = false
    if (props.fileType.length) {
      let fileExtension = ''
      if (file.name.lastIndexOf('.') > -1) {
        fileExtension = file.name.slice(file.name.lastIndexOf('.') + 1)
      }
      isImg = props.fileType.some((type) => {
        if (file.type.indexOf(type) > -1) return true
        if (fileExtension && fileExtension.indexOf(type) > -1) return true
        return false
      })
    } else {
      isImg = file.type.indexOf('image') > -1
    }
    if (!isImg) {
      modal.msgError(`文件格式不正确，请上传 ${props.fileType.join('/')} 图片格式文件！`)
      return false
    }
    if (file.name.includes(',')) {
      modal.msgError('文件名不正确，不能包含英文逗号！')
      return false
    }
    if (props.fileSize) {
      const isLt = file.size / 1024 / 1024 < props.fileSize
      if (!isLt) {
        modal.msgError(`上传图片大小不能超过 ${props.fileSize} MB！`)
        return false
      }
    }
    modal.loading('正在上传图片，请稍候...')
    number.value++
  }

  /** 文件个数超出 */
  const handleExceed = () => {
    modal.msgError(`上传文件数量不能超过 ${props.limit} 个！`)
  }

  /** 上传成功回调（el-upload 透传原始响应，未经过拦截器） */
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
      imageUploadRef.value?.handleRemove(file)
      uploadedSuccessfully()
    }
  }

  /** 删除图片 */
  const handleDelete = (file: any): boolean => {
    const findex = fileList.value.map((f) => f.name).indexOf(file.name)
    if (findex > -1 && uploadList.value.length === number.value) {
      const ossId = fileList.value[findex].ossId
      delOss(ossId)
      fileList.value.splice(findex, 1)
      emit('update:modelValue', listToString(fileList.value))
      return false
    }
    return true
  }

  /** 上传结束处理 */
  const uploadedSuccessfully = () => {
    if (number.value > 0 && uploadList.value.length === number.value) {
      fileList.value = fileList.value.filter((f) => f.url !== undefined).concat(uploadList.value)
      uploadList.value = []
      number.value = 0
      emit('update:modelValue', listToString(fileList.value))
      modal.closeLoading()
    }
  }

  /** 上传失败 */
  const handleUploadError = () => {
    modal.msgError('上传图片失败')
    modal.closeLoading()
  }

  /** 预览 */
  const handlePictureCardPreview = (file: any) => {
    dialogImageUrl.value = file.url
    dialogVisible.value = true
  }

  /** 对象转逗号分隔字符串 */
  const listToString = (list: any[], separator = ','): string => {
    let strs = ''
    for (const item of list) {
      if (item.ossId !== undefined && item.url.indexOf('blob:') !== 0) {
        strs += item.ossId + separator
      }
    }
    return strs !== '' ? strs.substring(0, strs.length - 1) : ''
  }
</script>

<style lang="scss" scoped>
  :deep(.hide .el-upload--picture-card) {
    display: none;
  }
</style>
