/**
 * 消息状态管理模块（对接 XuYa-Max SysMessageController + SSE 实时推送）
 *
 * ## 主要功能
 *
 * - 拉取消息盒子（systemList / noticeList / workflowList）
 * - 建立 / 关闭 SSE 连接，接收后端实时推送（登录公告、系统消息、踢人下线等）
 * - 维护未读消息数（用于 Header 铃铛徽标）
 * - 处理「被踢下线」消息（`kicked`），触发全局登出
 *
 * ## 连接时机
 *
 * - 登录并获取用户信息后：调用 `connect()` 建立 SSE 连接并拉取消息盒子
 * - 登出 / 会话过期：调用 `disconnect()` 关闭连接并清空状态
 *
 * ## 鉴权
 *
 * EventSource 无法自定义请求头，故通过 query 参数携带 Authorization + clientid，
 * Sa-Token 默认从 query/header 读取 token，与 plus-ui 实现一致。
 *
 * @module store/modules/message
 */
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useEventSource } from '@vueuse/core'
import { ElNotification } from 'element-plus'
import { getMessageBox, closeMessage } from '@/api/system/message'
import type { MessageVO } from '@/api/system/message/types'
import { useUserStore } from './user'

/** SSE 推送的「踢人下线」标识 */
const KICKED_MESSAGE = 'kicked'

/** 自动重连参数（退避较大，避免 dev proxy 下 SSE 断连风暴打垮后端） */
const AUTO_RECONNECT = {
  retries: 5,
  delay: 10000
}

