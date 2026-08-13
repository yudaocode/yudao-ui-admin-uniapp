import { http } from '@/http/http'

/** FMS 初始余额金额信息 */
export interface InitialBalanceAmounts {
  openingAmount: number // 期初金额
  openingQuantity: number // 期初数量
  yearDebitAmount: number // 本年累计借方金额
  yearDebitQuantity: number // 本年累计借方数量
  yearCreditAmount: number // 本年累计贷方金额
  yearCreditQuantity: number // 本年累计贷方数量
  yearOpeningAmount: number // 年初金额
  yearOpeningQuantity: number // 年初数量
  profitLossAmount: number // 实际损益发生额
  profitLossQuantity: number // 实际损益发生数量
}

/** FMS 初始余额辅助核算配置 */
export interface InitialBalanceAuxiliaryConfig {
  auxiliaryTypeId: number // 辅助核算类别编号
  type: number // 辅助核算类型
  name: string // 辅助核算类别名称
}

/** FMS 初始余额辅助核算项目 */
export interface InitialBalanceAuxiliaryItem {
  type: number // 辅助核算类型
  typeId: number // 辅助核算类别编号
  itemId: number // 辅助核算项目编号
  name: string // 辅助核算项目名称
}

/** FMS 初始余额辅助核算余额 */
export interface InitialBalanceAssist extends InitialBalanceAmounts {
  assistCombinationId?: number // 辅助核算组合编号
  auxiliaries: InitialBalanceAuxiliaryItem[] // 辅助核算项目数组
}

/** FMS 初始余额 */
export interface InitialBalance extends InitialBalanceAmounts {
  id?: number // 初始余额编号
  subjectId: number // 科目编号
  subjectCode: string // 科目编码
  subjectName: string // 科目名称
  parentId?: number // 上级科目编号
  type: number // 科目类型
  balanceDirection: number // 余额方向
  quantityAccounting: boolean // 是否启用数量核算
  quantityUnit?: string // 数量单位
  auxiliaryAccounting: boolean // 是否启用辅助核算
  auxiliaryConfigs: InitialBalanceAuxiliaryConfig[] // 辅助核算配置数组
  assistBalances: InitialBalanceAssist[] // 辅助核算余额数组
}

/** FMS 初始余额辅助核算余额修改信息 */
export interface InitialBalanceAssistUpdate extends InitialBalanceAmounts {
  auxiliaryItemIds: number[] // 辅助核算项目编号数组
}

/** FMS 初始余额科目修改信息 */
export interface InitialBalanceUpdate extends InitialBalanceAmounts {
  subjectId: number // 科目编号
  assistBalances: InitialBalanceAssistUpdate[] // 辅助核算余额数组
}

/** FMS 初始余额保存参数 */
export interface InitialBalanceSaveReq {
  accountSetId: number // 账套编号
  balances: InitialBalanceUpdate[] // 科目余额数组
}

/** FMS 试算平衡 */
export interface TrialBalance {
  openingDebitAmount: number // 期初借方金额
  openingCreditAmount: number // 期初贷方金额
  openingDifferenceAmount: number // 期初差额
  yearDebitAmount: number // 本年累计借方金额
  yearCreditAmount: number // 本年累计贷方金额
  yearDifferenceAmount: number // 本年累计差额
  balanced: boolean // 是否平衡
}

/** 查询初始余额列表 */
export function getInitialBalanceList(accountSetId: number, subjectType: number) {
  return http.get<InitialBalance[]>('/fms/config/initial-balance/list', { accountSetId, subjectType })
}

/** 保存初始余额 */
export function saveInitialBalance(data: InitialBalanceSaveReq) {
  return http.put<boolean>('/fms/config/initial-balance/save', data)
}

/** 查询试算平衡结果 */
export function getTrialBalance(accountSetId: number) {
  return http.get<TrialBalance>('/fms/config/initial-balance/trial-balance', { accountSetId })
}
