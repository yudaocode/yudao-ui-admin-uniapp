/** HRM 业务类型枚举 */
export const HrmBizType = {
  RECRUIT_POST: 1, // 招聘职位
  RECRUIT_CANDIDATE: 2, // 招聘候选人
  EMPLOYEE: 3, // 员工档案
} as const

/** 招聘候选人状态枚举（对齐后端 HrmRecruitCandidateStatusEnum） */
export const HrmRecruitCandidateStatus = {
  NEW: 1, // 新候选人
  PRIMARY_PASS: 2, // 初选通过
  INTERVIEW: 3, // 安排面试
  INTERVIEW_PASS: 4, // 面试通过
  OFFER_SENT: 5, // 已发 Offer
  PENDING_ENTRY: 6, // 待入职
  ELIMINATED: 7, // 已淘汰
  JOINED: 8, // 已入职
} as const

/** 招聘候选人状态取值 */
export type HrmRecruitCandidateStatusValue
  = (typeof HrmRecruitCandidateStatus)[keyof typeof HrmRecruitCandidateStatus]

/** 招聘面试方式枚举（对齐字典 hrm_recruit_interview_type） */
export const HrmRecruitInterviewType = {
  ONSITE: 1, // 现场面试
  PHONE: 2, // 电话面试
  VIDEO: 3, // 视频面试
} as const

/** 招聘面试结果枚举（对齐后端 HrmRecruitInterviewResultEnum） */
export const HrmRecruitInterviewResult = {
  UNFINISHED: 1, // 未完成
  PASS: 2, // 通过
  NOT_PASS: 3, // 未通过
  CANCELED: 4, // 取消
} as const

/** 招聘职位状态枚举（对齐后端 HrmRecruitPostStatusEnum） */
export const HrmRecruitPostStatus = {
  STOPPED: 0, // 停止招聘
  RECRUITING: 1, // 招聘中
} as const

/** 招聘职位状态取值 */
export type HrmRecruitPostStatusValue
  = (typeof HrmRecruitPostStatus)[keyof typeof HrmRecruitPostStatus]

/** 招聘工作性质枚举（对齐 hrm_recruit_job_nature 字典） */
export const HrmRecruitJobNature = {
  FULL_TIME: 1, // 全职
  INTERNSHIP: 2, // 实习
  PART_TIME: 3, // 兼职
} as const

/** 招聘工作经验枚举（对齐 hrm_recruit_work_time 字典） */
export const HrmRecruitWorkTime = {
  UNLIMITED: 1, // 不限
  LESS_THAN_ONE_YEAR: 2, // 1 年以下
  ONE_TO_THREE_YEARS: 3, // 1-3 年
  THREE_TO_FIVE_YEARS: 4, // 3-5 年
  FIVE_TO_TEN_YEARS: 5, // 5-10 年
  MORE_THAN_TEN_YEARS: 6, // 10 年以上
} as const

/** 招聘职位学历要求枚举（对齐 hrm_recruit_post_education 字典） */
export const HrmRecruitPostEducation = {
  UNLIMITED: 1, // 不限
  HIGH_SCHOOL_AND_ABOVE: 2, // 高中及以上
  COLLEGE_AND_ABOVE: 3, // 大专及以上
  BACHELOR_AND_ABOVE: 4, // 本科及以上
  MASTER_AND_ABOVE: 5, // 硕士及以上
  DOCTOR: 6, // 博士
} as const

/** 招聘薪资单位枚举（对齐 hrm_recruit_salary_unit 字典） */
export const HrmRecruitSalaryUnit = {
  MONTH: 1, // 元/月
  YEAR: 2, // 元/年
} as const

/** 招聘紧急程度枚举（对齐 hrm_recruit_emergency_level 字典） */
export const HrmRecruitEmergencyLevel = {
  URGENT: 1, // 紧急
  NORMAL: 2, // 一般
} as const

/** 薪资面议值（对齐后端 HrmRecruitPostDO.SALARY_NEGOTIABLE_VALUE） */
export const SALARY_NEGOTIABLE_VALUE = -1

