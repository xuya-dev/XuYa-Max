<!--
  个人中心（重新设计的规范布局）
  - 顶部：用户横幅卡（头像可点击上传 + 昵称 + 核心信息，横向铺满）
  - 中部：基本设置（左 2/3）+ 账号安全（右 1/3）
  - 底部：在线设备（铺满宽度）
-->
<template>
  <div class="user-center-page">
    <!-- 顶部：用户横幅卡 -->
    <div class="xuya-card-sm banner-card">
      <img class="banner-bg" src="@imgs/user/gradient_bg.jpg" alt="bg" />
      <div class="banner-content">
        <!-- 头像（可点击上传） -->
        <ElUpload
          class="avatar-uploader"
          :show-file-list="false"
          :before-upload="beforeAvatarUpload"
          :http-request="handleAvatarUpload"
          accept="image/png,image/jpeg,image/jpg"
        >
          <div class="avatar-wrap">
            <img class="avatar-img" :src="profile.avatar || defaultAvatar" @error="(e: any) => (e.target.src = defaultAvatar)" />
            <div class="avatar-mask">
              <XuyaSvgIcon icon="ri:camera-line" class="text-xl text-white" />
              <span class="text-xs text-white mt-1">更换头像</span>
            </div>
          </div>
        </ElUpload>

        <!-- 用户基本信息 -->
        <div class="banner-info">
          <h2 class="text-2xl font-medium text-white">{{ profile.nickName || profile.userName }}</h2>
          <div class="banner-meta">
            <span class="meta-item"><XuyaSvgIcon icon="ri:user-3-line" />{{ profile.userName }}</span>
            <span class="meta-item"><XuyaSvgIcon icon="ri:building-line" />{{ profile.deptName || '-' }}</span>
            <span class="meta-item"><XuyaSvgIcon icon="ri:shield-user-line" />{{ roleGroup || '-' }}</span>
            <span class="meta-item"><XuyaSvgIcon icon="ri:mail-line" />{{ profile.email || '-' }}</span>
            <span class="meta-item"><XuyaSvgIcon icon="ri:phone-line" />{{ profile.phoneNumber || '-' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 中部：基本设置 + 账号安全 -->
    <ElRow :gutter="20" class="mt-5">
      <ElCol :xs="24" :lg="16">
        <!-- 基本设置 -->
        <div class="xuya-card-sm">
          <div class="flex-cb px-5 py-4 border-b border-g-300">
            <h3 class="text-base font-medium text-g-800">基本设置</h3>
            <div class="flex-c gap-2">
              <template v-if="!isEditing">
                <ElButton type="primary" plain size="small" :icon="EditPen" @click="startEdit">编辑</ElButton>
              </template>
              <template v-else>
                <ElButton size="small" @click="cancelEdit">取消</ElButton>
                <ElButton type="primary" size="small" :loading="baseSaving" @click="submitBase">保存</ElButton>
              </template>
            </div>
          </div>
          <ElForm
            ref="baseFormRef"
            :model="baseForm"
            :rules="baseRules"
            :disabled="!isEditing"
            class="box-border p-5"
            label-width="92px"
          >
            <ElRow :gutter="20">
              <ElCol :span="12" class="max-sm:!w-full">
                <ElFormItem label="用户昵称" prop="nickName">
                  <ElInput v-model="baseForm.nickName" maxlength="30" placeholder="请输入用户昵称" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12" class="max-sm:!w-full">
                <ElFormItem label="性别" prop="gender">
                  <ElSelect v-model="baseForm.gender" placeholder="请选择性别" class="!w-full">
                    <ElOption v-for="d in sys_user_gender" :key="d.value" :label="d.label" :value="d.value" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="20">
              <ElCol :span="12" class="max-sm:!w-full">
                <ElFormItem label="手机号码" prop="phoneNumber">
                  <ElInput v-model="baseForm.phoneNumber" maxlength="11" placeholder="请输入手机号码" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12" class="max-sm:!w-full">
                <ElFormItem label="邮箱" prop="email">
                  <ElInput v-model="baseForm.email" maxlength="50" placeholder="请输入邮箱" />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElForm>
        </div>
      </ElCol>

      <ElCol :xs="24" :lg="8">
        <!-- 账号安全 -->
        <div class="xuya-card-sm h-full flex flex-col">
          <div class="px-5 py-4 border-b border-g-300">
            <h3 class="text-base font-medium text-g-800">账号安全</h3>
          </div>
          <div class="flex-1 flex-c justify-center p-5">
            <div class="text-center">
              <XuyaSvgIcon icon="ri:shield-check-line" class="text-4xl text-success mb-3" />
              <p class="text-sm text-g-700">定期修改密码可保护账号安全</p>
              <ElButton type="primary" plain class="mt-4" :icon="Lock" @click="openPwdDialog">修改密码</ElButton>
            </div>
          </div>
        </div>
      </ElCol>
    </ElRow>

    <!-- 底部：在线设备 -->
    <div class="xuya-card-sm mt-5">
      <div class="flex-cb px-5 py-4 border-b border-g-300">
        <div class="flex-c gap-2">
          <h3 class="text-base font-medium text-g-800">在线设备</h3>
          <ElBadge :value="devices.length" :max="99" type="primary" />
        </div>
        <ElButton text size="small" :icon="RefreshRight" @click="loadDevices">刷新</ElButton>
      </div>
      <div class="p-2">
        <ElEmpty v-if="!devices.length" description="暂无在线设备" :image-size="70" />
        <ElTable v-else :data="devices" :show-header="true" size="default">
          <ElTableColumn label="设备" min-width="120">
            <template #default="{ row }">
              <div class="flex-c gap-2">
                <XuyaSvgIcon :icon="deviceIcon(row.os)" class="text-lg text-theme" />
                <span class="text-sm">{{ row.os || '未知设备' }}</span>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="browser" label="浏览器" min-width="120" show-overflow-tooltip />
          <ElTableColumn prop="ipaddr" label="IP 地址" min-width="120" show-overflow-tooltip />
          <ElTableColumn prop="loginLocation" label="登录地点" min-width="100" show-overflow-tooltip />
          <ElTableColumn label="登录时间" width="170">
            <template #default="{ row }">{{ parseTime(row.loginTime) }}</template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="90" align="center">
            <template #default="{ row }">
              <ElButton link type="danger" size="small" @click="handleForceLogout(row)">下线</ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <ElDialog v-model="pwdDialogVisible" title="修改密码" width="440px" append-to-body @close="resetPwdForm">
      <ElForm ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="92px">
        <ElFormItem label="当前密码" prop="oldPassword">
          <ElInput v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
        </ElFormItem>
        <ElFormItem label="新密码" prop="newPassword">
          <ElInput v-model="pwdForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </ElFormItem>
        <ElFormItem label="确认新密码" prop="confirmPassword">
          <ElInput v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="pwdDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="pwdSaving" @click="submitPwd">确认修改</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { EditPen, Lock, RefreshRight } from '@element-plus/icons-vue'
  import XuyaSvgIcon from '@/components/core/base/xuya-svg-icon/index.vue'
  import { useDict } from '@/hooks/core/useDict'
  import { useUserStore } from '@/store/modules/user'
  import { getUserProfile, updateUserProfile, updateUserPwd } from '@/api/system/user'
  import { uploadOss, listByIds } from '@/api/system/oss'
  import { getOnline, forceLogout } from '@/api/monitor/online'
  import { parseTime } from '@/utils/xuya-max'
  import defaultAvatar from '@imgs/user/avatar.webp'

  defineOptions({ name: 'UserCenter' })

  const userStore = useUserStore()
  const { sys_user_gender } = useDict('sys_user_gender')

  /** 用户资料 */
  const profile = reactive<any>({
    userName: '',
    nickName: '',
    avatar: '',
    email: '',
    phoneNumber: '',
    deptName: '',
    createTime: ''
  })
  const roleGroup = ref('')

  /** 基本设置：默认只读，编辑按钮切换 */
  const isEditing = ref(false)
  const baseFormRef = ref<FormInstance>()
  const baseSaving = ref(false)
  const baseForm = reactive<any>({ nickName: '', gender: '', phoneNumber: '', email: '' })
  const baseSnapshot = reactive<any>({})
  const baseRules: FormRules = {
    nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
    email: [
      { required: true, message: '邮箱不能为空', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱', trigger: ['blur', 'change'] }
    ],
    phoneNumber: [
      { required: true, message: '手机号码不能为空', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
    ]
  }
  const startEdit = () => {
    Object.assign(baseSnapshot, baseForm)
    isEditing.value = true
  }
  const cancelEdit = () => {
    Object.assign(baseForm, baseSnapshot)
    isEditing.value = false
    baseFormRef.value?.clearValidate()
  }
  const submitBase = async () => {
    if (!baseFormRef.value) return
    try {
      await baseFormRef.value.validate()
      baseSaving.value = true
      await updateUserProfile({
        nickName: baseForm.nickName,
        phoneNumber: baseForm.phoneNumber,
        email: baseForm.email,
        gender: baseForm.gender
      })
      ElMessage.success('修改成功')
      Object.assign(profile, {
        nickName: baseForm.nickName,
        phoneNumber: baseForm.phoneNumber,
        email: baseForm.email
      })
      isEditing.value = false
    } catch (e) {
    } finally {
      baseSaving.value = false
    }
  }

  /** 头像上传 */
  const avatarUploading = ref(false)
  const beforeAvatarUpload = (file: File) => {
    const isImg = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isImg) {
      ElMessage.error('头像仅支持 png / jpg / jpeg 格式')
      return false
    }
    if (!isLt2M) {
      ElMessage.error('头像大小不能超过 2MB')
      return false
    }
    return true
  }
  const handleAvatarUpload = async (options: UploadRequestOptions) => {
    const file = options.file as File
    avatarUploading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res: any = await uploadOss(formData)
      const ossId = res?.ossId || res?.data?.ossId
      if (!ossId) throw new Error('上传失败')
      // 更新用户资料里的头像
      await updateUserProfile({ avatar: String(ossId) } as any)
      // 查询头像 URL 并同步到 store / 页面
      const list: any = await listByIds(String(ossId))
      const url = list?.[0]?.url
      if (url) {
        profile.avatar = url
        if (userStore.info) userStore.info.avatar = url
      }
      ElMessage.success('头像更新成功')
    } catch (e) {
      console.error('头像上传失败', e)
      ElMessage.error('头像上传失败')
    } finally {
      avatarUploading.value = false
    }
  }

  /** 修改密码弹窗 */
  const pwdDialogVisible = ref(false)
  const pwdFormRef = ref<FormInstance>()
  const pwdSaving = ref(false)
  const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const equalToPassword = (_rule: any, value: string, callback: any) => {
    if (pwdForm.newPassword !== value) callback(new Error('两次输入的密码不一致'))
    else callback()
  }
  const pwdRules: FormRules = {
    oldPassword: [{ required: true, message: '当前密码不能为空', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '新密码不能为空', trigger: 'blur' },
      { min: 5, max: 20, message: '长度在 5 到 20 个字符', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '确认密码不能为空', trigger: 'blur' },
      { validator: equalToPassword, trigger: 'blur' }
    ]
  }
  const openPwdDialog = () => {
    pwdDialogVisible.value = true
  }
  const resetPwdForm = () => {
    pwdFormRef.value?.resetFields()
  }
  const submitPwd = async () => {
    if (!pwdFormRef.value) return
    try {
      await pwdFormRef.value.validate()
      pwdSaving.value = true
      await updateUserPwd(pwdForm.oldPassword, pwdForm.newPassword)
      ElMessage.success('修改成功')
      pwdDialogVisible.value = false
    } catch (e) {
    } finally {
      pwdSaving.value = false
    }
  }

  /** 在线设备 */
  const devices = ref<any[]>([])
  const loadDevices = async () => {
    try {
      const res: any = await getOnline()
      devices.value = res?.rows || []
    } catch (e) {
      console.error('获取在线设备失败', e)
    }
  }
  const handleForceLogout = (row: any) => {
    ElMessageBox.confirm(`确认要强制该设备下线吗？（${row.os || '未知设备'}）`, '系统提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => forceLogout(row.tokenId))
      .then(() => {
        ElMessage.success('强制下线成功')
        loadDevices()
      })
      .catch(() => {})
  }
  const deviceIcon = (os?: string): string => {
    if (!os) return 'ri:device-line'
    const s = os.toLowerCase()
    if (s.includes('windows')) return 'ri:windows-line'
    if (s.includes('mac') || s.includes('ios')) return 'ri:apple-line'
    if (s.includes('android')) return 'ri:android-line'
    if (s.includes('linux')) return 'ri:terminal-line'
    return 'ri:device-line'
  }

  /** 加载用户资料 */
  const loadProfile = async () => {
    try {
      const res: any = await getUserProfile()
      const data = res
      const user = data?.user || {}
      Object.assign(profile, {
        userName: user.userName,
        nickName: user.nickName,
        avatar: user.avatar,
        email: user.email,
        phoneNumber: user.phoneNumber,
        deptName: user.deptName,
        createTime: user.createTime
      })
      roleGroup.value = data?.roleGroup || ''
      Object.assign(baseForm, {
        nickName: user.nickName,
        gender: String(user.gender ?? ''),
        phoneNumber: user.phoneNumber,
        email: user.email
      })
    } catch (e) {
      console.error('获取用户资料失败', e)
    }
  }

  onMounted(() => {
    loadProfile()
    loadDevices()
  })
</script>

<style lang="scss" scoped>
  @reference '@styles/core/tailwind.css';

  .user-center-page {
    padding: 4px 0;
  }

  /* 顶部横幅卡 */
  .banner-card {
    position: relative;
    overflow: hidden;
  }
  .banner-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .banner-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-end;
    gap: 20px;
    padding: 60px 24px 24px;
    max-md\:block {
      display: block;
    }
  }
  @media (max-width: 768px) {
    .banner-content {
      display: block;
      padding: 50px 16px 20px;
    }
  }

  /* 头像上传 */
  .avatar-uploader {
    flex-shrink: 0;
    :deep(.el-upload) {
      cursor: pointer;
    }
  }
  .avatar-wrap {
    position: relative;
    width: 88px;
    height: 88px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .avatar-mask {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .avatar-wrap:hover .avatar-mask {
    opacity: 1;
  }

  /* 横幅用户信息 */
  .banner-info {
    flex: 1;
    padding-bottom: 6px;
  }
  .banner-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    margin-top: 8px;
  }
  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.92);
  }
  .meta-item :deep(svg) {
    font-size: 15px;
  }
</style>
