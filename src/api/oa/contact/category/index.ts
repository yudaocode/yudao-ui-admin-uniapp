import { http } from '@/http/http'

/** OA 联系人分类信息 */
export interface ContactCategory {
  id?: number // 分类编号
  name: string // 分类名称
  sort: number // 显示排序
  createTime?: string // 创建时间
}

/** 查询联系人分类列表 */
export function getContactCategoryList() {
  return http.get<ContactCategory[]>('/oa/contact-category/list')
}

/** 查询分类精简列表 */
export function getSimpleContactCategoryList() {
  return http.get<ContactCategory[]>('/oa/contact-category/simple-list')
}

/** 创建联系人分类 */
export function createContactCategory(data: ContactCategory) {
  return http.post<number>('/oa/contact-category/create', data)
}

/** 更新联系人分类 */
export function updateContactCategory(data: ContactCategory) {
  return http.put<boolean>('/oa/contact-category/update', data)
}

/** 删除联系人分类 */
export function deleteContactCategory(id: number) {
  return http.delete<boolean>(`/oa/contact-category/delete?id=${id}`)
}
