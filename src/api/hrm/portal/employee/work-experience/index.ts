import { http } from '@/http/http'

/** 员工工作经历 */
export interface EmployeeWorkExperience {
  id?: number // 工作经历编号
  employeeId?: number // 员工编号
  workUnit?: string // 工作单位
  postName?: string // 职务
  startTime?: Date | string | number // 工作开始日期
  endTime?: Date | string | number // 工作结束日期
  reason?: string // 离职原因
  witnessName?: string // 证明人
  witnessPhone?: string // 证明人手机号
  remark?: string // 工作备注
  sort?: number // 排序
  createTime?: Date | string | number // 创建时间
}

/** 获得当前员工的工作经历列表 */
export function getPortalEmployeeWorkExperienceList() {
  return http.get<EmployeeWorkExperience[]>('/hrm/portal/employee/work-experience/list')
}
