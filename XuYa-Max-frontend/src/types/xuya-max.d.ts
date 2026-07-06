/**
 * XuYa 公共全局类型定义
 *
 * 对应 plus-ui 中通过 auto-import 暴露的全局类型（PageQuery / BaseEntity / ElTagType 等）。
 * 在 .vue / .ts 文件中无需 import 即可直接使用（d.ts 全局声明）。
 */

/** 分页查询参数（XuYa-Max PageQuery） */
declare interface PageQuery {
  /** 当前页码 */
  pageNum: number
  /** 每页条数 */
  pageSize: number
  /** 排序列 */
  orderByColumn?: string
  /** 排序方向 asc / desc */
  isAsc?: string
}

/** 分页响应结果（XuYa-Max PageResult） */
declare interface PageResult<T = any> {
  total: number
  rows: T[]
}

/** 基础实体（XuYa-Max BaseEntity） */
declare interface BaseEntity {
  /** 搜索参数（如日期范围 beginTime/endTime） */
  params?: { [key: string]: any }
  /** 创建者 */
  createBy?: string | number
  /** 创建时间 */
  createTime?: string
  /** 更新者 */
  updateBy?: string | number
  /** 更新时间 */
  updateTime?: string
  /** 备注 */
  remark?: string
}

/** Element Plus 标签类型 */
declare type ElTagType = '' | 'success' | 'warning' | 'info' | 'danger' | 'primary'
