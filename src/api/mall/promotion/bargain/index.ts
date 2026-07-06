import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 砍价活动 */
export interface PromotionBargainActivity {
  id?: number
  name?: string
  startTime?: string | number | Date
  endTime?: string | number | Date
  status?: number
  helpMaxCount?: number
  bargainCount?: number
  totalLimitCount?: number
  spuId?: number
  skuId?: number
  bargainFirstPrice?: number
  bargainMinPrice?: number
  stock?: number
  randomMinPrice?: number
  randomMaxPrice?: number
  createTime?: string
}

/** 砍价记录 */
export interface PromotionBargainRecord {
  id?: number
  activityId?: number
  userId?: number
  spuId?: number
  skuId?: number
  bargainFirstPrice?: number
  bargainPrice?: number
  status?: number
  orderId?: number
  endTime?: string | number | Date
  createTime?: string
}

/** 砍价助力记录 */
export interface PromotionBargainHelp {
  id?: number
  recordId?: number
  userId?: number
  nickname?: string
  avatar?: string
  reducePrice?: number
  createTime?: string
}

/** 获取砍价活动分页列表 */
export function getPromotionBargainActivityPage(params: PageParam) {
  return http.get<PageResult<PromotionBargainActivity>>('/promotion/bargain-activity/page', params)
}

/** 获取砍价活动详情 */
export function getPromotionBargainActivity(id: number) {
  return http.get<PromotionBargainActivity>(`/promotion/bargain-activity/get?id=${id}`)
}

/** 创建砍价活动 */
export function createPromotionBargainActivity(data: PromotionBargainActivity) {
  return http.post<number>('/promotion/bargain-activity/create', data as Record<string, any>)
}

/** 更新砍价活动 */
export function updatePromotionBargainActivity(data: PromotionBargainActivity) {
  return http.put<boolean>('/promotion/bargain-activity/update', data as Record<string, any>)
}

/** 关闭砍价活动 */
export function closePromotionBargainActivity(id: number) {
  return http.put<boolean>(`/promotion/bargain-activity/close?id=${id}`)
}

/** 删除砍价活动 */
export function deletePromotionBargainActivity(id: number) {
  return http.delete<boolean>(`/promotion/bargain-activity/delete?id=${id}`)
}

/** 获取砍价记录分页列表 */
export function getPromotionBargainRecordPage(params: PageParam) {
  return http.get<PageResult<PromotionBargainRecord>>('/promotion/bargain-record/page', params)
}

/** 获取砍价助力分页列表 */
export function getPromotionBargainHelpPage(params: PageParam) {
  return http.get<PageResult<PromotionBargainHelp>>('/promotion/bargain-help/page', params)
}
