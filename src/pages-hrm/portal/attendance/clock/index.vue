<template>
  <view class="yd-page-container flex flex-col">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="activeTab === 'clock' ? '打卡' : '统计'"
      left-arrow
      placeholder
      safe-area-inset-top
      fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
      <!-- 打卡 -->
      <ClockPanel
        v-show="activeTab === 'clock'"
        :active="pageVisible && activeTab === 'clock'"
        :employee="employee"
        :detail="detail"
        @clocked="loadDetail"
        @day-change="handleDayChange"
      />

      <!-- 统计 -->
      <StatisticsPanel
        v-show="activeTab === 'statistics'"
        ref="statisticsPanelRef"
      />

      <!-- 底部导航 -->
      <wd-tabbar
        v-model="activeTab"
        placeholder
        bordered
        safe-area-inset-bottom
        fixed
        active-color="#1677ff"
        inactive-color="#666"
        :z-index="20"
        @change="handleTabChange"
      >
        <wd-tabbar-item name="clock" title="打卡" icon="location" />
        <wd-tabbar-item name="statistics" title="统计" icon="calendar-line" />
      </wd-tabbar>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { PortalAttendanceClockDetail } from '@/api/hrm/portal/attendance/clock'
import type { PortalEmployee } from '@/api/hrm/portal/employee'
import { onHide, onShow, onUnload } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { getMyAttendanceClockDetail } from '@/api/hrm/portal/attendance/clock'
import { getPortalEmployee } from '@/api/hrm/portal/employee'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import ClockPanel from './components/clock-panel.vue'
import StatisticsPanel from './components/statistics-panel.vue'

type AttendancePortalTab = 'clock' | 'statistics'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const accessible = ref(false) // 是否可访问
const pageVisible = ref(false) // 页面是否显示
const activeTab = ref<AttendancePortalTab>('clock') // 当前底部导航
const employee = ref<PortalEmployee>() // 个人信息
const detail = ref<PortalAttendanceClockDetail>() // 打卡详情
const statisticsPanelRef = ref<InstanceType<typeof StatisticsPanel>>() // 统计面板引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载打卡详情 */
async function loadDetail() {
  detail.value = await getMyAttendanceClockDetail()
}

/** 加载个人信息 */
async function loadEmployee() {
  employee.value = await getPortalEmployee()
}

/** 切换底部导航 */
async function handleTabChange({ value }: { value: string | number }) {
  if (value === 'statistics') {
    await statisticsPanelRef.value?.loadStatistics()
  }
}

/** 跨日刷新打卡和统计 */
async function handleDayChange() {
  await loadDetail()
  if (activeTab.value === 'statistics') {
    await statisticsPanelRef.value?.loadStatistics()
  }
}

/** 初始化 / 返回刷新 */
onShow(async () => {
  pageVisible.value = false
  accessible.value = await checkHrmPortalAccess()
  if (!accessible.value) {
    return
  }
  await Promise.all([loadEmployee(), loadDetail()])
  pageVisible.value = true
  if (activeTab.value === 'statistics') {
    await statisticsPanelRef.value?.loadStatistics()
  }
})

/** 页面隐藏 */
onHide(() => {
  pageVisible.value = false
})

/** 页面卸载 */
onUnload(() => {
  pageVisible.value = false
})
</script>
