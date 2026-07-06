<!--
  消息中心（对接 XuYa-Max SysMessageController / SysMessageBoxVo）
  - 三类消息：系统消息 / 通知公告 / 工作流（Tab 切换）
  - 数据来源：messageStore（getMessageBox 拉取 + SSE 实时推送）
  - 点击消息：若有 path 则跳转对应页面，并标记已读（从列表移除）
-->
<template>
  <div class="message-page xuya-full-height flex flex-col overflow-hidden p-4">
    <ElCard class="xuya-table-card">
      <ElTabs v-model="activeTab">
        <ElTabPane :label="`系统消息 (${messageStore.systemList.length})`" name="system">
          <MessageList :list="messageStore.systemList" @view="handleView" @read="handleRead" />
        </ElTabPane>
        <ElTabPane :label="`通知公告 (${messageStore.noticeList.length})`" name="notice">
          <MessageList :list="messageStore.noticeList" @view="handleView" @read="handleRead" />
        </ElTabPane>
        <ElTabPane :label="`工作流 (${messageStore.workflowList.length})`" name="workflow">
          <MessageList :list="messageStore.workflowList" @view="handleView" @read="handleRead" />
        </ElTabPane>
      </ElTabs>
      <template #header>
        <div class="flex-cb">
          <span class="font-medium">消息中心</span>
          <ElButton text type="primary" :icon="Refresh" @click="handleRefresh">刷新</ElButton>
        </div>
      </template>
    </ElCard>

    <!-- 消息详情弹窗 -->
    <ElDialog v-model="detailVisible" :title="detail?.title || '消息详情'" width="600px" append-to-body>
      <div v-if="detail" class="space-y-3">
        <div class="flex-cb text-sm">
          <span class="text-g-500">来源：{{ detail.source || '-' }}</span>
          <span class="text-g-500">{{ detail.createTime || '-' }}</span>
        </div>
        <ElDivider class="!my-2" />
        <div class="text-sm leading-relaxed whitespace-pre-wrap">{{ detail.content || detail.message || '无详细内容' }}</div>
      </div>
      <template #footer>
        <ElButton @click="detailVisible = false">关闭</ElButton>
        <ElButton v-if="detail?.path" type="primary" @click="goPath(detail.path)">前往查看</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { Refresh } from '@element-plus/icons-vue'
  import { useMessageStore } from '@/store/modules/message'
  import type { MessageVO } from '@/api/system/message/types'
  import MessageList from './modules/message-list.vue'

  defineOptions({ name: 'Message' })

  const router = useRouter()
  const messageStore = useMessageStore()
  const activeTab = ref('system')
  const detailVisible = ref(false)
  const detail = ref<MessageVO | null>(null)

  /** 查看消息详情 */
  const handleView = (msg: MessageVO) => {
    detail.value = msg
    detailVisible.value = true
  }

  /** 标记已读（从列表移除） */
  const handleRead = (msg: MessageVO) => {
    if (!msg.messageId) return
    messageStore.markRead(msg.messageId)
    ElMessage.success('已标记为已读')
  }

  /** 跳转到消息携带的路径，跳转同时标记已读 */
  const goPath = (path: string) => {
    detailVisible.value = false
    if (path) router.push(path)
    // 与右上角通知面板行为一致：点开即视为已读
    if (detail.value?.messageId) {
      messageStore.markRead(detail.value.messageId)
    }
  }

  /** 刷新消息盒子 */
  const handleRefresh = async () => {
    await messageStore.fetchBox()
    ElMessage.success('刷新成功')
  }
</script>
