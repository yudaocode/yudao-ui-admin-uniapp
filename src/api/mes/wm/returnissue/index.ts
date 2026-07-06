import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 生产退料单 */
export interface WmReturnIssue {
  id?: number
  code: string
  name?: string
  workstationId?: number
  workstationCode?: string
  workstationName?: string
  workOrderId?: number
  workOrderCode?: string
  type?: number
  returnDate?: string | number | Date
  status?: number
  remark?: string
  createTime?: Date
}

/** 查询生产退料单分页 */
export function getReturnIssuePage(params: PageParam) {
  return http.get<PageResult<WmReturnIssue>>('/mes/wm/return-issue/page', params)
}

/** 查询生产退料单详情 */
export function getReturnIssue(id: number) {
  return http.get<WmReturnIssue>(`/mes/wm/return-issue/get?id=${id}`)
}

/** 新增生产退料单 */
export function createReturnIssue(data: WmReturnIssue) {
  return http.post<number>('/mes/wm/return-issue/create', data)
}

/** 修改生产退料单 */
export function updateReturnIssue(data: WmReturnIssue) {
  return http.put<boolean>('/mes/wm/return-issue/update', data)
}

/** 删除生产退料单 */
export function deleteReturnIssue(id: number) {
  return http.delete<boolean>(`/mes/wm/return-issue/delete?id=${id}`)
}

/** 提交生产退料单（草稿 → 待检验/待上架） */
export function submitReturnIssue(id: number) {
  return http.put<boolean>(`/mes/wm/return-issue/submit?id=${id}`)
}

/** 入库上架 */
export function stockReturnIssue(id: number) {
  return http.put<boolean>(`/mes/wm/return-issue/stock?id=${id}`)
}

/** 取消生产退料单 */
export function cancelReturnIssue(id: number) {
  return http.put<boolean>(`/mes/wm/return-issue/cancel?id=${id}`)
}

/** 完成生产退料单 */
export function finishReturnIssue(id: number) {
  return http.put<boolean>(`/mes/wm/return-issue/finish?id=${id}`)
}

/** 导出生产退料单 Excel */
export function exportReturnIssue(params: Record<string, any>) {
  return http.get<Blob>('/mes/wm/return-issue/export-excel', params)
}
