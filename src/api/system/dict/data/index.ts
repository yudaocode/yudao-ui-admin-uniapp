import { http } from '@/http/http'

/** 字典数据 */
export interface DictData {
  id?: number
  dictType: string
  label: string
  value: string
  colorType?: string
  cssClass?: string
  sort?: number
  status: number
  remark?: string
  createTime?: string
}

/** 查询字典数据（精简）列表 */
export function getSimpleDictDataList() {
  return http.get<DictData[]>('/system/dict-data/simple-list')
}
