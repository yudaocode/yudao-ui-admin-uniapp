import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 待检任务 */
export interface QcPendingInspect {
  sourceDocType: number
  sourceDocId: number
  sourceLineId: number
  sourceDocCode: string
  qcType: number
  itemId: number
  itemCode: string
  itemName: string
  specification: string
  unitName: string
  batchCode?: string
  quantity: number
  vendorId?: number
  vendorName?: string
  workOrderId?: number
  workOrderCode?: string
  workOrderName?: string
  workstationId?: number
  workstationCode?: string
  workstationName?: string
  processId?: number
  processName?: string
  taskId?: number
  taskCode?: string
  clientId?: number
  clientName?: string
  recordTime: string | Date
}

/** 查询待检任务分页 */
export function getPendingInspectPage(params: PageParam) {
  return http.get<PageResult<QcPendingInspect>>('/mes/qc/pending-inspect/page', params)
}
