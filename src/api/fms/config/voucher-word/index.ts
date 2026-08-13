import { http } from '@/http/http'

/** FMS 凭证字 */
export interface VoucherWord {
  id?: number
  accountSetId: number // 账套编号
  name: string // 凭证字
  printTitle?: string // 打印标题
  defaultStatus: boolean // 是否默认凭证字
  sort?: number // 显示顺序
  createTime?: number // 创建时间
}

/** 查询凭证字列表 */
export function getVoucherWordList(accountSetId: number) {
  return http.get<VoucherWord[]>('/fms/config/voucher-word/list', { accountSetId })
}

/** 查询凭证字精简列表 */
export function getVoucherWordSimpleList(accountSetId: number) {
  return http.get<VoucherWord[]>('/fms/config/voucher-word/simple-list', { accountSetId })
}

/** 新增凭证字 */
export function createVoucherWord(data: VoucherWord) {
  return http.post<number>('/fms/config/voucher-word/create', data)
}

/** 修改凭证字 */
export function updateVoucherWord(data: VoucherWord) {
  return http.put<boolean>('/fms/config/voucher-word/update', data)
}

/** 删除凭证字 */
export function deleteVoucherWord(accountSetId: number, id: number) {
  return http.delete<boolean>('/fms/config/voucher-word/delete', undefined, { accountSetId, id })
}
