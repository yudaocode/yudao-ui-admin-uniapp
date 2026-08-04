import { http } from '@/http/http'

/** 标准参保类型 */
export interface InsuranceStandardType {
  code: string // 参保方案编码
  name: string // 参保方案名称
}

/** 标准参保项目 */
export interface InsuranceStandardProject {
  type: number // 项目类型
  name: string // 项目名称
  baseAmount?: number // 缴纳基数
  corporateRate?: number // 公司缴纳比例
  personalRate?: number // 个人缴纳比例
  corporateAmount?: number // 公司缴纳金额
  personalAmount?: number // 个人缴纳金额
}

/** 查询标准参保类型列表 */
export function getInsuranceStandardTypeList(areaId: number) {
  return http.get<InsuranceStandardType[]>('/hrm/insurance/standard/type-list', { areaId })
}

/** 查询标准参保项目列表 */
export function getInsuranceStandardProjectList(params: {
  areaId: number
  typeCode: string
}) {
  return http.get<InsuranceStandardProject[]>('/hrm/insurance/standard/project-list', params)
}
