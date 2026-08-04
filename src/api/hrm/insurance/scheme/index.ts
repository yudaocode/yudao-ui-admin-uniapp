import { http } from '@/http/http'

/** 社保方案项目 */
export interface InsuranceSchemeProject {
  id?: number // 社保方案项目编号
  schemeId?: number // 社保方案编号
  type?: number // 项目类型
  name?: string // 项目名称
  baseAmount?: number // 缴纳基数
  corporateRate?: number // 公司缴纳比例
  personalRate?: number // 个人缴纳比例
  corporateAmount?: number // 公司缴纳金额
  personalAmount?: number // 个人缴纳金额
  createTime?: Date | string | number // 创建时间
}

/** 社保方案 */
export interface InsuranceScheme {
  id?: number // 社保方案编号
  name: string // 方案名称
  areaId?: number // 参保地区编号
  areaName?: string // 参保地区
  householdType?: string // 户籍类型
  type?: number // 方案类型
  projectList?: InsuranceSchemeProject[] // 全部社保项目
  socialSecurityProjectList?: InsuranceSchemeProject[] // 社保项目
  providentFundProjectList?: InsuranceSchemeProject[] // 公积金项目
  personalInsuranceAmount?: number // 个人社保金额
  corporateInsuranceAmount?: number // 公司社保金额
  personalProvidentFundAmount?: number // 个人公积金金额
  corporateProvidentFundAmount?: number // 公司公积金金额
  useCount?: number // 使用人数
  monthRecordCount?: number // 历史月记录数
  createTime?: Date | string | number // 创建时间
}

/** 创建社保方案 */
export function createInsuranceScheme(data: InsuranceScheme) {
  return http.post<number>('/hrm/insurance/scheme/create', data)
}

/** 修改社保方案 */
export function updateInsuranceScheme(data: InsuranceScheme) {
  return http.put<boolean>('/hrm/insurance/scheme/update', data)
}

/** 删除社保方案 */
export function deleteInsuranceScheme(id: number) {
  return http.delete<boolean>(`/hrm/insurance/scheme/delete?id=${id}`)
}

/** 查询社保方案详情 */
export function getInsuranceScheme(id: number) {
  return http.get<InsuranceScheme>(`/hrm/insurance/scheme/get?id=${id}`)
}

/** 查询社保方案列表 */
export function getInsuranceSchemeList() {
  return http.get<InsuranceScheme[]>('/hrm/insurance/scheme/list')
}

/** 查询社保方案精简列表 */
export function getInsuranceSchemeSimpleList() {
  return http.get<InsuranceScheme[]>('/hrm/insurance/scheme/simple-list')
}
