import type { KnowledgeInteractionItem } from '../types'
import { http } from '@/http/http'

/** PMS 知识最近浏览 */
export interface KnowledgeRecentList {
  todayItems: KnowledgeInteractionItem[] // 今天浏览列表
  yesterdayItems: KnowledgeInteractionItem[] // 昨天浏览列表
  recent30DayItems: KnowledgeInteractionItem[] // 更早 30 天浏览列表
}

/** 查询最近浏览列表 */
export function getKnowledgeRecentViewRecordList(libraryId?: number) {
  return http.get<KnowledgeRecentList>('/pms/kb/view-record/recent-list', { libraryId })
}

export type { KnowledgeInteractionItem } from '../types'
