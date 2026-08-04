import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 薪资组 */
export interface SalaryGroup {
  id?: number // 薪资组编号
  name: string // 薪资组名称
  salaryStandard?: number // 月计薪标准
  changeRule?: string // 转正、调薪月规则
  taxRuleId?: number // 计税规则编号
  taxRuleName?: string // 计税规则名称
  deptIds?: number[] // 适用部门编号列表
  deptNames?: string[] // 适用部门名称列表
  employeeIds?: number[] // 适用员工编号列表
  employeeNames?: string[] // 适用员工名称列表
  createTime?: Date | string | number // 创建时间
}

/** 创建薪资组 */
export function createSalaryGroup(data: SalaryGroup) {
  return http.post<number>('/hrm/salary/group/create', data)
}

/** 修改薪资组 */
export function updateSalaryGroup(data: SalaryGroup) {
  return http.put<boolean>('/hrm/salary/group/update', data)
}

/** 删除薪资组 */
export function deleteSalaryGroup(id: number) {
  return http.delete<boolean>(`/hrm/salary/group/delete?id=${id}`)
}

/** 获得薪资组详情 */
export function getSalaryGroup(id: number) {
  return http.get<SalaryGroup>(`/hrm/salary/group/get?id=${id}`)
}

/** 获得薪资组分页 */
export function getSalaryGroupPage(params: PageParam) {
  return http.get<PageResult<SalaryGroup>>('/hrm/salary/group/page', params)
}

/** 获得薪资组精简列表 */
export function getSalaryGroupSimpleList() {
  return http.get<SalaryGroup[]>('/hrm/salary/group/simple-list')
}
