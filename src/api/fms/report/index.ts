import { http } from '@/http/http'

/** FMS 财务报表项目（利润表、现金流量表行） */
export interface ReportItem {
  id: number // 配置编号
  name: string // 项目名称
  rowNo?: number // 行次
  level?: number // 层级
  editable?: boolean // 是否可编辑公式
  formula?: string // 公式
  openingAmount?: number // 期初金额
  closingAmount?: number // 期末金额
  yearAmount?: number // 本年累计金额
  currentAmount?: number // 本期金额
}

/** FMS 资产负债表行（资产、负债和所有者权益两侧项目同一行返回） */
export interface BalanceSheetRow {
  rowId: number // 行编号
  assetId?: number // 资产项目配置编号
  assetName?: string // 资产项目名称
  assetRowNo?: number // 资产项目行次
  assetClosingAmount?: number // 资产项目期末余额
  assetOpeningAmount?: number // 资产项目年初余额
  assetLevel?: number // 资产项目层级
  assetEditable?: boolean // 资产项目是否可编辑公式
  assetFormula?: string // 资产项目公式
  liabilityId?: number // 负债和所有者权益项目配置编号
  liabilityName?: string // 负债和所有者权益项目名称
  liabilityRowNo?: number // 负债和所有者权益项目行次
  liabilityClosingAmount?: number // 负债和所有者权益项目期末余额
  liabilityOpeningAmount?: number // 负债和所有者权益项目年初余额
  liabilityLevel?: number // 负债和所有者权益项目层级
  liabilityEditable?: boolean // 负债和所有者权益项目是否可编辑公式
  liabilityFormula?: string // 负债和所有者权益项目公式
}

/** 查询资产负债表 */
export function getBalanceSheet(accountSetId: number, startMonth: string, endMonth: string) {
  return http.get<BalanceSheetRow[]>('/fms/report/balance-sheet/get', { accountSetId, startMonth, endMonth })
}

/** 查询利润表 */
export function getIncomeStatement(accountSetId: number, startMonth: string, endMonth: string) {
  return http.get<ReportItem[]>('/fms/report/income-statement/get', { accountSetId, startMonth, endMonth })
}

/** 查询现金流量表 */
export function getCashFlowStatement(accountSetId: number, startMonth: string, endMonth: string) {
  return http.get<ReportItem[]>('/fms/report/cash-flow-statement/get', { accountSetId, startMonth, endMonth })
}
