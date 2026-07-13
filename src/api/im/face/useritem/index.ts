import { http } from '@/http/http'

/** 个人表情 */
export interface ImFaceUserItemVO {
  id: number
  url: string
  name?: string
  width: number
  height: number
}

/** 添加个人表情 */
export interface ImFaceUserItemSaveReq {
  url: string
  name?: string
  width: number
  height: number
}

/** 获取我的个人表情列表 */
export function getFaceUserItemList() {
  return http.get<ImFaceUserItemVO[]>('/im/face-user-item/list')
}

/** 添加个人表情 */
export function createFaceUserItem(data: ImFaceUserItemSaveReq) {
  return http.post<number>('/im/face-user-item/create', data)
}

/** 删除个人表情 */
export function deleteFaceUserItem(id: number) {
  return http.delete<boolean>('/im/face-user-item/delete', undefined, { id })
}
