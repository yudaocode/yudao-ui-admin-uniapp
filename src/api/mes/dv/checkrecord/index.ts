import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 设备点检记录 */
export interface DvCheckRecord {
  id?: number // 编号
  planId: number // 点检计划编号
  planCode?: string // 计划编码
  planName?: string // 计划名称
  planCycleCount?: number // 频率数量
  planCycleType?: number // 频率类型
  machineryId: number // 设备编号
  machineryCode?: string // 设备编码
  machineryName?: string // 设备名称
  machineryBrand?: string // 品牌
  machinerySpecification?: string // 规格型号
  checkTime?: Date // 点检时间
  userId: number // 点检人编号
  nickname?: string // 点检人名称
  status?: number // 状态
  remark?: string // 备注
  createTime?: Date
}

/** 查询设备点检记录分页 */
export function getCheckRecordPage(params: PageParam) {
  return http.get<PageResult<DvCheckRecord>>('/mes/dv/check-record/page', params)
}

/** 查询设备点检记录详情 */
export function getCheckRecord(id: number) {
  return http.get<DvCheckRecord>(`/mes/dv/check-record/get?id=${id}`)
}

/** 新增设备点检记录 */
export function createCheckRecord(data: DvCheckRecord) {
  return http.post<number>('/mes/dv/check-record/create', data)
}

/** 修改设备点检记录 */
export function updateCheckRecord(data: DvCheckRecord) {
  return http.put<boolean>('/mes/dv/check-record/update', data)
}

/** 提交设备点检记录 */
export function submitCheckRecord(id: number) {
  return http.put<boolean>(`/mes/dv/check-record/submit?id=${id}`)
}

/** 删除设备点检记录 */
export function deleteCheckRecord(id: number) {
  return http.delete<boolean>(`/mes/dv/check-record/delete?id=${id}`)
}

/** 导出设备点检记录 Excel */
export function exportCheckRecord(params: Record<string, any>) {
  return http.get<Blob>('/mes/dv/check-record/export-excel', params)
}
