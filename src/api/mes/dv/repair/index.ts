import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 维修工单 */
export interface DvRepair {
  id?: number // 编号
  code: string // 维修工单编码
  name: string // 维修工单名称
  machineryId?: number // 设备编号
  machineryCode?: string // 设备编码
  machineryName?: string // 设备名称
  machineryBrand?: string // 品牌
  machinerySpecification?: string // 规格型号
  requireDate?: string | Date // 报修日期
  finishDate?: string | Date // 维修完成日期
  confirmDate?: string | Date // 验收日期
  result?: number // 维修结果
  acceptedUserId?: number // 维修人用户编号
  acceptedUserNickname?: string // 维修人名称
  confirmUserId?: number // 验收人用户编号
  confirmUserNickname?: string // 验收人名称
  sourceDocType?: number // 来源单据类型
  sourceDocId?: number // 来源单据编号
  sourceDocCode?: string // 来源单据编码
  status?: number // 状态
  remark?: string // 备注
  createTime?: Date
}

/** MES 维修完成确认参数 */
export interface DvRepairConfirmReq {
  id: number
  finishDate?: string
}

/** 查询维修工单分页 */
export function getRepairPage(params: PageParam) {
  return http.get<PageResult<DvRepair>>('/mes/dv/repair/page', params)
}

/** 查询维修工单详情 */
export function getRepair(id: number) {
  return http.get<DvRepair>(`/mes/dv/repair/get?id=${id}`)
}

/** 新增维修工单 */
export function createRepair(data: DvRepair) {
  return http.post<number>('/mes/dv/repair/create', data)
}

/** 修改维修工单 */
export function updateRepair(data: DvRepair) {
  return http.put<boolean>('/mes/dv/repair/update', data)
}

/** 删除维修工单 */
export function deleteRepair(id: number) {
  return http.delete<boolean>(`/mes/dv/repair/delete?id=${id}`)
}

/** 导出维修工单 Excel */
export function exportRepair(params: Record<string, any>) {
  return http.get<Blob>('/mes/dv/repair/export-excel', params)
}

/** 提交维修工单（草稿→维修中） */
export function submitRepair(id: number) {
  return http.put<boolean>(`/mes/dv/repair/submit?id=${id}`)
}

/** 确认维修完成（维修中→待验收） */
export function confirmRepair(data: DvRepairConfirmReq) {
  return http.put<boolean>('/mes/dv/repair/confirm', data)
}

/** 完成验收（待验收→已确认） */
export function finishRepair(id: number, result: number) {
  return http.put<boolean>(`/mes/dv/repair/finish?id=${id}&result=${result}`)
}
