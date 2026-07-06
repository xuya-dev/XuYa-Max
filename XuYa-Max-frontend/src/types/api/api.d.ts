/**
 * API 接口类型定义模块
 *
 * 提供所有后端接口的类型定义
 *
 * ## 主要功能
 *
 * - 通用类型（分页参数、响应结构等）
 * - 认证类型（登录、用户信息等）
 * - 系统管理类型（用户、角色等）
 * - 全局命名空间声明
 *
 * ## 使用场景
 *
 * - API 请求参数类型约束
 * - API 响应数据类型定义
 * - 接口文档类型同步
 *
 * ## 注意事项
 *
 * - 在 .vue 文件使用需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 * - 使用全局命名空间，无需导入即可使用
 *
 * ## 使用方式
 *
 * ```typescript
 * const params: Api.Auth.LoginParams = { userName: 'admin', password: '123456' }
 * const response: Api.Auth.UserInfo = await fetchUserInfo()
 * ```
 *
 * @module types/api/api
 * @author XuYa-Max Team
 */

declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /**
     * 分页参数（useTable 内部分页状态字段）
     * 注意：这是 useTable 的内部状态命名（current/size），
     * 实际发送给后端的请求参数名由 tableConfig.paginationKey 决定（XuYa 为 pageNum/pageSize）。
     */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<PaginationParams, 'current' | 'size'>

    /** 分页响应基础结构（XuYa-Max PageResult：rows / total） */
    interface PaginatedResponse<T = any> {
      rows: T[]
      total: number
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数（对接 XuYa-Max POST /auth/login） */
    interface LoginParams {
      /** 用户名 */
      username: string
      /** 密码 */
      password: string
      /** 验证码 */
      code?: string
      /** 验证码唯一标识（来自 /auth/code） */
      uuid?: string
      /** 客户端 id（默认取 VITE_APP_CLIENT_ID） */
      clientId?: string
      /** 授权类型，密码登录为 password */
      grantType?: string
      /** 记住我 */
      rememberMe?: boolean
    }

    /** 登录响应（XuYa LoginVo，字段为下划线命名） */
    interface LoginResponse {
      /** 访问令牌 */
      access_token: string
      /** 过期时间（秒） */
      expire_in?: number
      /** 客户端 id */
      client_id?: string
    }

    /** 验证码响应（GET /auth/code） */
    interface CaptchaResult {
      /** 是否启用验证码 */
      captchaEnabled: boolean
      /** 验证码唯一标识 */
      uuid?: string
      /** 验证码图片（base64，不含 data: 前缀） */
      img?: string
    }

    /** 用户信息（由后端 { user, permissions, roles } 映射而来） */
    interface UserInfo {
      /** 按钮权限标识集合（对应后端 permissions） */
      buttons: string[]
      /** 角色编码集合（对应后端 roles） */
      roles: string[]
      userId: number
      userName: string
      nickName?: string
      email?: string
      phonenumber?: string
      avatar?: string
      deptId?: number
      deptName?: string
    }
  }

  /** 系统管理类型 */
  namespace SystemManage {
    /** 用户列表 */
    type UserList = Api.Common.PaginatedResponse<UserListItem>

    /** 用户列表项 */
    interface UserListItem {
      id: number
      avatar: string
      status: string
      userName: string
      userGender: string
      nickName: string
      userPhone: string
      userEmail: string
      userRoles: string[]
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
    }

    /** 用户搜索参数 */
    type UserSearchParams = Partial<
      Pick<UserListItem, 'id' | 'userName' | 'userGender' | 'userPhone' | 'userEmail' | 'status'> &
        Api.Common.CommonSearchParams
    >

    /** 角色列表 */
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    /** 角色列表项 */
    interface RoleListItem {
      roleId: number
      roleName: string
      roleCode: string
      description: string
      enabled: boolean
      createTime: string
    }

    /** 角色搜索参数 */
    type RoleSearchParams = Partial<
      Pick<RoleListItem, 'roleId' | 'roleName' | 'roleCode' | 'description' | 'enabled'> &
        Api.Common.CommonSearchParams & {
          startTime: string | null
          endTime: string | null
        }
    >
  }
}
