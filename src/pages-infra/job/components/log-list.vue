<template>
  <view>
    <!-- 搜索组件 -->
    <LogSearchForm :job-id="jobId" @search="handleQuery" @reset="handleReset" />

    <!-- 日志列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        @click="handleDetail(item)"
      >
        <view class="p-24rpx">
          <view class="mb-16rpx flex items-center justify-between">
            <view class="text-32rpx text-[#333] font-semibold">
              {{ item.handlerName }}
            </view>
            <dict-tag :type="DICT_TYPE.INFRA_JOB_LOG_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">任务编号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.jobId || '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">处理器参数：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.handlerParam || '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">执行时长：</text>
            <text>{{ item.duration ? `${item.duration} ms` : '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">开始时间：</text>
            <text>{{ formatDateTime(item.beginTime) || '-' }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无调度日志数据" />
      </view>
      <wd-loadmore
        v-if="list.length > 0"
        :state="loadMoreState"
        @reload="loadMore"
      />
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { JobLog } from '@/api/infra/job/log'
import type { LoadMoreState } from '@/http/types'
import { ref, watch } from 'vue'
import { getJobLogPage } from '@/api/infra/job/log'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import LogSearchForm from './log-search-form.vue'

const props = defineProps<{
  jobId?: number
}>()

const total = ref(0)
const list = ref<JobLog[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
})

/** 查询列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getJobLogPage(queryParams.value)
    list.value = [...list.value, ...data.list]
    total.value = data.total
    loadMoreState.value = list.value.length >= total.value ? 'finished' : 'loading'
  } catch {
    queryParams.value.pageNo = queryParams.value.pageNo > 1 ? queryParams.value.pageNo - 1 : 1
    loadMoreState.value = 'error'
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = {
    ...data,
    pageNo: 1,
    pageSize: queryParams.value.pageSize,
  }
  list.value = []
  getList()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 加载更多 */
function loadMore() {
  if (loadMoreState.value === 'finished') {
    return
  }
  queryParams.value.pageNo++
  getList()
}

/** 查看详情 */
function handleDetail(item: JobLog) {
  uni.navigateTo({
    url: `/pages-infra/job/log/detail/index?id=${item.id}`,
  })
}

/** 触底加载更多 */
onReachBottom(() => {
  loadMore()
})

/** 初始化 */
onMounted(() => {
  getList()
})

/** 监听 jobId 变化，重新查询 */
watch(
  () => props.jobId,
  () => {
    if (props.jobId) {
      queryParams.value.pageNo = 1
      list.value = []
      getList()
    }
  },
)
</script>
