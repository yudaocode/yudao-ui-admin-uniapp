import { http } from '@/http/http'

/** 员工培训经历 */
export interface EmployeeTrainingExperience {
  id?: number // 培训经历编号
  employeeId?: number // 员工编号
  course?: string // 培训课程
  organizationName?: string // 培训机构名称
  startTime?: Date | string | number // 培训开始日期
  endTime?: Date | string | number // 培训结束日期
  duration?: string // 培训时长
  result?: string // 培训成绩
  certificateName?: string // 培训证书名称
  remark?: string // 备注
  sort?: number // 排序
  createTime?: Date | string | number // 创建时间
}

/** 查询员工培训经历列表 */
export function getEmployeeTrainingExperienceList(employeeId: number) {
  return http.get<EmployeeTrainingExperience[]>('/hrm/employee/training-experience/list', { employeeId })
}

/** 新增员工培训经历 */
export function createEmployeeTrainingExperience(data: EmployeeTrainingExperience) {
  return http.post<number>('/hrm/employee/training-experience/create', data)
}

/** 修改员工培训经历 */
export function updateEmployeeTrainingExperience(data: EmployeeTrainingExperience) {
  return http.put<boolean>('/hrm/employee/training-experience/update', data)
}

/** 删除员工培训经历 */
export function deleteEmployeeTrainingExperience(id: number) {
  return http.delete<boolean>(`/hrm/employee/training-experience/delete?id=${id}`)
}
