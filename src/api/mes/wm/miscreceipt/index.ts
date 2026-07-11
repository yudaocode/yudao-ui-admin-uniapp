import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 杂项入库单 */
export interface WmMiscReceipt {
  id?: number
  code?: string
  name?: string
  type?: number
  sourceDocType?: string
  sourceDocId?: number
  sourceDocCode?: string
  receiptDate?: string | number | Date
  status?: number
  remark?: string
  createTime?: Date
}

/** 查询杂项入库单分页 */
export function getMiscReceiptPage(params: PageParam) {
  return http.get<PageResult<WmMiscReceipt>>('/mes/wm/misc-receipt/page', params)
}

/** 查询杂项入库单详情 */
export function getMiscReceipt(id: number) {
  return http.get<WmMiscReceipt>(`/mes/wm/misc-receipt/get?id=${id}`)
}

/** 新增杂项入库单 */
export function createMiscReceipt(data: WmMiscReceipt) {
  return http.post<number>('/mes/wm/misc-receipt/create', data)
}

/** 修改杂项入库单 */
export function updateMiscReceipt(data: WmMiscReceipt) {
  return http.put<boolean>('/mes/wm/misc-receipt/update', data)
}

/** 删除杂项入库单 */
export function deleteMiscReceipt(id: number) {
  return http.delete<boolean>(`/mes/wm/misc-receipt/delete?id=${id}`)
}

/** 提交审批 */
export function submitMiscReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/misc-receipt/submit?id=${id}`)
}

/** 执行入库 */
export function finishMiscReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/misc-receipt/finish?id=${id}`)
}

/** 取消杂项入库单 */
export function cancelMiscReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/misc-receipt/cancel?id=${id}`)
}
