import { http } from '@/http/http'

/** 员工合同 */
export interface EmployeeContract {
  id?: number // 合同编号
  employeeId?: number // 员工编号
  no?: string // 合同编码
  type?: number // 合同类型
  startTime?: Date | string | number // 合同开始日期
  endTime?: Date | string | number // 合同结束日期
  term?: number // 合同期限
  status?: number // 合同状态
  signCompany?: string // 签约公司
  signTime?: Date | string | number // 合同签订日期
  remark?: string // 备注
  expireRemind?: boolean // 是否到期提醒
  fileUrls?: string[] // 附件地址数组
  sort?: number // 排序
  createTime?: Date | string | number // 创建时间
}

/** 查询员工合同列表 */
export function getEmployeeContractList(employeeId: number) {
  return http.get<EmployeeContract[]>('/hrm/employee/contract/list', { employeeId })
}

/** 新增员工合同 */
export function createEmployeeContract(data: EmployeeContract) {
  return http.post<number>('/hrm/employee/contract/create', data)
}

/** 修改员工合同 */
export function updateEmployeeContract(data: EmployeeContract) {
  return http.put<boolean>('/hrm/employee/contract/update', data)
}

/** 删除员工合同 */
export function deleteEmployeeContract(id: number) {
  return http.delete<boolean>(`/hrm/employee/contract/delete?id=${id}`)
}
