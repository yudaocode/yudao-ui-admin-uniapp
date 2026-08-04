import type { PageParam, PageResult } from '@/http/types'
import type { SalaryOptionValue } from '@/api/hrm/salary/config/option'
import { http } from '@/http/http'

/** 员工月度工资 */
export interface SalaryMonthEmployeeRecord {
  id?: number // 员工月度工资记录编号
  monthRecordId?: number // 月度工资表编号
  employeeId?: number // 员工编号
  year?: number // 年份
  month?: number // 月份
  employeeName?: string // 员工姓名
  jobNumber?: string // 工号
  deptId?: number // 部门编号
  deptName?: string // 部门
  postName?: string // 职位名称
  actualWorkDay?: number // 实际出勤天数
  needWorkDay?: number // 应出勤天数
  expectedPaySalary?: number // 应发工资
  taxableSalary?: number // 应税工资
  personalTax?: number // 个人所得税
  realPaySalary?: number // 实发工资
  performanceCoefficient?: number // 绩效系数
  optionValues?: SalaryOptionValue[] // 工资项值
}

/** 批量修改员工月度工资请求 */
export interface SalaryMonthEmployeeRecordUpdateReq {
  id: number // 员工月度工资记录编号
  optionValues: SalaryOptionValue[] // 工资项值
}

/** 批量修改员工月度工资 */
export function updateSalaryMonthEmployeeRecordList(data: SalaryMonthEmployeeRecordUpdateReq[]) {
  return http.put<boolean>('/hrm/salary/month-employee-record/update-list', data)
}

/** 获得员工月度工资分页 */
export function getSalaryMonthEmployeeRecordPage(params: PageParam) {
  return http.get<PageResult<SalaryMonthEmployeeRecord>>(
    '/hrm/salary/month-employee-record/page',
    params,
  )
}

/** 获得指定员工的月度工资分页 */
export function getSalaryEmployeeMonthRecordPage(params: PageParam) {
  return http.get<PageResult<SalaryMonthEmployeeRecord>>(
    '/hrm/salary/month-employee-record/employee-page',
    params,
  )
}

/** 获得员工月度工资列表 */
export function getSalaryMonthEmployeeRecordList(params: {
  monthRecordId: number
  employeeId?: number
  employeeIds?: number[]
  employeeName?: string
  jobNumber?: string
  deptId?: number
  employeeChangeType?: number
  salarySlipSent?: boolean
}) {
  return http.get<SalaryMonthEmployeeRecord[]>('/hrm/salary/month-employee-record/list', params)
}

/** 获得月度工资员工变动数量 */
export function getSalaryMonthEmployeeChangeCount(params: Record<string, any>) {
  return http.get<Record<number, number>>('/hrm/salary/month-employee-record/change-count', params)
}
