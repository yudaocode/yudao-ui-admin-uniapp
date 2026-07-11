import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 设备保养记录明细 */
export interface DvMaintenRecordLine {
  id?: number // 编号
  recordId: number // 保养记录编号
  subjectId?: number // 项目编号
  subjectCode?: string // 项目编码
  subjectName?: string // 项目名称
  subjectContent?: string // 项目内容
  subjectStandard?: string // 项目标准
  status: number // 保养结果
  result?: string // 异常描述
  remark?: string // 备注
}

/** 查询设备保养记录明细分页 */
export function getMaintenRecordLinePage(params: PageParam) {
  return http.get<PageResult<DvMaintenRecordLine>>('/mes/dv/mainten-record-line/page', params)
}

/** 查询指定设备保养记录的明细列表 */
export function getMaintenRecordLineListByRecordId(recordId: number) {
  return http.get<DvMaintenRecordLine[]>('/mes/dv/mainten-record-line/list-by-record-id', { recordId })
}

/** 查询设备保养记录明细详情 */
export function getMaintenRecordLine(id: number) {
  return http.get<DvMaintenRecordLine>(`/mes/dv/mainten-record-line/get?id=${id}`)
}

/** 新增设备保养记录明细 */
export function createMaintenRecordLine(data: DvMaintenRecordLine) {
  return http.post<number>('/mes/dv/mainten-record-line/create', data)
}

/** 修改设备保养记录明细 */
export function updateMaintenRecordLine(data: DvMaintenRecordLine) {
  return http.put<boolean>('/mes/dv/mainten-record-line/update', data)
}

/** 删除设备保养记录明细 */
export function deleteMaintenRecordLine(id: number) {
  return http.delete<boolean>(`/mes/dv/mainten-record-line/delete?id=${id}`)
}
