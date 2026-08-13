<template>
  <!-- 报表期间筛选：报表周期 + 会计期间，变化后立即触发查询 -->
  <view class="rounded-12rpx bg-white px-24rpx py-20rpx shadow-sm">
    <view class="flex items-center justify-between">
      <text class="text-28rpx text-[#666]">报表周期</text>
      <wd-radio-group v-model="periodType" type="button" @change="emitQuery">
        <wd-radio value="month">
          月报
        </wd-radio>
        <wd-radio value="quarter">
          季报
        </wd-radio>
      </wd-radio-group>
    </view>
    <view class="mt-20rpx flex items-center justify-between" @click="pickerVisible = true">
      <text class="text-28rpx text-[#666]">会计期间</text>
      <view class="flex items-center gap-8rpx">
        <text class="text-28rpx text-[#333]">{{ periodLabel || '请选择' }}</text>
        <wd-icon name="arrow-right" size="28rpx" color="#999" />
      </view>
    </view>
    <wd-datetime-picker
      v-model="pickerValue"
      v-model:visible="pickerVisible"
      title="请选择会计期间"
      type="year-month"
      :min-date="minDate"
      :max-date="maxDate"
      @confirm="handleMonthConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useFmsStore } from '@/pages-fms/store/fms'
import {
  formatFmsMonth,
  formatFmsPeriodLabel,
  formatFmsStartTime,
  parseFmsMonth,
} from '@/pages-fms/utils/format'

const emit = defineEmits<{
  query: [value: { startMonth: string, endMonth: string }]
}>()

const fmsStore = useFmsStore()
const periodType = ref<'month' | 'quarter'>('month') // 报表周期
const reportMonth = ref('') // 会计期间，格式 YYYY-MM
const pickerValue = ref<number | ''>('') // 期间选择器值（时间戳）
const pickerVisible = ref(false) // 期间选择器显隐

const accountSetId = computed(() => fmsStore.accountSet?.id) // 当前账套编号
const minMonth = computed(() => { // 账套启用月份，可选期间的最早月份
  const accountSet = fmsStore.accountSetList.find(item => item.id === accountSetId.value)
  return formatFmsStartTime(accountSet?.startTime)
})
const maxMonth = computed(() => fmsStore.currentMonth || dayjs().format('YYYY-MM')) // 账套当前月份，可选期间的最晚月份
const minDate = computed(() => parseFmsMonth(minMonth.value) || undefined) // 期间选择器最早日期
const maxDate = computed(() => parseFmsMonth(maxMonth.value) || undefined) // 期间选择器最晚日期

const periodLabel = computed(() => { // 当前期间展示文案，例如 2025年第01期 至 2025年第03期
  const { startMonth, endMonth } = buildRange()
  return startMonth ? formatFmsPeriodLabel(startMonth, endMonth) : ''
})

/** 按报表周期计算期间范围：月报取当月，季报取所选月份所在季度并钳制到账套启用月与当前月 */
function buildRange() {
  if (!reportMonth.value) {
    return { startMonth: '', endMonth: '' }
  }
  const month = dayjs(`${reportMonth.value}-01`)
  if (periodType.value === 'month') {
    return { startMonth: month.format('YYYY-MM'), endMonth: month.format('YYYY-MM') }
  }
  const quarter = Math.floor(month.month() / 3) + 1
  const quarterStartMonth = month.month((quarter - 1) * 3)
  let startMonth = quarterStartMonth.format('YYYY-MM')
  let endMonth = quarterStartMonth.add(2, 'month').format('YYYY-MM')
  // 季度起止分别钳制到账套启用月与当前月，避免查询未启用或未来期间
  if (minMonth.value && startMonth < minMonth.value) {
    startMonth = minMonth.value
  }
  if (maxMonth.value && endMonth > maxMonth.value) {
    endMonth = maxMonth.value
  }
  return { startMonth, endMonth }
}

/** 触发查询 */
function emitQuery() {
  const { startMonth, endMonth } = buildRange()
  if (!startMonth) {
    return
  }
  emit('query', { startMonth, endMonth })
}

/** 期间选择确认 */
function handleMonthConfirm() {
  reportMonth.value = formatFmsMonth(pickerValue.value)
  emitQuery()
}

/** 初始化期间为账套当前月份，并触发首次查询 */
async function initializePeriod() {
  const initializingAccountSetId = accountSetId.value
  if (!initializingAccountSetId) {
    return
  }
  if (!fmsStore.currentMonth) {
    await fmsStore.loadCurrentMonth()
  }
  if (accountSetId.value !== initializingAccountSetId) {
    return // 期间返回时账套已切换，丢弃本次初始化
  }
  reportMonth.value = maxMonth.value
  pickerValue.value = parseFmsMonth(reportMonth.value)
  emitQuery()
}

/** 账套切换后刷新期间并重新查询 */
watch(() => fmsStore.accountSet?.id, (value, oldValue) => {
  if (!value || value === oldValue) {
    return
  }
  initializePeriod()
})

/** 初始化 */
onMounted(() => {
  initializePeriod()
})
</script>
