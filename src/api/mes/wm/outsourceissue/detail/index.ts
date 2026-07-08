import { http } from '@/http/http'

/** MES 外协发料单明细 */
export interface WmOutsourceIssueDetail {
  id?: number // 明细编号
  lineId?: number // 发料单行编号
  issueId?: number // 发料单编号
  materialStockId?: number // 库存记录编号
  itemId?: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位名称
  quantity?: number // 拣货数量
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  warehouseId?: number // 仓库编号
  warehouseName?: string // 仓库名称
  locationId?: number // 库区编号
  locationName?: string // 库区名称
  areaId?: number // 库位编号
  areaName?: string // 库位名称
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询外协发料单明细列表（按行编号） */
export function getOutsourceIssueDetailListByLineId(lineId: number) {
  return http.get<WmOutsourceIssueDetail[]>('/mes/wm/outsource-issue-detail/list-by-line', { lineId })
}

/** 查询外协发料单明细详情 */
export function getOutsourceIssueDetail(id: number) {
  return http.get<WmOutsourceIssueDetail>(`/mes/wm/outsource-issue-detail/get?id=${id}`)
}

/** 新增外协发料单明细 */
export function createOutsourceIssueDetail(data: WmOutsourceIssueDetail) {
  return http.post<number>('/mes/wm/outsource-issue-detail/create', data)
}

/** 修改外协发料单明细 */
export function updateOutsourceIssueDetail(data: WmOutsourceIssueDetail) {
  return http.put<boolean>('/mes/wm/outsource-issue-detail/update', data)
}

/** 删除外协发料单明细 */
export function deleteOutsourceIssueDetail(id: number) {
  return http.delete<boolean>(`/mes/wm/outsource-issue-detail/delete?id=${id}`)
}
