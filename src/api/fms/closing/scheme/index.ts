import { http } from '@/http/http'

/** FMS 结账方案列表查询参数 */
export interface ClosingSchemeListReq {
  accountSetId: number // 账套编号
  month: string // 会计期间，格式为 YYYY-MM
}

/** FMS 结账方案科目规则 */
export interface ClosingSchemeSubjectRule {
  subjectId?: number // 科目编号
  subjectCode?: string // 科目编码快照
  digest: string // 摘要
  direction: number // 借贷方向
  amountRatio: number // 金额比例
}

/** FMS 结账方案 */
export interface ClosingScheme {
  id: number // 方案编号
  accountSetId: number // 账套编号
  name: string // 方案名称
  type: number // 方案类型
  periodEnd: boolean // 是否期末结转
  subjectId?: number // 来源科目编号
  formulaRule?: number // 取数规则
  timeType?: number // 取数时间类型
  voucherWordId?: number // 凭证字编号
  digest?: string // 凭证摘要
  voucherType?: number // 结转凭证类型
  priorYearAdjustmentSubjectId?: number // 以前年度损益调整科目编号
  adjustmentClosingSubjectId?: number // 以前年度损益调整结转科目编号
  otherClosingSubjectId?: number // 其他损益结转科目编号
  reverseBalance?: boolean // 是否按余额反向结转
  closingDay?: number // 结转日期
  subjects: ClosingSchemeSubjectRule[] // 结转科目规则数组
  balance: number // 待结转金额
  voucherIds: number[] // 当前期间已生成凭证编号数组
}

/** 查询结账方案列表 */
export function getClosingSchemeList(params: ClosingSchemeListReq) {
  return http.get<ClosingScheme[]>('/fms/closing/scheme/list', params)
}
