import { http } from '@/http/http'

/** 计薪配置 */
export interface SalaryConfig {
  id?: number // 配置编号
  cycleStartDay?: number // 计薪周期开始日
  cycleEndDay?: number // 计薪周期结束日
  socialSecurityMonthType?: number // 社保对应月份类型
  startYear?: number // 工资开始年份
  startMonth?: number // 工资开始月份
  createTime?: Date | string | number // 创建时间
}

/** 计薪配置创建请求 */
export interface SalaryConfigCreateReq {
  cycleStartDay: number // 计薪周期开始日
  socialSecurityMonthType: number // 社保对应月份类型
  startYear: number // 工资开始年份
  startMonth: number // 工资开始月份
}

/** 计薪配置更新请求 */
export interface SalaryConfigUpdateReq {
  socialSecurityMonthType: number // 社保对应月份类型
}

/** 创建计薪配置 */
export function createSalaryConfig(data: SalaryConfigCreateReq) {
  return http.post<number>('/hrm/salary/config/create', data)
}

/** 更新对应社保自然月 */
export function updateSalaryConfig(data: SalaryConfigUpdateReq) {
  return http.put<boolean>('/hrm/salary/config/update', data)
}

/** 获得计薪配置 */
export function getSalaryConfig() {
  return http.get<SalaryConfig>('/hrm/salary/config/get')
}
