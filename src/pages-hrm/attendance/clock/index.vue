<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="打卡记录"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 概况 / 明细 tab -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 打卡概况 -->
    <template v-if="activeTab === 'overview'">
      <OverviewSearchForm @search="handleOverviewQuery" @reset="handleOverviewReset" />
      <z-paging
        ref="overviewPagingRef"
        v-model="overviewList"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="10"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无打卡概况"
        @query="queryOverviewList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in overviewList"
            :key="`${item.employeeId}-${item.year}-${item.month}`"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-16rpx">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ item.employeeName || '-' }}
              </view>
              <view class="mt-8rpx truncate text-24rpx text-[#999]">
                {{ item.jobNumber || '-' }} · {{ item.deptName || '-' }} · {{ item.postName || '-' }}
              </view>
            </view>
            <scroll-view scroll-x class="whitespace-nowrap">
              <view
                v-for="day in getOverviewDays(item)"
                :key="day.date"
                class="mr-12rpx w-160rpx inline-flex flex-col border border-[#f0f0f0] rounded-8rpx border-solid px-12rpx py-12rpx align-top"
                :class="day.overview ? 'bg-[#fafafa]' : 'bg-[#fff]'"
                @click="handleDailyDetail(item, day.date, day.overview)"
              >
                <view class="mb-8rpx text-center text-22rpx text-[#999]">
                  {{ day.day }} · {{ day.week }}
                </view>
                <template v-if="day.overview">
                  <view
                    v-for="(overviewItem, index) in day.overview.overviews || []"
                    :key="`${overviewItem.text || overviewItem.type}-${index}`"
                    class="mb-4rpx text-20rpx leading-28rpx"
                  >
                    <template v-if="overviewItem.type">
                      <view class="text-[#999]">
                        {{ overviewItem.type }} {{ overviewItem.time || '-' }}
                      </view>
                      <view :class="getOverviewTextClass(overviewItem.status)">
                        {{ overviewItem.status || '-' }}
                      </view>
                    </template>
                    <view
                      v-else
                      class="text-center"
                      :class="getOverviewTextClass(overviewItem.text)"
                    >
                      {{ overviewItem.text || '-' }}
                    </view>
                  </view>
                </template>
                <view v-else class="py-8rpx text-center text-22rpx text-[#ccc]">
                  -
                </view>
              </view>
            </scroll-view>
          </view>
        </view>
      </z-paging>
    </template>

    <!-- 打卡明细 -->
    <template v-else>
      <SearchForm @search="handleQuery" @reset="handleReset" />
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="10"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无打卡记录"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            @click="handleDetail(item)"
          >
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.employeeName || '-' }}
                </view>
                <view class="mt-8rpx truncate text-24rpx text-[#999]">
                  {{ item.jobNumber || '-' }} · {{ item.deptName || '-' }}
                </view>
              </view>
              <dict-tag
                v-if="item.status != null"
                :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_STATUS"
                :value="item.status"
              />
            </view>
            <view class="mb-12rpx flex items-center gap-12rpx text-28rpx text-[#666]">
              <text class="text-[#999]">打卡类型：</text>
              <dict-tag
                v-if="item.type != null"
                :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_TYPE"
                :value="item.type"
              />
              <text v-else>-</text>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">应打卡：</text>{{ formatDateTime(item.attendanceTime) || '-' }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">打卡时间：</text>{{ formatDateTime(item.clockTime) || '-' }}
            </view>
            <view class="mb-12rpx flex items-center gap-12rpx text-28rpx text-[#666]">
              <text class="text-[#999]">来源：</text>
              <dict-tag
                v-if="item.sourceType != null"
                :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_SOURCE"
                :value="item.sourceType"
              />
              <text v-else>-</text>
            </view>
            <view v-if="item.address" class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">地点：</text>
              <text class="line-clamp-1">{{ item.address }}</text>
            </view>
            <view v-if="item.remark" class="text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">备注：</text>
              <text class="line-clamp-1">{{ item.remark }}</text>
            </view>
          </view>
        </view>
      </z-paging>

      <!-- 手工录入按钮 -->
      <wd-fab
        v-if="hasAccessByCodes(['hrm:attendance:clock:create'])"
        position="right-bottom"
        type="primary"
        :expandable="false"
        @click="handleAdd"
      />
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { AttendanceClock } from '@/api/hrm/attendance/clock'
import type {
  AttendanceDailyOverview,
  AttendanceMonthDailyOverview,
} from '@/api/hrm/attendance/statistics'
import { onUnload } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'
import { getAttendanceClockPage } from '@/api/hrm/attendance/clock'
import { getAttendanceMonthDailyOverviewPage } from '@/api/hrm/attendance/statistics'
import { useAccess } from '@/hooks/useAccess'
import { getAttendanceMonthRange, getAttendanceYearMonth } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import OverviewSearchForm from './components/overview-search-form.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const tabs = [ // 页签：对齐 PC 打卡概况 / 打卡明细
  { key: 'overview', title: '打卡概况' },
  { key: 'record', title: '打卡明细' },
]
const tabIndex = ref(0) // 当前页签
const activeTab = computed(() => tabs[tabIndex.value]?.key || 'overview')

