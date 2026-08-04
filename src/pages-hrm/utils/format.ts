import type { SalaryGroup } from '@/api/hrm/salary/config/group'
import type { SalaryOption } from '@/api/hrm/salary/config/option'
import type { AttendanceShift, AttendanceSpecialDate } from '@/api/hrm/attendance/group'
import type { InsuranceSchemeProject } from '@/api/hrm/insurance/scheme'
import type { ResultLevel } from '@/api/hrm/performance/config/result-template'
import type { PerformancePlan, PerformanceReviewStage } from '@/api/hrm/performance/plan'
import type { RecruitPost } from '@/api/hrm/recruit/post'
import dayjs from 'dayjs'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import {
  AGE_UNLIMITED_VALUE,
  HRM_WEEK_OPTIONS,
  HrmAttendanceHolidayType,
  HrmAttendanceLateEarlyDeductMethod,
  HrmEmployeeChangeReasonOptions,
  HrmEmployeeChangeTypeOptions,
  HrmEmployeeContractStatusOptions,
  HrmEmployeeContractTypeOptions,
  HrmEmployeeFileGroups,
  HrmEmployeeIdTypeOptions,
  HrmEmployeeQuitReasonOptions,
  HrmEmployeeQuitTypeOptions,
  HrmEmployeeTeachingMethodOptions,
  HrmInsuranceProjectType,
  HrmPerformanceAppealTimeoutAction,
  HrmPerformanceCycleTypeOptions,
  HrmPerformanceQuotaSettingType,
  HrmPerformanceQuotaType,
  HrmPerformanceRaterType,
  HrmSalaryOptionType,
  HrmSalaryOptionTypeOptions,
  HrmSalaryTaxCycleTypeOptions,
  SALARY_NEGOTIABLE_VALUE,
} from '@/pages-hrm/utils/constants'

/** 格式化薪资组适用范围 */
export function formatSalaryGroupScope(salaryGroup: Pick<SalaryGroup, 'deptNames' | 'employeeNames'>): string {
  return [...(salaryGroup.deptNames || []), ...(salaryGroup.employeeNames || [])].join('、') || '-'
}

/** 格式化考勤组适用范围 */
export function formatAttendanceGroupScope(
  group: { deptNames?: string[], employeeNames?: string[] },
): string {
  const parts: string[] = []
  if (group.deptNames?.length) {
    parts.push(`部门：${group.deptNames.join('、')}`)
  }
  if (group.employeeNames?.length) {
    parts.push(`员工：${group.employeeNames.join('、')}`)
  }
  return parts.join('；') || '-'
}

/** 格式化考勤星期 */
export function formatHrmAttendanceWeeks(weeks?: number[]): string {
  return (
    weeks
      ?.map(week => HRM_WEEK_OPTIONS.find(item => item.value === week)?.label)
      .filter(Boolean)
      .join('、') || '-'
  )
}

/** 格式化考勤特殊日期上下班文案 */
export function formatHrmAttendanceSpecialDate(
  specialDate: AttendanceSpecialDate,
  shifts?: AttendanceShift[],
): string {
  if (specialDate.type === HrmAttendanceHolidayType.REST) {
    return '休息'
  }
  const week = specialDate.date ? dayjs(specialDate.date).day() || 7 : undefined
  const shift = shifts?.find(item => week && item.weeks.includes(week)) || shifts?.[0]
  return shift ? `${shift.startTime} - ${shift.endTime}` : '上班'
}

/** 格式化迟到早退扣款单位 */
export function formatHrmAttendanceDeductUnit(method?: number): string {
  if (method === HrmAttendanceLateEarlyDeductMethod.BY_MINUTE) {
    return '分钟'
  }
  if (method === HrmAttendanceLateEarlyDeductMethod.BY_COUNT) {
    return '次'
  }
  return '月'
}

/** 格式化考勤班次工作时长 */
export function formatHrmAttendanceShiftDuration(shift: AttendanceShift): string {
  let duration = getTimeRangeMinutes(shift.startTime, shift.endTime)
  if (shift.excludeRestTime) {
    duration -= getTimeRangeMinutes(shift.restStartTime, shift.restEndTime)
  }
  duration = Math.max(duration, 0)
  return `${Math.floor(duration / 60)} 小时 ${duration % 60} 分钟`
}

/** 计算时间范围分钟数（结束早于开始按次日） */
function getTimeRangeMinutes(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) {
    return 0
  }
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  const start = startHour * 60 + startMinute
  let end = endHour * 60 + endMinute
  if (end <= start) {
    end += 24 * 60
  }
  return end - start
}

/** 格式化薪资计税周期 */
export function formatHrmSalaryTaxCycleType(cycleType?: number | null): string {
  return HrmSalaryTaxCycleTypeOptions.find(item => item.value === cycleType)?.label || '-'
}

