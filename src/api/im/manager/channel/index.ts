import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IM 管理端频道 */
export interface ImManagerChannelVO {
  id: number
  code: string
  name: string
  avatar?: string
  sort: number
  status: number
  createTime?: string
}

/** 获取频道分页 */
export function getManagerChannelPage(params: PageParam) {
  return http.get<PageResult<ImManagerChannelVO>>('/im/manager/channel/page', params)
}

/** 获取频道详情 */
export function getManagerChannel(id: number) {
  return http.get<ImManagerChannelVO>('/im/manager/channel/get', { id })
}

/** 新增频道 */
export function createManagerChannel(data: ImManagerChannelVO) {
  return http.post<number>('/im/manager/channel/create', data)
}

/** 修改频道 */
export function updateManagerChannel(data: ImManagerChannelVO) {
  return http.put<boolean>('/im/manager/channel/update', data)
}

/** 删除频道 */
export function deleteManagerChannel(id: number) {
  return http.delete<boolean>('/im/manager/channel/delete', undefined, { id })
}

/** 获取启用的频道精简列表 */
export function getSimpleChannelList() {
  return http.get<ImManagerChannelVO[]>('/im/manager/channel/simple-list')
}
