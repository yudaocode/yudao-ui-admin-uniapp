import type { SalaryOptionValue } from '@/api/hrm/salary/config/option'
import { http } from '@/http/http'

/** 员工调薪记录 */
export interface SalaryChangeRecord {
  id?: number // 调薪记录编号
  employeeId?: number // 员工编号
  recordType?: number // 记录类型
  changeReason?: number // 调薪原因
  effectTime?: number // 生效时间
  beforeTotal?: number // 调整前转正工资
  afterTotal?: number // 调整后转正工资
  probationBeforeTotal?: number // 调整前试用期工资
  probationAfterTotal?: number // 调整后试用期工资
  status?: number // 状态
  remark?: string // 备注
  salaryOptions?: SalaryOptionValue[] // 转正工资项
  probationSalaryOptions?: SalaryOptionValue[] // 试用期工资项
  createTime?: Date | string | number // 创建时间
}

/** 获得员工调薪记录 */
export function getSalaryChangeRecord(id: number) {
  return http.get<SalaryChangeRecord>('/hrm/salary/change-record/get', { id })
}

/** 获得员工调薪记录列表 */
export function getSalaryChangeRecordList(employeeId: number) {
  return http.get<SalaryChangeRecord[]>('/hrm/salary/change-record/list', { employeeId })
}

/** 取消员工调薪记录 */
export function cancelSalaryChangeRecord(id: number) {
  return http.put<boolean>(`/hrm/salary/change-record/cancel?id=${id}`)
}

/** 删除员工调薪记录 */
export function deleteSalaryChangeRecord(id: number) {
  return http.delete<boolean>(`/hrm/salary/change-record/delete?id=${id}`)
}
