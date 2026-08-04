import { http } from '@/http/http'

/** 员工教育经历 */
export interface EmployeeEducationExperience {
  id?: number // 教育经历编号
  employeeId?: number // 员工编号
  education?: number // 学历
  graduateSchool?: string // 毕业院校
  major?: string // 专业
  admissionTime?: Date | string | number // 入学日期
  graduationTime?: Date | string | number // 毕业日期
  teachingMethods?: number // 教学方式
  firstDegree?: boolean // 是否第一学历
  sort?: number // 排序
  createTime?: Date | string | number // 创建时间
}

/** 查询员工教育经历列表 */
export function getEmployeeEducationExperienceList(employeeId: number) {
  return http.get<EmployeeEducationExperience[]>('/hrm/employee/education-experience/list', { employeeId })
}

/** 新增员工教育经历 */
export function createEmployeeEducationExperience(data: EmployeeEducationExperience) {
  return http.post<number>('/hrm/employee/education-experience/create', data)
}

/** 修改员工教育经历 */
export function updateEmployeeEducationExperience(data: EmployeeEducationExperience) {
  return http.put<boolean>('/hrm/employee/education-experience/update', data)
}

/** 删除员工教育经历 */
export function deleteEmployeeEducationExperience(id: number) {
  return http.delete<boolean>(`/hrm/employee/education-experience/delete?id=${id}`)
}
