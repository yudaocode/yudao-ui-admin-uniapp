import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** OA 联系人共享记录 */
export interface ContactShare {
  id: number // 共享记录编号
  creatorName?: string // 实际共享人昵称
  userId: number // 共享接收人用户编号
  userName?: string // 共享接收人用户昵称
  userAvatar?: string // 共享接收人用户头像
  categoryId?: number // 接收人的分类编号
  categoryName?: string // 接收人的分类名称
  handleStatus: boolean // 处理状态
  createTime: string // 共享时间
}

/** OA 联系人信息 */
export interface Contact {
  id?: number // 联系人编号
  ownerUserId?: number // 创建人用户编号
  ownerUserName?: string // 创建人用户昵称
  categoryId?: number // 分类编号
  categoryName?: string // 分类名称
  name: string // 姓名
  pinyin?: string // 姓名拼音
  sex?: number // 性别
  mobile?: string // 手机号码
  email?: string // 邮箱
  address?: string // 地址
  companyName?: string // 公司名称
  companyPhone?: string // 公司电话
  avatar?: string // 头像地址
  remark?: string // 备注
  shares?: ContactShare[] // 共享记录列表
  share?: ContactShare // 当前行的共享关系，仅我共享的列表返回
  sharerName?: string // 分享给当前用户的共享人昵称
  handleStatus?: boolean // 当前接收人的处理状态
  sharedCategoryId?: number // 当前接收人的分类编号
  sharedCategoryName?: string // 当前接收人的分类名称
  createTime?: string // 创建时间
}

/** 查询我的联系人分页 */
export function getMyContactPage(params: PageParam) {
  return http.get<PageResult<Contact>>('/oa/contact/my-page', params)
}

/** 查询共享给我的联系人分页 */
export function getReceivedContactPage(params: PageParam) {
  return http.get<PageResult<Contact>>('/oa/contact/received-page', params)
}

/** 查询我共享的联系人分页 */
export function getSharedContactPage(params: PageParam) {
  return http.get<PageResult<Contact>>('/oa/contact/shared-page', params)
}

/** 查询联系人详情 */
export function getContact(id: number) {
  return http.get<Contact>(`/oa/contact/get?id=${id}`)
}

/** 创建联系人 */
export function createContact(data: Contact) {
  return http.post<number>('/oa/contact/create', data)
}

/** 更新联系人 */
export function updateContact(data: Contact) {
  return http.put<boolean>('/oa/contact/update', data)
}

/** 删除联系人 */
export function deleteContact(id: number) {
  return http.delete<boolean>(`/oa/contact/delete?id=${id}`)
}

/** 删除接收到的共享联系人 */
export function deleteReceivedContact(contactId: number) {
  return http.delete<boolean>(`/oa/contact/delete-received?contactId=${contactId}`)
}

/** 共享联系人 */
export function shareContact(contactId: number, userIds: number[]) {
  return http.post<boolean>('/oa/contact/share', { contactId, userIds })
}

/** 处理联系人共享（归类到我的分类） */
export function handleContactShare(contactId: number, categoryId?: number) {
  return http.put<boolean>('/oa/contact/handle-share', { contactId, categoryId })
}
