import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 工作记录流水 */
export interface ProWorkRecordLog {
  id: number
  userId: number
  userNickname: string
  workstationId: number
  workstationCode: string
  workstationName: string
  type: number
  remark?: string
  createTime: Date
}

/** 当前用户工作站绑定状态 */
export interface ProWorkRecord {
  userId: number
  userNickname: string
  workstationId?: number
  workstationCode?: string
  workstationName?: string
  type?: number
  clockInTime?: string | Date
  clockOutTime?: string | Date
}

/** 查询工作记录分页 */
export function getWorkRecordLogPage(params: PageParam) {
  return http.get<PageResult<ProWorkRecordLog>>(`/mes/pro/workrecord/log/page`, params)
}

/** 查询工作记录详情 */
export function getWorkRecordLog(id: number) {
  return http.get<ProWorkRecordLog>(`/mes/pro/workrecord/log/get?id=${id}`)
}

/** 导出工作记录 Excel */
export function exportWorkRecordLog(params: Record<string, any>) {
  return http.get<Blob>(`/mes/pro/workrecord/log/export-excel`, params)
}

/** 上线（绑定工作站） */
export function clockInWorkRecord(workstationId: number) {
  return http.put<number>(`/mes/pro/workrecord/clock-in?workstationId=${workstationId}`)
}

/** 下线（解绑工作站） */
export function clockOutWorkRecord() {
  return http.put<number>(`/mes/pro/workrecord/clock-out`)
}

/** 获取当前用户绑定的工作站 */
export function getMyWorkRecord() {
  return http.get<ProWorkRecord | null>(`/mes/pro/workrecord/get-my`)
}
