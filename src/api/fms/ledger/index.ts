import { http } from '@/http/http'

/** FMS 账簿行类型（对齐后端 FmsLedgerDetailRespVO 的 ROW_TYPE 常量） */
export const FmsLedgerRowType = {
  OPENING: 1, // 期初余额
  VOUCHER: 2, // 凭证分录
  PERIOD_TOTAL: 3, // 本期合计
  YEAR_TOTAL: 4, // 本年累计
  ENDING: 5, // 期末余额
} as const

/** FMS 账簿查询参数（对齐后端 FmsLedgerListReqVO） */
export interface LedgerListReq {
  accountSetId: number // 账套编号
  startMonth: string // 开始会计期间，格式 YYYY-MM
  endMonth: string // 结束会计期间，格式 YYYY-MM
  subjectId?: number // 科目编号
  startSubjectId?: number // 起始科目编号
  endSubjectId?: number // 结束科目编号
  minLevel?: number // 最小科目级次
  maxLevel?: number // 最大科目级次
}

/** FMS 辅助核算账簿查询参数（对齐后端 FmsLedgerAuxiliaryListReqVO） */
export interface LedgerAuxiliaryListReq {
  accountSetId: number // 账套编号
  startMonth: string // 开始会计期间，格式 YYYY-MM
  endMonth: string // 结束会计期间，格式 YYYY-MM
  auxiliaryTypeId: number // 辅助核算类别编号
  subjectId?: number // 科目编号
  auxiliaryItemId?: number // 辅助核算项目编号
}

/** FMS 账簿明细行（对齐后端 FmsLedgerDetailRespVO） */
export interface LedgerDetail {
  rowType: number // 行类型
  entryId?: number // 分录编号
  entrySubjectId?: number // 分录科目编号
  subjectId: number // 科目编号
  subjectCode: string // 科目编码
  subjectName: string // 科目名称
  period: string // 会计期间
  accountDate?: string // 日期
  voucherId?: number // 凭证编号
  voucherNumber?: string // 凭证字号
  digest: string // 摘要
  debitAmount: number // 借方金额
  creditAmount: number // 贷方金额
  balanceDirection: string // 余额方向
  balance: number // 余额
  debitQuantity: number // 借方数量
  creditQuantity: number // 贷方数量
  balanceQuantity: number // 结存数量
  unitPrice?: number // 单价
  quantityUnit?: string // 计量单位
  columnAmounts?: Record<number, number> // 多栏账科目金额 Map
}

/** FMS 总账行（对齐后端 FmsLedgerGeneralRespVO） */
export interface LedgerGeneral {
  rowType: number // 行类型
  subjectId: number // 科目编号
  subjectCode: string // 科目编码
  subjectName: string // 科目名称
  period: string // 会计期间
  digest: string // 摘要
  debitAmount: number // 借方金额
  creditAmount: number // 贷方金额
  balanceDirection: string // 余额方向
  balance: number // 余额
}

/** FMS 科目余额节点（对齐后端 FmsLedgerSubjectBalanceRespVO） */
export interface LedgerSubjectBalance {
  nodeKey: string // 节点唯一键
  nodeType: number // 节点类型：1 科目、2 辅助核算组合
  subjectId: number // 科目编号
  assistCombinationId?: number // 辅助核算组合编号
  subjectCode: string // 科目编码
  subjectName: string // 科目名称
  level: number // 科目级次
  quantityAccounting: boolean // 是否启用数量核算
  quantityUnit?: string // 计量单位
  openingDebitAmount: number // 期初借方余额
  openingCreditAmount: number // 期初贷方余额
  openingBalanceDirection: string // 期初余额方向
  openingQuantity: number // 期初数量
  openingUnitPrice: number // 期初单价
  periodDebitAmount: number // 本期借方发生额
  periodCreditAmount: number // 本期贷方发生额
  periodDebitQuantity: number // 本期借方数量
  periodCreditQuantity: number // 本期贷方数量
  yearDebitAmount: number // 本年累计借方发生额
  yearCreditAmount: number // 本年累计贷方发生额
  yearDebitQuantity: number // 本年累计借方数量
  yearCreditQuantity: number // 本年累计贷方数量
  endingDebitAmount: number // 期末借方余额
  endingCreditAmount: number // 期末贷方余额
  endingBalanceDirection: string // 期末余额方向
  endingQuantity: number // 期末数量
  endingUnitPrice: number // 期末单价
  children: LedgerSubjectBalance[] // 下级科目或辅助核算组合数组
}

/** FMS 多栏账科目列（对齐后端 FmsLedgerMultiColumnRespVO.Column） */
export interface LedgerMultiColumnColumn {
  subjectId: number // 科目编号
  subjectCode: string // 科目编码
  subjectName: string // 科目名称
  balanceDirection: number // 余额方向
}

/** FMS 多栏账（对齐后端 FmsLedgerMultiColumnRespVO） */
export interface LedgerMultiColumn {
  columns: LedgerMultiColumnColumn[] // 动态科目列数组
  rows: LedgerDetail[] // 账簿行数组
}

/** FMS 核算项目明细账行（对齐后端 FmsLedgerAuxiliaryDetailRespVO） */
export interface LedgerAuxiliaryDetail {
  rowType: number // 行类型
  entryId?: number // 分录编号
  subjectId: number // 科目编号
  subjectCode: string // 科目编码
  subjectName: string // 科目名称
  period: string // 会计期间
  accountDate?: string // 日期
  voucherId?: number // 凭证编号
  voucherNumber?: string // 凭证字号
  digest: string // 摘要
  debitAmount: number // 借方金额
  creditAmount: number // 贷方金额
  balanceDirection: string // 余额方向
  balance: number // 余额
}

