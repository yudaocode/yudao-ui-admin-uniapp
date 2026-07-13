import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IM 管理端敏感词 */
export interface ImManagerSensitiveWordVO {
  id?: number
  word: string
  status: number
  creator?: string
  creatorName?: string
  createTime?: string
}

/** 获取敏感词分页 */
export function getManagerSensitiveWordPage(params: PageParam) {
  return http.get<PageResult<ImManagerSensitiveWordVO>>('/im/manager/sensitive-word/page', params)
}

/** 获取敏感词详情 */
export function getManagerSensitiveWord(id: number) {
  return http.get<ImManagerSensitiveWordVO>('/im/manager/sensitive-word/get', { id })
}

/** 新增敏感词 */
export function createManagerSensitiveWord(data: ImManagerSensitiveWordVO) {
  return http.post<number>('/im/manager/sensitive-word/create', data)
}

/** 修改敏感词 */
export function updateManagerSensitiveWord(data: ImManagerSensitiveWordVO) {
  return http.put<boolean>('/im/manager/sensitive-word/update', data)
}

/** 删除敏感词 */
export function deleteManagerSensitiveWord(id: number) {
  return http.delete<boolean>('/im/manager/sensitive-word/delete', undefined, { id })
}

/** 批量删除敏感词 */
export function deleteManagerSensitiveWordList(ids: number[]) {
  return http.delete<boolean>('/im/manager/sensitive-word/delete-list', undefined, { ids: ids.join(',') })
}
