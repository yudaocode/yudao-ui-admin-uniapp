import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 安灯呼叫记录 */
export interface ProAndonRecord {
  id?: number
  configId?: number
  workstationId?: number
  workstationCode?: string
  workstationName?: string
  userId?: number
  userNickname?: string
  workOrderId?: number
  workOrderCode?: string
  processId?: number
  processName?: string
  reason?: string
  level?: number
  status?: number
  handleTime?: Date
  handlerUserId?: number
  handlerUserNickname?: string
  remark?: string
  createTime?: Date
}

/** 查询安灯记录分页 */
export function getAndonRecordPage(params: PageParam) {
  return http.get<PageResult<ProAndonRecord>>(`/mes/pro/andon-record/page`, params)
}

/** 查询安灯记录详情 */
export function getAndonRecord(id: number) {
  return http.get<ProAndonRecord>(`/mes/pro/andon-record/get?id=${id}`)
}

/** 新增安灯记录 */
export function createAndonRecord(data: ProAndonRecord) {
  return http.post<number>(`/mes/pro/andon-record/create`, data)
}

/** 删除安灯记录 */
export function deleteAndonRecord(id: number) {
  return http.delete<boolean>(`/mes/pro/andon-record/delete?id=${id}`)
}

/** 更新安灯记录（保存/已处置） */
export function updateAndonRecord(data: ProAndonRecord) {
  return http.put<boolean>(`/mes/pro/andon-record/update`, data)
}

/** 导出安灯记录 Excel */
export function exportAndonRecord(params: Record<string, any>) {
  return http.get<Blob>(`/mes/pro/andon-record/export-excel`, params)
}