/** FMS 核算项目余额（对齐后端 FmsLedgerAuxiliaryBalanceRespVO） */
export interface LedgerAuxiliaryBalance {
  auxiliaryItemId: number // 辅助核算项目编号
  code: string // 项目编码
  name: string // 项目名称
  openingDebitAmount: number // 期初借方余额
  openingCreditAmount: number // 期初贷方余额
  periodDebitAmount: number // 本期借方发生额
  periodCreditAmount: number // 本期贷方发生额
  yearDebitAmount: number // 本年累计借方发生额
  yearCreditAmount: number // 本年累计贷方发生额
  endingDebitAmount: number // 期末借方余额
  endingCreditAmount: number // 期末贷方余额
}

/** FMS 数量金额明细账行（对齐后端 FmsLedgerQuantityDetailRespVO） */
export interface LedgerQuantityDetail {
  rowType: number // 行类型
  entryId?: number // 分录编号
  subjectId: number // 科目编号
  subjectCode: string // 科目编码
  subjectName: string // 科目名称
  period: string // 会计期间
  accountDate?: string // 日期
  voucherId?: number // 凭证编号
  voucherNumber?: string // 凭证字号
  digest: string // 摘要
  debitAmount: number // 借方金额
  creditAmount: number // 贷方金额
  balanceDirection: string // 余额方向
  balance: number // 结存金额
  debitQuantity: number // 借方数量
  creditQuantity: number // 贷方数量
  balanceQuantity: number // 结存数量
  unitPrice?: number // 分录单价
  openingUnitPrice?: number // 期初单价
  periodUnitPrice?: number // 本期单价
  yearUnitPrice?: number // 累计单价
  endingUnitPrice?: number // 期末单价
  quantityUnit?: string // 计量单位
}

/** FMS 数量金额总账行（对齐后端 FmsLedgerQuantityGeneralRespVO） */
export interface LedgerQuantityGeneral {
  subjectId: number // 科目编号
  subjectCode: string // 科目编码
  subjectName: string // 科目名称
  level: number // 科目级次
  quantityAccounting: boolean // 是否启用数量核算
  quantityUnit?: string // 计量单位
  openingBalanceDirection: string // 期初余额方向
  openingQuantity: number // 期初数量
  openingUnitPrice: number // 期初单价
  openingDebitAmount: number // 期初借方余额
  openingCreditAmount: number // 期初贷方余额
  openingAmount: number // 期初金额
  periodDebitQuantity: number // 本期借方数量
  periodDebitAmount: number // 本期借方发生额
  periodCreditQuantity: number // 本期贷方数量
  periodCreditAmount: number // 本期贷方发生额
  yearDebitQuantity: number // 本年累计借方数量
  yearDebitAmount: number // 本年累计借方发生额
  yearCreditQuantity: number // 本年累计贷方数量
  yearCreditAmount: number // 本年累计贷方发生额
  endingBalanceDirection: string // 期末余额方向
  endingQuantity: number // 期末数量
  endingUnitPrice: number // 期末单价
  endingDebitAmount: number // 期末借方余额
  endingCreditAmount: number // 期末贷方余额
  endingAmount: number // 期末金额
  children: LedgerQuantityGeneral[] // 下级科目数组
}

/** FMS 明细账科目（指定期间有发生额的科目，含父级节点） */
export interface LedgerDetailSubject {
  id?: number // 科目编号
  parentId: number // 上级科目编号
  code: string // 科目编码
  name: string // 科目名称
  type: number // 科目类型
  balanceDirection: number // 余额方向
  status?: number // 状态
  level?: number // 层级
  auxiliaryTypeIds?: number[] // 辅助核算类别编号数组
  quantityAccounting?: boolean // 是否启用数量核算
  quantityUnit?: string // 数量单位
}

/** 查询明细账 */
export function getLedgerDetailList(params: LedgerListReq) {
  return http.get<LedgerDetail[]>('/fms/ledger/detail/list', params)
}

/** 查询指定期间有发生额的明细账科目（后端未单独配置权限，跟随登录用户） */
export function getLedgerDetailSubjectList(params: LedgerListReq) {
  return http.get<LedgerDetailSubject[]>('/fms/ledger/detail/subject-list', params)
}

/** 查询总账 */
export function getLedgerGeneralList(params: LedgerListReq) {
  return http.get<LedgerGeneral[]>('/fms/ledger/general/list', params)
}

/** 查询科目余额表 */
export function getLedgerSubjectBalanceList(params: LedgerListReq) {
  return http.get<LedgerSubjectBalance[]>('/fms/ledger/subject-balance/list', params)
}

/** 查询多栏账 */
export function getLedgerMultiColumn(params: LedgerListReq) {
  return http.get<LedgerMultiColumn>('/fms/ledger/multi-column/list', params)
}

/** 查询核算项目明细账 */
export function getLedgerAuxiliaryDetailList(params: LedgerAuxiliaryListReq) {
  return http.get<LedgerAuxiliaryDetail[]>('/fms/ledger/auxiliary-detail/list', params)
}

/** 查询核算项目余额表 */
export function getLedgerAuxiliaryBalanceList(params: LedgerAuxiliaryListReq) {
  return http.get<LedgerAuxiliaryBalance[]>('/fms/ledger/auxiliary-balance/list', params)
}

/** 查询数量金额明细账 */
export function getLedgerQuantityDetailList(params: LedgerListReq) {
  return http.get<LedgerQuantityDetail[]>('/fms/ledger/quantity-detail/list', params)
}

/** 查询数量金额总账 */
export function getLedgerQuantityGeneralList(params: LedgerListReq) {
  return http.get<LedgerQuantityGeneral[]>('/fms/ledger/quantity-general/list', params)
}
