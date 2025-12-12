import { http } from '@/http/http'

/** 流程分类 */
export interface Category {
  id: number
  name: string
  code: string
}

/** 获取流程分类简单列表 */
export function getCategorySimpleList() {
  return http.get<Category[]>('/bpm/category/simple-list')
}
