<template>
  <view>
    <wd-cell-group border title="结果设置">
      <yd-form-picker
        v-model="model.resultTemplateId"
        label="结果模板"
        label-width="200rpx"
        prop="resultTemplateId"
        :columns="resultTemplateColumns"
        placeholder="请选择结果模板"
        :disabled="disabled"
        @confirm="handleResultTemplateChange"
      />
      <wd-cell title="结果等级" :value="resultLevelText" />
      <wd-form-item title="同步薪资" title-width="200rpx" prop="syncToSalary">
        <wd-switch v-model="model.syncToSalary" :disabled="disabled" />
      </wd-form-item>
      <wd-form-item
        v-if="model.syncToSalary"
        title="计薪月份"
        title-width="200rpx"
        prop="paidForMonth"
      >
        <view
          class="min-h-72rpx flex items-center justify-end text-28rpx"
          :class="model.paidForMonth ? 'text-[#333]' : 'text-[#999]'"
          @click="!disabled && (paidMonthVisible = true)"
        >
          {{ model.paidForMonth || '请选择计薪月份' }}
        </view>
      </wd-form-item>
    </wd-cell-group>

    <wd-datetime-picker
      v-model="paidMonthPickerValue"
      v-model:visible="paidMonthVisible"
      type="year-month"
      title="请选择计薪月份"
      @confirm="handlePaidMonthConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ResultTemplate } from '@/api/hrm/performance/config/result-template'
import type { PerformancePlan } from '@/api/hrm/performance/plan'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  disabled?: boolean
  resultTemplates?: ResultTemplate[]
}>(), {
  disabled: false,
  resultTemplates: () => [],
})

const model = defineModel<PerformancePlan>({ required: true })

const paidMonthVisible = ref(false)
const paidMonthPickerValue = ref<number | string>(Date.now())

const resultTemplateColumns = computed(() =>
  props.resultTemplates.map(item => ({ label: item.name, value: item.id! })),
)
const resultLevelText = computed(() => {
  return model.value.resultConfig?.levels
    ?.map(level => `${level.name}（${level.minScore}-${level.maxScore}）`)
    .join('；') || '-'
})

/** 切换结果模板 */
function handleResultTemplateChange(value?: number) {
  const template = props.resultTemplates.find(item => item.id === value)
  if (!template) {
    model.value.resultConfig = { name: '', levels: [] }
    return
  }
  model.value.resultConfig = {
    name: template.name,
    levels: (template.levels || []).map(level => ({ ...level })),
  }
}

/** 选择计薪月份 */
function handlePaidMonthConfirm({ value }: { value: number | string }) {
  model.value.paidForMonth = dayjs(value).format('YYYY-MM')
}
</script>
