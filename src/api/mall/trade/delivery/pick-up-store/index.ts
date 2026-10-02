import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 自提门店 */
export interface DeliveryPickUpStore {
  id?: number
  name?: string
  introduction?: string
  phone?: string
  areaId?: number
  areaName?: string
  detailAddress?: string
  logo?: string
  openingTime?: string
  closingTime?: string
  latitude?: number
  longitude?: number
  status?: number
  verifyUserIds?: number[]
  verifyUsers?: { id?: number, nickname?: string }[]
  createTime?: string
}

/** 获取自提门店分页列表 */
export function getDeliveryPickUpStorePage(params: PageParam) {
  return http.get<PageResult<DeliveryPickUpStore>>('/trade/delivery/pick-up-store/page', params)
}

/** 获取自提门店详情 */
export function getDeliveryPickUpStore(id: number) {
  return http.get<DeliveryPickUpStore>(`/trade/delivery/pick-up-store/get?id=${id}`)
}

/** 获取自提门店精简列表 */
export function getSimpleDeliveryPickUpStoreList() {
  return http.get<DeliveryPickUpStore[]>('/trade/delivery/pick-up-store/simple-list')
}

/** 创建自提门店 */
export function createDeliveryPickUpStore(data: DeliveryPickUpStore) {
  return http.post<number>('/trade/delivery/pick-up-store/create', data as Record<string, any>)
}

/** 更新自提门店 */
export function updateDeliveryPickUpStore(data: DeliveryPickUpStore) {
  return http.put<boolean>('/trade/delivery/pick-up-store/update', data as Record<string, any>)
}

/** 删除自提门店 */
export function deleteDeliveryPickUpStore(id: number) {
  return http.delete<boolean>(`/trade/delivery/pick-up-store/delete?id=${id}`)
}

/** 绑定自提店员 */
export function bindDeliveryPickUpStoreStaff(data: Record<string, any>) {
  return http.post<boolean>('/trade/delivery/pick-up-store/bind', data)
}
