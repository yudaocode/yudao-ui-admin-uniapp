import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 字典类型 */
export interface DictType {
  id?: number
  name: string
  type: string
  status: number
  remark?: string
  createTime?: Date
}

/** 查询字典类型（精简）列表 */
export function getSimpleDictTypeList() {
  return http.get<DictType[]>('/system/dict-type/list-all-simple')
}

/** 查询字典类型分页列表 */
export function getDictTypePage(params: PageParam) {
  return http.get<PageResult<DictType>>('/system/dict-type/page', params)
}

/** 查询字典类型详情 */
export function getDictType(id: number) {
  return http.get<DictType>(`/system/dict-type/get?id=${id}`)
}

/** 新增字典类型 */
export function createDictType(data: DictType) {
  return http.post<number>('/system/dict-type/create', data)
}

/** 修改字典类型 */
export function updateDictType(data: DictType) {
  return http.put<boolean>('/system/dict-type/update', data)
}

/** 删除字典类型 */
export function deleteDictType(id: number) {
  return http.delete<boolean>(`/system/dict-type/delete?id=${id}`)
}
