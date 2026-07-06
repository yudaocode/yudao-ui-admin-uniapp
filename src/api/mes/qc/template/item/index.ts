import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 质检方案-产品关联 */
export interface QcTemplateItem {
  id?: number // 编号
  templateId: number // 质检方案ID
  itemId?: number // 产品物料ID
  quantityCheck?: number // 最低检测数
  quantityUnqualified?: number // 最大不合格数
  criticalRate?: number // 最大致命缺陷率（%）
  majorRate?: number // 最大严重缺陷率（%）
  minorRate?: number // 最大轻微缺陷率（%）
  remark?: string // 备注
  // JOIN mes_md_item
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 计量单位名称
  createTime?: Date // 创建时间
}

/** 查询产品关联分页 */
export function getTemplateItemPage(params: PageParam) {
  return http.get<PageResult<QcTemplateItem>>(`/mes/qc/template/item/page`, params)
}

/** 查询产品关联详情 */
export function getTemplateItem(id: number) {
  return http.get<QcTemplateItem>(`/mes/qc/template/item/get?id=${id}`)
}

/** 新增产品关联 */
export function createTemplateItem(data: QcTemplateItem) {
  return http.post<number>(`/mes/qc/template/item/create`, data)
}

/** 修改产品关联 */
export function updateTemplateItem(data: QcTemplateItem) {
  return http.put<boolean>(`/mes/qc/template/item/update`, data)
}

/** 删除产品关联 */
export function deleteTemplateItem(id: number) {
  return http.delete<boolean>(`/mes/qc/template/item/delete?id=${id}`)
}
