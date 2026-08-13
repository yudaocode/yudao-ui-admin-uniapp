import { http } from '@/http/http'

/** FMS 凭证模板分录辅助核算项目 */
export interface VoucherTemplateAuxiliaryItem {
  type?: number // 辅助核算类型
  typeId: number // 辅助核算类别编号
  itemId: number // 辅助核算项目编号
  name?: string // 辅助核算项目名称
}

/** FMS 凭证模板分录 */
export interface VoucherTemplateEntry {
  digest: string // 摘要内容
  subjectId: number // 科目编号
  quantity?: number // 数量
  unitPrice?: number // 单价
  debitAmount?: number // 借方金额
  creditAmount?: number // 贷方金额
  auxiliaries: VoucherTemplateAuxiliaryItem[] // 辅助核算项目数组
}

/** FMS 凭证模板 */
export interface VoucherTemplate {
  id?: number // 模板编号
  accountSetId: number // 账套编号
  name: string // 模板名称
  categoryId: number // 分类编号
  categoryName?: string // 分类名称
  entries: VoucherTemplateEntry[] // 凭证模板分录数组
}

/** 查询凭证模板列表 */
export function getVoucherTemplateList(accountSetId: number) {
  return http.get<VoucherTemplate[]>('/fms/config/voucher-template/list', { accountSetId })
}

/** 查询凭证模板精简列表（主要用于录凭证时套用凭证模板） */
export function getVoucherTemplateSimpleList(accountSetId: number) {
  return http.get<VoucherTemplate[]>('/fms/config/voucher-template/simple-list', { accountSetId })
}

/** 新增凭证模板 */
export function createVoucherTemplate(data: VoucherTemplate) {
  return http.post<number>('/fms/config/voucher-template/create', data)
}

/** 修改凭证模板 */
export function updateVoucherTemplate(data: VoucherTemplate) {
  return http.put<boolean>('/fms/config/voucher-template/update', data)
}

/** 删除凭证模板 */
export function deleteVoucherTemplate(accountSetId: number, id: number) {
  return http.delete<boolean>('/fms/config/voucher-template/delete', { accountSetId, id })
}
