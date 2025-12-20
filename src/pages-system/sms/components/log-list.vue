<template>
  <view>
    <!-- 搜索组件 -->
    <LogSearchForm @search="handleQuery" @reset="handleReset" />

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
              {{ item.mobile }}
            </view>
            <dict-tag :type="DICT_TYPE.SYSTEM_SMS_SEND_STATUS" :value="item.sendStatus" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">短信渠道：</text>
            <dict-tag :type="DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE" :value="item.channelCode" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">短信类型：</text>
            <dict-tag :type="DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE" :value="item.templateType" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">短信内容：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.templateContent }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">发送时间：</text>
            <text>{{ formatDateTime(item.sendTime) || '-' }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无短信日志数据" />
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
import type { SmsLog } from '@/api/system/sms'
import type { LoadMoreState } from '@/http/types'
import { ref, watch } from 'vue'
import { getSmsLogPage } from '@/api/system/sms'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import LogSearchForm from './log-search-form.vue'

const props = defineProps<{
  active?: boolean
}>()

const total = ref(0)
const list = ref<SmsLog[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
})
const initialized = ref(false)

/** 查询列表 */
async function getList() {
  loadMoreState.value = 'loading'
  try {
    const data = await getSmsLogPage(queryParams.value)
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
function handleDetail(item: SmsLog) {
  uni.navigateTo({
    url: `/pages-system/sms/log/detail/index?id=${item.id}`,
  })
}

/** 监听 active 变化，首次激活时加载数据 */
watch(
  () => props.active,
  (val) => {
    if (val && !initialized.value) {
      initialized.value = true
      getList()
    }
  },
  { immediate: true },
)
</script>
