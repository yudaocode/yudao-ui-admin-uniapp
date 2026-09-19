<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="我的日历"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 范围与搜索 -->
    <view class="flex items-center gap-32rpx bg-white px-24rpx py-16rpx">
      <wd-checkbox v-model="queryParams.includeMine" @change="getList">
        我的日程
      </wd-checkbox>
      <wd-checkbox v-model="queryParams.includeReceived" @change="getList">
        共享给我
      </wd-checkbox>
    </view>
    <SearchForm :show-start-time="false" @search="handleQuery" @reset="handleReset" />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 月历网格 -->
        <view class="rounded-12rpx bg-white p-16rpx">
          <!-- 月份切换 -->
          <view class="mb-16rpx flex items-center justify-between px-8rpx">
            <wd-icon name="arrow-left" size="36rpx" color="#666" @click="handleMonthChange(-1)" />
            <view class="flex items-center gap-16rpx">
              <text class="text-30rpx text-[#333] font-semibold">{{ currentMonth.format('YYYY 年 MM 月') }}</text>
              <text class="text-24rpx text-[#1677ff]" @click="handleToday">今天</text>
            </view>
            <wd-icon name="arrow-right" size="36rpx" color="#666" @click="handleMonthChange(1)" />
          </view>
          <!-- 星期表头 -->
          <view class="grid grid-cols-7 mb-4rpx">
            <text
              v-for="day in weekDays"
              :key="day"
              class="py-8rpx text-center text-24rpx text-[#999]"
            >
              {{ day }}
            </text>
          </view>
          <!-- 日期网格 -->
          <view class="grid grid-cols-7">
            <view
              v-for="cell in dayCells"
              :key="cell.key"
              class="min-h-96rpx border border-[#f5f5f5] border-solid p-4rpx"
              :class="cell.key === selectedDate ? 'bg-[#e8f4ff]' : ''"
              @click="selectedDate = cell.key"
            >
              <view
                class="mx-auto h-36rpx w-36rpx flex items-center justify-center rounded-full text-24rpx"
                :class="getDayClass(cell)"
              >
                {{ cell.date.date() }}
              </view>
              <!-- 当日日程，最多 2 条 -->
              <view
                v-for="schedule in getDaySchedules(cell.key).slice(0, 2)"
                :key="schedule.id"
                class="mt-2rpx truncate rounded-4rpx px-4rpx text-18rpx leading-28rpx"
                :style="getPriorityStyle(schedule.priority)"
                @click.stop="handleDetail(schedule)"
              >
                {{ dayjs(schedule.startTime).isSame(cell.key, 'day') ? dayjs(schedule.startTime).format('HH:mm') : '持续' }} {{ schedule.title }}
              </view>
              <view
                v-if="getDaySchedules(cell.key).length > 2"
                class="text-center text-18rpx text-[#1677ff] leading-24rpx"
              >
                还有 {{ getDaySchedules(cell.key).length - 2 }} 项
              </view>
            </view>
          </view>
        </view>

        <!-- 选中日期日程 -->
        <view class="mb-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx">
          <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
            {{ dayjs(selectedDate).format('MM 月 DD 日日程') }}
          </view>
          <view v-if="!selectedSchedules.length" class="py-16rpx text-center text-24rpx text-[#999]">
            暂无日程
          </view>
          <view
            v-for="item in selectedSchedules"
            :key="item.id"
            class="mb-12rpx flex items-center gap-16rpx"
            @click="handleDetail(item)"
          >
            <text class="w-88rpx shrink-0 text-24rpx text-[#1677ff]">
              {{ dayjs(item.startTime).isSame(selectedDate, 'day') ? dayjs(item.startTime).format('HH:mm') : '持续' }}
            </text>
            <text class="line-clamp-1 min-w-0 flex-1 text-28rpx text-[#333]">{{ item.title }}</text>
            <dict-tag :type="DICT_TYPE.OA_PRIORITY" :value="item.priority" />
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['oa:schedule:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Dayjs } from 'dayjs'
import type { Schedule } from '@/api/oa/schedule'
import { onUnload } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import { computed, onMounted, reactive, ref } from 'vue'
import { getSchedulePage } from '@/api/oa/schedule'
import { useAccess } from '@/hooks/useAccess'
import { getDictObj } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from '../components/search-form.vue'

interface DayCell {
  key: string // 唯一标识
  date: Dayjs // 日期
  inMonth: boolean // 是否当前月份
}

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const PRIORITY_COLOR_MAP: Record<string, { bg: string, text: string }> = { // 优先级字典颜色映射
  primary: { bg: '#e8f4ff', text: '#1677ff' },
  success: { bg: '#f0f9eb', text: '#52c41a' },
  warning: { bg: '#fdf6ec', text: '#e6a23c' },
  error: { bg: '#fef0f0', text: '#f56c6c' },
  info: { bg: '#f4f4f5', text: '#909399' },
}
const weekDays = ['日', '一', '二', '三', '四', '五', '六'] // 星期表头
const { hasAccessByCodes } = useAccess()
const list = ref<Schedule[]>([]) // 当前月份日程
const currentMonth = ref(dayjs().startOf('month')) // 当前展示月份
const selectedDate = ref(dayjs().format('YYYY-MM-DD')) // 选中日期
const queryParams = reactive({
  includeMine: true,
  includeReceived: true,
  title: undefined as string | undefined,
  type: undefined as number | undefined,
  priority: undefined as number | undefined,
}) // 查询参数

const dayCells = computed<DayCell[]>(() => { // 当前月份日历格子，固定 6 行 42 格
  const firstDay = currentMonth.value.startOf('month')
  const start = firstDay.subtract(firstDay.day(), 'day')
  return Array.from({ length: 42 }, (_, index) => {
    const date = start.add(index, 'day')
    return {
      key: date.format('YYYY-MM-DD'),
      date,
      inMonth: date.month() === currentMonth.value.month(),
    }
  })
})

const calendarRange = computed(() => [ // 月历补齐相邻月份的日期，预留首尾一周
  currentMonth.value.startOf('month').subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
  currentMonth.value.endOf('month').add(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
])

const scheduleMap = computed(() => { // 按日期分组的日程，跨天日程分别归入覆盖的每个自然日
  const result = new Map<string, Schedule[]>()
  list.value.forEach((schedule) => {
    let currentDate = dayjs(schedule.startTime).startOf('day')
    let endDate = dayjs(schedule.endTime).startOf('day')
    if (currentDate.isBefore(calendarRange.value[0], 'day')) {
      currentDate = dayjs(calendarRange.value[0])
    }
    if (endDate.isAfter(calendarRange.value[1], 'day')) {
      endDate = dayjs(calendarRange.value[1]).startOf('day')
    }
    while (!currentDate.isAfter(endDate)) {
      const date = currentDate.format('YYYY-MM-DD')
      result.set(date, [...(result.get(date) || []), schedule])
      currentDate = currentDate.add(1, 'day')
    }
  })
  return result
})

const selectedSchedules = computed(() => scheduleMap.value.get(selectedDate.value) || []) // 选中日期日程

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 获得指定日期的日程 */
function getDaySchedules(date: string) {
  return scheduleMap.value.get(date) || []
}

/** 日期样式：今天高亮，其他月置灰 */
function getDayClass(cell: DayCell) {
  if (cell.key === dayjs().format('YYYY-MM-DD')) {
    return 'bg-[#3b82f6] text-white'
  }
  return cell.inMonth ? 'text-[#333]' : 'text-[#ccc]'
}

/** 日历优先级颜色与列表字典标签保持一致 */
function getPriorityStyle(priority: number) {
  const dict = getDictObj(DICT_TYPE.OA_PRIORITY, priority)
  if (dict?.cssClass && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(dict.cssClass)) {
    return { backgroundColor: dict.cssClass, color: '#fff' }
  }
  const color = PRIORITY_COLOR_MAP[dict?.colorType || 'primary'] || PRIORITY_COLOR_MAP.primary
  return { backgroundColor: color!.bg, color: color!.text }
}

/** 查询与当前月份范围相交的全部日程 */
async function getList() {
  const result: Schedule[] = []
  let pageNo = 1
  let total = 0
  do {
    const data = await getSchedulePage({
      ...queryParams,
      overlapTime: [...calendarRange.value],
      pageNo,
      pageSize: 200,
    })
    result.push(...data.list)
    total = data.total
    pageNo++
    if (!data.list.length) {
      break
    }
  } while (result.length < total)
  list.value = result
}

/** 切换月份 */
function handleMonthChange(offset: number) {
  currentMonth.value = currentMonth.value.add(offset, 'month')
  getList()
}

/** 回到今天 */
function handleToday() {
  currentMonth.value = dayjs().startOf('month')
  selectedDate.value = dayjs().format('YYYY-MM-DD')
  getList()
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.title = data?.title
  queryParams.type = data?.type
  queryParams.priority = data?.priority
  getList()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 新增日程 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-oa/schedule/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: Schedule) {
  uni.navigateTo({
    url: `/pages-oa/schedule/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  getList()
  uni.$on('oa:schedule:reload', getList)
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:schedule:reload', getList)
})
</script>
