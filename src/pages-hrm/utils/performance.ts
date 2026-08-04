import type {
  AssessmentConfig,
  AssessmentDimension,
} from '@/api/hrm/performance/assessment'
import type { ResultLevel } from '@/api/hrm/performance/config/result-template'
import {
  HrmPerformanceScoreCalculation,
  HrmPerformanceUpperLimitType,
} from '@/pages-hrm/utils/constants'

/** 创建默认考核配置 */
export function createDefaultAssessmentConfig(): AssessmentConfig {
  return {
    name: '',
    scoreCalculation: HrmPerformanceScoreCalculation.WEIGHTED,
    upperLimitType: HrmPerformanceUpperLimitType.UNIFIED,
    upperLimitScore: 100,
    dimensions: [],
  }
}

/** 校验考核维度和指标配置 */
export function validateAssessmentConfig(config?: AssessmentConfig) {
  const dimensions = config?.dimensions || []
  if (!dimensions.length) {
    return '至少需要一个考核维度'
  }
  const dimensionNames = new Set<string>()
  const quotaNames = new Set<string>()
  let dimensionTotalWeight = 0
  for (const dimension of dimensions) {
    const dimensionName = dimension.name?.trim()
    if (!dimensionName) {
      return '维度名称不能为空'
    }
    if (dimensionNames.has(dimensionName)) {
      return `维度名称（${dimensionName}）重复`
    }
    dimensionNames.add(dimensionName)
    if (!isValidWeight(dimension.weight)) {
      return `维度（${dimensionName}）权重必须在 0% 到 100% 之间`
    }
    dimensionTotalWeight += dimension.weight as number

    const quotas = dimension.quotas || []
    if (!quotas.length) {
      return `维度（${dimensionName}）至少需要一个指标`
    }
    let quotaTotalWeight = 0
    for (const quota of quotas) {
      const quotaName = quota.name?.trim()
      if (!quotaName) {
        return '指标名称不能为空'
      }
      if (!quota.standard?.trim()) {
        return `指标（${quotaName}）考核标准不能为空`
      }
      if (quotaNames.has(quotaName)) {
        return `指标名称（${quotaName}）重复`
      }
      quotaNames.add(quotaName)
      if (!isValidWeight(quota.weight)) {
        return `指标（${quotaName}）权重必须在 0% 到 100% 之间`
      }
      if (quota.scoreType === undefined || quota.scoreType === null) {
        return `指标（${quotaName}）评分方式不能为空`
      }
      quotaTotalWeight += quota.weight as number
    }
    if (dimension.allowEdit) {
      if (quotaTotalWeight > 100) {
        return `可编辑维度（${dimensionName}）指标权重总和不能大于 100%`
      }
    } else if (!isHundred(quotaTotalWeight)) {
      return `维度（${dimensionName}）指标权重总和必须等于 100%`
    }
  }
  if (!isHundred(dimensionTotalWeight)) {
    return '维度权重总和必须等于 100%'
  }
}

/** 复制考核配置，避免编辑影响原数据 */
export function cloneAssessmentConfig(config: AssessmentConfig): AssessmentConfig {
  return {
    name: config.name,
    scoreCalculation: config.scoreCalculation,
    upperLimitType: config.upperLimitType,
    upperLimitScore: config.upperLimitScore,
    dimensions: (config.dimensions || []).map(dimension => ({
      ...dimension,
      quotas: (dimension.quotas || []).map(quota => ({ ...quota })),
    })),
  }
}

/** 获得指标权重合计 */
export function getQuotaWeightTotal(dimension: AssessmentDimension) {
  return (dimension.quotas || []).reduce((total, quota) => total + Number(quota.weight || 0), 0)
}

/** 获得维度权重合计 */
export function getDimensionWeightTotal(dimensions?: AssessmentDimension[]) {
  return (dimensions || []).reduce((total, dimension) => total + Number(dimension.weight || 0), 0)
}

/** 判断权重是否为 100% */
export function isHundred(weight: number) {
  return Math.abs(weight - 100) < 0.001
}

/** 创建默认结果等级 */
export function createDefaultResultLevels(): ResultLevel[] {
  return [
    { name: 'S', minScore: 85, maxScore: 100, coefficient: 1.2 },
    { name: 'A', minScore: 75, maxScore: 84.99, coefficient: 1 },
    { name: 'B', minScore: 60, maxScore: 74.99, coefficient: 0.8 },
    { name: 'C', minScore: 0, maxScore: 59.99, coefficient: 0.6 },
  ]
}

/** 校验结果等级名称和连续分数区间 */
export function validateResultLevels(levels?: ResultLevel[]) {
  if (!levels?.length) {
    return '至少需要一个结果等级'
  }
  const names = new Set<string>()
  for (const level of levels) {
    const name = level.name?.trim()
    if (!name) {
      return '等级名称不能为空'
    }
    if (names.has(name)) {
      return `等级名称（${name}）重复`
    }
    names.add(name)
    if (!isValidPerformanceScore(level.minScore) || !isValidPerformanceScore(level.maxScore)) {
      return `等级（${name}）的分数必须在 0 到 100 之间，并最多保留两位小数`
    }
    if (level.minScore > level.maxScore) {
      return `等级（${name}）的最低分数不能大于最高分数`
    }
    if (!isValidPerformanceCoefficient(level.coefficient)) {
      return `等级（${name}）的绩效系数不能小于 0，并最多保留两位小数`
    }
  }
  const sortedLevels = [...levels].sort((left, right) => left.minScore - right.minScore)
  if (!isSameNumber(sortedLevels[0].minScore, 0)) {
    return '结果等级必须覆盖 0 分'
  }
  for (let index = 1; index < sortedLevels.length; index++) {
    if (!isSameNumber(sortedLevels[index].minScore, sortedLevels[index - 1].maxScore + 0.01)) {
      return '结果等级分数区间必须连续且不能重叠'
    }
  }
  if (!isSameNumber(sortedLevels[sortedLevels.length - 1].maxScore, 100)) {
    return '结果等级必须覆盖 100 分'
  }
}

/** 判断绩效评分是否合法 */
export function isValidPerformanceScore(score: number) {
  return Number.isFinite(score) && score >= 0 && score <= 100 && hasAtMostTwoDecimals(score)
}

/** 判断绩效系数是否合法 */
export function isValidPerformanceCoefficient(coefficient: number) {
  return Number.isFinite(coefficient) && coefficient >= 0 && hasAtMostTwoDecimals(coefficient)
}

/** 判断两个数值是否相等，避免浮点数计算误差 */
export function isSameNumber(left: number, right: number) {
  return Math.abs(left - right) < 0.000001
}

/** 判断权重是否合法 */
function isValidWeight(weight?: number) {
  return weight !== undefined && weight !== null && weight >= 0 && weight <= 100
}

/** 判断数值是否最多保留两位小数 */
function hasAtMostTwoDecimals(value: number) {
  return isSameNumber(value * 100, Math.round(value * 100))
}
