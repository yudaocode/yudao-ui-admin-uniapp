import { http } from '@/http/http'

/** FMS 结账期间操作参数 */
export interface ClosingPeriodReq {
  accountSetId: number // 账套编号
  month: string // 目标会计期间，格式为 YYYY-MM
}

/** FMS 结账概况 */
export interface ClosingOverview {
  month: string // 会计期间
  closed: boolean // 是否已结账
  voucherReviewRequired: boolean // 是否要求凭证审核
  pendingVoucherCount: number // 未审核凭证数量
  voucherCount: number // 凭证数量
  profitLossBalance: number // 损益类科目余额
  balanceSheetDifference: number // 资产负债表差额
  profitLossVoucherId?: number // 结转损益凭证编号
  initialBalanceBalanced: boolean // 初始余额是否试算平衡
  voucherNumberContinuous: boolean // 凭证编号是否连续
  profitLossVoucherGenerated: boolean // 需要结转损益时是否已生成凭证
  incomeStatementBalanced: boolean // 利润表勾稽是否平衡
  incomeStatementUnmappedSubjectCount: number // 利润表未纳入公式的科目数量
  balanceSheetProfitLossTransferred: boolean // 资产负债表损益是否已结转
  balanceSheetBalanced: boolean // 资产负债表是否平衡
  balanceSheetUnmappedSubjectCount: number // 资产负债表未纳入公式的科目数量
  canClose: boolean // 是否满足全部结账条件
}

/** 查询当前会计期间 */
export function getCurrentMonth(accountSetId: number) {
  return http.get<string>('/fms/closing/period/current-month', { accountSetId })
}

/** 查询结账概况 */
export function getClosingOverview(params: ClosingPeriodReq) {
  return http.get<ClosingOverview>('/fms/closing/period/overview', params)
}

/** 结账 */
export function closePeriod(data: ClosingPeriodReq) {
  return http.put<boolean>('/fms/closing/period/close', data)
}

/** 反结账 */
export function cancelClosePeriod(params: ClosingPeriodReq) {
  return http.delete<boolean>('/fms/closing/period/cancel', undefined, params)
}
