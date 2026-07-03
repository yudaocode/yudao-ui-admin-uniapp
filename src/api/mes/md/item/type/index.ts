import { http } from '@/http/http'

/** MES 物料产品分类 */
export interface MdItemType {
  id?: number // 分类编号
  parentId?: number // 父分类编号
  code?: string // 分类编码
  name?: string // 分类名称
  itemOrProduct?: string // 物料/产品标识
  sort?: number // 显示排序
  status?: number // 状态
  remark?: string // 备注
  createTime?: Date // 创建时间
  children?: MdItemType[] // 子分类列表
  parentName?: string // 父分类名称
}

/** 查询物料产品分类列表（全量树形数据） */
export function getItemTypeList(params?: Record<string, any>) {
  return http.get<MdItemType[]>(`/mes/md/item-type/list`, params)
}

/** 查询物料产品分类精简列表 */
export function getItemTypeSimpleList() {
  return http.get<MdItemType[]>(`/mes/md/item-type/simple-list`)
}

/** 查询物料产品分类详情 */
export function getItemType(id: number) {
  return http.get<MdItemType>(`/mes/md/item-type/get?id=${id}`)
}

/** 新增物料产品分类 */
export function createItemType(data: MdItemType) {
  return http.post<number>(`/mes/md/item-type/create`, data)
}

/** 修改物料产品分类 */
export function updateItemType(data: MdItemType) {
  return http.put<boolean>(`/mes/md/item-type/update`, data)
}

/** 删除物料产品分类 */
export function deleteItemType(id: number) {
  return http.delete<boolean>(`/mes/md/item-type/delete?id=${id}`)
}
