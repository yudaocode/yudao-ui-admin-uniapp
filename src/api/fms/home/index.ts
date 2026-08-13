import { http } from '@/http/http'

/** FMS 首页指标 */
export interface FmsHomeMetric {
  key: string // 指标标识
  name: string // 指标名称
  amount: number // 指标金额
}

/** FMS 首页指标趋势 */
export interface FmsHomeTrend {
  month: string // 会计期间，格式为 YYYY-MM
  metrics: FmsHomeMetric[] // 动态财务指标
  income: number // 收入
  operatingCost: number // 成本
  profit: number // 利润
  expense: number // 费用
  other: number // 其他
}

/** FMS 首页信息 */
export interface FmsHome {
  currentMonth: string // 当前会计期间，格式为 YYYY-MM
  metrics: FmsHomeMetric[] // 当期财务指标
  trends: FmsHomeTrend[] // 财务指标趋势
}

/** FMS 首页指标趋势明细 */
export interface FmsHomeMetricTrend {
  month: string // 会计期间，格式为 YYYY-MM
  amount: number // 指标金额
}

/** FMS 首页指标科目构成 */
export interface FmsHomeMetricStructure {
  subjectId: number // 科目编号
  subjectCode: string // 科目编码
  subjectName: string // 科目名称
  amount: number // 科目金额
}

/** FMS 首页指标明细 */
export interface FmsHomeMetricDetail {
  key: string // 指标标识
  name: string // 指标名称
  trends: FmsHomeMetricTrend[] // 财务指标趋势
  structure: FmsHomeMetricStructure[] // 当期科目构成
}

/** 查询首页数据 */
export function getFmsHome(accountSetId: number) {
  return http.get<FmsHome>('/fms/home/get', { accountSetId })
}

/** 查询首页财务指标明细 */
export function getFmsHomeMetricDetail(accountSetId: number, metricKey: string) {
  return http.get<FmsHomeMetricDetail>('/fms/home/metric-detail', { accountSetId, metricKey })
}
