<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="私聊消息"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm
      :sender-id="props.senderId ? Number(props.senderId) : undefined"
      :receiver-id="props.receiverId ? Number(props.receiverId) : undefined"
      @search="handleQuery"
      @reset="handleReset"
    />

    <!-- 私聊消息列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无私聊消息数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
              {{ item.senderNickname || `用户 ${item.senderId}` }}
              <text class="mx-8rpx text-[#bbb]">→</text>
              {{ item.receiverNickname || `用户 ${item.receiverId}` }}
            </view>
            <dict-tag :type="DICT_TYPE.IM_CONTENT_TYPE" :value="item.type" />
          </view>
          <view class="line-clamp-2 mt-10rpx text-26rpx text-[#666]">
            {{ getMessageSummary(item.type, item.content) }}
          </view>
          <view class="mt-12rpx flex items-center justify-between text-24rpx text-[#999]">
            <text>{{ formatDateTime(item.sendTime) }}</text>
            <view class="flex items-center gap-12rpx">
              <text>{{ getDictLabel(DICT_TYPE.IM_MESSAGE_STATUS, item.status) }}</text>
              <dict-tag
                v-if="item.receiptStatus != null"
                :type="DICT_TYPE.IM_MESSAGE_RECEIPT_STATUS"
                :value="item.receiptStatus"
              />
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerPrivateMessageVO } from '@/api/im/manager/message/private'
import { ref } from 'vue'
import { getManagerPrivateMessagePage } from '@/api/im/manager/message/private'
import { getDictLabel } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { getMessageSummary } from '@/pages-im/utils/message'
import SearchForm from './components/search-form.vue'

const props = defineProps<{
  senderId?: number | string
  receiverId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<ImManagerPrivateMessageVO[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ // 查询参数
  senderId: props.senderId ? Number(props.senderId) : undefined,
  receiverId: props.receiverId ? Number(props.receiverId) : undefined,
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询私聊消息列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getManagerPrivateMessagePage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery({
    senderId: props.senderId ? Number(props.senderId) : undefined,
    receiverId: props.receiverId ? Number(props.receiverId) : undefined,
  })
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看私聊消息详情 */
function handleDetail(item: ImManagerPrivateMessageVO) {
  uni.navigateTo({
    url: `/pages-im/manager/message/private/detail/index?id=${item.id}`,
  })
}
</script>
