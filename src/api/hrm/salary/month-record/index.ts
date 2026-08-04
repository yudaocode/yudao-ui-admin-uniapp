import type { PageParam, PageResult } from '@/http/types'
import type { SalaryOption, SalaryOptionValue } from '@/api/hrm/salary/config/option'
import { http } from '@/http/http'

/** 月度工资表 */
export interface SalaryMonthRecord {
  id?: number // 月度工资表编号
  title?: string // 标题
  year?: number // 年份
  month?: number // 月份
  employeeCount?: number // 计薪人数
  startTime?: string // 计薪开始时间
  endTime?: string // 计薪结束时间
  expectedPaySalary?: number // 应发工资
  personalInsuranceAmount?: number // 个人社保
  personalProvidentFundAmount?: number // 个人公积金
  personalTax?: number // 个人所得税
  realPaySalary?: number // 实发工资
  corporateInsuranceAmount?: number // 公司社保
  corporateProvidentFundAmount?: number // 公司公积金
  status?: number // 工资表状态
  optionHeaders?: SalaryOption[] // 工资项表头
  createTime?: Date | string | number // 创建时间
}

/** 薪资核算就绪员工 */
export interface SalaryPayrollReadinessEmployee {
  employeeId?: number // 员工编号
  employeeName?: string // 员工姓名
  jobNumber?: string // 工号
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  postName?: string // 职位名称
  entryStatus?: number // 入职状态
  status?: number // 员工状态
  entryTime?: Date | string | number // 入职时间
}

/** 薪资核算就绪状态 */
export interface SalaryPayrollReadiness {
  monthRecordId?: number // 月度工资表编号
  title?: string // 工资表标题
  year?: number // 年份
  month?: number // 月份
  startTime?: string // 计薪开始时间
  endTime?: string // 计薪结束时间
  socialSecurityYearMonth?: string // 社保年月
  payrollEmployeeCount?: number // 计薪人数
  salaryEmployeeCount?: number // 已定薪人数
  noSalaryEmployeeCount?: number // 未定薪人数
  noSalaryGroupEmployeeCount?: number // 未分配薪资组人数
  changeEmployeeCount?: number // 异动人数
  changeTypeCountMap?: Record<number, number> // 异动类型数量
  noSalaryEmployees?: SalaryPayrollReadinessEmployee[] // 未定薪员工
  noSalaryGroupEmployees?: SalaryPayrollReadinessEmployee[] // 未分配薪资组员工
}

/** 创建下月工资表 */
export function createNextSalaryMonthRecord() {
  return http.post<number>('/hrm/salary/month-record/create-next')
}

/** 删除月度工资表 */
export function deleteSalaryMonthRecord(id: number) {
  return http.delete<boolean>(`/hrm/salary/month-record/delete?id=${id}`)
}

/** 获得月度工资表分页 */
export function getSalaryMonthRecordPage(params: PageParam) {
  return http.get<PageResult<SalaryMonthRecord>>('/hrm/salary/month-record/page', params)
}

/** 获得月度工资表详情 */
export function getSalaryMonthRecord(id: number) {
  return http.get<SalaryMonthRecord>(`/hrm/salary/month-record/get?id=${id}`)
}

/** 获得最近月度工资表 */
export function getLastSalaryMonthRecord() {
  return http.get<SalaryMonthRecord>('/hrm/salary/month-record/last')
}

/** 获得薪资核算就绪状态 */
export function getSalaryPayrollReadiness(monthRecordId?: number) {
  return http.get<SalaryPayrollReadiness>('/hrm/salary/month-record/payroll-readiness', {
    monthRecordId,
  })
}

/** 获得月度工资薪资项汇总 */
export function getSalaryMonthOptionSummary(params: Record<string, any>) {
  return http.get<SalaryOptionValue[]>('/hrm/salary/month-record/option-summary', params)
}
