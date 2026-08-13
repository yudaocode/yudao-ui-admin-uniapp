import { http } from '@/http/http'

/** FMS 常用摘要 */
export interface Digest {
  id?: number
  accountSetId: number // 账套编号
  content: string // 摘要内容
  createTime?: string // 创建时间
}

/** 查询常用摘要列表 */
export function getDigestList(accountSetId: number) {
  return http.get<Digest[]>('/fms/config/digest/list', { accountSetId })
}

/** 查询常用摘要精简列表 */
export function getDigestSimpleList(accountSetId: number) {
  return http.get<Digest[]>('/fms/config/digest/simple-list', { accountSetId })
}

/** 新增常用摘要 */
export function createDigest(data: Digest) {
  return http.post<number>('/fms/config/digest/create', data)
}

/** 修改常用摘要 */
export function updateDigest(data: Digest) {
  return http.put<boolean>('/fms/config/digest/update', data)
}

/** 删除常用摘要 */
export function deleteDigest(accountSetId: number, id: number) {
  return http.delete<boolean>('/fms/config/digest/delete', { accountSetId, id })
}
