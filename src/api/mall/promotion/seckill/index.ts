import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 秒杀活动商品配置 */
export interface PromotionSeckillProduct {
  spuId?: number
  skuId?: number
  seckillPrice?: number
  stock?: number
}

/** 秒杀活动 */
export interface PromotionSeckillActivity {
  id?: number
  spuId?: number
  name?: string
  status?: number
  remark?: string
  startTime?: string | number | Date
  endTime?: string | number | Date
  sort?: number
  configIds?: string
  orderCount?: number
  userCount?: number
  totalPrice?: number
  totalLimitCount?: number
  singleLimitCount?: number
  stock?: number
  totalStock?: number
  seckillPrice?: number
  products?: PromotionSeckillProduct[]
  createTime?: string
}

/** 秒杀时段 */
export interface PromotionSeckillConfig {
  id?: number
  name?: string
  startTime?: string
  endTime?: string
  sliderPicUrls?: string[]
  status?: number
  createTime?: string
}

/** 获取秒杀活动分页列表 */
export function getPromotionSeckillActivityPage(params: PageParam) {
  return http.get<PageResult<PromotionSeckillActivity>>('/promotion/seckill-activity/page', params)
}

/** 获取秒杀活动详情 */
export function getPromotionSeckillActivity(id: number) {
  return http.get<PromotionSeckillActivity>(`/promotion/seckill-activity/get?id=${id}`)
}

/** 创建秒杀活动 */
export function createPromotionSeckillActivity(data: PromotionSeckillActivity) {
  return http.post<number>('/promotion/seckill-activity/create', data as Record<string, any>)
}

/** 更新秒杀活动 */
export function updatePromotionSeckillActivity(data: PromotionSeckillActivity) {
  return http.put<boolean>('/promotion/seckill-activity/update', data as Record<string, any>)
}

/** 关闭秒杀活动 */
export function closePromotionSeckillActivity(id: number) {
  return http.put<boolean>(`/promotion/seckill-activity/close?id=${id}`)
}

/** 删除秒杀活动 */
export function deletePromotionSeckillActivity(id: number) {
  return http.delete<boolean>(`/promotion/seckill-activity/delete?id=${id}`)
}

/** 获取秒杀活动列表 */
export function getPromotionSeckillActivityListByIds(ids: number[]) {
  return http.get<PromotionSeckillActivity[]>(`/promotion/seckill-activity/list-by-ids?ids=${ids.join(',')}`)
}

/** 获取秒杀时段分页列表 */
export function getPromotionSeckillConfigPage(params: PageParam) {
  return http.get<PageResult<PromotionSeckillConfig>>('/promotion/seckill-config/page', params)
}

/** 获取秒杀时段列表 */
export function getSimplePromotionSeckillConfigList() {
  return http.get<PromotionSeckillConfig[]>('/promotion/seckill-config/list')
}

/** 获取秒杀时段详情 */
export function getPromotionSeckillConfig(id: number) {
  return http.get<PromotionSeckillConfig>(`/promotion/seckill-config/get?id=${id}`)
}

/** 创建秒杀时段 */
export function createPromotionSeckillConfig(data: PromotionSeckillConfig) {
  return http.post<number>('/promotion/seckill-config/create', data as Record<string, any>)
}

/** 更新秒杀时段 */
export function updatePromotionSeckillConfig(data: PromotionSeckillConfig) {
  return http.put<boolean>('/promotion/seckill-config/update', data as Record<string, any>)
}

/** 更新秒杀时段状态 */
export function updatePromotionSeckillConfigStatus(data: { id: number, status: number }) {
  return http.put<boolean>('/promotion/seckill-config/update-status', data)
}

/** 删除秒杀时段 */
export function deletePromotionSeckillConfig(id: number) {
  return http.delete<boolean>(`/promotion/seckill-config/delete?id=${id}`)
}
