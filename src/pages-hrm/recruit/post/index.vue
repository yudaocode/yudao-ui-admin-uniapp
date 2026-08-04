<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="招聘职位"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 招聘状态 tab（无「全部」，默认招聘中） -->
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
      empty-view-text="暂无招聘职位数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="min-w-0" @click.stop="handleDetail(item)">
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.postName || '-' }}
              </view>
              <dict-tag
                v-if="item.status != null"
                :type="DICT_TYPE.HRM_RECRUIT_POST_STATUS"
                :value="item.status"
              />
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">用人部门：</text>{{ item.deptName || '-' }}
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">工作性质：</text>
              <dict-tag
                v-if="item.jobNature != null"
                :type="DICT_TYPE.HRM_RECRUIT_JOB_NATURE"
                :value="item.jobNature"
              />
              <text v-else>-</text>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">工作城市：</text>{{ item.areaName || '-' }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">招聘进度：</text>{{ formatRecruitPostProgress(item) }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">薪资：</text>{{ formatRecruitPostSalary(item) }}
            </view>
            <view class="text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">负责人：</text>{{ item.ownerEmployeeName || '-' }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['hrm:recruit:post:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { RecruitPost } from '@/api/hrm/recruit/post'
import type { HrmRecruitPostStatusValue } from '@/pages-hrm/utils/constants'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import {
  getRecruitPostPage,
  getRecruitPostStatusCount,
} from '@/api/hrm/recruit/post'
import { getIntDictOptions } from '@/hooks/useDict'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { HrmRecruitPostStatus } from '@/pages-hrm/utils/constants'
import {
  formatRecruitPostProgress,
  formatRecruitPostSalary,
} from '@/pages-hrm/utils/format'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<RecruitPost[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数（不含状态）
const statusCounts = ref<Record<number, number>>({}) // 各状态数量

const statusTabs = computed(() => { // 状态页签（无「全部」）
  return getIntDictOptions(DICT_TYPE.HRM_RECRUIT_POST_STATUS).map(item => ({
    label: item.label,
    value: item.value as HrmRecruitPostStatusValue,
    count: statusCounts.value[item.value] ?? 0,
  }))
})

/** 默认定位「招聘中」页签 */
function getRecruitingTabIndex() {
  const index = getIntDictOptions(DICT_TYPE.HRM_RECRUIT_POST_STATUS)
    .findIndex(item => item.value === HrmRecruitPostStatus.RECRUITING)
  return index >= 0 ? index : 0
}

const tabIndex = ref(getRecruitingTabIndex()) // 当前 tab 下标

const activeStatusValue = computed<HrmRecruitPostStatusValue>(() => {
  const tab = statusTabs.value[tabIndex.value]
  return (tab?.value ?? HrmRecruitPostStatus.RECRUITING) as HrmRecruitPostStatusValue
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询招聘职位列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const [data] = await Promise.all([
      getRecruitPostPage({
        ...queryParams.value,
        status: activeStatusValue.value,
        pageNo,
        pageSize,
      }),
      loadStatusCounts(),
    ])
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 加载状态统计 */
async function loadStatusCounts() {
  const counts = await getRecruitPostStatusCount({ ...queryParams.value })
  statusCounts.value = Object.fromEntries(counts.map(item => [item.status, item.count]))
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  tabIndex.value = getRecruitingTabIndex()
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  reload()
}

/** 新增招聘职位 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-hrm/recruit/post/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: RecruitPost) {
  uni.navigateTo({
    url: `/pages-hrm/recruit/post/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:recruit:post:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:recruit:post:reload', reload)
})
</script>
