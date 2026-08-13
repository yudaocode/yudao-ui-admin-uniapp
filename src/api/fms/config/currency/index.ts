import { http } from '@/http/http'

/** FMS 币别 */
export interface Currency {
  id?: number
  accountSetId: number // 账套编号
  code: string // 币别编码
  name: string // 币别名称
  exchangeRate: number // 汇率
  standard?: boolean // 是否本位币
  createTime?: string // 创建时间
}

/** 查询币别列表 */
export function getCurrencyList(accountSetId: number) {
  return http.get<Currency[]>('/fms/config/currency/list', { accountSetId })
}

/** 查询币别精简列表 */
export function getCurrencySimpleList(accountSetId: number) {
  return http.get<Currency[]>('/fms/config/currency/simple-list', { accountSetId })
}

/** 新增币别 */
export function createCurrency(data: Currency) {
  return http.post<number>('/fms/config/currency/create', data)
}

/** 修改币别 */
export function updateCurrency(data: Currency) {
  return http.put<boolean>('/fms/config/currency/update', data)
}

/** 删除币别 */
export function deleteCurrency(accountSetId: number, id: number) {
  return http.delete<boolean>('/fms/config/currency/delete', { accountSetId, id })
}
