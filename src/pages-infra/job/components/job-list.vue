<template>
  <view>
    <!-- 搜索组件 -->
    <JobSearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 任务列表 -->
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
              {{ item.name }}
            </view>
            <dict-tag :type="DICT_TYPE.INFRA_JOB_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">处理器名称：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.handlerName }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">处理器参数：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.handlerParam || '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">CRON 表达式：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.cronExpression }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>
            <text>{{ formatDateTime(item.createTime) }}</text>
          </view>
          <!-- 查看日志按钮 -->
          <view class="flex justify-end -mt-8">
            <wd-button size="small" type="info" @click.stop="handleViewLog(item)">
              调度日志
            </wd-button>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无定时任务数据" />
      </view>
      <wd-loadmore
        v-if="list.length > 0"
        :state="loadMoreState"
        @reload="loadMore"
      />
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['infra:job:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Job } from '@/api/infra/job'
import type { LoadMoreState } from '@/http/types'
import { ref } from 'vue'
import { getJobPage } from '@/api/infra/job'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import JobSearchForm from './job-search-form.vue'

const emit = defineEmits<{
  viewLog: [jobId: number]
}>()

const { hasAccessByCodes } = useAccess()
const total = ref(0)
const list = ref<Job[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
})

/** 查询列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getJobPage(queryParams.value)
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

/** 新增 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-infra/job/job/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: Job) {
  uni.navigateTo({
    url: `/pages-infra/job/job/detail/index?id=${item.id}`,
  })
}

/** 查看调度日志 */
function handleViewLog(item: Job) {
  emit('viewLog', item.id)
}

/** 触底加载更多 */
onReachBottom(() => {
  loadMore()
})

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
