<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="我的任务"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm show-publisher @search="handleQuery" @reset="handleReset" />

    <!-- 任务列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无任务数据"
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
              <text class="line-clamp-1 min-w-0 flex-1 text-32rpx text-[#333] font-semibold">
                <text v-if="item.top" class="mr-8rpx text-24rpx text-[#f5222d]">[置顶]</text>{{ item.title }}
              </text>
              <dict-tag v-if="item.receiverStatus != null" :type="DICT_TYPE.OA_TASK_STATUS" :value="item.receiverStatus" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">发布人：</text>
              <text>{{ item.publisherUserName || '-' }}</text>
              <text v-if="item.publisherDeptName" class="ml-8rpx text-[#999]">（{{ item.publisherDeptName }}）</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">任务周期：</text>
              <text>{{ formatDate(item.startTime) }} ~ {{ formatDate(item.endTime) }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">任务进度：</text>
              <view class="min-w-0 flex-1">
                <wd-progress :percentage="getTaskStatusProgress(item.receiverStatus)" />
              </view>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">发布时间：</text>
              <text>{{ formatDateTime(item.publishTime) || '-' }}</text>
              <text v-if="item.canceled" class="ml-16rpx text-[#f5222d]">已取消</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { Task } from '@/api/oa/task'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getReceivedTaskPage } from '@/api/oa/task'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import { getTaskStatusProgress } from '../../utils/format'
import SearchForm from '../components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<Task[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询任务列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getReceivedTaskPage({
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

/** 查看详情 */
function handleDetail(item: Task) {
  uni.navigateTo({
    url: `/pages-oa/task/detail/index?id=${item.id}&scene=received`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:task:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:task:reload', reload)
})
</script>
