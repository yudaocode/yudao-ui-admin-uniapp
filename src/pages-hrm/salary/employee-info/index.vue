<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="薪资档案"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 员工状态 tab -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" @change="handleTabChange">
        <wd-tab
          v-for="tab in statusTabs"
          :key="tab.value"
          :title="`${tab.label}(${tab.count})`"
        />
      </wd-tabs>
    </view>

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无薪资档案"
      @query="queryList"
    >
      <view class="p-24rpx" :class="hasAccessByCodes(['hrm:salary:employee-info:update']) ? 'pb-160rpx' : ''">
        <view
          v-for="item in list"
          :key="item.employeeId"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.employeeName || '-' }}
            </view>
            <dict-tag
              v-if="item.status != null"
              :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
              :value="item.status"
            />
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">工号：</text>{{ item.jobNumber || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">部门：</text>{{ item.deptName || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">岗位：</text>{{ item.postName || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">入职：</text>{{ formatHrmDate(item.entryTime) }}
            <text class="mx-8rpx text-[#ddd]">|</text>
            转正：{{ formatHrmDate(item.regularTime) }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">最近调整：</text>{{ formatHrmDate(item.effectTime) }}
          </view>
          <view class="mb-12rpx flex items-center gap-12rpx text-28rpx text-[#666]">
            <text class="text-[#999]">调薪原因：</text>
            <dict-tag
              v-if="item.changeReason != null"
              :type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
              :value="item.changeReason"
            />
            <text v-else>-</text>
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">工资合计：</text>
            <text class="text-[#333] font-medium">
              {{ formatHrmMoney(getSalaryTotal(item)) }}
            </text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 批量调薪（详情无法替代，保留列表底部入口） -->
    <view
      v-if="hasAccessByCodes(['hrm:salary:employee-info:update'])"
      class="yd-detail-footer"
    >
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" @click="handleBatch">
          批量调薪
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SalaryEmployeeInfo } from '@/api/hrm/salary/employee-info'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import {
  getSalaryEmployeeInfoPage,
  getSalaryEmployeeInfoStatusCount,
} from '@/api/hrm/salary/employee-info'
import { getDictLabel } from '@/hooks/useDict'
import { useAccess } from '@/hooks/useAccess'
import {
  HrmEmployeeStatus,
  HrmEmployeeStatusTab,
} from '@/pages-hrm/utils/constants'
import { formatHrmDate, formatHrmMoney } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<SalaryEmployeeInfo[]>([]) // 薪资档案列表
const pagingRef = ref<any>() // 分页组件引用
const statusCounts = ref<Record<number, number>>({}) // 状态统计
const tabIndex = ref(0) // 默认在职页签
const queryParams = ref<Record<string, any>>({
  statusCategory: HrmEmployeeStatusTab.ACTIVE,
}) // 查询参数

const statusItems = [ // 员工状态页签
  { status: HrmEmployeeStatusTab.ACTIVE, label: '在职' },
  { status: HrmEmployeeStatusTab.FULL_TIME, label: '全职' },
  { status: HrmEmployeeStatus.INTERN, label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.INTERN) || '实习' },
  { status: HrmEmployeeStatus.LABOR, label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.LABOR) || '劳务' },
  { status: HrmEmployeeStatus.CONSULTANT, label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.CONSULTANT) || '顾问' },
  { status: HrmEmployeeStatus.REHIRE, label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.REHIRE) || '返聘' },
  { status: HrmEmployeeStatus.OUTSOURCE, label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.OUTSOURCE) || '外包' },
  { status: HrmEmployeeStatus.PART_TIME, label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.PART_TIME) || '兼职' },
  { status: HrmEmployeeStatus.PROBATION, label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.PROBATION) || '试用' },
  { status: HrmEmployeeStatus.REGULAR, label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.REGULAR) || '正式' },
]

const statusTabs = computed(() => statusItems.map(item => ({
  label: item.label,
  value: item.status,
  count: statusCounts.value[item.status] ?? 0,
})))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 获得员工当前工资合计 */
function getSalaryTotal(salaryEmployee: SalaryEmployeeInfo) {
  return salaryEmployee.status === HrmEmployeeStatus.PROBATION
    ? salaryEmployee.probationSalary
    : salaryEmployee.regularSalary
}

/** 查询薪资档案列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const [data] = await Promise.all([
      getSalaryEmployeeInfoPage({
        ...queryParams.value,
        pageNo,
        pageSize,
      }),
      refreshStatusCounts(),
    ])
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新状态统计 */
async function refreshStatusCounts() {
  const counts = await getSalaryEmployeeInfoStatusCount(queryParams.value)
  statusCounts.value = Object.fromEntries(counts.map(item => [item.status, item.count]))
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = {
    ...data,
    statusCategory: queryParams.value.statusCategory,
  }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** tab 切换 */
function handleTabChange({ index }: { index: number }) {
  const tab = statusTabs.value[index]
  if (!tab) {
    return
  }
  queryParams.value = {
    ...queryParams.value,
    statusCategory: tab.value,
  }
  reload()
}

/** 查看薪资档案详情 */
function handleDetail(item: SalaryEmployeeInfo) {
  if (!item.employeeId) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/salary/employee-info/detail/index?id=${item.employeeId}`,
  })
}

/** 批量调薪 */
function handleBatch() {
  uni.navigateTo({
    url: '/pages-hrm/salary/employee-info/batch/index',
  })
}

/** 返回后刷新列表 */
onShow(() => {
  if (list.value.length) {
    reload()
  }
})
</script>
