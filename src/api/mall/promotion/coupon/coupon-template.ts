import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 优惠券模板 */
export interface PromotionCouponTemplate {
  id?: number
  name?: string
  status?: number
  totalCount?: number
  takeLimitCount?: number
  takeType?: number
  usePrice?: number
  productScope?: number
  productScopeValues?: number[]
  validityType?: number
  validStartTime?: string | number | Date
  validEndTime?: string | number | Date
  fixedStartTerm?: number
  fixedEndTerm?: number
  discountType?: number
  discountPercent?: number
  discountPrice?: number
  discountLimitPrice?: number
  takeCount?: number
  useCount?: number
}

/** 获取优惠券模板分页列表 */
export function getPromotionCouponTemplatePage(params: PageParam) {
  return http.get<PageResult<PromotionCouponTemplate>>('/promotion/coupon-template/page', params)
}

/** 获取优惠券模板详情 */
export function getPromotionCouponTemplate(id: number) {
  return http.get<PromotionCouponTemplate>(`/promotion/coupon-template/get?id=${id}`)
}

/** 获取优惠券模板列表 */
export function getPromotionCouponTemplateList(ids: number[]) {
  return http.get<PromotionCouponTemplate[]>(`/promotion/coupon-template/list?ids=${ids.join(',')}`)
}

/** 创建优惠券模板 */
export function createPromotionCouponTemplate(data: PromotionCouponTemplate) {
  return http.post<number>('/promotion/coupon-template/create', data as Record<string, any>)
}

/** 更新优惠券模板 */
export function updatePromotionCouponTemplate(data: PromotionCouponTemplate) {
  return http.put<boolean>('/promotion/coupon-template/update', data as Record<string, any>)
}

/** 更新优惠券模板状态 */
export function updatePromotionCouponTemplateStatus(data: { id: number, status: number }) {
  return http.put<boolean>('/promotion/coupon-template/update-status', data)
}

/** 删除优惠券模板 */
export function deletePromotionCouponTemplate(id: number) {
  return http.delete<boolean>(`/promotion/coupon-template/delete?id=${id}`)
}
