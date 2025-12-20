<template>
  <view>
    <!-- 搜索组件 -->
    <UserSearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 社交用户列表 -->
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
              {{ item.nickname || '-' }}
            </view>
            <dict-tag :type="DICT_TYPE.SYSTEM_SOCIAL_TYPE" :value="item.type" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">社交 openid：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.openid || '-' }}</text>
          </view>
          <view v-if="item.avatar" class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">头像：</text>
            <image :src="item.avatar" class="h-80rpx w-80rpx rounded-8rpx" mode="aspectFill" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>
            <text>{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无社交用户数据" />
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
import type { SocialUser } from '@/api/system/social/user'
import type { LoadMoreState } from '@/http/types'
import { onMounted, ref } from 'vue'
import { getSocialUserPage } from '@/api/system/social/user'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import UserSearchForm from './user-search-form.vue'

const total = ref(0)
const list = ref<SocialUser[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
})

/** 查询社交用户列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getSocialUserPage(queryParams.value)
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
function handleDetail(item: SocialUser) {
  uni.navigateTo({
    url: `/pages-system/social/user/detail/index?id=${item.id}`,
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
