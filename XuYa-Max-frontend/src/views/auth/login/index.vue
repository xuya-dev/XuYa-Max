<!-- 登录页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">{{ $t('login.title') }}</h3>
          <p class="sub-title">{{ $t('login.subTitle') }}</p>
          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            :key="formKey"
            @keyup.enter="handleSubmit"
            style="margin-top: 25px"
          >
            <ElFormItem prop="username">
              <ElInput
                class="custom-height"
                :placeholder="$t('login.placeholder.username')"
                v-model.trim="formData.username"
              />
            </ElFormItem>
            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                :placeholder="$t('login.placeholder.password')"
                v-model.trim="formData.password"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <!-- 图片验证码（XuYa-Max 后端 /auth/code 返回 {captchaEnabled, uuid, img}） -->
            <ElFormItem v-if="captchaEnabled" prop="code">
              <div class="flex w-full gap-3">
                <ElInput
                  class="custom-height flex-1"
                  :placeholder="$t('login.placeholder.captcha', '请输入验证码')"
                  v-model.trim="formData.code"
                  @keyup.enter="handleSubmit"
                />
                <div
                  class="captcha-img flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border border-solid"
                  style="height: 40px; width: 120px"
                  :title="$t('login.placeholder.clickToRefresh', '点击刷新验证码')"
                  @click="getCaptcha"
                >
                  <img
                    v-if="codeImg"
                    :src="codeImg"
                    alt="captcha"
                    class="h-full w-full object-cover"
                  />
                  <div v-else class="h-full w-full flex-center text-xs text-gray-400">
                    {{ $t('login.placeholder.loading', '加载中...') }}
                  </div>
                </div>
              </div>
            </ElFormItem>

            <div class="flex-cb mt-2 text-sm">
              <ElCheckbox v-model="formData.rememberPassword">{{
                $t('login.rememberPwd')
              }}</ElCheckbox>
              <RouterLink class="text-theme" :to="{ name: 'ForgetPassword' }">{{
                $t('login.forgetPwd')
              }}</RouterLink>
            </div>

            <div style="margin-top: 30px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                {{ $t('login.btnText') }}
              </ElButton>
            </div>

            <div class="mt-5 text-sm text-gray-600">
              <span>{{ $t('login.noAccount') }}</span>
              <RouterLink class="text-theme" :to="{ name: 'Register' }">{{
                $t('login.register')
              }}</RouterLink>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import { useUserStore } from '@/store/modules/user'
  import { useI18n } from 'vue-i18n'
  import { fetchLogin, fetchGetCaptcha } from '@/api/auth'
  import { ElNotification, type FormInstance, type FormRules } from 'element-plus'

  defineOptions({ name: 'Login' })

  const { t, locale } = useI18n()
  const formKey = ref(0)

  // 监听语言切换，重置表单
  watch(locale, () => {
    formKey.value++
  })

  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()

  const systemName = AppConfig.systemInfo.name
  const formRef = ref<FormInstance>()

  // 图片验证码相关状态
  const captchaEnabled = ref(true)
  const codeImg = ref('')

  const formData = reactive({
    username: '',
    password: '',
    code: '',
    uuid: '',
    rememberPassword: true
  })

  const rules = computed<FormRules>(() => ({
    username: [{ required: true, message: t('login.placeholder.username'), trigger: 'blur' }],
    password: [{ required: true, message: t('login.placeholder.password'), trigger: 'blur' }],
    code: [{ required: true, message: t('login.placeholder.captcha', '请输入验证码'), trigger: 'blur' }]
  }))

  const loading = ref(false)

  onMounted(() => {
    getCaptcha()
  })

  // 获取图片验证码
  const getCaptcha = async () => {
    try {
      const data = await fetchGetCaptcha()
      captchaEnabled.value = data.captchaEnabled !== false
      if (captchaEnabled.value) {
        formData.uuid = data.uuid || ''
        // 后端返回的 img 为 base64 字符串（不含 data: 前缀），前端补全
        codeImg.value = data.img ? 'data:image/gif;base64,' + data.img : ''
      }
    } catch (e) {
      console.error('[Login] getCaptcha error:', e)
    }
  }

  // 登录
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      // 表单验证
      const valid = await formRef.value.validate()
      if (!valid) return

      // 验证码校验（启用验证码时必填）
      if (captchaEnabled.value && !formData.code) {
        ElNotification({ title: t('login.placeholder.captcha', '请输入验证码'), type: 'warning' })
        return
      }

      loading.value = true

      // 登录请求（对接 XuYa-Max，token 在 store.login 中处理）
      await userStore.login({
        username: formData.username,
        password: formData.password,
        code: formData.code,
        uuid: formData.uuid
      })

      // 设置登录状态
      userStore.setLoginStatus(true)

      // 登录成功处理
      showLoginSuccessNotice()

      // 获取 redirect 参数，如果存在则跳转到指定页面，否则跳转到首页
      // 防护：过滤掉登录页自身路径和外部 URL，避免登录后跳回登录页或被钓鱼
      const redirect = route.query.redirect as string
      const safeRedirect = redirect && !redirect.startsWith('http') && redirect !== '/auth/login' && redirect !== '/login'
        ? redirect
        : '/'
      router.push(safeRedirect)
    } catch (error) {
      console.error('[Login] error:', error)
      // 登录失败刷新验证码
      getCaptcha()
    } finally {
      loading.value = false
    }
  }

  // 登录成功提示
  const showLoginSuccessNotice = () => {
    setTimeout(() => {
      ElNotification({
        title: t('login.success.title'),
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `${t('login.success.message')}, ${systemName}!`
      })
    }, 1000)
  }
</script>

<style scoped>
  @import './style.css';
</style>

<style lang="scss" scoped>
  :deep(.el-select__wrapper) {
    height: 40px !important;
  }
</style>
