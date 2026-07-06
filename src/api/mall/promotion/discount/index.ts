import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 限时折扣商品配置 */
export interface PromotionDiscountProduct {
  spuId?: number
  skuId?: number
  discountType?: number
  discountPercent?: number
  discountPrice?: number
}

/** 限时折扣活动 */
export interface PromotionDiscountActivity {
  id?: number
  spuId?: number
  name?: string
  status?: number
  remark?: string
  startTime?: string | number | Date
  endTime?: string | number | Date
  products?: PromotionDiscountProduct[]
  createTime?: string
}

/** 获取限时折扣活动分页列表 */
export function getPromotionDiscountActivityPage(params: PageParam) {
  return http.get<PageResult<PromotionDiscountActivity>>('/promotion/discount-activity/page', params)
}

/** 获取限时折扣活动详情 */
export function getPromotionDiscountActivity(id: number) {
  return http.get<PromotionDiscountActivity>(`/promotion/discount-activity/get?id=${id}`)
}

/** 创建限时折扣活动 */
export function createPromotionDiscountActivity(data: PromotionDiscountActivity) {
  return http.post<number>('/promotion/discount-activity/create', data as Record<string, any>)
}

/** 更新限时折扣活动 */
export function updatePromotionDiscountActivity(data: PromotionDiscountActivity) {
  return http.put<boolean>('/promotion/discount-activity/update', data as Record<string, any>)
}

/** 关闭限时折扣活动 */
export function closePromotionDiscountActivity(id: number) {
  return http.put<boolean>(`/promotion/discount-activity/close?id=${id}`)
}

/** 删除限时折扣活动 */
export function deletePromotionDiscountActivity(id: number) {
  return http.delete<boolean>(`/promotion/discount-activity/delete?id=${id}`)
}
