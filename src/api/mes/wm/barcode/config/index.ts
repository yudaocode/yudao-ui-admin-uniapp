import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 条码配置 */
export interface WmBarcodeConfig {
  id?: number
  format?: number
  bizType?: number
  contentFormat: string
  contentExample?: string
  autoGenerateFlag: boolean
  defaultTemplate?: string
  status: number
  remark?: string
  createTime?: Date
}

/** 查询条码配置分页 */
export function getBarcodeConfigPage(params: PageParam) {
  return http.get<PageResult<WmBarcodeConfig>>('/mes/wm/barcode-config/page', params)
}

/** 查询条码配置详情 */
export function getBarcodeConfig(id: number) {
  return http.get<WmBarcodeConfig>(`/mes/wm/barcode-config/get?id=${id}`)
}

/** 新增条码配置 */
export function createBarcodeConfig(data: WmBarcodeConfig) {
  return http.post<number>('/mes/wm/barcode-config/create', data)
}

/** 修改条码配置 */
export function updateBarcodeConfig(data: WmBarcodeConfig) {
  return http.put<boolean>('/mes/wm/barcode-config/update', data)
}

/** 删除条码配置 */
export function deleteBarcodeConfig(id: number) {
  return http.delete<boolean>(`/mes/wm/barcode-config/delete?id=${id}`)
}
