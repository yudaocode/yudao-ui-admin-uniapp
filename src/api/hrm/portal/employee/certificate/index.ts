import { http } from '@/http/http'

/** 员工证书 */
export interface EmployeeCertificate {
  id?: number // 证书编号
  employeeId?: number // 员工编号
  name?: string // 证书名称
  level?: string // 证书级别
  no?: string // 证书编码
  startTime?: Date | string | number // 有效开始日期
  endTime?: Date | string | number // 有效结束日期
  issuingAuthority?: string // 发证机构
  issuingTime?: Date | string | number // 发证日期
  remark?: string // 备注
  sort?: number // 排序
  createTime?: Date | string | number // 创建时间
}

/** 获得当前员工的证书列表 */
export function getPortalEmployeeCertificateList() {
  return http.get<EmployeeCertificate[]>('/hrm/portal/employee/certificate/list')
}
