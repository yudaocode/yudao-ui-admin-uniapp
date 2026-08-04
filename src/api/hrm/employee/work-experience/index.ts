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

/** 查询员工工作经历列表 */
export function getEmployeeWorkExperienceList(employeeId: number) {
  return http.get<EmployeeWorkExperience[]>('/hrm/employee/work-experience/list', { employeeId })
}

/** 新增员工工作经历 */
export function createEmployeeWorkExperience(data: EmployeeWorkExperience) {
  return http.post<number>('/hrm/employee/work-experience/create', data)
}

/** 修改员工工作经历 */
export function updateEmployeeWorkExperience(data: EmployeeWorkExperience) {
  return http.put<boolean>('/hrm/employee/work-experience/update', data)
}

/** 删除员工工作经历 */
export function deleteEmployeeWorkExperience(id: number) {
  return http.delete<boolean>(`/hrm/employee/work-experience/delete?id=${id}`)
}
