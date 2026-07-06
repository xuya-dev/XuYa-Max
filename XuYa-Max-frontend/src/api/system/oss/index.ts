import request, { downloadGet } from '@/utils/http';
import type { OssQuery, OssUploadVO, OssVO } from './types';

// 查询OSS对象存储列表
export function listOss(query: OssQuery): Promise<PageResult<OssVO>> {
  return request({
    url: '/resource/oss/list',
    method: 'get',
    params: query
  });
}

// 查询OSS对象基于id串
export function listByIds(ossId: string | number): Promise<OssVO[]> {
  return request({
    url: '/resource/oss/listByIds/' + ossId,
    method: 'get'
  });
}

// 上传OSS对象存储
export function uploadOss(data: FormData): Promise<OssUploadVO> {
  return request({
    url: '/resource/oss/upload',
    method: 'post',
    data
  });
}

// 删除OSS对象存储
export function delOss(ossId: string | number | Array<string | number>) {
  return request({
    url: '/resource/oss/' + ossId,
    method: 'delete'
  });
}

/**
 * 下载 OSS 对象
 * 后端 GET /resource/oss/download/{ossId}（注意是 GET，需用 downloadGet）
 * @param ossId 对象 ID
 * @param fileName 保存的文件名
 */
export function downloadOss(ossId: string | number, fileName: string) {
  return downloadGet('/resource/oss/download/' + ossId, fileName);
}

