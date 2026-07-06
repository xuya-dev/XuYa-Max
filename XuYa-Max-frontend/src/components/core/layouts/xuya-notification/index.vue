<!--
  通知组件（对接 XuYa-Max 消息盒子 + SSE 实时推送）
  - 数据来源：useMessageStore（getMessageBox 拉取 + SSE 推送）
  - 三个 Tab：通知公告 / 系统消息 / 工作流
  - 点击消息：若有 path 则跳转，并标记已读（从列表移除）
  - 「查看全部」：跳转消息中心 /system/message
-->
<template>
  <div
    class="xuya-notification-panel xuya-card-sm !shadow-xl"
    :style="{
      transform: show ? 'scaleY(1)' : 'scaleY(0.9)',
      opacity: show ? 1 : 0
    }"
    v-show="visible"
    @click.stop
  >
    <div class="flex-cb px-3.5 mt-3.5">
      <span class="text-base font-medium text-g-800">{{ $t('notice.title') }}</span>
      <span
        class="text-xs text-g-800 px-1.5 py-1 c-p select-none rounded hover:bg-g-200"
        @click="handleReadAll"
        >全部已读</span
      >
    </div>

    <ul class="box-border flex items-end w-full h-12.5 px-3.5 border-b-d">
      <li
        v-for="(item, index) in barList"
        :key="index"
        class="h-12 leading-12 mr-5 overflow-hidden text-[13px] text-g-700 c-p select-none"
        :class="{ 'bar-active': barActiveIndex === index }"
        @click="changeBar(index)"
      >
        {{ item.name }} ({{ item.num }})
      </li>
    </ul>

    <div class="w-full h-[calc(100%-95px)]">
      <div class="h-[calc(100%-60px)] overflow-y-scroll scrollbar-thin">
        <ul v-show="barActiveIndex === 0">
          <li
            v-for="item in noticeList"
            :key="item.messageId"
            class="box-border flex-c px-3.5 py-3.5 c-p last:border-b-0 hover:bg-g-200/60"
            @click="handleItemClick(item)"
          >
            <div class="size-9 leading-9 text-center rounded-lg flex-cc bg-theme/12 text-theme">
              <XuyaSvgIcon class="text-lg !bg-transparent" icon="ri:notification-3-line" />
            </div>
            <div class="w-[calc(100%-45px)] ml-3.5">
              <h4 class="text-sm font-normal leading-5.5 text-g-900 truncate">{{ item.title }}</h4>
              <p class="mt-1.5 text-xs text-g-500 truncate">{{ item.message }}</p>
            </div>
          </li>
        </ul>

        <ul v-show="barActiveIndex === 1">
          <li
            v-for="item in systemList"
            :key="item.messageId"
            class="box-border flex-c px-3.5 py-3.5 c-p last:border-b-0 hover:bg-g-200/60"
            @click="handleItemClick(item)"
          >
            <div class="size-9 leading-9 text-center rounded-lg flex-cc bg-info/12 text-info">
              <XuyaSvgIcon class="text-lg !bg-transparent" icon="ri:information-line" />
            </div>
            <div class="w-[calc(100%-45px)] ml-3.5">
              <h4 class="text-sm font-normal leading-5.5 text-g-900 truncate">{{ item.title }}</h4>
              <p class="mt-1.5 text-xs text-g-500 truncate">{{ item.message }}</p>
            </div>
          </li>
        </ul>

        <ul v-show="barActiveIndex === 2">
          <li
            v-for="item in workflowList"
            :key="item.messageId"
            class="box-border flex-c px-3.5 py-3.5 c-p last:border-b-0 hover:bg-g-200/60"
            @click="handleItemClick(item)"
          >
            <div class="size-9 leading-9 text-center rounded-lg flex-cc bg-success/12 text-success">
              <XuyaSvgIcon class="text-lg !bg-transparent" icon="ri:flow-chart" />
            </div>
            <div class="w-[calc(100%-45px)] ml-3.5">
              <h4 class="text-sm font-normal leading-5.5 text-g-900 truncate">{{ item.title }}</h4>
              <p class="mt-1.5 text-xs text-g-500 truncate">{{ item.message }}</p>
            </div>
          </li>
        </ul>

        <!-- 空状态 -->
        <div
          v-show="currentTabIsEmpty"
          class="relative top-25 h-full text-g-500 text-center !bg-transparent"
        >
          <XuyaSvgIcon icon="system-uicons:inbox" class="text-5xl" />
          <p class="mt-3.5 text-xs !bg-transparent">暂无{{ barList[barActiveIndex].name }}</p>
        </div>
      </div>

      <div class="relative box-border w-full px-3.5">
        <ElButton class="w-full mt-3" @click="handleViewAll" v-ripple>
          {{ $t('notice.viewAll') }}
        </ElButton>
      </div>
    </div>

    <div class="h-25"></div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import XuyaSvgIcon from '@/components/core/base/xuya-svg-icon/index.vue'
  import { useMessageStore } from '@/store/modules/message'
  import type { MessageVO } from '@/api/system/message/types'

  defineOptions({ name: 'XuyaNotification' })

  const props = defineProps<{
    value: boolean
  }>()

  const emit = defineEmits<{
    'update:value': [value: boolean]
  }>()

  const { t } = useI18n()
  const router = useRouter()
  const messageStore = useMessageStore()

  const show = ref(false)
  const visible = ref(false)
  const barActiveIndex = ref(0)

  // 消息数据来自 store（getMessageBox + SSE 实时推送）
  const noticeList = computed(() => messageStore.noticeList)
  const systemList = computed(() => messageStore.systemList)
  const workflowList = computed(() => messageStore.workflowList)

  // 标签栏：通知公告 / 系统消息 / 工作流
  const barList = computed(() => [
    { name: t('notice.bar[0]') || '通知', num: noticeList.value.length },
    { name: t('notice.bar[1]') || '消息', num: systemList.value.length },
    { name: t('notice.bar[2]') || '待办', num: workflowList.value.length }
  ])

  const changeBar = (index: number) => {
    barActiveIndex.value = index
  }

  // 当前 Tab 是否为空
  const currentTabIsEmpty = computed(() => {
    const map = [noticeList.value, systemList.value, workflowList.value]
    const cur = map[barActiveIndex.value]
    return !cur || cur.length === 0
  })

  /**
   * 点击消息：若有 path 则跳转并标记已读，否则仅标记已读
   */
  const handleItemClick = (item: MessageVO) => {
    if (item.messageId) {
      messageStore.markRead(item.messageId)
    }
    if (item.path) {
      emit('update:value', false)
      router.push(item.path)
    }
  }

  /**
   * 全部已读：清空当前 Tab 分组
   */
  const handleReadAll = () => {
    const groupRef = [noticeList, systemList, workflowList][barActiveIndex.value]
    groupRef.value.forEach((m) => m.messageId && messageStore.markRead(m.messageId))
  }

  /**
   * 查看全部：跳转消息中心
   */
  const handleViewAll = () => {
    emit('update:value', false)
    router.push('/system/message')
  }

  // 面板打开动画
  const showNotice = (open: boolean) => {
    if (open) {
      visible.value = true
      // 打开时刷新一次消息盒子
      messageStore.fetchBox()
      setTimeout(() => {
        show.value = true
      }, 5)
    } else {
      show.value = false
      setTimeout(() => {
        visible.value = false
      }, 350)
    }
  }

  watch(
    () => props.value,
    (newValue) => {
      showNotice(newValue)
    }
  )
</script>

<style scoped>
  @reference '@styles/core/tailwind.css';

  .xuya-notification-panel {
    @apply absolute
    top-14.5
    right-5
    w-90
    h-125
    overflow-hidden
    transition-all
    duration-300
    origin-top
    will-change-[top,left]
    max-[640px]:top-[65px]
    max-[640px]:right-0
    max-[640px]:w-full
    max-[640px]:h-[80vh];
  }

  .bar-active {
    color: var(--theme-color) !important;
    border-bottom: 2px solid var(--theme-color);
  }

  .scrollbar-thin::-webkit-scrollbar {
    width: 5px !important;
  }

  .dark .scrollbar-thin::-webkit-scrollbar-track {
    background-color: var(--default-box-color);
  }

  .dark .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: #222 !important;
  }
</style>
