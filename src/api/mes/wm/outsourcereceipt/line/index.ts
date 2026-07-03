import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 外协入库单行 */
export interface WmOutsourceReceiptLine {
  id?: number // 行编号
  receiptId: number // 入库单编号
  itemId: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位
  quantity?: number // 入库数量
  batchId?: number // 批次编号
  batchCode?: string // 批次编码
  productionDate?: string // 生产日期
  expireDate?: string // 有效期
  lotNumber?: string // 生产批号
  iqcCheckFlag?: boolean // 是否需要质检
  iqcId?: number // 来料检验单编号
  qualityStatus?: number // 质量状态
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询外协入库单行分页 */
export function getOutsourceReceiptLinePage(params: PageParam) {
  return http.get<PageResult<WmOutsourceReceiptLine>>('/mes/wm/outsource-receipt-line/page', params)
}

/** 查询外协入库单行详情 */
export function getOutsourceReceiptLine(id: number) {
  return http.get<WmOutsourceReceiptLine>(`/mes/wm/outsource-receipt-line/get?id=${id}`)
}

/** 新增外协入库单行 */
export function createOutsourceReceiptLine(data: WmOutsourceReceiptLine) {
  return http.post<number>('/mes/wm/outsource-receipt-line/create', data)
}

/** 修改外协入库单行 */
export function updateOutsourceReceiptLine(data: WmOutsourceReceiptLine) {
  return http.put<boolean>('/mes/wm/outsource-receipt-line/update', data)
}

/** 删除外协入库单行 */
export function deleteOutsourceReceiptLine(id: number) {
  return http.delete<boolean>(`/mes/wm/outsource-receipt-line/delete?id=${id}`)
}
