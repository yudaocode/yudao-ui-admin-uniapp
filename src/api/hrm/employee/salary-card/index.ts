import { http } from '@/http/http'

/** 员工工资卡 */
export interface EmployeeSalaryCard {
  id?: number // 工资卡编号
  employeeId?: number // 员工编号
  bankCardNumber?: string // 银行卡号
  bankAreaId?: number // 开户地区编号
  bankAreaName?: string // 开户地区名称
  bankName?: string // 银行名称
  bankBranchName?: string // 开户支行名称
  createTime?: Date | string | number // 创建时间
}

/** 查询员工工资卡 */
export function getEmployeeSalaryCard(employeeId: number) {
  return http.get<EmployeeSalaryCard>('/hrm/employee/salary-card/get', { employeeId })
}

/** 保存员工工资卡 */
export function saveEmployeeSalaryCard(data: EmployeeSalaryCard) {
  return http.put<number>('/hrm/employee/salary-card/save', data)
}

/** 删除员工工资卡 */
export function deleteEmployeeSalaryCard(employeeId: number) {
  return http.delete<boolean>(`/hrm/employee/salary-card/delete?employeeId=${employeeId}`)
}
