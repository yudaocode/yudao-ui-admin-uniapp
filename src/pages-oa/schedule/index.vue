<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="日程管理"
      placeholder safe-area-inset-top fixed
    >
      <template #left>
        <view class="flex items-center gap-24rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <wd-icon name="calendar-line" size="40rpx" color="#333" @click="handleCalendar" />
        </view>
      </template>
    </wd-navbar>

    <!-- 范围页签 -->
    <wd-tabs v-model="tabIndex" @change="handleTabChange">
      <wd-tab
        v-for="tab in tabs"
        :key="tab.title"
        :title="tab.title"
      />
    </wd-tabs>

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 日程列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无日程数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-center justify-between gap-12rpx">
              <text class="line-clamp-1 min-w-0 flex-1 text-32rpx text-[#333] font-semibold">{{ item.title }}</text>
              <dict-tag :type="DICT_TYPE.OA_PRIORITY" :value="item.priority" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">日程类型：</text>
              <dict-tag :type="DICT_TYPE.OA_SCHEDULE_TYPE" :value="item.type" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">开始时间：</text>
              <text>{{ formatDateTime(item.startTime) || '-' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">结束时间：</text>
              <text>{{ formatDateTime(item.endTime) || '-' }}</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

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
import type { Schedule } from '@/api/oa/schedule'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getSchedulePage } from '@/api/oa/schedule'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const tabs = [ // 范围页签，对应 PC 日程范围的 includeMine / includeReceived 组合
  { title: '全部', includeMine: true, includeReceived: true },
  { title: '我创建的', includeMine: true, includeReceived: false },
  { title: '共享给我', includeMine: false, includeReceived: true },
]
const tabIndex = ref(0) // 当前页签下标
const list = ref<Schedule[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询日程列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const tab = tabs[tabIndex.value]!
    const params = {
      ...queryParams.value,
      includeMine: tab.includeMine,
      includeReceived: tab.includeReceived,
      pageNo,
      pageSize,
    }
    const data = await getSchedulePage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 页签切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  reload()
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增日程 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-oa/schedule/form/index',
  })
}

/** 日历视图 */
function handleCalendar() {
  uni.navigateTo({
    url: '/pages-oa/schedule/calendar/index',
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
  uni.$on('oa:schedule:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:schedule:reload', reload)
})
</script>
