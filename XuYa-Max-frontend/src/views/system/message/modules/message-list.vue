<!--
  消息列表（消息中心的列表项组件）
-->
<template>
  <div class="message-list">
    <ElEmpty v-if="!list.length" description="暂无消息" />
    <ul v-else class="list-none p-0 m-0">
      <li
        v-for="item in list"
        :key="item.messageId"
        class="flex-c px-3 py-3 border-b last:border-b-0 hover:bg-g-200/50 cursor-pointer transition-colors"
        @click="emit('view', item)"
      >
        <div class="size-9 leading-9 text-center rounded-lg flex-cc bg-theme/12 text-theme flex-shrink-0">
          <XuyaSvgIcon class="text-lg !bg-transparent" icon="ri:notification-3-line" />
        </div>
        <div class="flex-1 min-w-0 ml-3">
          <h4 class="text-sm font-normal text-g-900 truncate">{{ item.title }}</h4>
          <p class="mt-1 text-xs text-g-500 truncate">{{ item.message }}</p>
        </div>
        <div class="flex-c gap-2 flex-shrink-0">
          <span class="text-xs text-g-400">{{ item.createTime || '' }}</span>
          <ElButton text type="primary" size="small" @click.stop="emit('read', item)">已读</ElButton>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
  import XuyaSvgIcon from '@/components/core/base/xuya-svg-icon/index.vue'
  import type { MessageVO } from '@/api/system/message/types'

  defineOptions({ name: 'MessageList' })

  defineProps<{
    list: MessageVO[]
  }>()

  const emit = defineEmits<{
    view: [msg: MessageVO]
    read: [msg: MessageVO]
  }>()
</script>
