import type { RecruitPost } from '@/api/hrm/recruit/post'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import {
  AGE_UNLIMITED_VALUE,
  SALARY_NEGOTIABLE_VALUE,
} from '@/pages-hrm/utils/constants'

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

/** 格式化招聘职位薪资范围 */
export function formatRecruitPostSalary(post: RecruitPost): string {
  if (post.minSalary === SALARY_NEGOTIABLE_VALUE && post.maxSalary === SALARY_NEGOTIABLE_VALUE) {
    return '面议'
  }
  const salaryRange = [post.minSalary, post.maxSalary]
    .filter(salary => salary !== undefined && salary !== null)
    .join('-')
  if (!salaryRange) {
    return '-'
  }
  const salaryUnit = post.salaryUnit !== undefined && post.salaryUnit !== null
    ? getDictLabel(DICT_TYPE.HRM_RECRUIT_SALARY_UNIT, post.salaryUnit)
    : ''
  return [salaryRange, salaryUnit].filter(Boolean).join(' ')
}

/** 格式化招聘职位年龄要求 */
export function formatRecruitPostAge(post: RecruitPost): string {
  if (post.minAge === AGE_UNLIMITED_VALUE && post.maxAge === AGE_UNLIMITED_VALUE) {
    return '不限'
  }
  const hasMinAge = post.minAge !== undefined && post.minAge !== null
  const hasMaxAge = post.maxAge !== undefined && post.maxAge !== null
  if (hasMinAge && hasMaxAge) {
    return `${post.minAge}-${post.maxAge}`
  }
  if (hasMinAge) {
    return `${post.minAge} 岁以上`
  }
  if (hasMaxAge) {
    return `${post.maxAge} 岁以下`
  }
  return '-'
}

/** 格式化招聘职位进度 */
export function formatRecruitPostProgress(post: RecruitPost): string {
  const joinedCount = post.hasEntryNum ?? 0
  const recruitCount = post.recruitNum ?? 0
  if (!recruitCount) {
    return `${joinedCount} / ${recruitCount}`
  }
  return `${joinedCount} / ${recruitCount}（${post.recruitSchedule ?? 0}%）`
}
