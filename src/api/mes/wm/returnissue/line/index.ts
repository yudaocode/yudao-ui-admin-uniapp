import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 生产退料单行 */
export interface WmReturnIssueLine {
  id?: number
  issueId: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  materialStockId?: number
  quantity: number
  batchId?: number
  batchCode?: string
  rqcCheckFlag?: boolean
  qualityStatus?: number
  rqcId?: number
  remark?: string
  createTime?: Date
}

/** 查询生产退料单行分页 */
export function getReturnIssueLinePage(params: PageParam) {
  return http.get<PageResult<WmReturnIssueLine>>('/mes/wm/return-issue-line/page', params)
}

/** 查询生产退料单行详情 */
export function getReturnIssueLine(id: number) {
  return http.get<WmReturnIssueLine>(`/mes/wm/return-issue-line/get?id=${id}`)
}

/** 新增生产退料单行 */
export function createReturnIssueLine(data: WmReturnIssueLine) {
  return http.post<number>('/mes/wm/return-issue-line/create', data)
}

/** 修改生产退料单行 */
export function updateReturnIssueLine(data: WmReturnIssueLine) {
  return http.put<boolean>('/mes/wm/return-issue-line/update', data)
}

/** 删除生产退料单行 */
export function deleteReturnIssueLine(id: number) {
  return http.delete<boolean>(`/mes/wm/return-issue-line/delete?id=${id}`)
}
