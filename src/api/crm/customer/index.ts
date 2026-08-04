import type { TransferReq } from '@/api/crm/permission'
import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'
import { downloadApiFile } from '@/utils/download'

/** 客户 */
export interface Customer {
  id?: number
  name: string
  followUpStatus?: boolean
  contactLastTime?: Date | string | number
  contactLastContent?: string
  contactNextTime?: Date | string | number
  ownerUserId?: number
  ownerUserName?: string
  ownerUserDept?: string
  lockStatus?: boolean
  dealStatus?: boolean
  mobile?: string
  telephone?: string
  qq?: string
  wechat?: string
  email?: string
  areaId?: number
  areaName?: string
  detailAddress?: string
  industryId?: number
  level?: number
  source?: number
  remark?: string
  creator?: string
  creatorName?: string
  createTime?: Date | string
  updateTime?: Date | string
}

/** 查询客户分页列表 */
export function getCustomerPage(params: PageParam) {
  return http.get<PageResult<Customer>>('/crm/customer/page', params)
}

/** 查询待进入公海客户分页列表 */
export function getPutPoolRemindCustomerPage(params: PageParam) {
  return http.get<PageResult<Customer>>('/crm/customer/put-pool-remind-page', params)
}

/** 获得待进入公海客户数量 */
export function getPutPoolRemindCustomerCount() {
  return http.get<number>('/crm/customer/put-pool-remind-count')
}

/** 获得今日需联系客户数量 */
export function getTodayContactCustomerCount() {
  return http.get<number>('/crm/customer/today-contact-count')
}

/** 获得分配给我且待跟进的客户数量 */
export function getFollowCustomerCount() {
  return http.get<number>('/crm/customer/follow-count')
}

/** 查询客户详情 */
export function getCustomer(id: number) {
  return http.get<Customer>(`/crm/customer/get?id=${id}`)
}

/** 新增客户 */
export function createCustomer(data: Customer) {
  return http.post<number>('/crm/customer/create', data)
}

/** 修改客户 */
export function updateCustomer(data: Customer) {
  return http.put<boolean>('/crm/customer/update', data)
}

/** 更新客户成交状态 */
export function updateCustomerDealStatus(id: number, dealStatus: boolean) {
  return http.put<boolean>('/crm/customer/update-deal-status', undefined, { id, dealStatus })
}

/** 删除客户 */
export function deleteCustomer(id: number) {
  return http.delete<boolean>(`/crm/customer/delete?id=${id}`)
}

/** 导出客户 Excel */
export function exportCustomer(params: Record<string, any>) {
  return downloadApiFile('/crm/customer/export-excel', params, '客户.xls')
}

/** 获得客户精简列表 */
export function getCustomerSimpleList() {
  return http.get<Customer[]>('/crm/customer/simple-list')
}

/** 客户转移 */
export function transferCustomer(data: TransferReq) {
  return http.put<boolean>('/crm/customer/transfer', data)
}

/** 锁定或解锁客户 */
export function lockCustomer(id: number, lockStatus: boolean) {
  return http.put<boolean>('/crm/customer/lock', { id, lockStatus })
}

/** 领取公海客户 */
export function receiveCustomer(ids: number[]) {
  return http.put<boolean>('/crm/customer/receive', undefined, { ids: ids.join(',') })
}

/** 分配公海客户 */
export function distributeCustomer(ids: number[], ownerUserId: number) {
  return http.put<boolean>('/crm/customer/distribute', { ids, ownerUserId })
}

/** 客户放入公海 */
export function putCustomerPool(id: number) {
  return http.put<boolean>(`/crm/customer/put-pool?id=${id}`)
}
