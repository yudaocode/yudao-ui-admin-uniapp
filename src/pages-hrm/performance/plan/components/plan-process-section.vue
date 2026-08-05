<template>
  <wd-cell-group border title="流程设置">
    <view class="px-24rpx py-16rpx text-28rpx text-[#333] font-semibold">
      考核评分流程
    </view>
    <ReviewStageList
      v-if="model.reviewStages"
      v-model="model.reviewStages"
      :disabled="disabled"
    />
    <wd-form-item title="结果审核" title-width="200rpx" prop="resultAudit">
      <wd-switch
        v-model="model.resultAudit"
        :disabled="disabled"
        @change="handleResultAuditChange"
      />
    </wd-form-item>
    <HandlerStageList
      v-if="model.resultAudit && model.resultAuditStages"
      v-model="model.resultAuditStages"
      :disabled="disabled"
    />
    <wd-form-item title="结果确认" title-width="200rpx" prop="resultConfirmation">
      <wd-switch
        v-model="model.resultConfirmation"
        :disabled="disabled"
        @change="handleResultConfirmationChange"
      />
    </wd-form-item>
    <wd-form-item
      v-if="model.resultConfirmation"
      title="申诉超期天数"
      title-width="200rpx"
      prop="appealTimeoutDays"
    >
      <wd-input-number
        v-model="model.appealTimeoutDays"
        allow-null
        :min="1"
        :precision="0"
        :disabled="disabled"
      />
    </wd-form-item>
    <yd-form-picker
      v-if="model.resultConfirmation"
      v-model="model.appealTimeoutAction"
      label="超期处理"
      label-width="200rpx"
      prop="appealTimeoutAction"
      :columns="appealTimeoutColumns"
      placeholder="请选择超期处理"
      :disabled="disabled"
    />
    <HandlerStageList
      v-if="model.resultConfirmation && model.appealStages"
      v-model="model.appealStages"
      :disabled="disabled"
    />
  </wd-cell-group>
</template>

<script lang="ts" setup>
import type { PerformanceHandlerStage, PerformancePlan } from '@/api/hrm/performance/plan'
import {
  HrmPerformanceAppealTimeoutAction,
  HrmPerformanceRaterType,
} from '@/pages-hrm/utils/constants'
import HandlerStageList from './handler-stage-list.vue'
import ReviewStageList from './review-stage-list.vue'

withDefaults(defineProps<{
  disabled?: boolean
}>(), {
  disabled: false,
})

const model = defineModel<PerformancePlan>({ required: true })

const appealTimeoutColumns = [
  { label: '自动拒绝', value: HrmPerformanceAppealTimeoutAction.REJECT },
  { label: '自动通过', value: HrmPerformanceAppealTimeoutAction.APPROVE },
]

/** 创建默认处理节点 */
function createDefaultHandlerStage(): PerformanceHandlerStage {
  return {
    type: HrmPerformanceRaterType.DEPT_LEADER,
    level: 1,
  }
}

/** 切换结果审核 */
function handleResultAuditChange() {
  if (model.value.resultAudit && !model.value.resultAuditStages?.length) {
    model.value.resultAuditStages = [createDefaultHandlerStage()]
  }
}

/** 切换结果确认 */
function handleResultConfirmationChange() {
  if (model.value.resultConfirmation && !model.value.appealStages?.length) {
    model.value.appealStages = [createDefaultHandlerStage()]
  }
}
</script>
