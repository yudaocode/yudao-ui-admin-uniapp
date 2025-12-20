<template>
  <view>
    <AccountSearchForm @search="handleQuery" @reset="handleReset" />

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
              {{ item.mail }}
            </view>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">用户名：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.username || '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">SMTP：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.host }}:{{ item.port }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>
            <text>{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
        </view>
      </view>

      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无邮箱账号数据" />
      </view>
      <wd-loadmore
        v-if="list.length > 0"
        :state="loadMoreState"
        @reload="loadMore"
      />
    </view>

    <wd-fab
      v-if="hasAccessByCodes(['system:mail-account:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MailAccount } from '@/api/system/mail/account/index'
import type { LoadMoreState } from '@/http/types'
import { onMounted, ref } from 'vue'
import { getMailAccountPage } from '@/api/system/mail/account/index'
import { useAccess } from '@/hooks/useAccess'
import { formatDateTime } from '@/utils/date'
import AccountSearchForm from './account-search-form.vue'

const { hasAccessByCodes } = useAccess()
const total = ref(0)
const list = ref<MailAccount[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
})

async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getMailAccountPage(queryParams.value)
    list.value = [...list.value, ...data.list]
    total.value = data.total
    loadMoreState.value = list.value.length >= total.value ? 'finished' : 'loading'
  } catch {
    queryParams.value.pageNo = queryParams.value.pageNo > 1 ? queryParams.value.pageNo - 1 : 1
    loadMoreState.value = 'error'
  }
}

function handleQuery(data?: Record<string, any>) {
  queryParams.value = {
    ...data,
    pageNo: 1,
    pageSize: queryParams.value.pageSize,
  }
  list.value = []
  getList()
}

function handleReset() {
  handleQuery()
}

function loadMore() {
  if (loadMoreState.value === 'finished') {
    return
  }
  queryParams.value.pageNo++
  getList()
}

function handleAdd() {
  uni.navigateTo({
    url: '/pages-system/mail/account/form/index',
  })
}

function handleDetail(item: MailAccount) {
  uni.navigateTo({
    url: `/pages-system/mail/account/detail/index?id=${item.id}`,
  })
}

onReachBottom(() => {
  loadMore()
})

onMounted(() => {
  getList()
})
</script>