const overviewList = ref<AttendanceMonthDailyOverview[]>([]) // 概况列表
const overviewPagingRef = ref<any>() // 概况分页引用
const overviewQueryParams = ref<Record<string, any>>({ // 概况查询参数；默认当前月
  ...getAttendanceYearMonth(),
})

const list = ref<AttendanceClock[]>([]) // 明细列表
const pagingRef = ref<any>() // 明细分页引用
const queryParams = ref<Record<string, any>>({ // 明细查询参数；默认当前月
  attendanceTime: getAttendanceMonthRange(),
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询打卡概况列表 */
async function queryOverviewList(pageNo: number, pageSize: number) {
  try {
    const data = await getAttendanceMonthDailyOverviewPage({
      ...overviewQueryParams.value,
      pageNo,
      pageSize,
    })
    overviewPagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    overviewPagingRef.value?.complete(false)
  }
}

/** 概况搜索按钮操作 */
function handleOverviewQuery(data?: Record<string, any>) {
  overviewQueryParams.value = {
    ...getAttendanceYearMonth(),
    ...data,
  }
  overviewPagingRef.value?.reload()
}

/** 概况重置按钮操作 */
function handleOverviewReset() {
  handleOverviewQuery(getAttendanceYearMonth())
}

/** 生成员工当月日列 */
function getOverviewDays(item: AttendanceMonthDailyOverview) {
  const month = dayjs(`${item.year}-${String(item.month).padStart(2, '0')}-01`)
  return Array.from({ length: month.daysInMonth() }, (_, index) => {
    const date = month.date(index + 1)
    const dateText = date.format('YYYY-MM-DD')
    return {
      date: dateText,
      day: date.format('DD'),
      week: `周${'日一二三四五六'[date.day()]}`,
      overview: item.dailyClockMap?.[dateText],
    }
  })
}

/** 概况文字颜色 */
function getOverviewTextClass(value?: string) {
  if (!value || value === '休息' || value === '未排班') {
    return 'text-[#999]'
  }
  if (value.includes('旷工') || value.includes('缺卡')) {
    return 'text-[#f5222d]'
  }
  if (value.includes('迟到') || value.includes('早退')) {
    return 'text-[#fa8c16]'
  }
  if (value.includes('正常')) {
    return 'text-[#52c41a]'
  }
  return 'text-[#1677ff]'
}

/** 打开每日考勤详情 */
function handleDailyDetail(
  item: AttendanceMonthDailyOverview,
  attendanceDate: string,
  overview?: AttendanceDailyOverview,
) {
  if (!overview) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/attendance/clock/daily-detail/index?employeeId=${item.employeeId}&attendanceDate=${encodeURIComponent(attendanceDate)}`,
  })
}

/** 查询打卡记录列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getAttendanceClockPage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = {
    attendanceTime: getAttendanceMonthRange(),
    ...data,
  }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery({ attendanceTime: getAttendanceMonthRange() })
}

/** 重新加载明细 */
function reload() {
  pagingRef.value?.reload()
}

/** 手工录入打卡 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-hrm/attendance/clock/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: AttendanceClock) {
  uni.navigateTo({
    url: `/pages-hrm/attendance/clock/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:attendance:clock:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:attendance:clock:reload', reload)
})
</script>
