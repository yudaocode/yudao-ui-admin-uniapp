<template>
  <view>
    <view
      v-for="(stage, index) in model"
      :key="index"
      class="border-b border-[#f0f0f0] px-24rpx py-20rpx"
    >
      <view class="mb-12rpx flex items-center justify-between">
        <text class="text-28rpx text-[#333] font-semibold">节点 {{ index + 1 }}</text>
        <wd-button
          v-if="!disabled && model.length > 1"
          size="small"
          type="danger"
          variant="text"
          @click="removeStage(index)"
        >
          删除
        </wd-button>
      </view>
      <yd-form-picker
        v-model="stage.type"
        label="处理人"
        label-width="160rpx"
        :columns="handlerTypeColumns"
        placeholder="请选择处理人"
        :disabled="disabled"
        @confirm="() => handleTypeChange(stage)"
      />
      <yd-form-picker
        v-if="isLevelType(stage.type)"
        v-model="stage.level"
        label="层级"
        label-width="160rpx"
        :columns="levelColumns(stage.type)"
        placeholder="请选择层级"
        :disabled="disabled"
      />
      <EmployeeFormPicker
        v-else
        v-model="stage.employeeId"
        label="指定员工"
        label-width="160rpx"
        placeholder="请选择处理员工"
        :disabled="disabled"
      />
    </view>
    <view v-if="!disabled && model.length < 3" class="px-24rpx py-16rpx">
      <wd-button size="small" type="primary" variant="plain" @click="addStage">
        新增处理节点
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PerformanceHandlerStage } from '@/api/hrm/performance/plan'
import { computed } from 'vue'
import {
  HRM_PERFORMANCE_RATER_MAX_LEVEL,
  HrmPerformanceHandlerTypeOptions,
  HrmPerformanceRaterType,
} from '@/pages-hrm/utils/constants'
import { formatHrmPerformanceRaterLevel } from '@/pages-hrm/utils/format'
import EmployeeFormPicker from '@/pages-hrm/employee/components/employee-form-picker.vue'

withDefaults(defineProps<{
  disabled?: boolean
}>(), {
  disabled: false,
})

const model = defineModel<PerformanceHandlerStage[]>({ required: true })

const handlerTypeColumns = computed(() =>
  HrmPerformanceHandlerTypeOptions.map(item => ({ label: item.label, value: item.value })),
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

/** 新增处理节点 */
function addStage() {
  model.value = [
    ...model.value,
    { type: HrmPerformanceRaterType.SUPERIOR, level: 1 },
  ]
}

/** 删除处理节点 */
function removeStage(index: number) {
  model.value = model.value.filter((_, stageIndex) => stageIndex !== index)
}

/** 处理人类型变化 */
function handleTypeChange(stage: PerformanceHandlerStage) {
  stage.level = isLevelType(stage.type) ? 1 : undefined
  stage.employeeId = undefined
}
</script>
