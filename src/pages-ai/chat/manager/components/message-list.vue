<template>
  <view class="min-h-0 flex flex-1 flex-col">
    <!-- 搜索组件 -->
    <MessageSearchForm
      :conversation-id="props.conversationId"
      @search="handleQuery"
      @reset="handleReset"
    />

    <!-- 消息列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无聊天消息"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="text-30rpx text-[#333] font-semibold">
            消息 #{{ item.id }}
          </view>
          <view class="mt-12rpx text-26rpx text-[#666]">
            对话编号：{{ item.conversationId || '-' }} / 类型：{{ item.type || '-' }}
          </view>
          <view class="line-clamp-4 mt-12rpx text-24rpx text-[#666]">
            {{ item.content || '-' }}
          </view>
          <view class="mt-8rpx text-24rpx text-[#999]">
            用户：{{ getUserName(item.userId) }} / 模型：{{ item.model || '-' }}
          </view>
          <view class="mt-8rpx text-24rpx text-[#999]">
            携带上下文：{{ item.useContext ? '是' : '否' }}
          </view>
          <view class="mt-8rpx text-22rpx text-[#999]">
            {{ formatDateTime(item.createTime) }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { ChatMessage } from '@/api/ai/chat/message'
import type { User } from '@/api/system/user'
import { onMounted, onUnmounted, ref } from 'vue'
import { getChatMessagePage } from '@/api/ai/chat/message'
import { getSimpleUserList } from '@/api/system/user'
import { formatDateTime } from '@/utils/date'
import MessageSearchForm from './message-search-form.vue'

const props = defineProps<{
  conversationId?: number
}>()

const list = ref<ChatMessage[]>([]) // 消息列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({
  conversationId: props.conversationId,
}) // 查询参数
const userList = ref<User[]>([]) // 用户精简列表

/** 查询消息列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getChatMessagePage(params)
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
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看消息详情 */
function handleDetail(item: ChatMessage) {
  uni.navigateTo({
    url: `/pages-ai/chat/manager/message/detail/index?id=${item.id}`,
  })
}

/** 获取用户昵称 */
function getUserName(userId?: number) {
  return userList.value.find(user => user.id === userId)?.nickname || String(userId || '-')
}

/** 初始化 */
onMounted(async () => {
  uni.$on('ai:chat-message:reload', reload)
  userList.value = await getSimpleUserList().catch(() => [])
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('ai:chat-message:reload', reload)
})
</script>
