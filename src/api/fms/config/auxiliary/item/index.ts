import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** FMS 辅助核算项目 */
export interface AuxiliaryItem {
  id?: number
  accountSetId: number // 账套编号
  auxiliaryTypeId: number // 辅助核算类别编号
  code: string // 项目编码
  name: string // 项目名称
  remark?: string // 备注
  specification?: string // 规格（存货类别）
  unit?: string // 单位（存货类别）
  status?: number // 状态（0 启用、1 停用）
  createTime?: string // 创建时间
}

/** 查询辅助核算项目分页 */
export function getAuxiliaryItemPage(
  params: PageParam & { accountSetId: number, auxiliaryTypeId: number, search?: string },
) {
  return http.get<PageResult<AuxiliaryItem>>('/fms/config/auxiliary-item/page', params)
}

/** 查询辅助核算项目精简列表（作为凭证分录辅助核算选项） */
export function getAuxiliaryItemSimpleList(accountSetId: number, auxiliaryTypeId: number) {
  return http.get<AuxiliaryItem[]>('/fms/config/auxiliary-item/simple-list', { accountSetId, auxiliaryTypeId })
}

/** 新增辅助核算项目 */
export function createAuxiliaryItem(data: AuxiliaryItem) {
  return http.post<number>('/fms/config/auxiliary-item/create', data)
}

/** 修改辅助核算项目 */
export function updateAuxiliaryItem(data: AuxiliaryItem) {
  return http.put<boolean>('/fms/config/auxiliary-item/update', data)
}

/** 删除辅助核算项目（后端为批量接口，单个删除传单个编号） */
export function deleteAuxiliaryItem(accountSetId: number, id: number) {
  return http.delete<boolean>('/fms/config/auxiliary-item/delete-list', { accountSetId, ids: `${id}` })
}

/** 修改辅助核算项目状态 */
export function updateAuxiliaryItemStatus(accountSetId: number, id: number, status: number) {
  return http.put<boolean>('/fms/config/auxiliary-item/update-status', { accountSetId, id, status })
}
