import { http } from '@/http/http'

/** MES 班组排班 */
export interface CalTeamShift {
  id: number
  planId: number // 排班计划编号
  teamId: number // 班组编号
  shiftId: number // 班次编号
  day: number // 日期
  sort: number // 排序
  teamName: string // 班组名称（关联查询）
  shiftName: string // 班次名称（关联查询）
  remark: string // 备注
}

/** 查询班组排班列表 */
export function getTeamShiftList(params?: Record<string, any>) {
  return http.get<CalTeamShift[]>(`/mes/cal/team-shift/list`, params)
}
