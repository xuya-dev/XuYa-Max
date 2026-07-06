/**
 * 消息弹窗统一封装（移植自 plus-ui/src/plugins/modal）
 *
 * 对 Element Plus 的 ElMessage / ElMessageBox / ElNotification / ElLoading 做薄封装，
 * 便于业务代码统一调用（如上传组件、表单提交提示）。
 *
 * @module plugins/modal
 */
import { ElMessage, ElMessageBox, ElNotification, ElLoading } from 'element-plus'

let loadingInstance: { close: () => void } | undefined

export default {
  /** 消息提示 */
  msg(message: string) {
    ElMessage({ message })
  },
  /** 错误消息 */
  msgError(message: string) {
    ElMessage({ message, type: 'error' })
  },
  /** 成功消息 */
  msgSuccess(message: string) {
    ElMessage({ message, type: 'success' })
  },
  /** 警告消息 */
  msgWarning(message: string) {
    ElMessage({ message, type: 'warning' })
  },
  /** 通知 */
  notify(message: string) {
    ElNotification({ message })
  },
  /** 错误通知 */
  notifyError(message: string) {
    ElNotification.error({ message })
  },
  /** 确认框（返回 Promise<boolean>，点击确认 resolve true） */
  confirm(message: string, title = '系统提示'): Promise<boolean> {
    return ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => true)
      .catch(() => false)
  },
  /** 删除确认 */
  delConfirm(message = '是否确认删除?', title = '系统提示'): Promise<boolean> {
    return ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => true)
      .catch(() => false)
  },
  /** 提交内容确认 */
  prompt(content: string, title = '系统提示') {
    return ElMessageBox.prompt(content, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  },
  /** 打开 loading */
  loading(message = '加载中...') {
    loadingInstance = ElLoading.service({
      text: message,
      background: 'rgba(0, 0, 0, 0.7)'
    })
  },
  /** 关闭 loading */
  closeLoading() {
    loadingInstance?.close()
  }
}
