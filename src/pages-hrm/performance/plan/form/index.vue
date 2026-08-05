<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <PlanBasicSection
          v-model="formData"
          v-model:custom-date-range="customDateRange"
          :disabled="!planEditable"
        />
        <PlanAssessmentSection
          v-model="formData"
          :disabled="!planEditable"
          :assessment-templates="assessmentTemplates"
        />
        <PlanProcessSection v-model="formData" :disabled="!planEditable" />
        <PlanResultSection
          v-model="formData"
          :disabled="!planEditable"
          :result-templates="resultTemplates"
        />
      </wd-form>
    </view>

    <!-- 底部保存 -->
    <view v-if="planEditable" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AssessmentConfig } from '@/api/hrm/performance/assessment'
import type { AssessmentTemplate } from '@/api/hrm/performance/config/assessment-template'
import type { ResultTemplate } from '@/api/hrm/performance/config/result-template'
import type {
  PerformanceHandlerStage,
  PerformancePlan,
  PerformanceReviewStage,
  PerformanceScope,
} from '@/api/hrm/performance/plan'
import dayjs from 'dayjs'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getPerformanceAssessmentTemplateSimpleList } from '@/api/hrm/performance/config/assessment-template'
import { getPerformanceResultTemplateSimpleList } from '@/api/hrm/performance/config/result-template'
import {
  createPerformancePlan,
  getPerformancePlan,
  updatePerformancePlan,
} from '@/api/hrm/performance/plan'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import {
  HrmEmployeeStatus,
  HrmEmployeeType,
  HrmPerformanceAppealTimeoutAction,
  HrmPerformanceCycleType,
  HrmPerformancePlanScopeType,
  HrmPerformancePlanStatus,
  HrmPerformanceQuotaSettingType,
  HrmPerformanceRaterType,
  HrmPerformanceReviewScoringType,
  HrmPerformanceReviewVisibleContent,
  HrmPerformanceScoreCalculation,
  HrmPerformanceUpperLimitType,
} from '@/pages-hrm/utils/constants'
import { formatHrmPerformanceReviewStageName } from '@/pages-hrm/utils/format'
import { validateAssessmentConfig } from '@/pages-hrm/utils/performance'
import PlanAssessmentSection from '../components/plan-assessment-section.vue'
import PlanBasicSection from '../components/plan-basic-section.vue'
import PlanProcessSection from '../components/plan-process-section.vue'
import PlanResultSection from '../components/plan-result-section.vue'

