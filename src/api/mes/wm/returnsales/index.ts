import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 销售退货单 */
export interface WmReturnSales {
  id?: number
  code: string
  name: string
  salesOrderCode?: string
  clientId: number
  clientCode?: string
  clientName?: string
  clientNickname?: string
  returnDate?: string | number | Date
  returnReason?: string
  status?: number
  remark?: string
  createTime?: Date
}

/** 查询销售退货单分页 */
export function getReturnSalesPage(params: PageParam) {
  return http.get<PageResult<WmReturnSales>>('/mes/wm/return-sales/page', params)
}

/** 查询销售退货单详情 */
export function getReturnSales(id: number) {
  return http.get<WmReturnSales>(`/mes/wm/return-sales/get?id=${id}`)
}

/** 新增销售退货单 */
export function createReturnSales(data: WmReturnSales) {
  return http.post<number>('/mes/wm/return-sales/create', data)
}

/** 修改销售退货单 */
export function updateReturnSales(data: WmReturnSales) {
  return http.put<boolean>('/mes/wm/return-sales/update', data)
}

/** 删除销售退货单 */
export function deleteReturnSales(id: number) {
  return http.delete<boolean>(`/mes/wm/return-sales/delete?id=${id}`)
}

/** 提交销售退货单 */
export function submitReturnSales(id: number) {
  return http.put<boolean>(`/mes/wm/return-sales/submit?id=${id}`)
}

/** 执行退货 */
export function finishReturnSales(id: number) {
  return http.put<boolean>(`/mes/wm/return-sales/finish?id=${id}`)
}

/** 执行上架 */
export function stockReturnSales(id: number) {
  return http.put<boolean>(`/mes/wm/return-sales/stock?id=${id}`)
}

/** 取消销售退货单 */
export function cancelReturnSales(id: number) {
  return http.put<boolean>(`/mes/wm/return-sales/cancel?id=${id}`)
}

/** 校验销售退货数量 */
export function checkReturnSalesQuantity(id: number) {
  return http.get<boolean>(`/mes/wm/return-sales/check-quantity?id=${id}`)
}

/** 导出销售退货单 Excel */
export function exportReturnSales(params: Record<string, any>) {
  return http.get<Blob>('/mes/wm/return-sales/export-excel', params)
}
