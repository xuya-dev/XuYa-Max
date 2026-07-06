/**
 * 消息相关类型定义（对接 XuYa-Max SysMessageController / SysMessageBoxVo）
 *
 * 消息盒子分三类：systemList（系统消息）、noticeList（通知公告）、workflowList（工作流）。
 */

/** 单条消息视图对象（对应后端 SysMessageVo） */
export interface MessageVO extends BaseEntity {
  /** 消息 ID */
  messageId: number | string;
  /** 消息分组 */
  category: string;
  /** 消息类型 */
  type: string;
  /** 消息来源 */
  source: string;
  /** 标题 */
  title: string;
  /** 摘要消息 */
  message: string;
  /** 详细内容 */
  content?: string;
  /** 扩展数据 */
  data?: Record<string, any> | null;
  /** 前端跳转路径 */
  path?: string;
  /** 创建时间 */
  createTime?: string;
}

/** 消息盒子视图对象（对应后端 SysMessageBoxVo） */
export interface MessageBoxVO {
  /** 系统消息 */
  systemList: MessageVO[];
  /** 通知公告消息 */
  noticeList: MessageVO[];
  /** 工作流消息 */
  workflowList: MessageVO[];
}

/**
 * 消息分组枚举（用于 store / 通知面板分 Tab 展示）
 * 与 SysMessageBoxVo 三个字段一一对应。
 */
export enum MessageCategoryEnum {
  /** 系统消息 */
  SYSTEM = 'system',
  /** 通知公告 */
  NOTICE = 'notice',
  /** 工作流消息（后端工作流已砍掉，保留以兼容结构） */
  WORKFLOW = 'workflow'
}
