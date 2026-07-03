import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 来料检验单行 */
export interface QcIqcLine {
  id: number // 编号
  iqcId: number // 来料检验单 ID
  indicatorId: number // 检测指标 ID
  indicatorCode?: string // 检测指标编码
  indicatorName?: string // 检测指标名称
  indicatorType?: number // 检测指标类型
  tool?: string // 检测工具
  checkMethod?: string // 检测方法
  standardValue?: number // 标准值
  unitMeasureId?: number // 计量单位 ID
  unitMeasureName?: string // 计量单位名称
  maxThreshold?: number // 误差上限
  minThreshold?: number // 误差下限
  criticalQuantity?: number // 致命缺陷数量
  majorQuantity?: number // 严重缺陷数量
  minorQuantity?: number // 轻微缺陷数量
  remark?: string // 备注
  createTime?: Date // 创建时间
}

/** 查询来料检验单行分页 */
export function getIqcLinePage(params: PageParam) {
  return http.get<PageResult<QcIqcLine>>('/mes/qc/iqc/line/page', params)
}

/** 查询来料检验单行详情 */
export function getIqcLine(id: number) {
  return http.get<QcIqcLine>(`/mes/qc/iqc/line/get?id=${id}`)
}
