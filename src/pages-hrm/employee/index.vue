<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="员工管理"
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
      empty-view-text="暂无员工数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name || '-' }}
            </view>
            <dict-tag
              v-if="item.entryStatus != null"
              :type="DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS"
              :value="item.entryStatus"
            />
          </view>
          <view class="mb-12rpx flex items-center gap-12rpx text-28rpx text-[#666]">
            <dict-tag
              v-if="item.status != null"
              :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
              :value="item.status"
            />
            <dict-tag
              v-if="item.type != null"
              :type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
              :value="item.type"
            />
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">工号：</text>{{ item.jobNumber || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">手机：</text>{{ item.mobile || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">部门：</text>{{ item.deptName || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">岗位：</text>{{ item.postName || '-' }}
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">入职时间：</text>{{ formatDateTime(item.entryTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['hrm:employee:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Employee } from '@/api/hrm/employee'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getEmployeePage, getEmployeeStatusCount } from '@/api/hrm/employee'
import { getDictLabel } from '@/hooks/useDict'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import {
  HrmEmployeeStatus,
  HrmEmployeeStatusTab,
  HrmEmployeeSurveyType,
  HrmEmployeeTodoType,
} from '@/pages-hrm/utils/constants'
import SearchForm from './components/search-form.vue'

defineOptions({
  name: 'HrmEmployee',
  options: {
    styleIsolation: 'shared',
  },
})

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<Employee[]>([]) // 员工列表
const pagingRef = ref<any>() // 分页组件引用
const statusCounts = ref<Record<number, number>>({}) // 状态统计
const tabIndex = ref(1) // 默认全职页签
const queryParams = ref<Record<string, any>>({
  statusCategory: HrmEmployeeStatusTab.FULL_TIME,
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
  { status: HrmEmployeeStatusTab.PENDING_ENTRY, label: '待入职' },
  { status: HrmEmployeeStatusTab.PENDING_LEAVE, label: '待离职' },
  { status: HrmEmployeeStatusTab.LEFT, label: '已离职' },
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

/** 查询员工列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const [data] = await Promise.all([
      getEmployeePage({
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
  const counts = await getEmployeeStatusCount(queryParams.value)
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
    surveyType: queryParams.value.surveyType,
    todoType: queryParams.value.todoType,
    leaderEmployeeId: queryParams.value.leaderEmployeeId,
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
    entryStatus: undefined,
    status: undefined,
    surveyType: undefined,
    todoType: undefined,
  }
  reload()
}

/** 查看员工详情 */
function handleDetail(item: Employee) {
  if (!item.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/employee/detail/index?id=${item.id}`,
  })
}

/** 新增员工 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-hrm/employee/form/index',
  })
}

/** 应用首页跳转筛选条件 */
function applyHomeFilter(options: Record<string, string | undefined>) {
  queryParams.value.statusCategory = HrmEmployeeStatusTab.FULL_TIME
  queryParams.value.surveyType = undefined
  queryParams.value.todoType = undefined
  queryParams.value.leaderEmployeeId = undefined
  tabIndex.value = 1

  const statusCategory = Number(options.statusCategory)
  const statusCategoryValues: number[] = Object.values(HrmEmployeeStatusTab)
  if (statusCategoryValues.includes(statusCategory)) {
    queryParams.value.statusCategory = statusCategory
    const index = statusItems.findIndex(item => item.status === statusCategory)
    tabIndex.value = index >= 0 ? index : 1
  }

  const surveyType = Number(options.surveyType)
  const surveyTypeValues: number[] = Object.values(HrmEmployeeSurveyType)
  if (surveyTypeValues.includes(surveyType)) {
    queryParams.value.surveyType = surveyType
    let surveyStatusCategory: number | undefined
    if (surveyType === HrmEmployeeSurveyType.LEAVE) {
      surveyStatusCategory = HrmEmployeeStatusTab.LEFT
    } else if (surveyType === HrmEmployeeSurveyType.PENDING_ENTRY) {
      surveyStatusCategory = HrmEmployeeStatusTab.PENDING_ENTRY
    } else if (surveyType === HrmEmployeeSurveyType.PENDING_LEAVE) {
      surveyStatusCategory = HrmEmployeeStatusTab.PENDING_LEAVE
    }
    if (surveyStatusCategory != null) {
      queryParams.value.statusCategory = surveyStatusCategory
      const index = statusItems.findIndex(item => item.status === surveyStatusCategory)
      tabIndex.value = index >= 0 ? index : tabIndex.value
    }
  }

  const todoType = Number(options.todoType)
  const todoTypeValues: number[] = Object.values(HrmEmployeeTodoType)
  if (todoTypeValues.includes(todoType)) {
    queryParams.value.todoType = todoType
  }

  const leaderEmployeeId = Number(options.leaderEmployeeId)
  if (Number.isSafeInteger(leaderEmployeeId) && leaderEmployeeId > 0) {
    queryParams.value.leaderEmployeeId = leaderEmployeeId
  }
}

/** 初始化 */
onLoad((options) => {
  applyHomeFilter(options || {})
})
</script>
