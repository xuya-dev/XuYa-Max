import request from '@/utils/http';
import type { OperLogQuery, OperLogVO } from './types';

// 查询操作日志列表
export function list(query: OperLogQuery): Promise<PageResult<OperLogVO>> {
  return request({
    url: '/monitor/operlog/list',
    method: 'get',
    params: query
  });
}

// 删除操作日志
export function delOperlog(operId: string | number | Array<string | number>) {
  return request({
    url: '/monitor/operlog/' + operId,
    method: 'delete'
  });
}

// 清空操作日志
export function cleanOperlog() {
  return request({
    url: '/monitor/operlog/clean',
    method: 'delete'
  });
}
