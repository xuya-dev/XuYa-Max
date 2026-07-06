import request from '@/utils/http';
import type { CacheVO } from './types';

// 查询缓存详细
export function getCache(): Promise<CacheVO> {
  return request({
    url: '/monitor/cache',
    method: 'get'
  });
}

