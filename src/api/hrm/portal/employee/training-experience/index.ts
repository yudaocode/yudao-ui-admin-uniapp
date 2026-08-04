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

/** 获得当前员工的培训经历列表 */
export function getPortalEmployeeTrainingExperienceList() {
  return http.get<EmployeeTrainingExperience[]>('/hrm/portal/employee/training-experience/list')
}
