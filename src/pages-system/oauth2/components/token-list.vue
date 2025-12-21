<template>
  <view>
    <!-- 搜索组件 -->
    <TokenSearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 令牌列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.accessToken"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
      >
        <view class="p-24rpx">
          <view class="mb-16rpx flex items-center justify-between">
            <view class="text-28rpx text-[#333] font-semibold">
              用户编号: {{ item.userId }}
            </view>
            <dict-tag :type="DICT_TYPE.USER_TYPE" :value="item.userType" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">访问令牌：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.accessToken }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">刷新令牌：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.refreshToken }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">客户端编号：</text>
            <text>{{ item.clientId }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">过期时间：</text>
            <text>{{ formatDateTime(item.expiresTime) }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>
            <text>{{ formatDateTime(item.createTime) }}</text>
          </view>
          <!-- 删除按钮 -->
          <view
            v-if="hasAccessByCodes(['system:oauth2-token:delete'])"
            class="flex justify-end -mt-8"
          >
            <wd-button size="small" type="error" @click="handleDelete(item)">
              强退
            </wd-button>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无令牌数据" />
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
import type { OAuth2Token } from '@/api/system/oauth2/token'
import type { LoadMoreState } from '@/http/types'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteOAuth2Token, getOAuth2TokenPage } from '@/api/system/oauth2/token'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import TokenSearchForm from './token-search-form.vue'

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const total = ref(0)
const list = ref<OAuth2Token[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
})

/** 查询令牌列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getOAuth2TokenPage(queryParams.value)
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

/** 删除令牌 */
function handleDelete(item: OAuth2Token) {
  uni.showModal({
    title: '提示',
    content: '确定要删除该令牌吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      await deleteOAuth2Token(item.accessToken)
      toast.success('删除成功')
      // 刷新列表
      handleQuery()
    },
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
