import type { RoleVO } from '@/api/system/role/types';
import request, { download } from '@/utils/http';
import { parseStrEmpty } from '@/utils/xuya-max';
import type { DeptTreeVO } from './../dept/types';
import type { UserForm, UserInfoVO, UserProfileForm, UserQuery, UserVO } from './types';

/**
 * 查询用户列表
 * @param query
 */
export const listUser = (query: UserQuery): Promise<PageResult<UserVO>> => {
  return request({
    url: '/system/user/list',
    method: 'get',
    params: query
  });
};

/**
 * 通过用户ids查询用户
 * @param userIds
 */
export const optionSelect = (userIds: (number | string)[]): Promise<UserVO[]> => {
  return request({
    url: '/system/user/optionselect?userIds=' + userIds,
    method: 'get'
  });
};

/**
 * 获取用户详情
 * @param userId
 */
export const getUser = (userId?: string | number): Promise<UserInfoVO> => {
  return request({
    url: '/system/user/' + parseStrEmpty(userId),
    method: 'get'
  });
};

/**
 * 新增用户
 */
export const addUser = (data: UserForm) => {
  return request({
    url: '/system/user',
    method: 'post',
    data: data
  });
};

/**
 * 修改用户
 */
export const updateUser = (data: UserForm) => {
  return request({
    url: '/system/user',
    method: 'put',
    data: data
  });
};

/**
 * 删除用户
 * @param userId 用户ID
 */
export const delUser = (userId: Array<string | number> | string | number) => {
  return request({
    url: '/system/user/' + userId,
    method: 'delete'
  });
};

/**
 * 用户密码重置
 * @param userId 用户ID
 * @param password 密码
 */
export const resetUserPwd = (userId: string | number, password: string) => {
  const data = {
    userId,
    password
  };
  return request({
    url: '/system/user/resetPwd',
    method: 'put',
    headers: {
      isEncrypt: 'true',
      repeatSubmit: false
    },
    data: data
  });
};

/**
 * 用户状态修改
 * @param userId 用户ID
 * @param status 用户状态
 */
export const changeUserStatus = (userId: number | string, status: string) => {
  const data = {
    userId,
    status
  };
  return request({
    url: '/system/user/changeStatus',
    method: 'put',
    data: data
  });
};

/**
 * 解锁用户
 * @param userId 用户ID
 */
export const unlockUser = (userId: number | string) => {
  return request({
    url: '/system/user/unlock/' + userId,
    method: 'get'
  });
};

/**
 * 查询用户个人信息
 */
export const getUserProfile = (): Promise<UserInfoVO> => {
  return request({
    url: '/system/user/profile',
    method: 'get'
  });
};

/**
 * 修改用户个人信息
 * @param data 用户信息
 */
export const updateUserProfile = (data: UserProfileForm) => {
  return request({
    url: '/system/user/profile',
    method: 'put',
    data: data
  });
};

/**
 * 用户密码重置
 * @param oldPassword 旧密码
 * @param newPassword 新密码
 */
export const updateUserPwd = (oldPassword: string, newPassword: string) => {
  const data = {
    oldPassword,
    newPassword
  };
  return request({
    url: '/system/user/profile/updatePwd',
    method: 'put',
    headers: {
      isEncrypt: 'true',
      repeatSubmit: false
    },
    data: data
  });
};

/**
 * 查询授权角色
 * @param userId 用户ID
 */
export const getAuthRole = (userId: string | number): Promise<{ user: UserVO; roles: RoleVO[] }> => {
  return request({
    url: '/system/user/authRole/' + userId,
    method: 'get'
  });
};

/**
 * 保存授权角色
 * @param data 用户ID
 */
export const updateAuthRole = (data: { userId: string; roleIds: string }) => {
  return request({
    url: '/system/user/authRole',
    method: 'put',
    params: data
  });
};

/**
 * 查询当前部门的所有用户信息
 * @param deptId
 */
export const listUserByDeptId = (deptId: string | number): Promise<UserVO[]> => {
  return request({
    url: '/system/user/list/dept/' + deptId,
    method: 'get'
  });
};

/**
 * 查询部门下拉树结构
 */
export const deptTreeSelect = (): Promise<DeptTreeVO[]> => {
  return request({
    url: '/system/user/deptTree',
    method: 'get'
  });
};

/**
 * 用户导入接口地址（POST multipart/form-data）
 * el-upload 直传，不经过 axios 拦截器，故返回完整 URL 由组件使用
 */
export const userImportUrl = `${import.meta.env.VITE_API_URL}/system/user/importData`;

/**
 * 下载用户导入模板
 */
export const downloadUserImportTemplate = () => {
  return download('/system/user/importTemplate', {}, `user_template_${new Date().getTime()}.xlsx`);
};

export default {
  listUser,
  getUser,
  optionSelect,
  addUser,
  updateUser,
  delUser,
  resetUserPwd,
  changeUserStatus,
  unlockUser,
  getUserProfile,
  updateUserProfile,
  updateUserPwd,
  getAuthRole,
  updateAuthRole,
  deptTreeSelect,
  listUserByDeptId
};
