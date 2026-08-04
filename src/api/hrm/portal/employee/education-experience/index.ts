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

/** 获得当前员工的教育经历列表 */
export function getPortalEmployeeEducationExperienceList() {
  return http.get<EmployeeEducationExperience[]>('/hrm/portal/employee/education-experience/list')
}
