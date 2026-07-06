import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 满减送规则 */
export interface PromotionRewardRule {
  limit?: number
  discountPrice?: number
  freeDelivery?: boolean
  point?: number
  giveCouponTemplateCounts?: Record<string, number>
}

/** 满减送活动 */
export interface PromotionRewardActivity {
  id?: number
  name?: string
  startTime?: string | number | Date
  endTime?: string | number | Date
  status?: number
  remark?: string
  conditionType?: number
  productScope?: number
  productScopeValues?: number[]
  productCategoryIds?: number[]
  productSpuIds?: number[]
  rules?: PromotionRewardRule[]
  createTime?: string
}

/** 获取满减送活动分页列表 */
export function getPromotionRewardActivityPage(params: PageParam) {
  return http.get<PageResult<PromotionRewardActivity>>('/promotion/reward-activity/page', params)
}

/** 获取满减送活动详情 */
export function getPromotionRewardActivity(id: number) {
  return http.get<PromotionRewardActivity>(`/promotion/reward-activity/get?id=${id}`)
}

/** 创建满减送活动 */
export function createPromotionRewardActivity(data: PromotionRewardActivity) {
  return http.post<number>('/promotion/reward-activity/create', data as Record<string, any>)
}

/** 更新满减送活动 */
export function updatePromotionRewardActivity(data: PromotionRewardActivity) {
  return http.put<boolean>('/promotion/reward-activity/update', data as Record<string, any>)
}

/** 关闭满减送活动 */
export function closePromotionRewardActivity(id: number) {
  return http.put<boolean>(`/promotion/reward-activity/close?id=${id}`)
}

/** 删除满减送活动 */
export function deletePromotionRewardActivity(id: number) {
  return http.delete<boolean>(`/promotion/reward-activity/delete?id=${id}`)
}
