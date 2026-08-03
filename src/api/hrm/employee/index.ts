import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 员工档案 */
export interface Employee {
  id?: number // 员工编号
  name: string // 员工姓名
  jobNumber?: string // 工号
  mobile?: string // 手机号
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  postName?: string // 职位名称
  type?: number // 聘用形式
  entryTime?: Date | string | number // 入职时间
  status?: number // 员工状态
}

/** 员工部门统计 */
export interface EmployeeDeptStatistics {
  deptId: number // 部门编号
  activeCount: number // 在职员工人数
  fullTimeCount: number // 全职员工人数
  nonFullTimeCount: number // 非全职员工人数
}

/** 查询员工分页 */
export function getEmployeePage(params: PageParam) {
  return http.get<PageResult<Employee>>('/hrm/employee/page', params)
}

/** 查询员工部门统计 */
export function getEmployeeDeptStatistics() {
  return http.get<EmployeeDeptStatistics[]>('/hrm/employee/dept-statistics')
}
