<template>
  <wd-cell-group border title="指标设置">
    <yd-form-picker
      v-model="model.assessmentTemplateId"
      label="考核指标模板"
      label-width="200rpx"
      prop="assessmentTemplateId"
      :columns="assessmentTemplateColumns"
      placeholder="请选择考核指标模板"
      :disabled="disabled"
      @confirm="handleAssessmentTemplateChange"
    />
    <AssessmentConfigEditor
      v-if="model.assessmentTemplateId && model.assessmentConfig"
      v-model="model.assessmentConfig"
      prop-prefix="assessmentConfig."
      :disabled="disabled"
      :show-dimensions="true"
    />
    <view v-else class="px-24rpx py-32rpx text-center text-28rpx text-[#999]">
      请先选择考核指标模板
    </view>
    <yd-form-picker
      v-model="model.quotaSettingType"
      label="指标制定"
      label-width="200rpx"
      prop="quotaSettingType"
      :columns="quotaSettingColumns"
      placeholder="请选择指标制定方式"
      :disabled="disabled"
      @confirm="handleQuotaSettingChange"
    />
    <template v-if="model.quotaSettingType === HrmPerformanceQuotaSettingType.EMPLOYEE">
      <wd-form-item title="目标确认" title-width="200rpx" prop="targetConfirmation">
        <wd-switch
          v-model="model.targetConfirmation"
          :disabled="disabled"
          @change="handleTargetConfirmationChange"
        />
      </wd-form-item>
      <template v-if="model.targetConfirmation && model.targetConfirmationStage">
        <yd-form-picker
          v-model="model.targetConfirmationStage.type"
          label="确认人"
          label-width="200rpx"
          prop="targetConfirmationStage"
          :columns="handlerTypeColumns"
          placeholder="请选择确认人"
          :disabled="disabled"
          @confirm="handleTargetConfirmerTypeChange"
        />
        <yd-form-picker
          v-if="isLevelType(model.targetConfirmationStage.type)"
          v-model="model.targetConfirmationStage.level"
          label="确认层级"
          label-width="200rpx"
          :columns="levelColumns(model.targetConfirmationStage.type)"
          placeholder="请选择层级"
          :disabled="disabled"
        />
        <EmployeeFormPicker
          v-else-if="model.targetConfirmationStage.type === HrmPerformanceRaterType.SPECIFIED"
          v-model="model.targetConfirmationStage.employeeId"
          label="指定确认人"
          label-width="200rpx"
          placeholder="请选择确认员工"
          :disabled="disabled"
        />
      </template>
    </template>
  </wd-cell-group>
</template>

<script lang="ts" setup>
import type { AssessmentConfig } from '@/api/hrm/performance/assessment'
import type { AssessmentTemplate } from '@/api/hrm/performance/config/assessment-template'
import type { PerformancePlan } from '@/api/hrm/performance/plan'
import { computed } from 'vue'
import { getPerformanceAssessmentTemplate } from '@/api/hrm/performance/config/assessment-template'
import {
  HRM_PERFORMANCE_RATER_MAX_LEVEL,
  HrmPerformanceHandlerTypeOptions,
  HrmPerformanceQuotaSettingType,
  HrmPerformanceRaterType,
  HrmPerformanceScoreCalculation,
  HrmPerformanceUpperLimitType,
} from '@/pages-hrm/utils/constants'
import { formatHrmPerformanceRaterLevel } from '@/pages-hrm/utils/format'
import EmployeeFormPicker from '@/pages-hrm/employee/components/employee-form-picker.vue'
import AssessmentConfigEditor from '@/pages-hrm/performance/config/assessment-template/components/assessment-config-editor.vue'

const props = withDefaults(defineProps<{
  disabled?: boolean
  assessmentTemplates?: AssessmentTemplate[]
}>(), {
  disabled: false,
  assessmentTemplates: () => [],
})

const model = defineModel<PerformancePlan>({ required: true })

const quotaSettingColumns = [
  { label: '系统制定', value: HrmPerformanceQuotaSettingType.SYSTEM },
  { label: '员工制定', value: HrmPerformanceQuotaSettingType.EMPLOYEE },
]
const handlerTypeColumns = computed(() =>
  HrmPerformanceHandlerTypeOptions.map(item => ({ label: item.label, value: item.value })),
)
const assessmentTemplateColumns = computed(() =>
  props.assessmentTemplates.map(item => ({ label: item.name, value: item.id! })),
)

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

/** 切换考核模板 */
async function handleAssessmentTemplateChange(value?: number) {
  model.value.assessmentConfig = createDefaultAssessmentConfig()
  if (!value) {
    return
  }
  const template = await getPerformanceAssessmentTemplate(value)
  if (model.value.assessmentTemplateId !== value) {
    return
  }
  model.value.assessmentConfig = cloneAssessmentConfig(template)
}

/** 切换指标制定方式 */
function handleQuotaSettingChange() {
  if (model.value.quotaSettingType === HrmPerformanceQuotaSettingType.EMPLOYEE) {
    return
  }
  model.value.targetConfirmation = false
  model.value.targetConfirmationStage = undefined
}

/** 切换目标确认 */
function handleTargetConfirmationChange() {
  const value = !!model.value.targetConfirmation
  model.value.targetConfirmationStage = value
    ? { type: HrmPerformanceRaterType.SUPERIOR, level: 1 }
    : undefined
}

/** 切换目标确认人类型 */
function handleTargetConfirmerTypeChange() {
  const stage = model.value.targetConfirmationStage
  if (!stage) {
    return
  }
  stage.level = isLevelType(stage.type) ? 1 : undefined
  stage.employeeId = undefined
}
</script>
