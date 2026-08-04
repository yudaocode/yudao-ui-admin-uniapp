import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 考勤请假记录 */
export interface AttendanceLeave {
  id?: number // 请假记录编号
  employeeId?: number // 员工编号
  employeeName?: string // 员工姓名
  jobNumber?: string // 工号
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  postName?: string // 职位名称
  type: string // 请假类型
  startTime?: Date | string | number // 请假开始时间
  endTime?: Date | string | number // 请假结束时间
  day: number // 请假天数
  reason?: string // 请假事由
  remark?: string // 备注
  approvalStatus?: number // 审批状态
  processInstanceId?: string // 流程实例编号
  approvalTime?: Date | string | number // 审批时间
  approvalReason?: string // 审批意见
  createTime?: Date | string | number // 创建时间
}

/** 查询请假记录分页 */
export function getAttendanceLeavePage(params: PageParam) {
  return http.get<PageResult<AttendanceLeave>>('/hrm/attendance/leave/page', params)
}

/** 查询请假记录详情 */
export function getAttendanceLeave(id: number) {
  return http.get<AttendanceLeave>(`/hrm/attendance/leave/get?id=${id}`)
}