export const useMessageStore = defineStore('messageStore', () => {
  /** 已读消息 ID 集合（按 userId 持久化到 localStorage，后端无已读状态） */
  const READ_KEY_PREFIX = 'xuya-max-read-msgs:'
  const readIds = ref<Set<string>>(new Set())

  /** 获取当前用户的已读 key */
  const getReadKey = () => {
    const userStore = useUserStore()
    return READ_KEY_PREFIX + (userStore.info?.userId || 'default')
  }
  /** 从 localStorage 加载已读集合 */
  const loadReadIds = () => {
    try {
      const raw = localStorage.getItem(getReadKey())
      readIds.value = new Set(raw ? JSON.parse(raw) : [])
    } catch {
      readIds.value = new Set()
    }
  }
  /** 持久化已读集合 */
  const saveReadIds = () => {
    try {
      localStorage.setItem(getReadKey(), JSON.stringify([...readIds.value]))
    } catch {
      // 忽略存储异常
    }
  }

  /** 系统消息列表 */
  const systemList = ref<MessageVO[]>([])
  /** 通知公告列表 */
  const noticeList = ref<MessageVO[]>([])
  /** 工作流消息列表（后端工作流已砍，保留兼容） */
  const workflowList = ref<MessageVO[]>([])

  /** SSE 连接状态 */
  const connected = ref(false)
  /**
   * SSE 永久断连标记（autoReconnect 重试耗尽后置 true）。
   * Header 可据此提示用户「实时消息已断开，刷新页面可重连」。
   */
  const connectionFailed = ref(false)
  /** SSE 已重连次数（超过 AUTO_RECONNECT.retries 即判定为永久断连） */
  let reconnectCount = 0

  /** SSE 实例控制句柄（连接后赋值，断开时调用 close） */
  let sseClose: (() => void) | undefined
  /** SSE data 监听停止函数 */
  let stopDataWatch: (() => void) | undefined
  /** SSE error 监听停止函数 */
  let stopErrorWatch: (() => void) | undefined

  /** 未读总数（系统 + 通知） */
  const unreadTotal = computed(() => systemList.value.length + noticeList.value.length)

  /** 全部消息（按时间倒序，用于消息中心列表） */
  const allMessages = computed(() => {
    return [...systemList.value, ...noticeList.value, ...workflowList.value].sort((a, b) => {
      const ta = a.createTime ? new Date(a.createTime).getTime() : 0
      const tb = b.createTime ? new Date(b.createTime).getTime() : 0
      return tb - ta
    })
  })

  /**
   * 拉取消息盒子，覆盖本地三类消息（过滤已读消息）
   * 后端消息盒子无已读状态，每次返回全部消息，需前端按 localStorage 持久化的已读 ID 过滤。
   */
  const fetchBox = async () => {
    try {
      loadReadIds()
      const res: any = await getMessageBox()
      const box = res?.data || res
      const filterRead = (list: MessageVO[]) =>
        (list || []).filter((m) => m.messageId && !readIds.value.has(String(m.messageId)))
      systemList.value = filterRead(box?.systemList)
      noticeList.value = filterRead(box?.noticeList)
      workflowList.value = filterRead(box?.workflowList)
    } catch (e) {
      console.error('[MessageStore] 拉取消息盒子失败:', e)
    }
  }

  /**
   * 根据消息类型/来源推断分类（与后端 SysMessageServiceImpl.resolveCategory 规则保持一致）
   * - type=notice 或 source=notice → notice（通知公告）
   * - source=workflow → workflow（工作流）
   * - 其余 → system（系统消息）
   *
   * SSE 实时推送的 PushPayloadDTO 不携带 category 字段（分类只在后端存库时计算），
   * 因此前端必须自行推断，否则公告会被错误地归到「系统消息」分组。
   */
  const resolveCategory = (msg: MessageVO): string => {
    if (msg.category) return msg.category
    if (msg.type === 'notice' || msg.source === 'notice') return 'notice'
    if (msg.source === 'workflow') return 'workflow'
    return 'system'
  }

  /**
   * 根据分类自动生成标题（与后端 SysMessageServiceImpl.resolveTitle 规则保持一致）
   * SSE 推送的 PushPayloadDTO 不携带 title 字段，需前端补全。
   */
  const resolveTitle = (msg: MessageVO): string => {
    if (msg.title) return msg.title
    switch (resolveCategory(msg)) {
      case 'notice':
        return '通知公告消息'
      case 'workflow':
        return '工作流消息'
      default:
        return '系统消息'
    }
  }

  /**
   * 处理 SSE 推送的单条消息
   * - `kicked`：被踢下线，触发登出
   * - 其余：解析为消息，补全 category/title/content/createTime 后追加到对应分组并弹通知
   *
   * SSE 实时推送的 PushPayloadDTO 与数据库 SysMessageVo 字段不对齐：
   * - 缺 category / title（已在下方补全）
   * - 公告正文藏在 data.noticeContent（后端 SysNoticeController.add 注入），需提取到 content
   *   否则消息中心详情只能看到摘要 message，看不到正文
   * - 缺 createTime（仅有 timestamp 毫秒数），不补全会导致列表时间列空白、且按时间排序异常
   */
  const handlePush = (raw: string) => {
    if (raw === KICKED_MESSAGE) {
      disconnect()
      const userStore = useUserStore()
      userStore.logOut()
      return
    }
    let payload: any
    try {
      payload = JSON.parse(raw)
    } catch {
      payload = { message: raw, type: 'message', source: 'backend' }
    }
    // 补全分类与标题
    payload.category = resolveCategory(payload)
    if (!payload.title) payload.title = resolveTitle(payload)
    // 提取公告正文：后端把 noticeContent 放在 data 里推送
    if (!payload.content && payload.data?.noticeContent) {
      payload.content = payload.data.noticeContent
    }
    // 补全创建时间：把 timestamp 毫秒数格式化为字符串，保证列表展示和按时间排序正确
    if (!payload.createTime && payload.timestamp) {
      payload.createTime = new Date(payload.timestamp).toISOString()
    }
    appendMessage(payload)
    notify(payload)
  }

  /**
   * 将一条消息追加到对应分组（去重 by messageId，跳过已读）
   */
  const appendMessage = (msg: MessageVO) => {
    // 已读过的消息不再显示（如刷新前已标记已读，SSE 推送同一条时跳过）
    if (msg.messageId && readIds.value.has(String(msg.messageId))) {
      return
    }
    const category = resolveCategory(msg)
    const target =
      category === 'notice'
        ? noticeList
        : category === 'workflow'
          ? workflowList
          : systemList
    if (msg.messageId && target.value.some((m) => m.messageId === msg.messageId)) {
      return
    }
    target.value.unshift(msg)
  }

  /**
   * 弹出右下角通知
   */
  const notify = (msg: MessageVO) => {
    ElNotification({
      title: msg.title || '系统消息',
      message: msg.message || '',
      type: 'info',
      duration: 4000
    })
  }

  /** 当前 SSE 连接使用的 token（用于判断 token 是否变化、是否需要重建） */
  let sseToken = ''
  /** 监听 token 变化的停止函数 */
  let stopTokenWatch: (() => void) | undefined

  /**
   * 建立 SSE 连接并拉取消息盒子
   * 应在登录并获取用户信息后调用。
   *
   * token 刷新 / 重新登录后，外部只需更新 userStore.accessToken，
   * 内部 watch 会自动用新 token 重建 SSE（见 connect 末尾），无需手动调 connect。
   */
  const connect = async () => {
    if (import.meta.env.VITE_APP_MESSAGE_ENABLED === 'false') return
    // 已连接则先关闭重建
    if (connected.value) {
      disconnect()
    }
    // 先拉取一次消息盒子
    await fetchBox()

    const { VITE_API_URL, VITE_API_PROXY_URL, VITE_APP_CLIENT_ID, VITE_APP_MESSAGE_PATH } = import.meta.env
    const userStore = useUserStore()
    const token = userStore.accessToken
    if (!token) {
      console.warn('[MessageStore] 无 token，跳过 SSE 连接')
      return
    }
    sseToken = token
    reconnectCount = 0
    connectionFailed.value = false
    const path = VITE_APP_MESSAGE_PATH || '/resource/message'
    // SSE 长连接直连后端，避免 dev proxy（vite http-proxy）对流式响应缓冲导致连接被立即关闭。
    // dev 下用 VITE_API_PROXY_URL（绝对地址，如 http://localhost:8080）；
    // 生产/未配置时回退到 VITE_API_URL（相对地址，由 nginx 代理，nginx 需配 proxy_buffering off）。
    const baseUrl = VITE_API_PROXY_URL || VITE_API_URL
    const url = `${baseUrl}${path}?Authorization=Bearer ${token}&clientid=${VITE_APP_CLIENT_ID}`

    const { data, error, close } = useEventSource(url, [], {
      autoReconnect: {
        retries: AUTO_RECONNECT.retries,
        delay: AUTO_RECONNECT.delay,
        onFailed: () => {
          // 重试耗尽：标记永久断连，让 Header 给用户提示
          connectionFailed.value = true
        }
      }
    })
    sseClose = close
    connected.value = true

    // 监听推送数据
    stopDataWatch = watch(data, (val) => {
      if (!val) return
      // 收到数据说明连接正常，重置重连计数
      reconnectCount = 0
      connectionFailed.value = false
      handlePush(String(val))
      data.value = null
    })
    stopErrorWatch = watch(error, (val) => {
      if (val) {
        reconnectCount++
        // 提前判断：若已达上限，直接标记永久断连（onFailed 兜底）
        if (reconnectCount > AUTO_RECONNECT.retries) {
          connectionFailed.value = true
        }
        console.warn(`[MessageStore] SSE 连接错误 (${reconnectCount}/${AUTO_RECONNECT.retries}):`, val)
        error.value = null
      }
    })

    // 监听 token 变化：token 刷新 / 重新登录后，用新 token 重建 SSE。
    // useEventSource 的 url 在创建时固定，重连时仍带旧 token，鉴权会失败 → 必须手动重建。
    stopTokenWatch?.()
    stopTokenWatch = watch(
      () => userStore.accessToken,
      (newToken) => {
        if (newToken && newToken !== sseToken) {
          console.info('[MessageStore] 检测到 token 变化，重建 SSE 连接')
          connect()
        }
      }
    )
  }

  /**
   * 关闭 SSE 连接并清空状态
   * 应在登出 / 会话过期时调用。
   */
  const disconnect = () => {
    // 通知后端释放 emitter（失败不阻塞）
    closeMessage().catch(() => {})
    stopDataWatch?.()
    stopErrorWatch?.()
    stopTokenWatch?.()
    sseClose?.()
    sseClose = undefined
    stopDataWatch = undefined
    stopErrorWatch = undefined
    stopTokenWatch = undefined
    sseToken = ''
    reconnectCount = 0
    connected.value = false
    connectionFailed.value = false
  }

  /**
   * 清空所有消息（用于登出后）
   */
  const clear = () => {
    systemList.value = []
    noticeList.value = []
    workflowList.value = []
  }

  /**
   * 标记某条消息已读（从列表移除 + 持久化到 localStorage）
   * 后端消息盒子无已读状态，每次刷新都返回全部，靠前端 localStorage 记录已读 ID。
   */
  const markRead = (messageId: number | string) => {
    const id = String(messageId)
    readIds.value.add(id)
    saveReadIds()
    systemList.value = systemList.value.filter((m) => String(m.messageId) !== id)
    noticeList.value = noticeList.value.filter((m) => String(m.messageId) !== id)
    workflowList.value = workflowList.value.filter((m) => String(m.messageId) !== id)
  }

  return {
    systemList,
    noticeList,
    workflowList,
    connected,
    connectionFailed,
    unreadTotal,
    allMessages,
    fetchBox,
    connect,
    disconnect,
    clear,
    markRead
  }
})