/** 格式化薪资项加减类型 */
export function formatHrmSalaryOptionType(type?: number | null): string {
  if (type === undefined || type === null || type === HrmSalaryOptionType.CALCULATED) {
    return '-'
  }
  return HrmSalaryOptionTypeOptions.find(item => item.value === type)?.label || '-'
}

/** 格式化 HRM 金额 */
export function formatHrmMoney(value?: number | null): string {
  return Number(value || 0).toFixed(2)
}

/** 格式化 HRM 比例 */
export function formatHrmRate(value?: number | null): string {
  return value === undefined || value === null ? '-' : `${Number(value).toFixed(2)}%`
}

/** 格式化 HRM 参保项目名称 */
export function formatHrmInsuranceProjectName(project: InsuranceSchemeProject): string {
  if (isHrmInsuranceCustomProject(project.type)) {
    return project.name || '-'
  }
  return getDictLabel(DICT_TYPE.HRM_INSURANCE_PROJECT_TYPE, project.type) || '-'
}

/** 是否为自定义参保项目 */
export function isHrmInsuranceCustomProject(type?: number) {
  return (
    type === HrmInsuranceProjectType.CUSTOM_SOCIAL_SECURITY
    || type === HrmInsuranceProjectType.CUSTOM_PROVIDENT_FUND
  )
}

/** 是否为社保项目 */
export function isHrmInsuranceSocialProject(type?: number) {
  return type !== undefined && type < HrmInsuranceProjectType.PROVIDENT_FUND
}

/** 是否为公积金项目 */
export function isHrmInsuranceProvidentFundProject(type?: number) {
  return type !== undefined && type >= HrmInsuranceProjectType.PROVIDENT_FUND
}

/** 按比例计算参保项目金额 */
export function calculateHrmInsuranceProjectAmount(
  project: Pick<InsuranceSchemeProject, 'baseAmount' | 'corporateRate' | 'personalRate'>,
  side: 'corporate' | 'personal',
) {
  const rate = side === 'corporate' ? project.corporateRate : project.personalRate
  return Number(project.baseAmount || 0) * Number(rate || 0) * 0.01
}

/** 格式化 HRM 日期 */
export function formatHrmDate(value?: dayjs.ConfigType): string {
  if (!value) {
    return '-'
  }
  return dayjs(value).isValid() ? formatDate(value, 'YYYY-MM-DD') || '-' : '-'
}

/** 格式化 HRM 绩效得分 */
export function formatHrmScore(value?: number | null): string {
  return value === undefined || value === null ? '-' : Number(value).toFixed(2)
}

/** 格式化 HRM 日期范围 */
export function formatHrmDateRange(
  startDate?: dayjs.ConfigType,
  endDate?: dayjs.ConfigType,
): string {
  if (!startDate && !endDate) {
    return '-'
  }
  return `${formatHrmDate(startDate)} 至 ${formatHrmDate(endDate)}`
}

/** 获得叶子薪资项 */
export function getSalaryLeafOptions(options?: SalaryOption[]): SalaryOption[] {
  const result: SalaryOption[] = []
  function append(optionsToAppend?: SalaryOption[]) {
    for (const option of optionsToAppend || []) {
      if (option.children?.length) {
        append(option.children)
      } else {
        result.push(option)
      }
    }
  }
  append(options)
  return result
}

