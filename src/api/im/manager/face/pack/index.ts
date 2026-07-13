import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IM 管理端表情包 */
export interface ImManagerFacePackVO {
  id?: number
  name: string
  icon?: string
  sort: number
  status: number
  createTime?: string
}

/** 获取表情包分页 */
export function getManagerFacePackPage(params: PageParam) {
  return http.get<PageResult<ImManagerFacePackVO>>('/im/manager/face-pack/page', params)
}

/** 获取表情包详情 */
export function getManagerFacePack(id: number) {
  return http.get<ImManagerFacePackVO>('/im/manager/face-pack/get', { id })
}

/** 新增表情包 */
export function createManagerFacePack(data: ImManagerFacePackVO) {
  return http.post<number>('/im/manager/face-pack/create', data)
}

/** 修改表情包 */
export function updateManagerFacePack(data: ImManagerFacePackVO) {
  return http.put<boolean>('/im/manager/face-pack/update', data)
}

/** 删除表情包 */
export function deleteManagerFacePack(id: number) {
  return http.delete<boolean>('/im/manager/face-pack/delete', undefined, { id })
}

/** 批量删除表情包 */
export function deleteManagerFacePackList(ids: number[]) {
  return http.delete<boolean>('/im/manager/face-pack/delete-list', undefined, { ids: ids.join(',') })
}
