import request from '@/utils/http';
import type { MessageBoxVO } from './types';

/**
 * 获取消息盒子数据（系统消息 / 通知公告 / 工作流）
 * 对接后端 GET /resource/message/box -> SysMessageBoxVo
 */
export function getMessageBox(): Promise<MessageBoxVO> {
  return request({
    url: '/resource/message/box',
    method: 'get'
  });
}

/**
 * 关闭当前用户的 SSE 连接
 * 对接后端 GET /resource/message/close
 * 在登出 / 关闭页签时调用，让后端释放 emitter 资源。
 */
export function closeMessage(): Promise<void> {
  return request({
    url: '/resource/message/close',
    method: 'get'
  });
}
