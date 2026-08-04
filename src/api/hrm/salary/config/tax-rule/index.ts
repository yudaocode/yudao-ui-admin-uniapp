import { http } from '@/http/http'

/** 计税规则 */
export interface SalaryTaxRule {
  id?: number // 计税规则编号
  name: string // 计税规则名称
  type?: number // 计税类型
  taxEnabled?: boolean // 是否计税
  threshold?: number // 起征阈值
  decimalScale?: number // 小数位数
  cycleType?: number // 计税周期类型
  usedGroupCount?: number // 使用该规则的薪资组数量
  createTime?: Date | string | number // 创建时间
}

/** 创建计税规则 */
export function createSalaryTaxRule(data: SalaryTaxRule) {
  return http.post<number>('/hrm/salary/tax-rule/create', data)
}

/** 修改计税规则 */
export function updateSalaryTaxRule(data: SalaryTaxRule) {
  return http.put<boolean>('/hrm/salary/tax-rule/update', data)
}

/** 删除计税规则 */
export function deleteSalaryTaxRule(id: number) {
  return http.delete<boolean>(`/hrm/salary/tax-rule/delete?id=${id}`)
}

/** 获得计税规则详情 */
export function getSalaryTaxRule(id: number) {
  return http.get<SalaryTaxRule>(`/hrm/salary/tax-rule/get?id=${id}`)
}

/** 获得计税规则列表 */
export function getSalaryTaxRuleList() {
  return http.get<SalaryTaxRule[]>('/hrm/salary/tax-rule/list')
}
