<template>
  <view>
    <wd-cell-group border title="基础设置">
      <wd-form-item title="计划名称" title-width="200rpx" prop="name">
        <wd-input
          v-model="model.name"
          clearable
          placeholder="请输入考核计划名称"
          :maxlength="50"
          :disabled="disabled"
        />
      </wd-form-item>
      <yd-form-picker
        v-model="model.cycleType"
        label="周期类型"
        label-width="200rpx"
        prop="cycleType"
        :columns="cycleTypeColumns"
        placeholder="请选择周期类型"
        :disabled="disabled"
        @confirm="handleCycleTypeChange"
      />
      <wd-form-item
        v-if="model.cycleType === HrmPerformanceCycleType.MONTH"
        title="考核周期"
        title-width="200rpx"
        prop="cycle"
      >
        <view
          class="min-h-72rpx flex items-center justify-end text-28rpx"
          :class="model.cycle ? 'text-[#333]' : 'text-[#999]'"
          @click="!disabled && (monthVisible = true)"
        >
          {{ model.cycle || '请选择月份' }}
        </view>
      </wd-form-item>
      <template v-else-if="model.cycleType === HrmPerformanceCycleType.QUARTER">
        <wd-form-item title="考核年份" title-width="200rpx" prop="cycle">
          <view
            class="min-h-72rpx flex items-center justify-end text-28rpx"
            :class="model.cycle ? 'text-[#333]' : 'text-[#999]'"
            @click="!disabled && (yearVisible = true)"
          >
            {{ model.cycle || '请选择年份' }}
          </view>
        </wd-form-item>
        <yd-form-picker
          v-model="model.quarter"
          label="季度"
          label-width="200rpx"
          prop="quarter"
          :columns="quarterColumns"
          placeholder="请选择季度"
          :disabled="disabled"
        />
      </template>
      <wd-form-item
        v-else-if="model.cycleType !== HrmPerformanceCycleType.OTHER"
        title="考核年份"
        title-width="200rpx"
        prop="cycle"
      >
        <view
          class="min-h-72rpx flex items-center justify-end text-28rpx"
          :class="model.cycle ? 'text-[#333]' : 'text-[#999]'"
          @click="!disabled && (yearVisible = true)"
        >
          {{ model.cycle || '请选择年份' }}
        </view>
      </wd-form-item>
      <template v-else>
        <wd-form-item title="开始日期" title-width="200rpx" prop="cycle">
          <view
            class="min-h-72rpx flex items-center justify-end text-28rpx"
            :class="customDateRange[0] ? 'text-[#333]' : 'text-[#999]'"
            @click="!disabled && (startDateVisible = true)"
          >
            {{ customDateRange[0] || '请选择开始日期' }}
          </view>
        </wd-form-item>
        <wd-form-item title="结束日期" title-width="200rpx" prop="cycle">
          <view
            class="min-h-72rpx flex items-center justify-end text-28rpx"
            :class="customDateRange[1] ? 'text-[#333]' : 'text-[#999]'"
            @click="!disabled && (endDateVisible = true)"
          >
            {{ customDateRange[1] || '请选择结束日期' }}
          </view>
        </wd-form-item>
      </template>
      <wd-form-item v-if="model.scopes" prop="scopes" vertical>
        <PlanScopeList v-model="model.scopes" :disabled="disabled" />
      </wd-form-item>
      <wd-form-item title="考核说明" title-width="200rpx" prop="description" vertical>
        <wd-textarea
          v-model="model.description"
          clearable
          placeholder="请输入考核说明"
          :maxlength="200"
          show-word-limit
          :disabled="disabled"
        />
      </wd-form-item>
    </wd-cell-group>

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
import type { PerformancePlan } from '@/api/hrm/performance/plan'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'
import {
  HrmPerformanceCycleType,
  HrmPerformanceCycleTypeOptions,
} from '@/pages-hrm/utils/constants'
import PlanScopeList from './plan-scope-list.vue'

withDefaults(defineProps<{
  disabled?: boolean
}>(), {
  disabled: false,
})

const model = defineModel<PerformancePlan>({ required: true })
const customDateRange = defineModel<[string | undefined, string | undefined]>('customDateRange', {
  required: true,
})

const monthVisible = ref(false)
const yearVisible = ref(false)
const startDateVisible = ref(false)
const endDateVisible = ref(false)
const monthPickerValue = ref<number | string>(Date.now())
const yearPickerValue = ref<number | string>(Date.now())
const startDatePickerValue = ref<number | string>(Date.now())
const endDatePickerValue = ref<number | string>(Date.now())

const cycleTypeColumns = computed(() =>
  HrmPerformanceCycleTypeOptions.map(item => ({ label: item.label, value: item.value })),
)
const quarterColumns = [
  { label: '第一季度', value: 1 },
  { label: '第二季度', value: 2 },
  { label: '第三季度', value: 3 },
  { label: '第四季度', value: 4 },
]

/** 切换周期类型 */
function handleCycleTypeChange() {
  model.value.cycle = ''
  model.value.quarter = model.value.cycleType === HrmPerformanceCycleType.QUARTER ? 1 : undefined
  customDateRange.value = [undefined, undefined]
}

/** 选择月份 */
function handleMonthConfirm({ value }: { value: number | string }) {
  model.value.cycle = dayjs(value).format('YYYY-MM')
}

/** 选择年份 */
function handleYearConfirm({ value }: { value: number | string }) {
  model.value.cycle = dayjs(value).format('YYYY')
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
  model.value.cycle = start && end ? `${start} ~ ${end}` : ''
}
</script>
