import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 设备保养记录 */
export interface DvMaintenRecord {
  id?: number // 编号
  planId?: number // 计划编号
  planCode?: string // 计划编码
  planName?: string // 计划名称
  planCycleCount?: number // 频率数量
  planCycleType?: number // 频率类型
  machineryId?: number // 设备编号
  machineryCode?: string // 设备编码
  machineryName?: string // 设备名称
  machineryBrand?: string // 品牌
  machinerySpecification?: string // 规格型号
  maintenTime?: string | Date // 保养时间
  userId?: number // 用户编号
  nickname?: string // 保养人名称
  status?: number // 状态
  remark?: string // 备注
  createTime?: Date
}

/** 查询设备保养记录分页 */
export function getMaintenRecordPage(params: PageParam) {
  return http.get<PageResult<DvMaintenRecord>>('/mes/dv/mainten-record/page', params)
}

/** 查询设备保养记录详情 */
export function getMaintenRecord(id: number) {
  return http.get<DvMaintenRecord>(`/mes/dv/mainten-record/get?id=${id}`)
}

/** 新增设备保养记录 */
export function createMaintenRecord(data: DvMaintenRecord) {
  return http.post<number>('/mes/dv/mainten-record/create', data)
}

/** 修改设备保养记录 */
export function updateMaintenRecord(data: DvMaintenRecord) {
  return http.put<boolean>('/mes/dv/mainten-record/update', data)
}

/** 提交设备保养记录 */
export function submitMaintenRecord(id: number) {
  return http.put<boolean>(`/mes/dv/mainten-record/submit?id=${id}`)
}

/** 删除设备保养记录 */
export function deleteMaintenRecord(id: number) {
  return http.delete<boolean>(`/mes/dv/mainten-record/delete?id=${id}`)
}

/** 导出设备保养记录 Excel */
export function exportMaintenRecord(params: Record<string, any>) {
  return http.get<Blob>('/mes/dv/mainten-record/export-excel', params)
}
