import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 岗位信息 */
export interface Post {
  id?: number
  name: string
  code: string
  sort: number
  status: number
  remark?: string
  createTime?: string
}

/** 获取岗位分页列表 */
export function getPostPage(params: PageParam) {
  return http.get<PageResult<Post>>('/system/post/page', params)
}

/** 获取岗位精简列表 */
export function getSimplePostList() {
  return http.get<Post[]>('/system/post/simple-list')
}

/** 获取岗位详情 */
export function getPost(id: number) {
  return http.get<Post>(`/system/post/get?id=${id}`)
}

/** 创建岗位 */
export function createPost(data: Post) {
  return http.post<number>('/system/post/create', data)
}

/** 更新岗位 */
export function updatePost(data: Post) {
  return http.put<boolean>('/system/post/update', data)
}

/** 删除岗位 */
export function deletePost(id: number) {
  return http.delete<boolean>(`/system/post/delete?id=${id}`)
}
