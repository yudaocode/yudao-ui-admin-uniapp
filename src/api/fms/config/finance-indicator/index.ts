import { http } from '@/http/http'

/** FMS 财务指标 */
export interface FinanceIndicator {
  id?: number
  accountSetId: number // 账套编号
  name: string // 指标名称
  code: string // 指标编码
  type: number // 取数报表类型
  formula: string // 指标公式
  sort: number // 展示顺序
  status: number // 状态
  createTime?: number // 创建时间
}

/** 查询财务指标详情 */
export function getFinanceIndicator(accountSetId: number, id: number) {
  return http.get<FinanceIndicator>('/fms/config/finance-indicator/get', { accountSetId, id })
}

/** 查询财务指标列表 */
export function getFinanceIndicatorList(accountSetId: number) {
  return http.get<FinanceIndicator[]>('/fms/config/finance-indicator/list', { accountSetId })
}

/** 新增财务指标 */
export function createFinanceIndicator(data: FinanceIndicator) {
  return http.post<number>('/fms/config/finance-indicator/create', data)
}

/** 修改财务指标 */
export function updateFinanceIndicator(data: FinanceIndicator) {
  return http.put<boolean>('/fms/config/finance-indicator/update', data)
}

/** 删除财务指标 */
export function deleteFinanceIndicator(accountSetId: number, id: number) {
  return http.delete<boolean>('/fms/config/finance-indicator/delete', undefined, { accountSetId, id })
}
