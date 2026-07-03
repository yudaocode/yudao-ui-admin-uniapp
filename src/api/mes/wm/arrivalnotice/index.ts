import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 到货通知单 */
export interface WmArrivalNotice {
  id?: number
  code: string
  name: string
  purchaseOrderCode?: string
  vendorId: number
  vendorCode?: string
  vendorName?: string
  arrivalDate?: string
  contactName?: string
  contactTelephone?: string
  status?: number
  remark?: string
  createTime?: Date
}

/** 查询到货通知单分页 */
export function getArrivalNoticePage(params: PageParam) {
  return http.get<PageResult<WmArrivalNotice>>('/mes/wm/arrival-notice/page', params)
}

/** 查询到货通知单详情 */
export function getArrivalNotice(id: number) {
  return http.get<WmArrivalNotice>(`/mes/wm/arrival-notice/get?id=${id}`)
}

/** 新增到货通知单 */
export function createArrivalNotice(data: WmArrivalNotice) {
  return http.post<number>('/mes/wm/arrival-notice/create', data)
}

/** 修改到货通知单 */
export function updateArrivalNotice(data: WmArrivalNotice) {
  return http.put<boolean>('/mes/wm/arrival-notice/update', data)
}

/** 删除到货通知单 */
export function deleteArrivalNotice(id: number) {
  return http.delete<boolean>(`/mes/wm/arrival-notice/delete?id=${id}`)
}

/** 提交到货通知单 */
export function submitArrivalNotice(id: number) {
  return http.put<boolean>(`/mes/wm/arrival-notice/submit?id=${id}`)
}

/** 导出到货通知单 Excel */
export function exportArrivalNotice(params: Record<string, any>) {
  return http.get<Blob>('/mes/wm/arrival-notice/export-excel', params)
}
