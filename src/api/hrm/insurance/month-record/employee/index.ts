import type { PageParam, PageResult } from '@/http/types'
import type { Employee } from '@/api/hrm/employee'
import { http } from '@/http/http'

/** 员工月度社保项目 */
export interface InsuranceMonthEmployeeProject {
  schemeProjectId?: number // 来源社保方案项目编号
  type?: number // 项目类型
  name?: string // 项目名称
  baseAmount?: number // 缴纳基数
  corporateRate?: number // 公司缴纳比例
  personalRate?: number // 个人缴纳比例
  corporateAmount?: number // 公司缴纳金额
  personalAmount?: number // 个人缴纳金额
}

/** 员工月度社保 */
export interface InsuranceMonthEmployeeRecord {
  id?: number // 员工月度社保记录编号
  monthRecordId?: number // 月度社保表编号
  employeeId?: number // 员工编号
  employeeName?: string // 员工姓名
  jobNumber?: string // 工号
  sex?: number // 性别
  age?: number // 年龄
  mobile?: string // 手机号
  idNumber?: string // 证件号码
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  postName?: string // 职位名称
  entryStatus?: number // 入职状态
  employeeStatus?: number // 员工状态
  entryTime?: Date | string | number // 入职时间
  schemeId?: number // 社保方案编号
  schemeName?: string // 社保方案名称
  areaId?: number // 参保地区编号
  areaName?: string // 参保地区
  houseType?: string // 户籍类型
  schemeType?: number // 方案类型
  socialSecurityNumber?: string // 社保账号
  accumulationFundNumber?: string // 公积金账号
  year?: number // 年份
  month?: number // 月份
  personalInsuranceAmount?: number // 个人社保金额
  personalProvidentFundAmount?: number // 个人公积金金额
  corporateInsuranceAmount?: number // 公司社保金额
  corporateProvidentFundAmount?: number // 公司公积金金额
  status?: number // 参保状态
  socialSecurityProjectList: InsuranceMonthEmployeeProject[] // 社保项目
  providentFundProjectList: InsuranceMonthEmployeeProject[] // 公积金项目
  createTime?: Date | string | number // 创建时间
}

/** 员工月度社保项目调整请求 */
export interface InsuranceMonthEmployeeProjectUpdateReq {
  schemeProjectId: number // 社保方案项目编号
  baseAmount?: number // 缴纳基数
  corporateAmount?: number // 公司缴纳金额
  personalAmount?: number // 个人缴纳金额
}

/** 修改员工月度社保项目请求 */
export interface InsuranceMonthEmployeeUpdateReq {
  id: number // 员工月度社保记录编号
  schemeId: number // 社保方案编号
  projects: InsuranceMonthEmployeeProjectUpdateReq[] // 社保项目数组
}

/** 员工停止参保请求 */
export interface InsuranceMonthEmployeeStopListReq {
  ids: number[] // 员工月度社保记录编号数组
}

/** 添加参保人员请求 */
export interface InsuranceMonthEmployeeCreateListReq {
  monthRecordId: number // 月度社保表编号
  employeeIds: number[] // 员工编号数组
}

/** 查询员工月度社保分页 */
export function getInsuranceMonthEmployeeRecordPage(params: PageParam) {
  return http.get<PageResult<InsuranceMonthEmployeeRecord>>('/hrm/insurance/month-employee-record/page', params)
}

/** 查询员工月度社保详情 */
export function getInsuranceMonthEmployeeRecord(id: number) {
  return http.get<InsuranceMonthEmployeeRecord>(`/hrm/insurance/month-employee-record/get?id=${id}`)
}

/** 修改员工月度参保项目 */
export function updateInsuranceMonthEmployeeRecord(data: InsuranceMonthEmployeeUpdateReq) {
  return http.put<boolean>('/hrm/insurance/month-employee-record/update', data)
}

/** 停止员工月度参保 */
export function stopInsuranceMonthEmployeeRecordList(data: InsuranceMonthEmployeeStopListReq) {
  return http.put<boolean>('/hrm/insurance/month-employee-record/stop-list', data)
}

/** 添加月度参保人员 */
export function createInsuranceMonthEmployeeRecordList(data: InsuranceMonthEmployeeCreateListReq) {
  return http.post<boolean>('/hrm/insurance/month-employee-record/create-list', data)
}

/** 查询本月未参保员工 */
export function getUninsuredEmployeeList(monthRecordId: number) {
  return http.get<Employee[]>(
    `/hrm/insurance/month-employee-record/uninsured-employee-list?monthRecordId=${monthRecordId}`,
  )
}
