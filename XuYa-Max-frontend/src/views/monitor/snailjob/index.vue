<!-- SnailJob 任务调度（iframe 内嵌） -->
<template>
  <div class="iframe-page" style="height: calc(100vh - 120px)">
    <iframe
      v-if="showFrame"
      :src="src"
      class="w-full h-full border-0"
      title="SnailJob 任务调度"
      @error="handleLoadError"
      @load="handleLoaded"
    />
    <div v-else class="flex-c justify-center h-full">
      <ElEmpty :description="emptyDesc">
        <template #image>
          <XuyaSvgIcon icon="ri:link-unlink" class="text-5xl text-g-400" />
        </template>
        <ElButton v-if="src" type="primary" class="mt-3" @click="retry">重新连接</ElButton>
        <ElButton v-else class="mt-3" @click="goDocs">部署文档</ElButton>
      </ElEmpty>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import XuyaSvgIcon from '@/components/core/base/xuya-svg-icon/index.vue'
  import { WEB_LINKS } from '@/utils/constants'
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'Snailjob' })

  const router = useRouter()
  const src = ref(import.meta.env.VITE_APP_SNAILJOB_ADMIN || '')

  /**
   * 是否显示 iframe。SnailJob 是独立服务（ruoyi-snailjob-server:17888），
   * 必须通过 VITE_APP_SNAILJOB_ADMIN 配置且服务已启动。
   * 即使配置了地址，也可能因服务未运行/跨域/Sa-Token 单点登录失败导致白屏，
   * 这里用超时探测：iframe onload 在跨域时也能触发，可作粗略存活判断。
   */
  const showFrame = ref(false)
  const loaded = ref(false)
  const loadFailed = ref(false)
  let probeTimer: ReturnType<typeof setTimeout> | null = null

  const emptyDesc = ref('')
  const setEmpty = (msg: string) => {
    showFrame.value = false
    emptyDesc.value = msg
  }

  /** 探测超时：超过 8s 仍无 onload 事件，认为不可用 */
  const startProbe = () => {
    stopProbe()
    probeTimer = setTimeout(() => {
      if (!loaded.value) handleLoadError()
    }, 8000)
  }
  const stopProbe = () => {
    if (probeTimer) {
      clearTimeout(probeTimer)
      probeTimer = null
    }
  }

  const tryMount = () => {
    if (!src.value) {
      setEmpty('未配置 SnailJob 地址（环境变量 VITE_APP_SNAILJOB_ADMIN）')
      return
    }
    loaded.value = false
    loadFailed.value = false
    showFrame.value = true
    nextTick(startProbe)
  }

  const handleLoaded = () => {
    loaded.value = true
    stopProbe()
  }
  const handleLoadError = () => {
    loaded.value = true // 阻止超时再触发
    stopProbe()
    setEmpty('SnailJob 控制台连接失败，请确认服务已启动（默认 17888 端口）且环境变量 VITE_APP_SNAILJOB_ADMIN 配置正确')
  }
  const retry = () => tryMount()
  const goDocs = () => router.push('/outside/iframe/3') // 项目文档页

  onMounted(tryMount)
  onBeforeUnmount(stopProbe)
</script>