/** 薪资面议单位值（对齐后端 HrmRecruitPostDO.SALARY_NEGOTIABLE_UNIT_VALUE） */
export const SALARY_NEGOTIABLE_UNIT_VALUE = -1

/** 年龄不限值（对齐后端 HrmRecruitPostDO.AGE_UNLIMITED_VALUE） */
export const AGE_UNLIMITED_VALUE = -1

/** 员工入职状态枚举（对齐后端 HrmEmployeeEntryStatusEnum） */
export const HrmEmployeeEntryStatus = {
  ACTIVE: 1, // 在职
  PENDING_ENTRY: 2, // 待入职
  PENDING_LEAVE: 3, // 待离职
  LEFT: 4, // 离职
} as const

/** 系统用户性别（对齐字典 system_user_sex） */
export const SYSTEM_USER_SEX_UNKNOWN = 0 // 未知（表单选项需过滤）
export const SYSTEM_USER_SEX_MALE = 1 // 男
export const SYSTEM_USER_SEX_FEMALE = 2 // 女

/** 首页日历事项类型（对齐 Wukong NotesType） */
export const HrmHomeCalendarItemType = {
  NOTE: 1, // 备忘
  BIRTHDAY: 2, // 生日
  ENTRY: 3, // 入职
  REGULAR: 4, // 转正
  LEAVE: 5, // 离职
  RECRUIT: 6, // 招聘面试
  ATTENDANCE: 7, // 考勤打卡
} as const

/** 员工状态页签枚举（对齐后端 HrmEmployeeStatusTabEnum） */
export const HrmEmployeeStatusTab = {
  ACTIVE: 11, // 在职
  FULL_TIME: 12, // 全职
  PENDING_ENTRY: 13, // 待入职
  PENDING_LEAVE: 14, // 待离职
  LEFT: 15, // 已离职
} as const

/** 员工首页待办筛选类型（对齐后端 HrmEmployeeTodoTypeEnum） */
export const HrmEmployeeTodoType = {
  PENDING_LEAVE: 2, // 待离职
  CONTRACT_EXPIRE: 3, // 合同到期
  REGULAR: 4, // 待转正
  PENDING_ENTRY: 5, // 待入职
  BIRTHDAY: 6, // 生日
} as const

/** 员工首页人事概况筛选类型（对齐后端 HrmEmployeeSurveyTypeEnum） */
export const HrmEmployeeSurveyType = {
  ENTRY: 1, // 入职
  LEAVE: 2, // 离职
  REGULAR: 3, // 转正
  TRANSFER: 4, // 调岗
  PENDING_ENTRY: 5, // 待入职
  PENDING_LEAVE: 6, // 待离职
} as const

/** 员工首页人事概况筛选类型取值 */
export type HrmEmployeeSurveyTypeValue
  = (typeof HrmEmployeeSurveyType)[keyof typeof HrmEmployeeSurveyType]

/** 团队工作台年龄区间类型（对齐后端 HrmHomeAgeRangeEnum） */
export const HrmTeamHomeAgeRangeType = {
  UNDER_18: 1, // 17 以下
  AGE_18_TO_25: 2, // 18 至 25
  AGE_26_TO_35: 3, // 26 至 35
  AGE_36_TO_45: 4, // 36 至 45
  AGE_46_TO_55: 5, // 46 至 55
  AGE_56_AND_ABOVE: 6, // 56 以上
} as const

/** 团队工作台司龄区间类型（对齐后端 HrmHomeCompanyAgeRangeEnum） */
export const HrmTeamHomeCompanyAgeRangeType = {
  WITHIN_3_MONTHS: 1, // 3 个月内
  MONTHS_3_TO_6: 2, // 3 至 6 个月
  MONTHS_6_TO_1_YEAR: 3, // 6 个月至 1 年
  YEARS_1_TO_3: 4, // 1 至 3 年
  YEARS_3_TO_5: 5, // 3 至 5 年
  YEARS_5_TO_10: 6, // 5 至 10 年
  YEARS_10_AND_ABOVE: 7, // 10 年以上
} as const
