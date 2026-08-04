import { http } from '@/http/http'

/** 月度社保表 */
export interface InsuranceMonthRecord {
  id?: number // 月度社保表编号
  title?: string // 标题
  year?: number // 年份
  month?: number // 月份
  insuredEmployeeCount?: number // 参保人数
  stoppedEmployeeCount?: number // 停止参保人数
  status?: number // 状态
  personalInsuranceAmount?: number // 个人社保金额
  personalProvidentFundAmount?: number // 个人公积金金额
  corporateInsuranceAmount?: number // 公司社保金额
  corporateProvidentFundAmount?: number // 公司公积金金额
  createTime?: Date | string | number // 创建时间
}

/** 月度社保表创建请求 */
export interface InsuranceMonthRecordCreateReq {
  year: number // 年份
  month: number // 月份
}

/** 创建首月社保表 */
export function createFirstInsuranceMonthRecord(data: InsuranceMonthRecordCreateReq) {
  return http.post<number>('/hrm/insurance/month-record/create-first', data)
}

/** 新建次月社保表 */
export function createNextInsuranceMonthRecord() {
  return http.post<number>('/hrm/insurance/month-record/create-next')
}

/** 删除月度社保表 */
export function deleteInsuranceMonthRecord(id: number) {
  return http.delete<boolean>(`/hrm/insurance/month-record/delete?id=${id}`)
}

/** 查询月度社保表详情 */
export function getInsuranceMonthRecord(id: number) {
  return http.get<InsuranceMonthRecord>(`/hrm/insurance/month-record/get?id=${id}`)
}

/** 查询最近月度社保表 */
export function getLastInsuranceMonthRecord() {
  return http.get<InsuranceMonthRecord>('/hrm/insurance/month-record/last')
}

/** 查询月度社保表列表 */
export function getInsuranceMonthRecordList(year?: number) {
  return http.get<InsuranceMonthRecord[]>('/hrm/insurance/month-record/list', { year })
}
