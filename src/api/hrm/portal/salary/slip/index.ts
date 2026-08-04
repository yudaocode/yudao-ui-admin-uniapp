import { http } from '@/http/http'

/** 员工端工资条薪资项 */
export interface SalarySlipOption {
  name: string // 薪资项名称
  type?: number // 薪资项类型
  code?: number // 薪资项编码
  value?: number // 薪资项金额
  remark?: string // 备注
  sort?: number // 排序
  children?: SalarySlipOption[] // 子薪资项
}

/** 员工端工资条 */
export interface SalarySlip {
  id: number // 工资条编号
  sendRecordId?: number // 工资条批次编号
  monthEmployeeRecordId?: number // 员工月度工资记录编号
  employeeId: number // 员工编号
  year: number // 年份
  month: number // 月份
  readStatus?: number // 阅读状态
  realPaySalary?: number // 实发工资
  remark?: string // 备注
  createTime?: Date | string | number // 创建时间
  options: SalarySlipOption[] // 薪资项列表
}

/** 员工端工资条列表查询 */
export interface SalarySlipListReq {
  startMonth?: string // 开始月份 YYYY-MM
  endMonth?: string // 结束月份 YYYY-MM
  orderType?: number // 排序字段类型
  order?: number // 排序方式
}

/** 员工端未读工资条概况 */
export interface SalarySlipUnreadSummary {
  unreadCount: number // 未读工资条数量
  reminder?: string // 最新未读工资条提醒
}

/** 获得我的工资条列表 */
export function getSalarySlipList(params?: SalarySlipListReq) {
  return http.get<SalarySlip[]>('/hrm/portal/salary/slip/list', params)
}

/** 获得我的工资条详情 */
export function getSalarySlip(id: number) {
  return http.get<SalarySlip>(`/hrm/portal/salary/slip/get?id=${id}`)
}

/** 获得我的未读工资条概况 */
export function getUnreadSalarySlipSummary() {
  return http.get<SalarySlipUnreadSummary>('/hrm/portal/salary/slip/unread-summary')
}

/** 标记我的工资条为已读 */
export function markSalarySlipRead(ids: number[]) {
  return http.put<boolean>('/hrm/portal/salary/slip/read', undefined, { ids: ids.join(',') })
}
