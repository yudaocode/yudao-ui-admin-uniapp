<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="考勤报表"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
      <!-- 月份与操作 -->
      <view class="bg-white px-24rpx py-20rpx">
        <view class="mb-16rpx flex items-center gap-16rpx">
          <view
            class="min-h-72rpx min-w-0 flex flex-1 items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx"
            @click="monthVisible = true"
          >
            <text class="min-w-0 flex-1 truncate text-[#333]">
              {{ monthText }}
            </text>
            <wd-icon name="arrow-right" size="32rpx" color="#666" />
          </view>
          <wd-datetime-picker
            v-model="selectedMonth"
            v-model:visible="monthVisible"
            title="请选择月份"
            type="year-month"
            :max-date="maxMonth"
            @confirm="handleMonthChange"
          />
        </view>
        <view class="mb-16rpx text-24rpx text-[#999]">
          考勤周期（{{ attendanceCycle }}）
        </view>
        <view class="flex gap-16rpx">
          <wd-button
            v-if="hasAccessByCodes(['hrm:portal:attendance:leave'])"
            class="flex-1"
            type="primary"
            size="small"
            @click="handleCreateLeave"
          >
            请假申请
          </wd-button>
          <wd-button
            class="flex-1"
            type="primary"
            variant="plain"
            size="small"
            :loading="exportLoading"
            @click="handleExport"
          >
            导出考勤
          </wd-button>
        </view>
      </view>

      <!-- 月度概况卡片 -->
      <view class="grid grid-cols-3 mx-24rpx mt-24rpx gap-16rpx">
        <view
          v-for="item in summaryItems"
          :key="item.label"
          class="rounded-12rpx bg-white px-16rpx py-20rpx shadow-sm"
        >
          <view class="mb-8rpx text-22rpx text-[#999]">
            {{ item.label }}
          </view>
          <view class="flex items-baseline gap-4rpx">
            <text class="text-32rpx text-[#333] font-semibold">
              {{ item.value }}
            </text>
            <text class="text-22rpx text-[#999]">
              {{ item.unit }}
            </text>
          </view>
        </view>
      </view>

      <!-- 详情分类 -->
      <view class="mt-24rpx bg-white">
        <wd-tabs v-model="tabIndex" slidable="always">
          <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
        </wd-tabs>
      </view>

      <view v-if="loading" class="py-80rpx text-center text-28rpx text-[#999]">
        <wd-loading size="32rpx" />
        <view class="mt-12rpx">
          加载中
        </view>
      </view>

      <!-- 汇总信息 -->
      <view v-else-if="activeTab === 'summary'" class="pb-48rpx">
        <wd-cell-group border>
          <wd-cell title="员工" :value="summary.employeeName || '-'" />
          <wd-cell title="工号" :value="summary.jobNumber || '-'" />
          <wd-cell title="部门" :value="summary.deptName || '-'" />
          <wd-cell title="岗位" :value="summary.postName || '-'" />
          <wd-cell title="考勤组" :value="summary.attendanceGroupName || '-'" />
          <wd-cell title="月份" :value="monthText" />
          <wd-cell title="应出勤" :value="`${summary.attendDays ?? 0} 天`" />
          <wd-cell title="实际出勤" :value="`${formatHrmDays(summary.actualDays)} 天`" />
          <wd-cell title="是否全勤" :value="summary.fullAttendance ? '是' : '否'" />
          <wd-cell title="迟到" :value="`${summary.lateCount ?? 0} 次 / ${summary.lateMinute ?? 0} 分钟`" />
          <wd-cell title="早退" :value="`${summary.earlyCount ?? 0} 次 / ${summary.earlyMinute ?? 0} 分钟`" />
          <wd-cell title="缺卡" :value="`${summary.misscardCount ?? 0} 次`" />
          <wd-cell title="旷工" :value="`${formatHrmDays(summary.absenteeismDays)} 天`" />
          <wd-cell title="请假" :value="`${formatHrmDays(summary.leaveDays)} 天`" />
          <wd-cell title="考勤扣款" :value="`${formatHrmMoney(summary.attendanceDeductAmount)} 元`" />
        </wd-cell-group>
      </view>

      <!-- 每日明细 -->
      <view v-else-if="activeTab === 'daily'" class="pb-48rpx">
        <view class="bg-white px-24rpx py-16rpx">
          <scroll-view scroll-x class="whitespace-nowrap">
            <view
              v-for="item in dailyStatusOptions"
              :key="item.value"
              class="mr-16rpx inline-flex rounded-full px-24rpx py-10rpx text-24rpx"
              :class="dailyStatusFilter === item.value
                ? 'bg-[#1677ff] text-white'
                : 'bg-[#f5f5f5] text-[#666]'"
              @click="dailyStatusFilter = item.value"
            >
              {{ item.label }}
            </view>
          </scroll-view>
        </view>
        <view v-if="filteredDailyDetails.length === 0" class="py-80rpx text-center text-28rpx text-[#999]">
          暂无每日明细
        </view>
        <view v-else class="p-24rpx">
          <view
            v-for="item in filteredDailyDetails"
            :key="String(item.attendanceTime)"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="getDailyBorderClass(item)"
          >
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 text-30rpx text-[#333] font-semibold">
                {{ formatDate(item.attendanceTime) || '-' }}
              </view>
              <view
                v-if="item.attendanceResult"
                class="shrink-0 rounded-8rpx px-12rpx py-4rpx text-22rpx"
                :class="getAttendanceResultClass(item.attendanceResult)"
              >
                {{ item.attendanceResult }}
              </view>
            </view>
            <view class="mb-12rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">班次：</text>{{ item.shiftName || '未排班' }}
            </view>
            <view
              v-for="clock in item.clockList || []"
              :key="clock.id || `${clock.type}-${clock.clockTime}`"
              class="mb-8rpx flex items-center gap-12rpx text-26rpx text-[#666]"
            >
              <dict-tag
                v-if="clock.type != null"
                :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_TYPE"
                :value="clock.type"
              />
              <text class="flex-1 text-right">
                {{ formatDate(clock.clockTime, 'HH:mm') || '--:--' }}
              </text>
              <dict-tag
                v-if="clock.status != null"
                :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_STATUS"
                :value="clock.status"
              />
            </view>
            <view
              v-if="item.scheduled !== false && !(item.clockList || []).length"
              class="mt-8rpx text-center text-24rpx text-[#999]"
            >
              暂无打卡
            </view>
            <view v-if="Number(item.leaveDays || 0) > 0" class="mt-8rpx text-26rpx text-[#1677ff]">
              请假 {{ formatHrmDays(item.leaveDays) }} 天
            </view>
          </view>
        </view>
      </view>

      <!-- 我的请假申请 -->
      <view v-else class="pb-48rpx">
        <view v-if="leaveLoading" class="py-80rpx text-center text-28rpx text-[#999]">
          <wd-loading size="32rpx" />
        </view>
        <view v-else-if="leaveList.length === 0" class="py-80rpx text-center text-28rpx text-[#999]">
          暂无请假申请
        </view>
        <view v-else class="p-24rpx">
          <view
            v-for="item in leaveList"
            :key="item.id || `${item.type}-${item.startTime}`"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-16rpx flex items-center justify-between gap-12rpx">
              <dict-tag
                v-if="item.type"
                :type="DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE"
                :value="item.type"
              />
              <text v-else class="text-28rpx text-[#333]">-</text>
              <dict-tag
                v-if="item.approvalStatus != null"
                :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
                :value="item.approvalStatus"
              />
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">开始：</text>{{ formatDateTime(item.startTime) || '-' }}
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">结束：</text>{{ formatDateTime(item.endTime) || '-' }}
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">天数：</text>{{ formatHrmDays(item.day) }} 天
            </view>
            <view v-if="item.reason" class="mb-16rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">事由：</text>{{ item.reason }}
            </view>
            <view class="flex gap-16rpx">
              <wd-button
                v-if="item.processInstanceId"
                class="flex-1"
                size="small"
                type="primary"
                variant="plain"
                @click="handleViewProcess(item.processInstanceId)"
              >
                审批进度
              </wd-button>
              <wd-button
                v-if="item.approvalStatus === BpmProcessInstanceStatus.RUNNING
                  && hasAccessByCodes(['hrm:portal:attendance:leave'])"
                class="flex-1"
                size="small"
                type="error"
                variant="plain"
                @click="handleCancelLeave(item.id)"
              >
                取消
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { AttendanceDailyDetail, AttendanceMonthRecord } from '@/api/hrm/attendance/statistics'
import type { AttendanceLeave } from '@/api/hrm/attendance/leave'
import type { PortalAttendanceMonthDetail } from '@/api/hrm/portal/attendance/statistics'
import dayjs from 'dayjs'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  exportPortalAttendanceMonthDetail,
  getPortalAttendanceMonthDetail,
} from '@/api/hrm/portal/attendance/statistics'
import {
  cancelMyAttendanceLeave,
  getMyAttendanceLeaveList,
} from '@/api/hrm/portal/attendance/leave'
import { useAccess } from '@/hooks/useAccess'
import { formatHrmDays, formatHrmMoney, formatHrmYearMonth, getAttendanceYearMonth } from '@/pages-hrm/utils/format'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import { BpmProcessInstanceStatus, DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()

const accessible = ref(false) // 是否可访问
const loading = ref(false) // 月度详情加载中
const leaveLoading = ref(false) // 请假列表加载中
const exportLoading = ref(false) // 导出加载中
const selectedMonth = ref(Date.now()) // 选中月份
const monthVisible = ref(false) // 月份选择器显隐
const monthDetail = ref<PortalAttendanceMonthDetail>() // 月度考勤详情
const leaveList = ref<AttendanceLeave[]>([]) // 请假申请列表
const tabIndex = ref(0) // 当前 tab
const dailyStatusFilter = ref('all') // 每日考勤状态筛选
const maxMonth = dayjs().endOf('month').valueOf() // 禁止选择未来月
const tabs = [ // tab 配置
  { key: 'summary', title: '月度概况' },
  { key: 'daily', title: '每日明细' },
  { key: 'leave', title: '我的请假' },
]
const dailyStatusOptions = [ // 每日状态筛选
  { label: '全部', value: 'all' },
  { label: '实际出勤', value: 'attendance' },
  { label: '迟到', value: 'late' },
  { label: '早退', value: 'early' },
  { label: '旷工', value: 'absenteeism' },
  { label: '缺卡', value: 'misscard' },
] as const

const activeTab = computed(() => tabs[tabIndex.value]?.key || 'summary')
const yearMonth = computed(() => getAttendanceYearMonth(selectedMonth.value))
const monthText = computed(() => formatHrmYearMonth(yearMonth.value.year, yearMonth.value.month))
const attendanceCycle = computed(() => {
  const month = dayjs(selectedMonth.value)
  return `${month.format('MM')}月01日~${month.format('MM')}月${month.endOf('month').format('DD')}日`
})
const summary = computed<Partial<AttendanceMonthRecord>>(() => monthDetail.value?.summary || {})
const summaryItems = computed(() => [
  { label: '应出勤', value: summary.value.attendDays ?? 0, unit: '天' },
  { label: '实出勤', value: formatHrmDays(summary.value.actualDays), unit: '天' },
  { label: '迟到', value: summary.value.lateCount ?? 0, unit: '次' },
  { label: '早退', value: summary.value.earlyCount ?? 0, unit: '次' },
  { label: '缺卡', value: summary.value.misscardCount ?? 0, unit: '次' },
  { label: '请假', value: formatHrmDays(summary.value.leaveDays), unit: '天' },
])
const filteredDailyDetails = computed(() =>
  (monthDetail.value?.dailyDetails || []).filter(item => isDailyDetailVisible(item)),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 判断每日考勤明细是否符合筛选条件 */
function isDailyDetailVisible(item: AttendanceDailyDetail) {
  switch (dailyStatusFilter.value) {
    case 'attendance':
      return (item.clockList?.length || 0) > 0
    case 'late':
      return item.lateCount > 0
    case 'early':
      return item.earlyCount > 0
    case 'absenteeism':
      return item.absenteeism === true
    case 'misscard':
      return (item.misscardCount || 0) > 0
    default:
      return true
  }
}

/** 是否为异常考勤 */
function isAbnormal(detail?: AttendanceDailyDetail) {
  if (!detail) {
    return false
  }
  return (
    (detail.lateCount || 0) > 0
    || (detail.earlyCount || 0) > 0
    || (detail.misscardCount || 0) > 0
    || detail.absenteeism === true
  )
}

/** 获得每日明细边框样式 */
function getDailyBorderClass(detail?: AttendanceDailyDetail) {
  if (isAbnormal(detail)) {
    return 'border-l-6rpx border-l-[#ff4d4f]'
  }
  if (detail?.scheduled === false) {
    return 'border-l-6rpx border-l-[#d9d9d9]'
  }
  if (detail?.clockList?.length) {
    return 'border-l-6rpx border-l-[#52c41a]'
  }
  return ''
}

/** 获得考勤结果样式 */
function getAttendanceResultClass(result?: string) {
  if (result === '正常') {
    return 'bg-[#f6ffed] text-[#52c41a]'
  }
  if (result?.includes('旷工')) {
    return 'bg-[#fff1f0] text-[#f5222d]'
  }
  if (result?.includes('缺卡') || result?.includes('迟到') || result?.includes('早退')) {
    return 'bg-[#fff7e6] text-[#fa8c16]'
  }
  return 'bg-[#f5f5f5] text-[#666]'
}

/** 加载月度考勤详情 */
async function loadMonthDetail() {
  loading.value = true
  try {
    monthDetail.value = await getPortalAttendanceMonthDetail(yearMonth.value)
  } finally {
    loading.value = false
  }
}

/** 加载请假申请列表 */
async function loadLeaveList() {
  leaveLoading.value = true
  try {
    leaveList.value = await getMyAttendanceLeaveList()
  } finally {
    leaveLoading.value = false
  }
}

/** 刷新页面数据 */
async function refreshAll() {
  await Promise.all([loadMonthDetail(), loadLeaveList()])
}

/** 月份切换操作 */
function handleMonthChange() {
  dailyStatusFilter.value = 'all'
  loadMonthDetail()
}

/** 打开请假申请表单 */
function handleCreateLeave() {
  uni.navigateTo({ url: '/pages-hrm/portal/attendance/leave/form/index' })
}

/** 导出考勤日报 */
async function handleExport() {
  exportLoading.value = true
  try {
    await exportPortalAttendanceMonthDetail(yearMonth.value.year, yearMonth.value.month)
    toast.success('导出成功')
  } finally {
    exportLoading.value = false
  }
}

/** 查看审批进度 */
function handleViewProcess(processInstanceId?: string) {
  if (!processInstanceId) {
    toast.show('暂无审批流程')
    return
  }
  uni.navigateTo({
    url: `/pages-bpm/processInstance/detail/index?id=${processInstanceId}`,
  })
}

/** 取消请假申请 */
async function handleCancelLeave(id?: number) {
  if (!id) {
    return
  }
  let reason: string | undefined
  try {
    const result = await dialog.prompt({
      title: '取消请假申请',
      msg: '请输入取消原因',
      inputProps: { maxlength: 200, placeholder: '请输入取消原因' },
    })
    reason = String(result.value || '').trim()
  } catch {
    return
  }
  if (!reason) {
    toast.warning('请输入取消原因')
    return
  }
  await cancelMyAttendanceLeave({ id, reason })
  toast.success('请假申请已取消')
  await refreshAll()
}

/** 初始化 / 返回刷新 */
onShow(async () => {
  accessible.value = await checkHrmPortalAccess()
  if (!accessible.value) {
    return
  }
  await refreshAll()
})
</script>
