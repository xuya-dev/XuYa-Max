import request, { download } from '@/utils/http';
import type { DictDataForm, DictDataQuery, DictDataVO } from './types';
// 根据字典类型查询字典数据信息
export function getDicts(dictType: string): Promise<DictDataVO[]> {
  return request({
    url: '/system/dict/data/type/' + dictType,
    method: 'get'
  });
}

// 查询字典数据列表
export function listData(query: DictDataQuery): Promise<PageResult<DictDataVO>> {
  return request({
    url: '/system/dict/data/list',
    method: 'get',
    params: query
  });
}

// 查询字典数据详细
export function getData(dictCode: string | number): Promise<DictDataVO> {
  return request({
    url: '/system/dict/data/' + dictCode,
    method: 'get'
  });
}

// 新增字典数据
export function addData(data: DictDataForm) {
  return request({
    url: '/system/dict/data',
    method: 'post',
    data: data
  });
}

// 修改字典数据
export function updateData(data: DictDataForm) {
  return request({
    url: '/system/dict/data',
    method: 'put',
    data: data
  });
}

// 删除字典数据
export function delData(dictCode: string | number | Array<string | number>) {
  return request({
    url: '/system/dict/data/' + dictCode,
    method: 'delete'
  });
}

// 导出字典数据（后端 POST /system/dict/data/export）
export function exportData(query: DictDataQuery) {
  return download('/system/dict/data/export', query, `dict_data_${new Date().getTime()}.xlsx`);
}
