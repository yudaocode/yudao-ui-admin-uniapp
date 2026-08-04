import { http } from '@/http/http'

/** 员工参保信息 */
export interface InsuranceEmployeeInfo {
  id?: number // 员工参保信息编号
  employeeId?: number // 员工编号
  firstSocialSecurity?: boolean // 是否本地首次缴纳社保
  firstAccumulationFund?: boolean // 是否本地首次缴纳公积金
  socialSecurityNumber?: string // 社保账号
  accumulationFundNumber?: string // 公积金账号
  socialSecurityStartMonth?: number // 社保起缴月份
  schemeId?: number // 社保方案编号
  schemeName?: string // 社保方案名称
  createTime?: string // 创建时间
}

/** 查询员工参保信息 */
export function getInsuranceEmployeeInfo(employeeId: number) {
  return http.get<InsuranceEmployeeInfo>('/hrm/insurance/employee-info/get', { employeeId })
}

/** 保存员工参保信息 */
export function saveInsuranceEmployeeInfo(data: InsuranceEmployeeInfo) {
  return http.put<number>('/hrm/insurance/employee-info/save', data)
}

/** 更新员工参保方案 */
export function updateEmployeeScheme(employeeId: number, schemeId: number) {
  return http.put<boolean>('/hrm/insurance/employee-info/update-scheme', { employeeId, schemeId })
}
