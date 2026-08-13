import { http } from '@/http/http'

/** FMS 辅助核算类别 */
export interface AuxiliaryType {
  id?: number
  accountSetId: number // 账套编号
  name: string // 类别名称
  type?: number // 辅助核算类型
  systemPreset?: boolean // 是否系统预置
}

/** 查询辅助核算类别列表 */
export function getAuxiliaryTypeList(accountSetId: number) {
  return http.get<AuxiliaryType[]>('/fms/config/auxiliary-type/list', { accountSetId })
}

/** 查询辅助核算类别精简列表（作为科目辅助核算选项） */
export function getAuxiliaryTypeSimpleList(accountSetId: number) {
  return http.get<AuxiliaryType[]>('/fms/config/auxiliary-type/simple-list', { accountSetId })
}

/** 新增辅助核算类别（后端固定创建为自定义类型） */
export function createAuxiliaryType(data: AuxiliaryType) {
  return http.post<number>('/fms/config/auxiliary-type/create', data)
}

/** 修改辅助核算类别 */
export function updateAuxiliaryType(data: AuxiliaryType) {
  return http.put<boolean>('/fms/config/auxiliary-type/update', data)
}

/** 删除辅助核算类别 */
export function deleteAuxiliaryType(accountSetId: number, id: number) {
  return http.delete<boolean>('/fms/config/auxiliary-type/delete', { accountSetId, id })
}
