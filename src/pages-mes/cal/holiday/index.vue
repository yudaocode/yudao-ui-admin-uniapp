<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="假期设置" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 月份切换 -->
    <view class="bg-white px-24rpx py-20rpx">
      <view class="flex items-center justify-between">
        <wd-button size="small" variant="plain" @click="changeMonth(-1)">
          上月
        </wd-button>
        <view class="text-34rpx text-[#333] font-semibold">
          {{ currentMonthText }}
        </view>
        <wd-button size="small" variant="plain" @click="changeMonth(1)">
          下月
        </wd-button>
      </view>
      <view class="mt-16rpx flex items-center justify-center gap-24rpx text-24rpx text-[#666]">
        <view class="flex items-center gap-8rpx">
          <text class="h-18rpx w-18rpx rounded-full bg-[#52c41a]" />
          <text>休息日</text>
        </view>
        <view class="flex items-center gap-8rpx">
          <text class="h-18rpx w-18rpx rounded-full bg-[#1677ff]" />
          <text>工作日</text>
        </view>
        <view class="flex items-center gap-8rpx">
          <text class="h-18rpx w-18rpx rounded-full bg-[#f56c6c]" />
          <text>周末</text>
        </view>
      </view>
    </view>

    <!-- 日历视图 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="m-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
        <view class="grid grid-cols-7 border-b border-[#f2f3f5]">
          <view
            v-for="week in weekLabels"
            :key="week"
            class="py-18rpx text-center text-24rpx text-[#999]"
          >
            {{ week }}
          </view>
        </view>
        <view class="grid grid-cols-7">
          <view
            v-for="day in calendarDays"
            :key="day.date"
            class="min-h-128rpx border-b border-r border-[#f2f3f5] p-10rpx"
            :class="day.isCurrentMonth ? 'bg-white' : 'bg-[#fafafa]'"
            @click="handleDayClick(day)"
          >
            <view class="flex items-start justify-between gap-6rpx">
              <text
                class="text-28rpx font-semibold"
                :class="[
                  day.isCurrentMonth ? 'text-[#333]' : 'text-[#c8c9cc]',
                  day.isWeekend && day.isCurrentMonth ? 'text-[#f56c6c]' : '',
                ]"
              >
                {{ day.dayOfMonth }}
              </text>
              <text
                v-if="day.isCurrentMonth"
                class="rounded-6rpx px-8rpx py-2rpx text-20rpx text-white"
                :class="isHoliday(day.date) ? 'bg-[#52c41a]' : 'bg-[#1677ff]'"
              >
                {{ isHoliday(day.date) ? '休' : '班' }}
              </text>
            </view>
            <view v-if="day.isToday" class="mt-8rpx text-22rpx text-[#1677ff]">
              今天
            </view>
            <view v-if="day.isCurrentMonth && holidayMap[day.date]?.remark" class="line-clamp-2 mt-8rpx text-22rpx text-[#666]">
              {{ holidayMap[day.date]?.remark }}
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 假期设置弹层 -->
    <wd-popup v-model="formVisible" position="bottom" :safe-area-inset-bottom="true">
      <view class="max-h-[80vh] flex flex-col bg-white">
        <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
          <text class="text-32rpx text-[#333] font-semibold">
            假期设置
          </text>
          <wd-icon name="close" size="36rpx" @click="formVisible = false" />
        </view>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-cell title="日期" :value="selectedDay || '-'" />
            <yd-form-picker v-model="formData.type" label="类型" label-width="180rpx" prop="type" :dict-type="DICT_TYPE.MES_CAL_HOLIDAY_TYPE" placeholder="请选择类型" />
            <wd-form-item title="备注" title-width="180rpx" prop="remark">
              <wd-textarea
                v-model="formData.remark"
                placeholder="请输入备注"
                :maxlength="200"
                show-word-limit
                clearable
              />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="p-24rpx">
          <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
            保存
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { CalHoliday } from '@/api/mes/cal/holiday'
import { onUnload } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { computed, onMounted, reactive, ref } from 'vue'
import { getHolidayByDay, getHolidayList, saveHoliday } from '@/api/mes/cal/holiday'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesCalHolidayTypeEnum } from '@/utils/constants'
import { formatDateEndTime, formatDateOnly, formatDateStartTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

interface CalendarDay {
  date: string
  dayOfMonth: string
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
}

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const currentMonth = ref(dayjs().startOf('month')) // 当前查看月份
const holidayMap = ref<Record<string, CalHoliday>>({}) // 日期维度的假期配置
const formVisible = ref(false) // 设置弹层显示状态
const formLoading = ref(false) // 设置提交状态
const selectedDay = ref('') // 当前设置日期
const formRef = ref<FormInstance>() // 设置表单引用
const formData = reactive<CalHoliday>({
  id: undefined,
  day: '',
  type: MesCalHolidayTypeEnum.WORKDAY,
}) // 设置表单数据
const formSchema = createFormSchema({
  type: [{ required: true, message: '类型不能为空' }],
})
const weekLabels = ['一', '二', '三', '四', '五', '六', '日'] // 周标题
const currentMonthText = computed(() => currentMonth.value.format('YYYY年MM月')) // 当前月份文案
const calendarDays = computed<CalendarDay[]>(() => { // 日历展示数据
  const startOfMonth = currentMonth.value.startOf('month')
  const endOfMonth = currentMonth.value.endOf('month')
  const mondayOffset = (startOfMonth.day() + 6) % 7
  const start = startOfMonth.subtract(mondayOffset, 'day')
  const totalDays = Math.ceil((mondayOffset + endOfMonth.date()) / 7) * 7
  return Array.from({ length: totalDays }, (_, index) => {
    const day = start.add(index, 'day')
    return {
      date: day.format('YYYY-MM-DD'),
      dayOfMonth: day.format('D'),
      isCurrentMonth: day.month() === currentMonth.value.month(),
      isToday: day.isSame(dayjs(), 'day'),
      isWeekend: day.day() === 0 || day.day() === 6,
    }
  })
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 判断是否为休息日 */
function isHoliday(day: string) {
  return holidayMap.value[day]?.type === MesCalHolidayTypeEnum.HOLIDAY
}

/** 加载当前月前后可见范围假期 */
async function getList() {
  const startDay = formatDateStartTime(currentMonth.value.subtract(1, 'month').startOf('month'))
  const endDay = formatDateEndTime(currentMonth.value.add(1, 'month').endOf('month'))
  const list = await getHolidayList({ startDay, endDay })
  holidayMap.value = list.reduce<Record<string, CalHoliday>>((map, item) => {
    const day = formatDateOnly(item.day)
    if (day) {
      map[day] = item
    }
    return map
  }, {})
}

/** 切换月份 */
function changeMonth(step: number) {
  currentMonth.value = currentMonth.value.add(step, 'month').startOf('month')
  getList()
}

/** 点击日期 */
async function handleDayClick(day: CalendarDay) {
  if (!day.isCurrentMonth) {
    return
  }
  if (!hasAccessByCodes(['mes:cal-holiday:create'])) {
    toast.warning('没有假期设置权限')
    return
  }
  selectedDay.value = day.date
  const submitDay = toTimestamp(formatDateStartTime(day.date))
  formData.id = undefined
  formData.day = submitDay
  formData.type = MesCalHolidayTypeEnum.WORKDAY
  formData.remark = undefined
  formRef.value?.reset()
  formVisible.value = true
  formLoading.value = true
  try {
    Object.assign(formData, await getHolidayByDay(formatDateStartTime(day.date)), { day: submitDay })
  } finally {
    formLoading.value = false
  }
}

/** 保存假期设置 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    await saveHoliday(formData)
    toast.success('设置成功')
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:cal:holiday:reload', getList)
  getList()
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:cal:holiday:reload', getList)
})
</script>
