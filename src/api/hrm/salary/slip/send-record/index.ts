import type { PageParam, PageResult } from '@/http/types'
import type { SalarySlipTemplateOption } from '@/api/hrm/salary/slip/template'
import { http } from '@/http/http'

/** 工资条发放记录 */
export interface SalarySlipSendRecord {
  id?: number // 工资条发放记录编号
  monthRecordId?: number // 月度工资表编号
  employeeCount?: number // 工资条数量
  sendEmployeeCount?: number // 发放数量
  readCount?: number // 已查看数量
  year?: number // 年份
  month?: number // 月份
  creator?: string // 创建人编号
  creatorName?: string // 创建人姓名
  createTime?: Date | string | number // 创建时间
}

/** 工资条发送请求 */
export interface SalarySlipSendReq {
  monthRecordId: number // 月度工资表编号
  hideEmpty: boolean // 是否隐藏空工资项
  options: SalarySlipTemplateOption[] // 本次发放的工资条模板项
  all: boolean // 是否发放全部筛选结果
  employeeIds?: number[] // 员工编号数组
  search?: string // 员工姓名、工号或手机号
  deptId?: number // 部门编号
  sent?: boolean // 是否已发送
}

/** 工资条待发员工 */
export interface SalarySlipSendEmployee {
  monthEmployeeRecordId: number // 员工月度工资记录编号
  employeeId: number // 员工编号
  employeeName?: string // 员工姓名
  jobNumber?: string // 工号
  mobile?: string // 手机号
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  postName?: string // 岗位名称
  expectedPaySalary?: number // 应发工资
  realPaySalary?: number // 实发工资
  sent: boolean // 是否已发送
}

/** 获得工资条发放记录分页 */
export function getSalarySlipSendRecordPage(params: PageParam) {
  return http.get<PageResult<SalarySlipSendRecord>>('/hrm/salary/slip-send-record/page', params)
}

/** 获得工资条发放记录详情 */
export function getSalarySlipSendRecord(id: number) {
  return http.get<SalarySlipSendRecord>(`/hrm/salary/slip-send-record/get?id=${id}`)
}

/** 发送工资条 */
export function sendSalarySlip(data: SalarySlipSendReq) {
  return http.post<number>('/hrm/salary/slip-send-record/create', data)
}

/** 获得工资条待发员工分页 */
export function getSalarySlipSendEmployeePage(params: PageParam) {
  return http.get<PageResult<SalarySlipSendEmployee>>('/hrm/salary/slip-send-record/employee-page', params)
}

/** 删除工资条发放记录 */
export function deleteSalarySlipSendRecord(id: number) {
  return http.delete<boolean>(`/hrm/salary/slip-send-record/delete?id=${id}`)
}
