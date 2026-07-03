import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 批次 */
export interface Batch {
  id: number
  code: string
  itemId: number
  itemCode?: string
  itemName?: string
  itemSpecification?: string
  unitName?: string
  produceDate?: Date
  expireDate?: Date
  receiptDate?: Date
  vendorId?: number
  vendorCode?: string
  vendorName?: string
  clientId?: number
  clientCode?: string
  clientName?: string
  purchaseOrderCode?: string
  salesOrderCode?: string
  workOrderId?: number
  workOrderCode?: string
  taskId?: number
  taskCode?: string
  workstationId?: number
  workstationCode?: string
  toolId?: number
  toolCode?: string
  moldId?: number
  lotNumber?: string
  qualityStatus?: number
  remark?: string
  createTime?: Date
}

/** 获取批次详情 */
export function getBatch(id: number) {
  return http.get<Batch>(`/mes/wm/batch/get?id=${id}`)
}

/** 获取批次分页 */
export function getBatchPage(params: PageParam) {
  return http.get<PageResult<Batch>>('/mes/wm/batch/page', params)
}

/** 向前追溯 */
export function getForwardList(code: string) {
  return http.get<Batch[]>('/mes/wm/batch/forward-list', { code })
}

/** 向后追溯 */
export function getBackwardList(code: string) {
  return http.get<Batch[]>('/mes/wm/batch/backward-list', { code })
}
