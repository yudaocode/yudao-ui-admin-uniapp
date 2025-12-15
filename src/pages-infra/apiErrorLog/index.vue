<template>
  <!-- TODO @芋艿：【优化：全局样式】后续要全局样式么 -->
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="API 错误日志"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    >
      <template #right>
        <view class="flex items-center" @click="searchVisible = !searchVisible">
          <wd-icon name="search" size="20px" />
        </view>
      </template>
    </wd-navbar>

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
            <view class="line-clamp-1 mr-16rpx flex-1 text-28rpx text-[#333] font-semibold">
              {{ item.exceptionName }}
            </view>
            <!-- DONE @芽艺：字典 -->
            <dict-tag :type="DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS" :value="item.processStatus" />
          </view>
          <view class="mb-12rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx flex-shrink-0 text-[#999]">请求：</text>
            <text class="line-clamp-2 break-all">{{ item.requestMethod }} {{ item.requestUrl }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">应用名：</text>
            <text>{{ item.applicationName }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">用户编号：</text>
            <text>{{ item.userId }}</text>
          </view>
          <view class="flex items-center text-24rpx text-[#999]">
            <text>{{ formatDateTime(item.exceptionTime) }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无日志数据" />
      </view>
      <wd-loadmore
        v-if="list.length > 0"
        :state="loadMoreState"
        @reload="loadMore"
      />
    </view>

    <!-- 搜索弹窗 -->
    <SearchForm
      v-model="searchVisible"
      :search-params="queryParams"
      @search="handleQuery"
      @reset="handleReset"
    />
  </view>
</template>

<script lang="ts" setup>
import type { SearchFormData } from './components/search-form.vue'
import type { ApiErrorLog } from '@/api/infra/apiErrorLog'
import type { LoadMoreState } from '@/http/types'
import { onReachBottom } from '@dcloudio/uni-app'
import { onMounted, reactive, ref } from 'vue'
import { getApiErrorLogPage } from '@/api/infra/apiErrorLog'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const total = ref(0) // 列表的总页数
const list = ref<ApiErrorLog[]>([]) // 列表的数据
const loadMoreState = ref<LoadMoreState>('loading') // 加载更多状态
const searchVisible = ref(false) // 搜索弹窗
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined as number | undefined,
  applicationName: undefined as string | undefined,
  processStatus: -1 as number, // -1 表示全部
})

/** 返回上一页 */
function handleBack() {
  uni.navigateBack()
}

/** 查询日志列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getApiErrorLogPage({
      ...queryParams,
      processStatus: queryParams.processStatus === -1 ? undefined : queryParams.processStatus,
    })
    list.value = [...list.value, ...data.list]
    total.value = data.total
    loadMoreState.value = list.value.length >= total.value ? 'finished' : 'loading'
  } catch {
    queryParams.pageNo = queryParams.pageNo > 1 ? queryParams.pageNo - 1 : 1
    loadMoreState.value = 'error'
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: SearchFormData) {
  queryParams.userId = data?.userId
  queryParams.applicationName = data?.applicationName
  queryParams.processStatus = data?.processStatus ?? -1
  queryParams.pageNo = 1
  list.value = [] // 清空列表
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
  queryParams.pageNo++
  getList()
}

/** 查看详情 */
function handleDetail(item: ApiErrorLog) {
  uni.navigateTo({
    url: `/pages-infra/apiErrorLog/detail/index?id=${item.id}`,
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
</script>

<style lang="scss" scoped>
</style>
