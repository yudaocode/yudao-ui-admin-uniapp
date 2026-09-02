import type { PageParam, PageResult } from '@/http/types'
import type { KnowledgeInteractionItem } from '../types'
import { http } from '@/http/http'

/** 关注知识对象 */
export function createKnowledgeFavorite(data: { type: number, entityId: number }) {
  return http.post<boolean>('/pms/kb/favorite/create', data)
}

/** 取消关注知识对象 */
export function deleteKnowledgeFavorite(type: number, entityId: number) {
  return http.delete<boolean>('/pms/kb/favorite/delete', undefined, { type, entityId })
}

/** 查询关注列表分页 */
export function getKnowledgeFavoritePage(params: PageParam & Record<string, any>) {
  return http.get<PageResult<KnowledgeInteractionItem>>('/pms/kb/favorite/page', params)
}

/** 查询指定知识库内的关注内容 */
export function getKnowledgeFavoriteList(libraryId: number) {
  return http.get<KnowledgeInteractionItem[]>('/pms/kb/favorite/list', { libraryId })
}

export type { KnowledgeInteractionItem } from '../types'
