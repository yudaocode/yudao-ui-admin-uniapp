<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="汇报统计"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 汇报类型页签 -->
    <wd-tabs v-model="tabIndex" @change="handleTypeChange">
      <wd-tab
        v-for="tab in tabs"
        :key="tab.title"
        :title="tab.title"
      />
    </wd-tabs>

    <!-- 统计周期 -->
    <view class="flex items-center justify-between gap-12rpx bg-white px-24rpx py-16rpx">
      <view class="flex-1 rounded-12rpx bg-[#f5f5f5] px-24rpx py-16rpx text-center text-28rpx text-[#333]" @click="startDateVisible = true">
        {{ formatDate(rangeStart) }}
      </view>
      <text class="text-28rpx text-[#999]">至</text>
      <view class="flex-1 rounded-12rpx bg-[#f5f5f5] px-24rpx py-16rpx text-center text-28rpx text-[#333]" @click="endDateVisible = true">
        {{ formatDate(rangeEnd) }}
      </view>
      <wd-button size="small" type="primary" :loading="loading" @click="getStatistics">
        查询
      </wd-button>
    </view>
    <wd-datetime-picker
      v-model="rangeStart"
      v-model:visible="startDateVisible"
      type="date"
      title="开始日期"
      @confirm="getStatistics"
    />
    <wd-datetime-picker
      v-model="rangeEnd"
      v-model:visible="endDateVisible"
      type="date"
      title="结束日期"
      @confirm="getStatistics"
    />

    <!-- 部门筛选 -->
    <view class="bg-white px-24rpx pb-16rpx">
      <DeptSearchPicker v-model="queryDeptId" label="部门" placeholder="请选择部门，默认管理范围" @change="getStatistics" />
    </view>

    <!-- 汇总卡片 -->
    <view class="flex gap-16rpx p-24rpx">
      <view class="flex-1 rounded-12rpx bg-white p-20rpx text-center">
        <view class="text-36rpx text-[#333] font-semibold">
          {{ statistics?.userCount ?? '-' }}
        </view>
        <view class="mt-8rpx text-24rpx text-[#999]">
          成员数
        </view>
      </view>
      <view class="flex-1 rounded-12rpx bg-white p-20rpx text-center">
        <view class="text-36rpx text-[#333] font-semibold">
          {{ statistics?.expectedCount ?? '-' }}
        </view>
        <view class="mt-8rpx text-24rpx text-[#999]">
          应填
        </view>
      </view>
      <view class="flex-1 rounded-12rpx bg-white p-20rpx text-center">
        <view class="text-36rpx text-[#52c41a] font-semibold">
          {{ statistics?.submittedCount ?? '-' }}
        </view>
        <view class="mt-8rpx text-24rpx text-[#999]">
          已填
        </view>
      </view>
      <view class="flex-1 rounded-12rpx bg-white p-20rpx text-center">
        <view class="text-36rpx text-[#f5222d] font-semibold">
          {{ statistics?.missingCount ?? '-' }}
        </view>
        <view class="mt-8rpx text-24rpx text-[#999]">
          未填
        </view>
      </view>
      <view class="flex-1 rounded-12rpx bg-white p-20rpx text-center">
        <view class="text-36rpx text-[#1677ff] font-semibold">
          {{ fillRate }}%
        </view>
        <view class="mt-8rpx text-24rpx text-[#999]">
          填写率
        </view>
      </view>
    </view>

    <!-- 成员统计列表 -->
    <view class="px-24rpx pb-24rpx">
      <view
        v-for="user in statistics?.users ?? []"
        :key="user.userId"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx"
        @click="handleUserDetail(user, 0)"
      >
        <view class="mb-12rpx flex items-center justify-between gap-12rpx">
          <text class="line-clamp-1 min-w-0 flex-1 text-32rpx text-[#333] font-semibold">
            {{ user.userName }}<text v-if="user.deptName" class="ml-12rpx text-24rpx text-[#999] font-normal">{{ user.deptName }}</text>
          </text>
          <text class="shrink-0 text-26rpx text-[#666]">{{ user.submittedCount }}/{{ user.expectedCount }} 已填</text>
        </view>
        <wd-progress
          :percentage="calculateFillRate(user.submittedCount, user.expectedCount)"
          :status="user.missingCount > 0 ? 'danger' : 'success'"
        />
        <view class="mt-16rpx flex items-center gap-24rpx text-24rpx">
          <text class="text-[#52c41a]" @click.stop="handleUserDetail(user, 0)">已填 {{ user.submittedCount }}</text>
          <text class="text-[#f5222d]" @click.stop="handleUserDetail(user, 1)">未填 {{ user.missingCount }}</text>
        </view>
      </view>
      <view v-if="statistics && !statistics.users.length" class="py-60rpx text-center text-28rpx text-[#999]">
        管理范围内暂无成员
      </view>
    </view>

    <!-- 成员汇报明细弹窗 -->
    <StatisticsDetail ref="detailRef" />
  </view>
