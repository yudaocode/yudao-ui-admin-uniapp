import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 物资消耗行 */
export interface WmItemConsumeLine {
  id: number
  feedbackId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  quantity?: number
  unitName?: string
  batchCode?: string
}

/** 根据报工编号分页获取消耗行列表 */
export function getItemConsumeLinePage(params: PageParam) {
  return http.get<PageResult<WmItemConsumeLine>>('/mes/wm/item-consume-line/page', params)
}
