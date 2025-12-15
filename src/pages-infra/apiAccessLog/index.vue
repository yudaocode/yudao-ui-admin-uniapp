<template>
  <!-- TODO @芋艿：【优化：全局样式】后续要全局样式么 -->
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="API 访问日志"
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
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-semibold">
              {{ item.requestMethod }} {{ item.requestUrl }}
            </view>
            <view class="flex-shrink-0">
              <wd-tag v-if="item.resultCode === 0" type="success" plain>
                成功
              </wd-tag>
              <wd-tag v-else type="danger" plain>
                失败
              </wd-tag>
            </view>
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">应用名：</text>
            <text>{{ item.applicationName }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">用户编号：</text>
            <text>{{ item.userId }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">执行时长：</text>
            <text>{{ item.duration }} ms</text>
          </view>
          <view v-if="item.operateName" class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">操作名：</text>
            <text class="line-clamp-1">{{ item.operateName }}</text>
          </view>
          <view class="flex items-center text-24rpx text-[#999]">
            <text>{{ formatDateTime(item.beginTime) }}</text>
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
import type { ApiAccessLog } from '@/api/infra/apiAccessLog'
import type { LoadMoreState } from '@/http/types'
import { onReachBottom } from '@dcloudio/uni-app'
import { onMounted, reactive, ref } from 'vue'
import { getApiAccessLogPage } from '@/api/infra/apiAccessLog'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const total = ref(0) // 列表的总页数
const list = ref<ApiAccessLog[]>([]) // 列表的数据
const loadMoreState = ref<LoadMoreState>('loading') // 加载更多状态
const searchVisible = ref(false) // 搜索弹窗
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined as number | undefined,
  applicationName: undefined as string | undefined,
})

/** 返回上一页 */
function handleBack() {
  uni.navigateBack()
}

/** 查询日志列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getApiAccessLogPage({
      ...queryParams,
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
function handleDetail(item: ApiAccessLog) {
  uni.navigateTo({
    url: `/pages-infra/apiAccessLog/detail/index?id=${item.id}`,
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
