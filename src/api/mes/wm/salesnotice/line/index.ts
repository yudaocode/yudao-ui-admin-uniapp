import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 发货通知单行 */
export interface WmSalesNoticeLine {
  id?: number // 行编号
  noticeId: number // 发货通知单编号
  itemId: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位名称
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  quantity?: number // 发货数量
  oqcCheckFlag?: boolean // 是否检验
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询发货通知单行分页 */
export function getSalesNoticeLinePage(params: PageParam) {
  return http.get<PageResult<WmSalesNoticeLine>>('/mes/wm/sales-notice-line/page', params)
}

/** 查询发货通知单行详情 */
export function getSalesNoticeLine(id: number) {
  return http.get<WmSalesNoticeLine>(`/mes/wm/sales-notice-line/get?id=${id}`)
}

/** 新增发货通知单行 */
export function createSalesNoticeLine(data: WmSalesNoticeLine) {
  return http.post<number>('/mes/wm/sales-notice-line/create', data)
}

/** 修改发货通知单行 */
export function updateSalesNoticeLine(data: WmSalesNoticeLine) {
  return http.put<boolean>('/mes/wm/sales-notice-line/update', data)
}

/** 删除发货通知单行 */
export function deleteSalesNoticeLine(id: number) {
  return http.delete<boolean>(`/mes/wm/sales-notice-line/delete?id=${id}`)
}
