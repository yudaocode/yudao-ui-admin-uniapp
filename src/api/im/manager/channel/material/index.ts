import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IM 管理端频道素材 */
export interface ImManagerChannelMaterialVO {
  id: number
  channelId: number
  channelName?: string
  type: number
  title: string
  coverUrl?: string
  summary?: string
  content?: string
  url?: string
  createTime?: string
}

/** 获取素材分页 */
export function getManagerChannelMaterialPage(params: PageParam) {
  return http.get<PageResult<ImManagerChannelMaterialVO>>('/im/manager/channel-material/page', params)
}

/** 获取指定频道下的素材精简列表 */
export function getSimpleManagerChannelMaterialList(channelId: number) {
  return http.get<ImManagerChannelMaterialVO[]>('/im/manager/channel-material/simple-list', { channelId })
}

/** 获取素材详情 */
export function getManagerChannelMaterial(id: number) {
  return http.get<ImManagerChannelMaterialVO>('/im/manager/channel-material/get', { id })
}

/** 新增素材 */
export function createManagerChannelMaterial(data: ImManagerChannelMaterialVO) {
  return http.post<number>('/im/manager/channel-material/create', data)
}

/** 修改素材 */
export function updateManagerChannelMaterial(data: ImManagerChannelMaterialVO) {
  return http.put<boolean>('/im/manager/channel-material/update', data)
}

/** 删除素材 */
export function deleteManagerChannelMaterial(id: number) {
  return http.delete<boolean>('/im/manager/channel-material/delete', undefined, { id })
}
