<template>
  <view>
    <!-- 搜索组件 -->
    <ClientSearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 应用列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        @click="handleDetail(item)"
      >
        <view class="p-24rpx">
          <view class="mb-16rpx flex items-center justify-between">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <dict-tag class="ml-16rpx shrink-0" :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">客户端编号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.clientId }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">访问令牌有效期：</text>
            <text>{{ item.accessTokenValiditySeconds }} 秒</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">刷新令牌有效期：</text>
            <text>{{ item.refreshTokenValiditySeconds }} 秒</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>
            <text>{{ formatDateTime(item.createTime) }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无应用数据" />
      </view>
      <wd-loadmore
        v-if="list.length > 0"
        :state="loadMoreState"
        @reload="loadMore"
      />
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['system:oauth2-client:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { OAuth2Client } from '@/api/system/oauth2/client'
import type { LoadMoreState } from '@/http/types'
import { onMounted, ref } from 'vue'
import { getOAuth2ClientPage } from '@/api/system/oauth2/client'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ClientSearchForm from './client-search-form.vue'

const { hasAccessByCodes } = useAccess()
const total = ref(0)
const list = ref<OAuth2Client[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
})

/** 查询应用列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getOAuth2ClientPage(queryParams.value)
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

/** 新增应用 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-system/oauth2/client/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: OAuth2Client) {
  uni.navigateTo({
    url: `/pages-system/oauth2/client/detail/index?id=${item.id}`,
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