/** 格式化带千分位的 HRM 金额 */
export function formatHrmMoneyWithThousands(value?: number | null): string {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** 格式化 HRM 天数 */
export function formatHrmDays(value?: number | null): string {
  return Number(value || 0)
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1')
}

/** 格式化 HRM 年月 */
export function formatHrmYearMonth(year?: number | null, month?: number | null): string {
  if (!year || !month) {
    return '-'
  }
  return `${year}-${String(month).padStart(2, '0')}`
}

/** 解析年月选择器值为 year / month */
export function getAttendanceYearMonth(month?: dayjs.ConfigType): { year: number, month: number } {
  const monthDate = dayjs(month)
  return {
    year: monthDate.year(),
    month: monthDate.month() + 1,
  }
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

/** 格式化员工证件类型 */
export function formatEmployeeIdType(value?: number): string {
  return HrmEmployeeIdTypeOptions.find(item => item.value === value)?.label || '-'
}

/** 格式化员工异动类型 */
export function formatEmployeeChangeType(value?: number): string {
  return HrmEmployeeChangeTypeOptions.find(item => item.value === value)?.label || '-'
}

/** 格式化员工异动原因 */
export function formatEmployeeChangeReason(value?: number): string {
  return HrmEmployeeChangeReasonOptions.find(item => item.value === value)?.label || '-'
}

/** 格式化员工合同类型 */
export function formatEmployeeContractType(value?: number): string {
  return HrmEmployeeContractTypeOptions.find(item => item.value === value)?.label || '-'
}

/** 格式化员工合同状态 */
export function formatEmployeeContractStatus(value?: number): string {
  return HrmEmployeeContractStatusOptions.find(item => item.value === value)?.label || '-'
}

/** 格式化员工教学方式 */
export function formatEmployeeTeachingMethod(value?: number): string {
  return HrmEmployeeTeachingMethodOptions.find(item => item.value === value)?.label || '-'
}

/** 格式化员工离职类型 */
export function formatEmployeeQuitType(value?: number): string {
  return HrmEmployeeQuitTypeOptions.find(item => item.value === value)?.label || '-'
}

/** 格式化员工离职原因 */
export function formatEmployeeQuitReason(value?: number): string {
  return HrmEmployeeQuitReasonOptions.find(item => item.value === value)?.label || '-'
}

/** 格式化员工材料附件类型 */
export function formatEmployeeFileType(value?: number): string {
  for (const group of HrmEmployeeFileGroups) {
    const option = group.options.find(item => item.value === value)
    if (option) {
      return option.label
    }
  }
  return '-'
}

/** 获取指定月份的应打卡时间闭区间（月初零点至月末最后一秒） */
export function getAttendanceMonthRange(month?: dayjs.ConfigType): [string, string] {
  const monthDate = dayjs(month)
  return [
    formatDateTime(monthDate.startOf('month').valueOf()),
    formatDateTime(monthDate.endOf('month').valueOf()),
  ]
}

/** 格式化绩效评分人层级 */
export function formatHrmPerformanceRaterLevel(
  raterType: number | undefined,
  level: number,
): string {
  if (raterType === HrmPerformanceRaterType.SUPERIOR) {
    return level === 1 ? '直属上级' : `第 ${level} 级上级`
  }
  return level === 1 ? '直属部门负责人' : `第 ${level} 级部门负责人`
}

/** 格式化绩效评分阶段名称 */
export function formatHrmPerformanceReviewStageName(stage: PerformanceReviewStage): string {
  if (stage.rater?.type === HrmPerformanceRaterType.SELF) {
    return '员工自评'
  }
  if (
    stage.rater?.type === HrmPerformanceRaterType.SUPERIOR
    || stage.rater?.type === HrmPerformanceRaterType.DEPT_LEADER
  ) {
    return `${formatHrmPerformanceRaterLevel(stage.rater.type, stage.rater.level || 1)}评分`
  }
  return '指定员工评分'
}

/** 格式化绩效计划周期 */
export function formatHrmPerformancePlanCycle(plan: PerformancePlan): string {
  return (
    [plan.cycle, plan.quarter ? `第 ${plan.quarter} 季度` : ''].filter(Boolean).join(' / ') || '-'
  )
}

/** 格式化绩效考核周期类型 */
export function formatHrmPerformanceCycleType(type?: number): string {
  return HrmPerformanceCycleTypeOptions.find(item => item.value === type)?.label || '-'
}

/** 格式化绩效指标制定方式 */
export function formatHrmPerformanceQuotaSettingType(type?: number): string {
  if (type === HrmPerformanceQuotaSettingType.SYSTEM) {
    return '系统制定'
  }
  return type === HrmPerformanceQuotaSettingType.EMPLOYEE ? '员工制定' : '-'
}

/** 格式化绩效申诉超期处理方式 */
export function formatHrmPerformanceAppealTimeout(plan: PerformancePlan): string {
  if (!plan.resultConfirmation || !plan.appealTimeoutDays) {
    return '-'
  }
  const action = {
    [HrmPerformanceAppealTimeoutAction.REJECT]: '自动拒绝',
    [HrmPerformanceAppealTimeoutAction.APPROVE]: '自动通过',
  }[plan.appealTimeoutAction || 0]
  return action ? `超过 ${plan.appealTimeoutDays} 天未处理，${action}` : '-'
}

/** 格式化绩效评分人类型 */
export function formatHrmPerformanceRaterType(type?: number): string {
  return (
    {
      [HrmPerformanceRaterType.SUPERIOR]: '上级',
      [HrmPerformanceRaterType.DEPT_LEADER]: '部门负责人',
      [HrmPerformanceRaterType.SPECIFIED]: '指定评分人',
      [HrmPerformanceRaterType.SELF]: '被考核人',
    }[type || 0] || '-'
  )
}

/** 格式化绩效指标类型 */
export function formatHrmPerformanceQuotaType(type?: number): string {
  if (type === HrmPerformanceQuotaType.BEHAVIOR) {
    return '行为态度指标'
  }
  return type === HrmPerformanceQuotaType.PERFORMANCE ? '业绩指标' : '-'
}

/** 格式化绩效结果等级名称列表 */
export function formatHrmPerformanceResultLevels(levels?: ResultLevel[]): string {
  return levels?.map(level => level.name).filter(Boolean).join('、') || '-'
}
