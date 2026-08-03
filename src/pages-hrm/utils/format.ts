import { getDictLabel } from '@/hooks/useDict'

/** 格式化带千分位的 HRM 金额 */
export function formatHrmMoneyWithThousands(value?: number | null): string {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** 格式化 HRM 分析项的字典分类 */
export function formatHrmAnalysisDictType(dictType: string, type: number | null): string {
  return type === null ? '未填写' : getDictLabel(dictType, type) || '未知'
}

/** 格式化 HRM 分析项的区间分类 */
export function formatHrmAnalysisRangeType(
  rangeNames: Record<number, string>,
  type: number | null,
): string {
  return type === null ? '未填写' : rangeNames[type] || '未知'
}
