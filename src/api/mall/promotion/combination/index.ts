import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 拼团活动商品配置 */
export interface PromotionCombinationProduct {
  spuId?: number
  skuId?: number
  combinationPrice?: number
}

/** 拼团活动 */
export interface PromotionCombinationActivity {
  id?: number
  name?: string
  spuId?: number
  totalLimitCount?: number
  singleLimitCount?: number
  startTime?: string | number | Date
  endTime?: string | number | Date
  userSize?: number
  totalCount?: number
  successCount?: number
  orderUserCount?: number
  virtualGroup?: number | boolean
  status?: number
  limitDuration?: number
  combinationPrice?: number
  products?: PromotionCombinationProduct[]
  createTime?: string
}

/** 拼团记录 */
export interface PromotionCombinationRecord {
  id?: number
  activityId?: number
  nickname?: string
  avatar?: string
  headId?: number
  expireTime?: string | number | Date
  userSize?: number
  userCount?: number
  status?: number
  spuName?: string
  picUrl?: string
  virtualGroup?: boolean
  startTime?: string | number | Date
  endTime?: string | number | Date
}

/** 获取拼团活动分页列表 */
export function getPromotionCombinationActivityPage(params: PageParam) {
  return http.get<PageResult<PromotionCombinationActivity>>('/promotion/combination-activity/page', params)
}

/** 获取拼团活动详情 */
export function getPromotionCombinationActivity(id: number) {
  return http.get<PromotionCombinationActivity>(`/promotion/combination-activity/get?id=${id}`)
}

/** 创建拼团活动 */
export function createPromotionCombinationActivity(data: PromotionCombinationActivity) {
  return http.post<number>('/promotion/combination-activity/create', data as Record<string, any>)
}

/** 更新拼团活动 */
export function updatePromotionCombinationActivity(data: PromotionCombinationActivity) {
  return http.put<boolean>('/promotion/combination-activity/update', data as Record<string, any>)
}

/** 关闭拼团活动 */
export function closePromotionCombinationActivity(id: number) {
  return http.put<boolean>(`/promotion/combination-activity/close?id=${id}`)
}

/** 删除拼团活动 */
export function deletePromotionCombinationActivity(id: number) {
  return http.delete<boolean>(`/promotion/combination-activity/delete?id=${id}`)
}

/** 获取拼团活动列表 */
export function getPromotionCombinationActivityListByIds(ids: number[]) {
  return http.get<PromotionCombinationActivity[]>(`/promotion/combination-activity/list-by-ids?ids=${ids.join(',')}`)
}

/** 获取拼团记录分页列表 */
export function getPromotionCombinationRecordPage(params: PageParam) {
  return http.get<PageResult<PromotionCombinationRecord>>('/promotion/combination-record/page', params)
}

/** 获取拼团记录概要 */
export function getPromotionCombinationRecordSummary() {
  return http.get<Record<string, any>>('/promotion/combination-record/get-summary')
}
