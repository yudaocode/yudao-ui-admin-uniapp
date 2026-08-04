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
        <wd-cell-group border title="基础设置">
          <wd-form-item title="计划名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入考核计划名称"
              :maxlength="50"
              :disabled="!planEditable"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.cycleType"
            label="周期类型"
            label-width="200rpx"
            prop="cycleType"
            :columns="cycleTypeColumns"
            placeholder="请选择周期类型"
            :disabled="!planEditable"
            @confirm="handleCycleTypeChange"
          />
          <wd-form-item
            v-if="formData.cycleType === HrmPerformanceCycleType.MONTH"
            title="考核周期"
            title-width="200rpx"
            prop="cycle"
          >
            <view
              class="min-h-72rpx flex items-center justify-end text-28rpx"
              :class="formData.cycle ? 'text-[#333]' : 'text-[#999]'"
              @click="planEditable && (monthVisible = true)"
            >
              {{ formData.cycle || '请选择月份' }}
            </view>
          </wd-form-item>
          <template v-else-if="formData.cycleType === HrmPerformanceCycleType.QUARTER">
            <wd-form-item title="考核年份" title-width="200rpx" prop="cycle">
              <view
                class="min-h-72rpx flex items-center justify-end text-28rpx"
                :class="formData.cycle ? 'text-[#333]' : 'text-[#999]'"
                @click="planEditable && (yearVisible = true)"
              >
                {{ formData.cycle || '请选择年份' }}
              </view>
            </wd-form-item>
            <yd-form-picker
              v-model="formData.quarter"
              label="季度"
              label-width="200rpx"
              prop="quarter"
              :columns="quarterColumns"
              placeholder="请选择季度"
              :disabled="!planEditable"
            />
          </template>
          <wd-form-item
            v-else-if="formData.cycleType !== HrmPerformanceCycleType.OTHER"
            title="考核年份"
            title-width="200rpx"
            prop="cycle"
          >
            <view
              class="min-h-72rpx flex items-center justify-end text-28rpx"
              :class="formData.cycle ? 'text-[#333]' : 'text-[#999]'"
              @click="planEditable && (yearVisible = true)"
            >
              {{ formData.cycle || '请选择年份' }}
            </view>
          </wd-form-item>
          <template v-else>
            <wd-form-item title="开始日期" title-width="200rpx" prop="cycle">
              <view
                class="min-h-72rpx flex items-center justify-end text-28rpx"
                :class="customDateRange[0] ? 'text-[#333]' : 'text-[#999]'"
                @click="planEditable && (startDateVisible = true)"
              >
                {{ customDateRange[0] || '请选择开始日期' }}
              </view>
            </wd-form-item>
            <wd-form-item title="结束日期" title-width="200rpx" prop="cycle">
              <view
                class="min-h-72rpx flex items-center justify-end text-28rpx"
                :class="customDateRange[1] ? 'text-[#333]' : 'text-[#999]'"
                @click="planEditable && (endDateVisible = true)"
              >
                {{ customDateRange[1] || '请选择结束日期' }}
              </view>
            </wd-form-item>
          </template>
          <yd-form-picker
            v-model="scopeType"
            label="范围类型"
            label-width="200rpx"
            prop="scopes"
            :columns="scopeTypeColumns"
            placeholder="请选择范围类型"
            :disabled="!planEditable"
            @confirm="handleScopeTypeChange"
          />
          <EmployeeFormPicker
            v-if="scopeType === HrmPerformancePlanScopeType.EMPLOYEE_DEPT"
            v-model="scopeEmployeeIds"
            type="checkbox"
            label="参评员工"
            label-width="200rpx"
            placeholder="请选择参评员工"
            :disabled="!planEditable"
          />
          <template v-else>
            <yd-form-picker
              v-model="scopeEmployeeType"
              label="聘用形式"
              label-width="200rpx"
              :dict-type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
              placeholder="请选择聘用形式"
              :disabled="!planEditable"
              @confirm="handleEmployTypeChange"
            />
            <yd-form-picker
              v-model="scopeEmployeeStatuses"
              label="员工状态"
              label-width="200rpx"
              type="checkbox"
              :columns="employeeStatusColumns"
              placeholder="请选择员工状态"
              :disabled="!planEditable"
            />
          </template>
          <wd-form-item title="考核说明" title-width="200rpx" prop="description" vertical>
            <wd-textarea
              v-model="formData.description"
              clearable
              placeholder="请输入考核说明"
              :maxlength="200"
              show-word-limit
              :disabled="!planEditable"
            />
          </wd-form-item>
        </wd-cell-group>

        <wd-cell-group border title="指标设置">
          <yd-form-picker
            v-model="formData.assessmentTemplateId"
            label="考核指标模板"
            label-width="200rpx"
            prop="assessmentTemplateId"
            :columns="assessmentTemplateColumns"
            placeholder="请选择考核指标模板"
            :disabled="!planEditable"
            @confirm="handleAssessmentTemplateChange"
          />
          <AssessmentConfigEditor
            v-if="formData.assessmentTemplateId"
            v-model="formData.assessmentConfig!"
            prop-prefix="assessmentConfig."
            :disabled="!planEditable"
            :show-dimensions="true"
          />
          <view v-else class="px-24rpx py-32rpx text-center text-28rpx text-[#999]">
            请先选择考核指标模板
          </view>
          <yd-form-picker
            v-model="formData.quotaSettingType"
            label="指标制定"
            label-width="200rpx"
            prop="quotaSettingType"
            :columns="quotaSettingColumns"
            placeholder="请选择指标制定方式"
            :disabled="!planEditable"
            @confirm="handleQuotaSettingChange"
          />
          <template v-if="formData.quotaSettingType === HrmPerformanceQuotaSettingType.EMPLOYEE">
            <wd-form-item title="目标确认" title-width="200rpx" prop="targetConfirmation">
              <wd-switch
                v-model="formData.targetConfirmation"
                :disabled="!planEditable"
                @change="handleTargetConfirmationChange"
              />
            </wd-form-item>
            <template v-if="formData.targetConfirmation">
              <yd-form-picker
                v-model="formData.targetConfirmationStage!.type"
                label="确认人"
                label-width="200rpx"
                prop="targetConfirmationStage"
                :columns="handlerTypeColumns"
                placeholder="请选择确认人"
                :disabled="!planEditable"
                @confirm="handleTargetConfirmerTypeChange"
              />
              <yd-form-picker
                v-if="isLevelType(formData.targetConfirmationStage?.type)"
                v-model="formData.targetConfirmationStage!.level"
                label="确认层级"
                label-width="200rpx"
                :columns="levelColumns(formData.targetConfirmationStage?.type)"
                placeholder="请选择层级"
                :disabled="!planEditable"
              />
              <EmployeeFormPicker
                v-else-if="formData.targetConfirmationStage?.type === HrmPerformanceRaterType.SPECIFIED"
                v-model="formData.targetConfirmationStage!.employeeId"
                label="指定确认人"
                label-width="200rpx"
                placeholder="请选择确认员工"
                :disabled="!planEditable"
              />
            </template>
          </template>
        </wd-cell-group>

        <wd-cell-group border title="流程设置">
          <view class="px-24rpx py-16rpx text-28rpx text-[#333] font-semibold">
            考核评分流程
          </view>
          <ReviewStageList v-model="formData.reviewStages!" :disabled="!planEditable" />
          <wd-form-item title="结果审核" title-width="200rpx" prop="resultAudit">
            <wd-switch
              v-model="formData.resultAudit"
              :disabled="!planEditable"
              @change="handleResultAuditChange"
            />
          </wd-form-item>
          <HandlerStageList
            v-if="formData.resultAudit"
            v-model="formData.resultAuditStages!"
            :disabled="!planEditable"
          />
          <wd-form-item title="结果确认" title-width="200rpx" prop="resultConfirmation">
            <wd-switch
              v-model="formData.resultConfirmation"
              :disabled="!planEditable"
              @change="handleResultConfirmationChange"
            />
          </wd-form-item>
          <wd-form-item
            v-if="formData.resultConfirmation"
            title="申诉超期天数"
            title-width="200rpx"
            prop="appealTimeoutDays"
          >
            <wd-input-number
              v-model="formData.appealTimeoutDays"
              :min="1"
              :precision="0"
              :disabled="!planEditable"
            />
          </wd-form-item>
          <yd-form-picker
            v-if="formData.resultConfirmation"
            v-model="formData.appealTimeoutAction"
            label="超期处理"
            label-width="200rpx"
            prop="appealTimeoutAction"
            :columns="appealTimeoutColumns"
            placeholder="请选择超期处理"
            :disabled="!planEditable"
          />
          <HandlerStageList
            v-if="formData.resultConfirmation"
            v-model="formData.appealStages!"
            :disabled="!planEditable"
          />
        </wd-cell-group>

        <wd-cell-group border title="结果设置">
          <yd-form-picker
            v-model="formData.resultTemplateId"
            label="结果模板"
            label-width="200rpx"
            prop="resultTemplateId"
            :columns="resultTemplateColumns"
            placeholder="请选择结果模板"
            :disabled="!planEditable"
            @confirm="handleResultTemplateChange"
          />
          <wd-cell title="结果等级" :value="resultLevelText" />
          <wd-form-item title="同步薪资" title-width="200rpx" prop="syncToSalary">
            <wd-switch v-model="formData.syncToSalary" :disabled="!planEditable" />
          </wd-form-item>
          <wd-form-item
            v-if="formData.syncToSalary"
            title="计薪月份"
            title-width="200rpx"
            prop="paidForMonth"
          >
            <view
              class="min-h-72rpx flex items-center justify-end text-28rpx"
              :class="formData.paidForMonth ? 'text-[#333]' : 'text-[#999]'"
              @click="planEditable && (paidMonthVisible = true)"
            >
              {{ formData.paidForMonth || '请选择计薪月份' }}
            </view>
          </wd-form-item>
        </wd-cell-group>
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

    <wd-datetime-picker
      v-model="monthPickerValue"
      v-model:visible="monthVisible"
      type="year-month"
      title="请选择月份"
      @confirm="handleMonthConfirm"
    />
    <wd-datetime-picker
      v-model="yearPickerValue"
      v-model:visible="yearVisible"
      type="year"
      title="请选择年份"
      @confirm="handleYearConfirm"
    />
    <wd-datetime-picker
      v-model="paidMonthPickerValue"
      v-model:visible="paidMonthVisible"
      type="year-month"
      title="请选择计薪月份"
      @confirm="handlePaidMonthConfirm"
    />
    <wd-datetime-picker
      v-model="startDatePickerValue"
      v-model:visible="startDateVisible"
      type="date"
      title="请选择开始日期"
      @confirm="handleStartDateConfirm"
    />
    <wd-datetime-picker
      v-model="endDatePickerValue"
      v-model:visible="endDateVisible"
      type="date"
      title="请选择结束日期"
      @confirm="handleEndDateConfirm"
    />
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
import { getPerformanceAssessmentTemplate, getPerformanceAssessmentTemplateSimpleList } from '@/api/hrm/performance/config/assessment-template'
import { getPerformanceResultTemplateSimpleList } from '@/api/hrm/performance/config/result-template'
import {
  createPerformancePlan,
  getPerformancePlan,
  updatePerformancePlan,
} from '@/api/hrm/performance/plan'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import {
  HRM_EMPLOYEE_NON_FORMAL_STATUSES,
  HRM_PERFORMANCE_RATER_MAX_LEVEL,
  HrmEmployeeStatus,
  HrmEmployeeType,
  HrmPerformanceAppealTimeoutAction,
  HrmPerformanceCycleType,
  HrmPerformanceCycleTypeOptions,
  HrmPerformanceHandlerTypeOptions,
  HrmPerformancePlanScopeType,
  HrmPerformancePlanStatus,
  HrmPerformanceQuotaSettingType,
  HrmPerformanceRaterType,
  HrmPerformanceReviewScoringType,
  HrmPerformanceReviewVisibleContent,
  HrmPerformanceScoreCalculation,
  HrmPerformanceUpperLimitType,
} from '@/pages-hrm/utils/constants'
import {
  formatHrmPerformanceRaterLevel,
  formatHrmPerformanceReviewStageName,
} from '@/pages-hrm/utils/format'
import EmployeeFormPicker from '@/pages-hrm/employee/components/employee-form-picker.vue'
import AssessmentConfigEditor from '@/pages-hrm/performance/config/assessment-template/components/assessment-config-editor.vue'
import { validateAssessmentConfig } from '@/pages-hrm/utils/performance'
import HandlerStageList from '../components/handler-stage-list.vue'
import ReviewStageList from '../components/review-stage-list.vue'

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
const monthVisible = ref(false)
const yearVisible = ref(false)
const paidMonthVisible = ref(false)
const startDateVisible = ref(false)
const endDateVisible = ref(false)
const monthPickerValue = ref<number | string>(Date.now())
const yearPickerValue = ref<number | string>(Date.now())
const paidMonthPickerValue = ref<number | string>(Date.now())
const startDatePickerValue = ref<number | string>(Date.now())
const endDatePickerValue = ref<number | string>(Date.now())

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
const cycleTypeColumns = computed(() =>
  HrmPerformanceCycleTypeOptions.map(item => ({ label: item.label, value: item.value })),
)
const quarterColumns = [
  { label: '第一季度', value: 1 },
  { label: '第二季度', value: 2 },
  { label: '第三季度', value: 3 },
  { label: '第四季度', value: 4 },
]
const scopeTypeColumns = [
  { label: '员工', value: HrmPerformancePlanScopeType.EMPLOYEE_DEPT },
  { label: '聘用形式', value: HrmPerformancePlanScopeType.EMPLOYMENT },
]
const quotaSettingColumns = [
  { label: '系统制定', value: HrmPerformanceQuotaSettingType.SYSTEM },
  { label: '员工制定', value: HrmPerformanceQuotaSettingType.EMPLOYEE },
]
const appealTimeoutColumns = [
  { label: '自动拒绝', value: HrmPerformanceAppealTimeoutAction.REJECT },
  { label: '自动通过', value: HrmPerformanceAppealTimeoutAction.APPROVE },
]
const handlerTypeColumns = computed(() =>
  HrmPerformanceHandlerTypeOptions.map(item => ({ label: item.label, value: item.value })),
)
const assessmentTemplateColumns = computed(() =>
  assessmentTemplates.value.map(item => ({ label: item.name, value: item.id! })),
)
const resultTemplateColumns = computed(() =>
  resultTemplates.value.map(item => ({ label: item.name, value: item.id! })),
)
const scopeType = computed({
  get: () => formData.value.scopes?.[0]?.type ?? HrmPerformancePlanScopeType.EMPLOYMENT,
  set: (value: number) => {
    const scope = formData.value.scopes?.[0]
    if (scope) {
      scope.type = value
    }
  },
})
const scopeEmployeeIds = computed({
  get: () => formData.value.scopes?.[0]?.employeeIds || [],
  set: (value: number | number[] | undefined) => {
    const scope = ensureScope()
    scope.employeeIds = Array.isArray(value) ? value : (value != null ? [value] : [])
  },
})
const scopeEmployeeType = computed({
  get: () => formData.value.scopes?.[0]?.employeeType,
  set: (value?: number) => {
    ensureScope().employeeType = value
  },
})
const scopeEmployeeStatuses = computed({
  get: () => formData.value.scopes?.[0]?.employeeStatuses || [],
  set: (value: number | number[] | undefined) => {
    ensureScope().employeeStatuses = Array.isArray(value) ? value : (value != null ? [value] : [])
  },
})
const employeeStatusColumns = computed(() => {
  if (scopeEmployeeType.value === HrmEmployeeType.INFORMAL) {
    return HRM_EMPLOYEE_NON_FORMAL_STATUSES.map(value => ({
      label: ({
        [HrmEmployeeStatus.INTERN]: '实习',
        [HrmEmployeeStatus.PART_TIME]: '兼职',
        [HrmEmployeeStatus.LABOR]: '劳务',
        [HrmEmployeeStatus.CONSULTANT]: '顾问',
        [HrmEmployeeStatus.REHIRE]: '返聘',
        [HrmEmployeeStatus.OUTSOURCE]: '外包',
      } as Record<number, string>)[value] || String(value),
      value,
    }))
  }
  return [
    { label: '正式', value: HrmEmployeeStatus.REGULAR },
    { label: '试用', value: HrmEmployeeStatus.PROBATION },
  ]
})
const resultLevelText = computed(() => {
  return formData.value.resultConfig?.levels
    ?.map(level => `${level.name}（${level.minScore}-${level.maxScore}）`)
    .join('；') || '-'
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

/** 确保存在考评范围 */
function ensureScope(): PerformanceScope {
  if (!formData.value.scopes?.length) {
    formData.value.scopes = [createDefaultPlanScope()]
  }
  return formData.value.scopes[0]
}

/** 校验考评范围 */
function validateScopes() {
  const scope = formData.value.scopes?.[0]
  if (!scope) {
    return false
  }
  if (scope.type === HrmPerformancePlanScopeType.EMPLOYEE_DEPT) {
    return !!(scope.employeeIds?.length || scope.deptIds?.length)
  }
  return !!(scope.employeeType && scope.employeeStatuses?.length)
}

/** 切换周期类型 */
function handleCycleTypeChange() {
  formData.value.cycle = ''
  formData.value.quarter = formData.value.cycleType === HrmPerformanceCycleType.QUARTER ? 1 : undefined
  customDateRange.value = [undefined, undefined]
}

/** 切换范围类型 */
function handleScopeTypeChange() {
  formData.value.scopes = [createScope(scopeType.value)]
}

/** 切换聘用形式 */
function handleEmployTypeChange() {
  ensureScope().employeeStatuses = []
}

/** 是否层级型处理人 */
function isLevelType(type?: number) {
  return type === HrmPerformanceRaterType.SUPERIOR || type === HrmPerformanceRaterType.DEPT_LEADER
}

/** 层级选项 */
function levelColumns(type?: number) {
  return Array.from({ length: HRM_PERFORMANCE_RATER_MAX_LEVEL }, (_, index) => {
    const level = index + 1
    return {
      label: formatHrmPerformanceRaterLevel(type, level),
      value: level,
    }
  })
}

/** 切换指标制定方式 */
function handleQuotaSettingChange() {
  if (formData.value.quotaSettingType === HrmPerformanceQuotaSettingType.EMPLOYEE) {
    return
  }
  formData.value.targetConfirmation = false
  formData.value.targetConfirmationStage = undefined
}

/** 切换目标确认 */
function handleTargetConfirmationChange() {
  const value = !!formData.value.targetConfirmation
  formData.value.targetConfirmationStage = value
    ? { type: HrmPerformanceRaterType.SUPERIOR, level: 1 }
    : undefined
}

/** 切换目标确认人类型 */
function handleTargetConfirmerTypeChange() {
  const stage = formData.value.targetConfirmationStage
  if (!stage) {
    return
  }
  stage.level = isLevelType(stage.type) ? 1 : undefined
  stage.employeeId = undefined
}

/** 切换结果审核 */
function handleResultAuditChange() {
  if (formData.value.resultAudit && !formData.value.resultAuditStages?.length) {
    formData.value.resultAuditStages = [createDefaultHandlerStage()]
  }
}

/** 切换结果确认 */
function handleResultConfirmationChange() {
  if (formData.value.resultConfirmation && !formData.value.appealStages?.length) {
    formData.value.appealStages = [createDefaultHandlerStage()]
  }
}

/** 选择月份 */
function handleMonthConfirm({ value }: { value: number | string }) {
  formData.value.cycle = dayjs(value).format('YYYY-MM')
}

/** 选择年份 */
function handleYearConfirm({ value }: { value: number | string }) {
  formData.value.cycle = dayjs(value).format('YYYY')
}

/** 选择计薪月份 */
function handlePaidMonthConfirm({ value }: { value: number | string }) {
  formData.value.paidForMonth = dayjs(value).format('YYYY-MM')
}

/** 选择开始日期 */
function handleStartDateConfirm({ value }: { value: number | string }) {
  customDateRange.value = [dayjs(value).format('YYYY-MM-DD'), customDateRange.value[1]]
  syncCustomCycle()
}

/** 选择结束日期 */
function handleEndDateConfirm({ value }: { value: number | string }) {
  customDateRange.value = [customDateRange.value[0], dayjs(value).format('YYYY-MM-DD')]
  syncCustomCycle()
}

/** 同步自定义周期文案 */
function syncCustomCycle() {
  const [start, end] = customDateRange.value
  formData.value.cycle = start && end ? `${start} ~ ${end}` : ''
}

/** 切换考核模板 */
async function handleAssessmentTemplateChange(value?: number) {
  formData.value.assessmentConfig = createDefaultAssessmentConfig()
  if (!value) {
    return
  }
  const template = await getPerformanceAssessmentTemplate(value)
  if (formData.value.assessmentTemplateId !== value) {
    return
  }
  formData.value.assessmentConfig = cloneAssessmentConfig(template)
}

/** 切换结果模板 */
function handleResultTemplateChange(value?: number) {
  const template = resultTemplates.value.find(item => item.id === value)
  if (!template) {
    formData.value.resultConfig = { name: '', levels: [] }
    return
  }
  formData.value.resultConfig = {
    name: template.name,
    levels: (template.levels || []).map(level => ({ ...level })),
  }
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

/** 复制考核配置 */
function cloneAssessmentConfig(config: AssessmentConfig): AssessmentConfig {
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
