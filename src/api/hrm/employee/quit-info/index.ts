import { http } from '@/http/http'

/** 员工离职信息 */
export interface EmployeeQuitInfo {
  id?: number // 离职信息编号
  employeeId?: number // 员工编号
  planQuitTime?: Date | string | number // 计划离职时间
  applyQuitTime?: Date | string | number // 申请离职时间
  salarySettlementTime?: Date | string | number // 薪资结算时间
  type?: number // 离职类型
  reason?: number // 离职原因
  remark?: string // 备注
  oldEmployeeStatus?: number // 原员工状态
  createTime?: Date | string | number // 创建时间
}

/** 查询员工离职信息 */
export function getEmployeeQuitInfo(employeeId: number) {
  return http.get<EmployeeQuitInfo>('/hrm/employee/quit-info/get', { employeeId })
}
