<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="操作日志管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 操作日志列表 -->
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
              {{ item.type }} / {{ item.subType }}
            </view>
            <dict-tag :type="DICT_TYPE.USER_TYPE" :value="item.userType" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">操作人：</text>
            <text class="line-clamp-1">{{ item.userName }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">操作内容：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.action }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">操作时间：</text>
            <text class="line-clamp-1">{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">业务编号：</text>
            <text class="line-clamp-1">{{ item.bizId }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">操作 IP：</text>
            <text class="line-clamp-1">{{ item.userIp }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无操作日志数据" />
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
import type { OperateLog } from '@/api/system/operate-log'
import type { LoadMoreState } from '@/http/types'
import { onReachBottom } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getOperateLogPage } from '@/api/system/operate-log'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './modules/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const total = ref(0)
const list = ref<OperateLog[]>([])
const loadMoreState = ref<LoadMoreState>('loading') // 加载更多状态

const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询操作日志列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getOperateLogPage(queryParams.value)
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
function handleDetail(item: OperateLog) {
  uni.navigateTo({
    url: `/pages-system/operate-log/detail/index?id=${item.id}`,
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
