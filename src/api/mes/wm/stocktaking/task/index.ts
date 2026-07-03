import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 盘点任务 */
export interface StockTakingTask {
  id?: number
  code: string
  name: string
  takingDate?: Date
  type: number
  userId: number
  userNickname?: string
  planId: number
  planCode?: string
  planName?: string
  blindFlag: boolean
  frozen: boolean
  startTime?: Date
  endTime?: Date
  status?: number
  remark?: string
  createTime?: Date
}

/** 获取盘点任务分页 */
export function getStockTakingPage(params: PageParam) {
  return http.get<PageResult<StockTakingTask>>('/mes/wm/stocktaking-task/page', params)
}

/** 获取盘点任务详情 */
export function getStockTaking(id: number) {
  return http.get<StockTakingTask>(`/mes/wm/stocktaking-task/get?id=${id}`)
}

/** 创建盘点任务 */
export function createStockTaking(data: StockTakingTask) {
  return http.post<number>('/mes/wm/stocktaking-task/create', data)
}

/** 修改盘点任务 */
export function updateStockTaking(data: StockTakingTask) {
  return http.put<boolean>('/mes/wm/stocktaking-task/update', data)
}

/** 删除盘点任务 */
export function deleteStockTaking(id: number) {
  return http.delete<boolean>(`/mes/wm/stocktaking-task/delete?id=${id}`)
}

/** 提交盘点任务 */
export function submitStockTaking(id: number) {
  return http.put<boolean>('/mes/wm/stocktaking-task/submit', undefined, { id })
}

/** 取消盘点任务 */
export function cancelStockTaking(id: number) {
  return http.put<boolean>('/mes/wm/stocktaking-task/cancel', undefined, { id })
}

/** 完成盘点任务 */
export function finishStockTaking(id: number) {
  return http.put<boolean>('/mes/wm/stocktaking-task/finish', { id })
}

/** 导出盘点任务 */
export function exportStockTaking(params: Record<string, any>) {
  return http.get<Blob>('/mes/wm/stocktaking-task/export-excel', params)
}
