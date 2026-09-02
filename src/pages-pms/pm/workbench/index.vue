<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="工作台"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 事项页签 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" @change="handleTabChange">
        <wd-tab
          v-for="tab in tabs"
          :key="tab.value"
          :title="getTabTitle(tab)"
        />
      </wd-tabs>
    </view>

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :refresher-enabled="true"
      empty-view-text="暂无数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <!-- 工作项卡片 -->
        <template v-if="!isIterationTab">
          <view
            v-for="item in (list as WorkbenchWorkItem[])"
            :key="item.id"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            @click="handleWorkItemDetail(item)"
          >
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                #{{ item.serialNumber }} {{ item.name }}
              </view>
              <view class="flex shrink-0 items-center gap-12rpx">
                <wd-tag type="primary" plain>
                  {{ getWorkItemTypeName(item.type) }}
                </wd-tag>
                <wd-icon
                  v-if="item.writeStatus && hasAccessByCodes(['pms:pm:work-item:update'])"
                  name="edit" size="32rpx" color="#1677ff"
                  @click.stop="quickEditRef?.open(item)"
                />
              </view>
            </view>
            <view class="mb-12rpx flex items-center gap-24rpx text-28rpx text-[#666]">
              <text>状态：{{ item.statusName }}</text>
              <text :style="{ color: getPriorityColor(item.priority) }">
                优先级：{{ getPriorityName(item.priority) }}
              </text>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">处理人：</text>{{ item.assigneeUserName || '未分配' }}
            </view>
            <view class="flex items-center justify-between text-28rpx text-[#666]">
              <text class="truncate">{{ item.projectName }}</text>
              <text class="shrink-0 text-[#999]">截止 {{ formatDate(item.endTime) || '未设置' }}</text>
            </view>
          </view>
        </template>

        <!-- 迭代卡片 -->
        <template v-else>
          <view
            v-for="item in (list as WorkbenchIteration[])"
            :key="item.id"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            @click="handleIterationDetail(item)"
          >
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name }}
              </view>
              <wd-tag :type="item.status === PmsIterationStatus.ACTIVE ? 'primary' : item.status === PmsIterationStatus.COMPLETED ? 'success' : 'default'" plain>
                {{ getIterationStatusName(item.status) }}
              </wd-tag>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">所属项目：</text>{{ item.projectName }}
            </view>
            <view class="text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">周期：</text>
              {{ formatDate(item.startTime) || '?' }} ~ {{ formatDate(item.endTime) || '?' }}
            </view>
          </view>
        </template>
      </view>
    </z-paging>

    <!-- 快捷编辑 -->
    <QuickEditForm ref="quickEditRef" @success="handleQuickEditSuccess" />
  </view>
</template>

<script lang="ts" setup>
import type { WorkbenchCount, WorkbenchIteration, WorkbenchWorkItem } from '@/api/pms/pm/workbench'
import { computed, ref } from 'vue'
import { onUnload } from '@dcloudio/uni-app'
import { getWorkbenchCount, getWorkbenchIterationPage, getWorkbenchWorkItemPage } from '@/api/pms/pm/workbench'
import {
  PmsIterationStatus,
  PmsWorkbenchTab,
  PmsWorkbenchTabOptions,
  PmsWorkItemType,
} from '@/pages-pms/pm/utils/constants'
import {
  getIterationStatusName,
  getPriorityColor,
  getPriorityName,
  getWorkItemTypeName,
} from '@/pages-pms/pm/utils/format'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import QuickEditForm from './components/quick-edit-form.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabIndex = ref(0) // 当前事项页签下标
const tabs = PmsWorkbenchTabOptions // 工作台事项页签
const countData = ref<WorkbenchCount>({
  requirementCount: 0,
  taskCount: 0,
  defectCount: 0,
  iterationCount: 0,
}) // 各事项数量
const displayCountData = computed<Record<string, number>>(() => ({
  ...countData.value,
  allCount: countData.value.requirementCount + countData.value.taskCount + countData.value.defectCount,
})) // 「全部」页签只汇总工作项，不包含独立的迭代页签
const list = ref<(WorkbenchWorkItem | WorkbenchIteration)[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const { hasAccessByCodes } = useAccess()
const quickEditRef = ref<InstanceType<typeof QuickEditForm>>() // 快捷编辑弹窗引用

const activeTab = computed(() => tabs[tabIndex.value].value) // 当前事项类型
const isIterationTab = computed(() => activeTab.value === PmsWorkbenchTab.ITERATION) // 是否迭代页签

/** 获得页签标题（带数量） */
function getTabTitle(tab: (typeof tabs)[number]) {
  const count = displayCountData.value[tab.countKey] || 0
  return count > 0 ? `${tab.label}(${count})` : tab.label
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 获得当前页签的工作项类型 */
function getWorkItemType() {
  return {
    [PmsWorkbenchTab.REQUIREMENT]: PmsWorkItemType.REQUIREMENT,
    [PmsWorkbenchTab.TASK]: PmsWorkItemType.TASK,
    [PmsWorkbenchTab.DEFECT]: PmsWorkItemType.DEFECT,
  }[activeTab.value]
}

/** 查询工作台列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = { ...queryParams.value, pageNo, pageSize, type: getWorkItemType() }
    const data = isIterationTab.value
      ? await getWorkbenchIterationPage(params)
      : await getWorkbenchWorkItemPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 查询各页签数量 */
async function getCount() {
  countData.value = await getWorkbenchCount(queryParams.value)
}

/** 搜索按钮操作 */
function handleQuery(data: Record<string, any>) {
  queryParams.value = { ...data }
  pagingRef.value?.reload()
  getCount()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery({})
}

/** 切换页签 */
function handleTabChange() {
  pagingRef.value?.reload()
}

/** 查看工作项详情 */
function handleWorkItemDetail(item: WorkbenchWorkItem) {
  uni.navigateTo({ url: `/pages-pms/pm/workitem/detail/index?id=${item.id}` })
}

/** 查看迭代详情 */
function handleIterationDetail(item: WorkbenchIteration) {
  uni.navigateTo({ url: `/pages-pms/pm/iteration/detail/index?id=${item.id}` })
}

/** 快捷编辑保存成功：刷新列表与页签数量 */
function handleQuickEditSuccess() {
  pagingRef.value?.reload()
  getCount()
}

/** 初始化 */
onMounted(() => {
  getCount()
  uni.$on('pms:pm:workitem:reload', handleWorkItemReload)
})

/** 工作项详情变更后刷新列表与数量 */
function handleWorkItemReload() {
  pagingRef.value?.reload()
  getCount()
}

/** 卸载 */
onUnload(() => {
  uni.$off('pms:pm:workitem:reload', handleWorkItemReload)
})
</script>
