<template>
  <view>
    <view class="mb-8rpx flex items-center justify-between px-24rpx py-12rpx">
      <text
        class="text-26rpx"
        :class="Math.abs(weightTotal - 100) < 0.001 ? 'text-[#52c41a]' : 'text-[#ff4d4f]'"
      >
        权重合计 {{ weightTotal }}%
      </text>
      <view v-if="!disabled" class="flex gap-12rpx">
        <wd-button
          size="small"
          variant="plain"
          :disabled="hasSelfStage"
          @click="addStage(HrmPerformanceRaterType.SELF)"
        >
          新增自评
        </wd-button>
        <wd-button
          size="small"
          type="primary"
          variant="plain"
          @click="addStage(HrmPerformanceRaterType.SUPERIOR)"
        >
          新增他评
        </wd-button>
      </view>
    </view>

    <view
      v-for="(stage, index) in model"
      :key="index"
      class="border-b border-[#f0f0f0] px-24rpx py-20rpx"
    >
      <view class="mb-12rpx flex items-center justify-between">
        <text class="text-28rpx text-[#333] font-semibold">
          {{ index + 1 }}. {{ stage.name || formatHrmPerformanceReviewStageName(stage) }}
        </text>
        <wd-button
          v-if="!disabled"
          size="small"
          type="danger"
          variant="text"
          @click="removeStage(index)"
        >
          删除
        </wd-button>
      </view>
      <yd-form-picker
        v-model="stage.rater!.type"
        label="评分人"
        label-width="160rpx"
        :columns="raterTypeColumns"
        placeholder="请选择评分人"
        :disabled="disabled"
        @confirm="() => handleRaterTypeChange(stage)"
      />
      <yd-form-picker
        v-if="isLevelType(stage.rater?.type)"
        v-model="stage.rater!.level"
        label="层级"
        label-width="160rpx"
        :columns="levelColumns(stage.rater?.type)"
        placeholder="请选择层级"
        :disabled="disabled"
      />
      <EmployeeFormPicker
        v-else-if="stage.rater?.type === HrmPerformanceRaterType.SPECIFIED"
        v-model="stage.rater!.employeeId"
        label="指定评分人"
        label-width="160rpx"
        placeholder="请选择评分人"
        :disabled="disabled"
      />
      <wd-form-item title="权重(%)" title-width="160rpx">
        <wd-input-number
          v-model="stage.weight"
          :min="0.01"
          :max="100"
          :precision="2"
          :disabled="disabled"
        />
      </wd-form-item>
      <yd-form-picker
        v-model="stage.visibleContent"
        label="可见内容"
        label-width="160rpx"
        :columns="visibleContentColumns"
        placeholder="请选择可见内容"
        :disabled="disabled"
      />
      <wd-form-item title="评语必填" title-width="160rpx">
        <wd-switch v-model="stage.requiredSetting" :disabled="disabled" />
      </wd-form-item>
      <wd-form-item title="允许驳回" title-width="160rpx">
        <wd-switch
          v-model="stage.rejectAuthority"
          :disabled="disabled || stage.rater?.type === HrmPerformanceRaterType.SELF"
        />
      </wd-form-item>
    </view>

    <view v-if="!model.length" class="px-24rpx py-24rpx text-28rpx text-[#999]">
      暂无评分阶段，请新增自评或他评
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PerformanceReviewStage } from '@/api/hrm/performance/plan'
import { computed } from 'vue'
import {
  HRM_PERFORMANCE_RATER_MAX_LEVEL,
  HrmPerformanceRaterType,
  HrmPerformanceRaterTypeOptions,
  HrmPerformanceReviewScoringType,
  HrmPerformanceReviewVisibleContent,
} from '@/pages-hrm/utils/constants'
import {
  formatHrmPerformanceRaterLevel,
  formatHrmPerformanceReviewStageName,
} from '@/pages-hrm/utils/format'
import EmployeeFormPicker from '@/pages-hrm/employee/components/employee-form-picker.vue'

withDefaults(defineProps<{
  disabled?: boolean
}>(), {
  disabled: false,
})

const model = defineModel<PerformanceReviewStage[]>({ required: true })

const raterTypeColumns = computed(() =>
  HrmPerformanceRaterTypeOptions.map(item => ({ label: item.label, value: item.value })),
)
const visibleContentColumns = [
  { label: '全部评分', value: HrmPerformanceReviewVisibleContent.ALL },
  { label: '仅自己', value: HrmPerformanceReviewVisibleContent.SELF },
]
const weightTotal = computed(() => {
  return Number(
    (model.value || [])
      .reduce((total, stage) => total + Number(stage.weight || 0), 0)
      .toFixed(2),
  )
})
const hasSelfStage = computed(() => {
  return (model.value || []).some(stage => stage.rater?.type === HrmPerformanceRaterType.SELF)
})

/** 是否层级型评分人 */
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

/** 新增评分阶段 */
function addStage(raterType: number) {
  model.value = [
    ...(model.value || []),
    {
      rater: {
        type: raterType,
        level: isLevelType(raterType) ? 1 : undefined,
      },
      weight: 0,
      scoringType: HrmPerformanceReviewScoringType.QUOTA,
      visibleContent: HrmPerformanceReviewVisibleContent.ALL,
      requiredSetting: false,
      rejectAuthority: raterType !== HrmPerformanceRaterType.SELF,
    },
  ]
}

/** 删除评分阶段 */
function removeStage(index: number) {
  model.value = (model.value || []).filter((_, stageIndex) => stageIndex !== index)
}

/** 评分人类型变化 */
function handleRaterTypeChange(stage: PerformanceReviewStage) {
  if (!stage.rater) {
    return
  }
  stage.rater.level = isLevelType(stage.rater.type) ? 1 : undefined
  stage.rater.employeeId = undefined
  if (stage.rater.type === HrmPerformanceRaterType.SELF) {
    stage.rejectAuthority = false
  }
}
</script>