</template>

<script lang="ts" setup>
import type { WorkReportStatistics, WorkReportUserStatistics } from '@/api/oa/workreport'
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'
import { getWorkReportStatistics } from '@/api/oa/workreport'
import { DeptSearchPicker } from '@/components/system-select'
import { navigateBackPlus } from '@/utils'
import { formatDate, formatDateEndTime, formatDateStartTime } from '@/utils/date'
import { OA_WORK_REPORT_TYPE } from '../../utils/constants'
import StatisticsDetail from './components/statistics-detail.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabs = [ // 汇报类型页签
  { title: '日报', type: OA_WORK_REPORT_TYPE.DAILY },
  { title: '周报', type: OA_WORK_REPORT_TYPE.WEEKLY },
  { title: '月报', type: OA_WORK_REPORT_TYPE.MONTHLY },
]
const tabIndex = ref(0) // 当前类型页签下标
const rangeStart = ref<number>(dayjs().startOf('month').valueOf()) // 统计开始日期
const rangeEnd = ref<number>(Date.now()) // 统计结束日期
const startDateVisible = ref(false) // 开始日期选择器显示状态
const endDateVisible = ref(false) // 结束日期选择器显示状态
const statistics = ref<WorkReportStatistics>() // 统计结果
const queryDeptId = ref<number>() // 部门筛选，空为默认管理范围
const loading = ref(false) // 加载状态
const detailRef = ref<InstanceType<typeof StatisticsDetail>>() // 成员汇报明细弹窗引用
const lastQueryParams = ref<{ type: number, startTime: string, endTime: string }>() // 最近一次统计条件，明细弹窗展示使用
const fillRate = computed(() => calculateFillRate(statistics.value?.submittedCount ?? 0, statistics.value?.expectedCount ?? 0)) // 整体填写率

/** 计算填写率，四舍五入保留一位小数 */
function calculateFillRate(submittedCount: number, expectedCount: number) {
  if (!expectedCount) {
    return 0
  }
  return Math.round((submittedCount * 1000) / expectedCount) / 10
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询工作汇报统计 */
async function getStatistics() {
  if (rangeStart.value > rangeEnd.value) {
    return
  }
  const type = tabs[tabIndex.value]!.type
  // 1. 统计时间范围，包含首日零点和末日最后一秒
  const startTime = formatDateStartTime(rangeStart.value)
  const endTime = formatDateEndTime(rangeEnd.value)
  // 2. 查询范围扩展到完整自然周期，避免从周中、月中开始时漏掉汇报
  let queryStart = dayjs(rangeStart.value)
  let queryEnd = dayjs(rangeEnd.value)
  if (type === OA_WORK_REPORT_TYPE.WEEKLY) {
    queryStart = queryStart.subtract((queryStart.day() + 6) % 7, 'day')
    queryEnd = queryEnd.add((7 - queryEnd.day()) % 7, 'day')
  } else if (type === OA_WORK_REPORT_TYPE.MONTHLY) {
    queryStart = queryStart.startOf('month')
    queryEnd = queryEnd.endOf('month')
  }

  loading.value = true
  try {
    statistics.value = await getWorkReportStatistics({
      type,
      startTime,
      endTime,
      queryStartTime: formatDateStartTime(queryStart.toDate()),
      queryEndTime: formatDateEndTime(queryEnd.toDate()),
      deptId: queryDeptId.value,
    })
    lastQueryParams.value = { type, startTime, endTime }
  } finally {
    loading.value = false
  }
}

/** 切换汇报类型：月报默认从年初开始，日报和周报从月初开始 */
function handleTypeChange({ index }: { index: number }) {
  tabIndex.value = index
  const type = tabs[index]!.type
  rangeStart.value = dayjs().startOf(type === OA_WORK_REPORT_TYPE.MONTHLY ? 'year' : 'month').valueOf()
  rangeEnd.value = Date.now()
  getStatistics()
}

/** 查看成员汇报明细，tab 0 已填、1 未填 */
function handleUserDetail(user: WorkReportUserStatistics, tab: number) {
  if (!lastQueryParams.value) {
    return
  }
  detailRef.value?.open(user, tab, lastQueryParams.value)
}

/** 初始化 */
onMounted(() => {
  getStatistics()
})
</script>
