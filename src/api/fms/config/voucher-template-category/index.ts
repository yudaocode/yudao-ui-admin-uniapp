import { http } from '@/http/http'

/** FMS 凭证模板分类 */
export interface VoucherTemplateCategory {
  id?: number // 分类编号
  accountSetId: number // 账套编号
  name: string // 分类名称
}

/** 查询凭证模板分类列表 */
export function getVoucherTemplateCategoryList(accountSetId: number) {
  return http.get<VoucherTemplateCategory[]>('/fms/config/voucher-template-category/list', { accountSetId })
}

/** 查询凭证模板分类精简列表（主要用于前端的下拉选项） */
export function getVoucherTemplateCategorySimpleList(accountSetId: number) {
  return http.get<VoucherTemplateCategory[]>('/fms/config/voucher-template-category/simple-list', { accountSetId })
}

/** 新增凭证模板分类 */
export function createVoucherTemplateCategory(data: VoucherTemplateCategory) {
  return http.post<number>('/fms/config/voucher-template-category/create', data)
}

/** 修改凭证模板分类 */
export function updateVoucherTemplateCategory(data: VoucherTemplateCategory) {
  return http.put<boolean>('/fms/config/voucher-template-category/update', data)
}

/** 删除凭证模板分类 */
export function deleteVoucherTemplateCategory(accountSetId: number, id: number) {
  return http.delete<boolean>('/fms/config/voucher-template-category/delete', undefined, { accountSetId, id })
}