const props = defineProps<{
  id?: number | string
  type?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formRef = ref<any>() // 表单引用
const formLoading = ref(false) // 表单提交状态
const formData = ref<PerformancePlan>(createDefaultFormData()) // 表单数据
const assessmentTemplates = ref<AssessmentTemplate[]>([]) // 考核模板
const resultTemplates = ref<ResultTemplate[]>([]) // 结果模板
const customDateRange = ref<[string | undefined, string | undefined]>([undefined, undefined]) // 自定义日期

const viewMode = computed(() => props.type === 'view') // 查看模式
const getTitle = computed(() => {
  if (!props.id) {
    return '新增 KPI 考核'
  }
  return `${viewMode.value ? '查看' : '编辑'} KPI 考核`
})
const planEditable = computed(() => { // 是否可编辑
  return !viewMode.value
    && (!formData.value.status
      || formData.value.status === HrmPerformancePlanStatus.DRAFT
      || formData.value.status === HrmPerformancePlanStatus.NOT_STARTED)
})

const formSchema = createFormSchema({
  name: [{ required: true, message: '考核计划名称不能为空' }],
  cycleType: [{ required: true, message: '请选择考核周期类型' }],
  cycle: [{
    required: true,
    validator: () => {
      if (formData.value.cycleType === HrmPerformanceCycleType.OTHER) {
        return !!(customDateRange.value[0] && customDateRange.value[1])
      }
      if (formData.value.cycleType === HrmPerformanceCycleType.QUARTER) {
        return !!formData.value.cycle && !!formData.value.quarter
      }
      return !!formData.value.cycle
    },
    message: '请选择考核周期',
  }],
  assessmentTemplateId: [{ required: true, message: '考核指标模板不能为空' }],
  resultTemplateId: [{ required: true, message: '考核结果模板不能为空' }],
  quotaSettingType: [{ required: true, message: '请选择指标制定方式' }],
  paidForMonth: [{
    required: () => !!formData.value.syncToSalary,
    message: '请选择参与计薪月份',
  }],
  scopes: [{
    required: true,
    validator: () => validateScopes(),
    message: '请完善考核范围',
  }],
})

/** 返回上一页 */
function handleBack() {
  if (props.id) {
    navigateBackPlus(`/pages-hrm/performance/plan/detail/index?id=${props.id}`)
    return
  }
  navigateBackPlus('/pages-hrm/performance/plan/index')
}

/** 校验考评范围 */
function validateScopes() {
  const scopes = formData.value.scopes || []
  if (!scopes.length || scopes.length > 3) {
    return false
  }
  return scopes.every((scope) => {
    if (scope.type === HrmPerformancePlanScopeType.EMPLOYEE_DEPT) {
      return !!(scope.employeeIds?.length || scope.deptIds?.length)
    }
    return !!(scope.employeeType && scope.employeeStatuses?.length)
  })
}

/** 填充考核周期起止日期 */
function fillCycleDates() {
  const cycleType = formData.value.cycleType
  if (cycleType === HrmPerformanceCycleType.OTHER) {
    formData.value.startTime = dayjs(customDateRange.value[0]).startOf('day').valueOf()
    formData.value.endTime = dayjs(customDateRange.value[1]).endOf('day').valueOf()
    formData.value.cycle = `${customDateRange.value[0]} ~ ${customDateRange.value[1]}`
    formData.value.quarter = undefined
    return
  }
  const cycle = String(formData.value.cycle)
  if (cycleType === HrmPerformanceCycleType.MONTH) {
    const month = dayjs(`${cycle}-01`)
    formData.value.startTime = month.startOf('month').valueOf()
    formData.value.endTime = month.endOf('month').valueOf()
    formData.value.quarter = undefined
    return
  }
  const year = Number(cycle)
  let startMonth = 0
  let endMonth = 11
  if (cycleType === HrmPerformanceCycleType.QUARTER) {
    startMonth = ((formData.value.quarter || 1) - 1) * 3
    endMonth = startMonth + 2
  } else if (cycleType === HrmPerformanceCycleType.FIRST_HALF_YEAR) {
    endMonth = 5
  } else if (cycleType === HrmPerformanceCycleType.SECOND_HALF_YEAR) {
    startMonth = 6
  }
  formData.value.startTime = dayjs().year(year).month(startMonth).startOf('month').valueOf()
  formData.value.endTime = dayjs().year(year).month(endMonth).endOf('month').valueOf()
  if (cycleType !== HrmPerformanceCycleType.QUARTER) {
    formData.value.quarter = undefined
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!(formData.value.reviewStages || []).length) {
    toast.show('请至少配置一个评分阶段')
    return
  }
  const reviewWeightTotal = (formData.value.reviewStages || [])
    .reduce((total, stage) => total + Number(stage.weight || 0), 0)
  if (Math.abs(reviewWeightTotal - 100) > 0.001) {
    toast.show('评分权重合计必须等于 100%')
    return
  }
  if (!formData.value.assessmentConfig?.dimensions?.length) {
    toast.show('请选择有效的考核指标模板')
    return
  }
  const assessmentError = validateAssessmentConfig(formData.value.assessmentConfig)
  if (assessmentError) {
    toast.show(assessmentError)
    return
  }
  if (
    formData.value.quotaSettingType === HrmPerformanceQuotaSettingType.EMPLOYEE
    && formData.value.targetConfirmation
    && !formData.value.targetConfirmationStage?.type
  ) {
    toast.show('请完善目标确认人')
    return
  }
  if (formData.value.resultAudit && !(formData.value.resultAuditStages || []).length) {
    toast.show('请至少配置一个结果审核节点')
    return
  }
  if (formData.value.resultConfirmation && !(formData.value.appealStages || []).length) {
    toast.show('请至少配置一个申诉确认节点')
    return
  }
  formLoading.value = true
  try {
    if (formData.value.quotaSettingType !== HrmPerformanceQuotaSettingType.EMPLOYEE) {
      formData.value.targetConfirmation = false
      formData.value.targetConfirmationStage = undefined
    }
    fillCycleDates()
    formData.value.reviewStages = (formData.value.reviewStages || []).map(stage => ({
      ...stage,
      name: formatHrmPerformanceReviewStageName(stage),
      scoringType: HrmPerformanceReviewScoringType.QUOTA,
      rejectAuthority:
        stage.rater?.type === HrmPerformanceRaterType.SELF ? false : Boolean(stage.rejectAuthority),
    }))
    if (formData.value.id) {
      await updatePerformancePlan(formData.value)
      toast.success('更新成功')
    } else {
      const id = await createPerformancePlan(formData.value)
      toast.success('创建成功')
      uni.$emit('hrm-performance-plan-refresh')
      uni.redirectTo({
        url: `/pages-hrm/performance/plan/detail/index?id=${id}`,
      })
      return
    }
    uni.$emit('hrm-performance-plan-refresh')
    handleBack()
  } finally {
    formLoading.value = false
  }
}

/** 创建默认考核配置 */
function createDefaultAssessmentConfig(): AssessmentConfig {
  return {
    name: '',
    scoreCalculation: HrmPerformanceScoreCalculation.WEIGHTED,
    upperLimitType: HrmPerformanceUpperLimitType.UNIFIED,
    upperLimitScore: 100,
    dimensions: [],
  }
}

/** 创建默认评分流程 */
function createDefaultReviewStages(): PerformanceReviewStage[] {
  return [
    {
      name: '员工自评',
      rater: { type: HrmPerformanceRaterType.SELF },
      weight: 30,
      scoringType: HrmPerformanceReviewScoringType.QUOTA,
      visibleContent: HrmPerformanceReviewVisibleContent.ALL,
      requiredSetting: false,
      rejectAuthority: false,
    },
    {
      name: '直属上级评分',
      rater: { type: HrmPerformanceRaterType.SUPERIOR, level: 1 },
      weight: 70,
      scoringType: HrmPerformanceReviewScoringType.QUOTA,
      visibleContent: HrmPerformanceReviewVisibleContent.ALL,
      requiredSetting: true,
      rejectAuthority: true,
    },
  ]
}

/** 创建默认处理节点 */
function createDefaultHandlerStage(): PerformanceHandlerStage {
  return {
    type: HrmPerformanceRaterType.DEPT_LEADER,
    level: 1,
  }
}

/** 创建考评范围 */
function createScope(type: number = HrmPerformancePlanScopeType.EMPLOYMENT): PerformanceScope {
  return type === HrmPerformancePlanScopeType.EMPLOYEE_DEPT
    ? { type, employeeIds: [], deptIds: [] }
    : {
        type,
        employeeType: HrmEmployeeType.FORMAL,
        employeeStatuses: [HrmEmployeeStatus.REGULAR, HrmEmployeeStatus.PROBATION],
      }
}

/** 创建默认考评范围 */
function createDefaultPlanScope(): PerformanceScope {
  return createScope(HrmPerformancePlanScopeType.EMPLOYMENT)
}

/** 创建默认表单数据 */
function createDefaultFormData(): PerformancePlan {
  return {
    id: undefined,
    name: '',
    cycleType: HrmPerformanceCycleType.MONTH,
    cycle: '',
    quarter: undefined,
    startTime: undefined,
    endTime: undefined,
    description: '',
    assessmentTemplateId: undefined,
    assessmentConfig: createDefaultAssessmentConfig(),
    resultTemplateId: undefined,
    resultConfig: { name: '', levels: [] },
    quotaSettingType: HrmPerformanceQuotaSettingType.SYSTEM,
    targetConfirmation: false,
    targetConfirmationStage: undefined,
    resultAudit: false,
    resultConfirmation: false,
    appealTimeoutDays: 2,
    appealTimeoutAction: HrmPerformanceAppealTimeoutAction.REJECT,
    syncToSalary: false,
    paidForMonth: '',
    scopes: [createDefaultPlanScope()],
    reviewStages: createDefaultReviewStages(),
    resultAuditStages: [createDefaultHandlerStage()],
    appealStages: [createDefaultHandlerStage()],
  }
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getPerformancePlan(Number(props.id))
  if (
    !viewMode.value
    && data.status !== HrmPerformancePlanStatus.DRAFT
    && data.status !== HrmPerformancePlanStatus.NOT_STARTED
  ) {
    toast.show('当前状态不允许修改 KPI 考核')
    handleBack()
    return
  }
  formData.value = data
  formData.value.assessmentConfig ||= createDefaultAssessmentConfig()
  formData.value.quotaSettingType ??= HrmPerformanceQuotaSettingType.SYSTEM
  formData.value.targetConfirmation ??= false
  formData.value.resultAudit ??= false
  formData.value.resultConfirmation ??= false
  formData.value.appealTimeoutDays ??= 2
  formData.value.appealTimeoutAction ??= HrmPerformanceAppealTimeoutAction.REJECT
  if (!formData.value.scopes?.length) {
    formData.value.scopes = [createDefaultPlanScope()]
  }
  if (!formData.value.reviewStages?.length) {
    formData.value.reviewStages = createDefaultReviewStages()
  }
  if (!formData.value.resultAuditStages?.length) {
    formData.value.resultAuditStages = [createDefaultHandlerStage()]
  }
  if (!formData.value.appealStages?.length) {
    formData.value.appealStages = [createDefaultHandlerStage()]
  }
  if (
    formData.value.cycleType === HrmPerformanceCycleType.OTHER
    && formData.value.startTime
    && formData.value.endTime
  ) {
    customDateRange.value = [
      dayjs(formData.value.startTime).format('YYYY-MM-DD'),
      dayjs(formData.value.endTime).format('YYYY-MM-DD'),
    ]
  }
  if (
    data.resultTemplateId
    && data.resultConfig
    && !resultTemplates.value.some(template => template.id === data.resultTemplateId)
  ) {
    resultTemplates.value.unshift({
      id: data.resultTemplateId,
      name: data.resultConfig.name,
      levels: data.resultConfig.levels,
    })
  }
}

/** 初始化 */
onMounted(async () => {
  formLoading.value = true
  try {
    const [assessmentList, resultList] = await Promise.all([
      getPerformanceAssessmentTemplateSimpleList(),
      getPerformanceResultTemplateSimpleList({ status: CommonStatusEnum.ENABLE }),
    ])
    assessmentTemplates.value = assessmentList || []
    resultTemplates.value = resultList || []
    await getDetail()
  } finally {
    formLoading.value = false
  }
})
</script>
