import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'
import { downloadApiFile } from '@/utils/download'

/** MES SN 码分组 */
export interface WmSnGroup {
  uuid?: string
  count?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitName?: string
  batchCode?: string
  workOrderId?: number
  createTime?: Date
}

/** MES SN 码明细 */
export interface WmSn {
  id: number
  uuid?: string
  code?: string
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitName?: string
  batchCode?: string
  workOrderId?: number
  createTime?: Date
}

/** MES SN 码生成参数 */
export interface WmSnGenerate {
  itemId: number
  batchCode?: string
  workOrderId?: number
  count: number
}

/** 生成 SN 码 */
export function generateSnCodes(data: WmSnGenerate) {
  return http.post<boolean>('/mes/wm/sn/generate', data)
}

/** 获得 SN 码分组分页 */
export function getSnGroupPage(params: PageParam) {
  return http.get<PageResult<WmSnGroup>>('/mes/wm/sn/group-page', params)
}

/** 获得批次 SN 码明细列表 */
export function getSnListByUuid(uuid: string) {
  return http.get<WmSn[]>('/mes/wm/sn/list-by-uuid', { uuid })
}

/** 批量删除 SN 码（按批次 UUID） */
export function deleteSnBatch(uuid: string) {
  return http.delete<boolean>('/mes/wm/sn/delete-batch', undefined, { uuid })
}

/** 导出 SN 码分组 */
export function exportSnGroupExcel(params: Record<string, any>) {
  return downloadApiFile('/mes/wm/sn/group-export-excel', params, 'SN码分组.xls')
}

/** 导出批次 SN 码明细 */
export function exportSnDetailExcel(uuid: string) {
  return downloadApiFile('/mes/wm/sn/export-excel', { uuid }, 'SN码明细.xls')
}
