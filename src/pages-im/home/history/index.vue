<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="查找聊天内容" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索与类型筛选 -->
    <view class="shrink-0 bg-white px-20rpx pb-16rpx">
      <wd-search v-model="keyword" placeholder="搜索聊天记录" hide-cancel />
      <scroll-view scroll-x class="whitespace-nowrap">
        <view class="inline-flex gap-16rpx px-4rpx">
          <view
            v-for="item in filterTabs"
            :key="item.value"
            class="rounded-full px-24rpx py-10rpx text-25rpx"
            :class="messageType === item.value ? 'bg-[#07c160] text-white' : 'bg-[#f5f5f5] text-[#666]'"
            @click="messageType = item.value"
          >
            {{ item.label }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 历史消息 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1 bg-[#f5f5f5]"
      :default-page-size="PAGE_SIZE"
      :inside-more="false"
      :to-bottom-loading-more-enabled="false"
      empty-view-text="暂无匹配的聊天记录"
      @query="queryList"
    >
      <view
        v-for="item in list"
        :key="item.id"
        class="flex gap-20rpx border-b border-b-[#eee] bg-white px-24rpx py-22rpx active:bg-[#f5f5f5]"
        @click="locateMessage(item)"
      >
        <ImAvatar :src="getSenderAvatar(item)" :name="getSenderName(item)" :round="false" size="76rpx" />
        <view class="min-w-0 flex-1">
          <view class="flex items-center justify-between gap-16rpx">
            <text class="truncate text-27rpx text-[#333]">{{ getSenderName(item) }}</text>
            <text class="shrink-0 text-22rpx text-[#aaa]">{{ formatDateTime(item.sendTime) }}</text>
          </view>
          <view class="line-clamp-2 mt-8rpx text-26rpx text-[#777] leading-38rpx">
            {{ getMessageSummary(item.type, item.content) || '[消息]' }}
          </view>
        </view>
      </view>

      <template #loadingMoreDefault>
        <view v-if="!serverNoMore" class="py-28rpx text-center text-25rpx text-[#576b95]" @click="loadMore">
          加载更多聊天记录
        </view>
      </template>
      <template #loadingMoreFail>
        <view class="py-28rpx text-center text-25rpx text-[#fa5151]" @click="loadMore">
          加载失败，点击重试
        </view>
      </template>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { ImGroupMemberRespVO } from '@/api/im/group/member'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { ImPrivateMessageRespVO } from '@/api/im/message/private'
import { computed, onMounted, ref, watch } from 'vue'
import { getGroupMemberList } from '@/api/im/group/member'
import { getGroupMessageList } from '@/api/im/message/group'
import { getPrivateMessageList } from '@/api/im/message/private'
import { getClientConversationId } from '@/pages-im/home/db'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { ImConversationType, ImMessageStatus, ImMessageType } from '@/utils/constants'
import { getMessageSummary } from '@/pages-im/utils/conversation'
import { parseRecallMessageId } from '@/pages-im/utils/message'
import { getMemberDisplayName } from '@/pages-im/utils/user'
import { useImConversations } from '../composables/useImConversations'
import ImAvatar from '../components/im-avatar.vue'

type HistoryMessage = ImPrivateMessageRespVO | ImGroupMessageRespVO

const props = defineProps<{
  targetId?: number | string
  title?: string
  type?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const PAGE_SIZE = 50 // 每次读取的服务端历史条数
const userStore = useUserStore()
const { getConversationClearBefore } = useImConversations()
const pagingRef = ref<any>() // 分页组件引用
const list = ref<HistoryMessage[]>([]) // 筛选后的历史记录
const keyword = ref('') // 搜索关键词
const messageType = ref(0) // 消息类型筛选
const historyMaxId = ref<number>() // 服务端历史游标
const serverNoMore = ref(false) // 服务端是否已无更早消息
const clearBeforeMessageId = ref(0) // 本地清理的历史边界
const groupMembers = ref<ImGroupMemberRespVO[]>([]) // 群成员
const recalledMessageIds = new Set<number>() // 分页期间已收到的撤回原消息编号
const filterTabs = [ // 消息类型筛选
  { label: '全部', value: 0 },
  { label: '图片', value: ImMessageType.IMAGE },
  { label: '文件', value: ImMessageType.FILE },
  { label: '语音', value: ImMessageType.VOICE },
  { label: '视频', value: ImMessageType.VIDEO },
]

const conversationType = computed(() => Number(props.type || ImConversationType.PRIVATE)) // 会话类型
const targetId = computed(() => Number(props.targetId)) // 会话目标
const pageTitle = computed(() => props.title ? decodeURIComponent(props.title) : '聊天') // 会话名称

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/index/index')
}

/** 查询原始历史消息 */
function queryMessages(maxId?: number) {
  return conversationType.value === ImConversationType.GROUP
    ? getGroupMessageList({ groupId: targetId.value, maxId, limit: PAGE_SIZE })
    : getPrivateMessageList({ receiverId: targetId.value, maxId, limit: PAGE_SIZE })
}

/** 是否命中当前筛选 */
function matchesFilter(item: HistoryMessage) {
  if (messageType.value && item.type !== messageType.value) {
    return false
  }
  const word = keyword.value.trim().toLowerCase()
  return !word || getMessageSummary(item.type, item.content).toLowerCase().includes(word)
}

/** 把撤回信号归一化到原消息，并移除信号消息 */
function normalizeRecallMessages(data: HistoryMessage[]) {
  data.forEach((message) => {
    const messageId = message.type === ImMessageType.RECALL
      ? parseRecallMessageId(message.content)
      : 0
    if (messageId) {
      recalledMessageIds.add(messageId)
    }
  })
  return data
    .filter(message => message.type !== ImMessageType.RECALL || !parseRecallMessageId(message.content))
    .map(message => message.status === ImMessageStatus.RECALL || recalledMessageIds.has(message.id)
      ? {
          ...message,
          type: ImMessageType.RECALL,
          content: '',
          status: ImMessageStatus.RECALL,
        }
      : message)
}

/** 查询聊天历史 */
async function queryList(pageNo: number) {
  if (!targetId.value) {
    await pagingRef.value?.complete([])
    return
  }
  try {
    clearBeforeMessageId.value ||= await getConversationClearBefore(
      getClientConversationId(conversationType.value, targetId.value),
    )
    const response = await queryMessages(pageNo === 1 ? undefined : historyMaxId.value)
    const raw = response.filter(item => item.id > clearBeforeMessageId.value)
    historyMaxId.value = raw.at(-1)?.id
    serverNoMore.value = response.length < PAGE_SIZE || raw.length < response.length
    const messages = normalizeRecallMessages(raw)
    await pagingRef.value?.completeByNoMore(messages.filter(matchesFilter), serverNoMore.value)
  } catch {
    await pagingRef.value?.complete(false).catch(() => undefined)
  }
}

/** 加载下一页 */
function loadMore() {
  pagingRef.value?.doLoadMore()
}

/** 重新搜索 */
function reload() {
  historyMaxId.value = undefined
  serverNoMore.value = false
  pagingRef.value?.reload()
}

/** 获取发送人昵称 */
function getSenderName(item: HistoryMessage) {
  if (item.senderId === userStore.userInfo.userId) {
    return '我'
  }
  if (conversationType.value === ImConversationType.GROUP) {
    const member = groupMembers.value.find(member => member.userId === item.senderId)
    return member ? getMemberDisplayName(member) : `用户 ${item.senderId}`
  }
  return pageTitle.value
}

/** 获取发送人头像 */
function getSenderAvatar(item: HistoryMessage) {
  if (item.senderId === userStore.userInfo.userId) {
    return userStore.userInfo.avatar
  }
  return conversationType.value === ImConversationType.GROUP
    ? groupMembers.value.find(member => member.userId === item.senderId)?.avatar
    : ''
}

/** 定位到聊天消息 */
function locateMessage(item: HistoryMessage) {
  uni.navigateTo({
    url: `/pages-im/home/chat/index?type=${conversationType.value}&targetId=${targetId.value}&title=${encodeURIComponent(pageTitle.value)}&locateMessageId=${item.id}`,
  })
}

watch([keyword, messageType], reload)

/** 初始化群成员 */
onMounted(async () => {
  if (conversationType.value === ImConversationType.GROUP && targetId.value) {
    groupMembers.value = await getGroupMemberList(targetId.value)
  }
})
</script>
