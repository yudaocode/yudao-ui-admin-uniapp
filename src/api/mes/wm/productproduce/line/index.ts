import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 产品产出行 */
export interface WmProductProduceLine {
  id: number
  feedbackId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  quantity?: number
  unitMeasureName?: string
  batchCode?: string
  qualityStatus?: number
}

/** 获取产品产出行分页 */
export function getProductProduceLinePage(params: PageParam) {
  return http.get<PageResult<WmProductProduceLine>>('/mes/wm/product-produce-line/page', params)
}
