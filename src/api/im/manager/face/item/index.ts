import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IM 管理端表情 */
export interface ImManagerFacePackItemVO {
  id?: number
  packId: number
  url: string
  name?: string
  width: number
  height: number
  sort: number
  status: number
  createTime?: string
}

/** 获取表情分页 */
export function getManagerFacePackItemPage(params: PageParam) {
  return http.get<PageResult<ImManagerFacePackItemVO>>('/im/manager/face-pack-item/page', params)
}

/** 获取表情详情 */
export function getManagerFacePackItem(id: number) {
  return http.get<ImManagerFacePackItemVO>('/im/manager/face-pack-item/get', { id })
}

/** 新增表情 */
export function createManagerFacePackItem(data: ImManagerFacePackItemVO) {
  return http.post<number>('/im/manager/face-pack-item/create', data)
}

/** 修改表情 */
export function updateManagerFacePackItem(data: ImManagerFacePackItemVO) {
  return http.put<boolean>('/im/manager/face-pack-item/update', data)
}

/** 删除表情 */
export function deleteManagerFacePackItem(id: number) {
  return http.delete<boolean>('/im/manager/face-pack-item/delete', undefined, { id })
}

/** 批量删除表情 */
export function deleteManagerFacePackItemList(ids: number[]) {
  return http.delete<boolean>('/im/manager/face-pack-item/delete-list', undefined, { ids: ids.join(',') })
}
