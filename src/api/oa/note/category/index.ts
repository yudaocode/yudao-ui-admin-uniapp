import { http } from '@/http/http'

/** OA 笔记目录信息 */
export interface NoteCategory {
  id?: number // 目录编号
  name: string // 目录名称
  sort: number // 显示排序
  createTime?: string // 创建时间
}

/** 查询笔记目录列表 */
export function getNoteCategoryList() {
  return http.get<NoteCategory[]>('/oa/note-category/list')
}

/** 查询目录精简列表 */
export function getSimpleNoteCategoryList() {
  return http.get<NoteCategory[]>('/oa/note-category/simple-list')
}

/** 创建笔记目录 */
export function createNoteCategory(data: NoteCategory) {
  return http.post<number>('/oa/note-category/create', data)
}

/** 更新笔记目录 */
export function updateNoteCategory(data: NoteCategory) {
  return http.put<boolean>('/oa/note-category/update', data)
}

/** 删除笔记目录 */
export function deleteNoteCategory(id: number) {
  return http.delete<boolean>(`/oa/note-category/delete?id=${id}`)
}
