import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 领料出库单 */
export interface WmProductIssue {
  id?: number
  code: string
  name: string
  workOrderId: number
  workOrderCode?: string
  workstationId?: number
  workstationCode?: string
  workstationName?: string
  clientCode?: string
  clientName?: string
  taskId?: number
  issueDate?: string
  requiredTime: string
  status?: number
  remark?: string
  createTime?: Date
}

/** 查询领料出库单分页 */
export function getProductIssuePage(params: PageParam) {
  return http.get<PageResult<WmProductIssue>>('/mes/wm/product-issue/page', params)
}

/** 查询领料出库单详情 */
export function getProductIssue(id: number) {
  return http.get<WmProductIssue>(`/mes/wm/product-issue/get?id=${id}`)
}

/** 新增领料出库单 */
export function createProductIssue(data: WmProductIssue) {
  return http.post<number>('/mes/wm/product-issue/create', data)
}

/** 修改领料出库单 */
export function updateProductIssue(data: WmProductIssue) {
  return http.put<boolean>('/mes/wm/product-issue/update', data)
}

/** 删除领料出库单 */
export function deleteProductIssue(id: number) {
  return http.delete<boolean>(`/mes/wm/product-issue/delete?id=${id}`)
}

/** 提交领料出库单（进入审批流程） */
export function submitProductIssue(id: number) {
  return http.put<boolean>(`/mes/wm/product-issue/submit?id=${id}`)
}

/** 执行拣货 */
export function stockProductIssue(id: number) {
  return http.put<boolean>(`/mes/wm/product-issue/stock?id=${id}`)
}

/** 取消领料出库单 */
export function cancelProductIssue(id: number) {
  return http.put<boolean>(`/mes/wm/product-issue/cancel?id=${id}`)
}

/** 完成领料出库单（执行出库） */
export function finishProductIssue(id: number) {
  return http.put<boolean>(`/mes/wm/product-issue/finish?id=${id}`)
}

/** 校验领料出库单数量（每行明细数量之和是否等于行领料数量） */
export function checkProductIssueQuantity(id: number) {
  return http.get<boolean>(`/mes/wm/product-issue/check-quantity?id=${id}`)
}

/** 导出领料出库单 Excel */
export function exportProductIssue(params: Record<string, any>) {
  return http.get<Blob>('/mes/wm/product-issue/export-excel', params)
}
