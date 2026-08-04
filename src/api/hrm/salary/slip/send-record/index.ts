import type { PageParam, PageResult } from '@/http/types'
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

/** 获得工资条发放记录分页 */
export function getSalarySlipSendRecordPage(params: PageParam) {
  return http.get<PageResult<SalarySlipSendRecord>>('/hrm/salary/slip-send-record/page', params)
}

/** 获得工资条发放记录详情 */
export function getSalarySlipSendRecord(id: number) {
  return http.get<SalarySlipSendRecord>(`/hrm/salary/slip-send-record/get?id=${id}`)
}

/** 删除工资条发放记录 */
export function deleteSalarySlipSendRecord(id: number) {
  return http.delete<boolean>(`/hrm/salary/slip-send-record/delete?id=${id}`)
}
