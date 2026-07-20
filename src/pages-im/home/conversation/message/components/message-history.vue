<template>
  <view class="h-full min-h-0 flex flex-col">
    <!-- 搜索与类型筛选 -->
    <view class="shrink-0 bg-white px-20rpx pb-16rpx">
      <wd-search v-model="keyword" placeholder="搜索聊天记录" hide-cancel />
      <scroll-view scroll-x class="whitespace-nowrap">
        <view class="inline-flex gap-16rpx px-4rpx">
          <view
            v-for="item in filterTabs"
            :key="item.value"
            class="rounded-full px-24rpx py-10rpx text-25rpx"
            :class="messageType === item.value && (!activeDate && !selectedMemberId) ? 'bg-[#07c160] text-white' : 'bg-[#f5f5f5] text-[#666]'"
            @click="setMessageType(item.value)"
          >
            {{ item.label }}
          </view>
          <view
            class="rounded-full px-24rpx py-10rpx text-25rpx"
            :class="activeDate ? 'bg-[#07c160] text-white' : 'bg-[#f5f5f5] text-[#666]'"
            @click="dateVisible = true"
          >
            {{ activeDate ? formatDate(activeDate) : '日期' }}
          </view>
          <view
            v-if="conversationType === ImConversationType.GROUP"
            class="rounded-full px-24rpx py-10rpx text-25rpx"
            :class="selectedMemberId ? 'bg-[#07c160] text-white' : 'bg-[#f5f5f5] text-[#666]'"
            @click="memberVisible = true"
          >
            {{ selectedMemberName || '群成员' }}
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
      <template v-for="item in list" :key="item.id">
        <view
          v-if="isSystemTip(item)"
          class="border-b border-b-[#eee] bg-white px-32rpx py-24rpx text-center active:bg-[#f5f5f5]"
          @click="locateMessage(item)"
        >
          <view class="text-24rpx text-[#999]">
            {{ getHistorySummary(item) }}
          </view>
          <view class="mt-8rpx text-21rpx text-[#bbb]">
            {{ formatHistoryTime(item.sendTime) }}
          </view>
        </view>
        <view
          v-else
          class="flex gap-20rpx border-b border-b-[#eee] bg-white px-24rpx py-22rpx active:bg-[#f5f5f5]"
          @click="locateMessage(item)"
        >
          <ImAvatar :src="getSenderAvatar(item)" :name="getSenderRealName(item)" :round="false" size="76rpx" />
          <view class="min-w-0 flex-1">
            <view class="flex items-center justify-between gap-16rpx">
              <text class="truncate text-27rpx text-[#333]">{{ getSenderName(item) }}</text>
              <text class="shrink-0 text-22rpx text-[#aaa]">
                {{ formatHistoryTime(item.sendTime) }}
              </text>
            </view>
            <view class="line-clamp-2 mt-8rpx text-26rpx text-[#777] leading-38rpx">
              {{ getHistorySummary(item) || '[消息]' }}
            </view>
          </view>
        </view>
      </template>

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

    <!-- 日期筛选 -->
    <wd-datetime-picker
      v-model="dateValue"
      v-model:visible="dateVisible"
      title="选择发送日期"
      type="date"
      @confirm="confirmDate"
    />

    <!-- 群成员筛选 -->
    <wd-popup v-model="memberVisible" root-portal position="bottom" custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;">
      <view class="h-full flex flex-col overflow-hidden bg-[#f5f5f5]">
        <view class="shrink-0 bg-white px-24rpx pb-16rpx pt-20rpx">
          <view class="flex items-center justify-between pb-12rpx">
            <text class="text-30rpx text-[#333] font-semibold">选择群成员</text>
            <wd-icon name="close" size="36rpx" color="#999" @click="memberVisible = false" />
          </view>
          <wd-search v-model="memberKeyword" placeholder="搜索群成员" hide-cancel />
        </view>
        <scroll-view scroll-y class="min-h-0 flex-1">
          <view
            v-for="member in filteredMembers"
            :key="member.userId"
            class="flex items-center gap-18rpx border-b border-b-[#eee] bg-white px-24rpx py-18rpx"
            @click="selectMember(member)"
          >
            <ImAvatar :src="member.avatar" :name="member.nickname" size="72rpx" />
            <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">{{ getMemberDisplayName(member) }}</text>
          </view>
          <wd-empty v-if="filteredMembers.length === 0" icon="search" tip="没有匹配的群成员" />
        </scroll-view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { GroupMember, Message } from '../../../types'
import { computed, onMounted, ref, watch } from 'vue'
import { getGroupMessageList } from '@/api/im/message/group'
import { getPrivateMessageList } from '@/api/im/message/private'
import { getClientConversationId } from '@/pages-im/utils/db'
import { useUserStore } from '@/store/user'
import { formatDate } from '@/utils/date'
import {
  CommonStatusEnum,
  ImConversationType,
  ImMessageStatus,
  ImMessageType,
  isFriendChatTip,
  isGroupNotification,
  isRtcCallTip,
} from '@/pages-im/utils/constants'
import { buildRecallTip, getMessageSummary } from '@/pages-im/utils/conversation'
import { parseRecallMessageId } from '@/pages-im/utils/message'
import { formatHistoryTime } from '@/pages-im/utils/time'
import {
  getFriendDisplayName,
  getGroupDisplayName,
  getMemberDisplayName,
  getSenderDisplayName,
  getSenderRealNickname,
  getSenderAvatar as resolveSenderAvatar,
} from '@/pages-im/utils/user'
import { useFriendStore } from '../../../store/friendStore'
import { useGroupStore } from '../../../store/groupStore'
import { useImRuntimeStore } from '../../../store/runtimeStore'
import { useMessagePuller } from '../../../composables/useMessagePuller'
import { useMessageStore } from '../../../store/messageStore'
import ImAvatar from '../../../components/im-avatar.vue'

const props = defineProps<{
  targetId?: number | string
  title?: string
  type?: number | string
  active?: boolean
}>()

const emit = defineEmits<{
  locate: [messageId: number] // 定位聊天消息
}>()

const PAGE_SIZE = 50 // 每次读取的服务端历史条数
const userStore = useUserStore()
const { convertGroupMessage, convertPrivateMessage } = useMessagePuller()
const { getConversationClearBefore, getConversationDeletedMessageKeys } = useMessageStore()
const pagingRef = ref<any>() // 分页组件引用
const list = ref<Message[]>([]) // 筛选后的历史记录
const keyword = ref('') // 搜索关键词
const messageType = ref(0) // 消息类型筛选
const historyMaxId = ref<number>() // 服务端历史游标
const serverNoMore = ref(false) // 服务端是否已无更早消息
const clearBeforeMessageId = ref(0) // 本地清理的历史边界
const deletedMessageKeys = ref(new Set<string>()) // 当前设备已删除消息标识
const groupMembers = ref<GroupMember[]>([]) // 群成员
const recalledMessageIds = new Set<number>() // 分页期间已收到的撤回原消息编号
const dateValue = ref(Date.now()) // 日期选择器值
const activeDate = ref<number>() // 当前日期筛选
const dateVisible = ref(false) // 日期选择器显示状态
const selectedMemberId = ref<number>() // 当前群成员筛选
const memberVisible = ref(false) // 群成员选择弹窗
const memberKeyword = ref('') // 群成员搜索关键词
let localStateLoaded = false
const filterTabs = [ // 消息类型筛选
  { label: '全部', value: 0 },
  { label: '图片', value: ImMessageType.IMAGE },
  { label: '文件', value: ImMessageType.FILE },
  { label: '语音', value: ImMessageType.VOICE },
  { label: '视频', value: ImMessageType.VIDEO },
]

const conversationType = computed(() => Number(props.type || ImConversationType.PRIVATE)) // 会话类型
const targetId = computed(() => Number(props.targetId)) // 会话目标
const routeTitle = computed(() => props.title ? decodeURIComponent(props.title) : '聊天') // 路由会话名称
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const privateFriend = computed(() => friendStore.isActiveFriend(targetId.value)
  ? friendStore.getFriend(targetId.value)
  : undefined) // 当前有效私聊好友
const group = computed(() => groupStore.getGroup(targetId.value)) // 当前群聊资料
const pageTitle = computed(() => {
  if (conversationType.value === ImConversationType.GROUP && group.value) {
    return getGroupDisplayName(group.value)
  }
  return privateFriend.value ? getFriendDisplayName(privateFriend.value) : routeTitle.value
}) // 会话名称
const selectedMemberName = computed(() => {
  const member = groupMembers.value.find(item => item.userId === selectedMemberId.value)
  return member ? getMemberDisplayName(member) : ''
}) // 已选群成员名称
const filteredMembers = computed(() => { // 搜索后的群成员
  const word = memberKeyword.value.trim().toLowerCase()
  return groupMembers.value.filter(member => member.status !== CommonStatusEnum.DISABLE
    && (!word
      || getMemberDisplayName(member).toLowerCase().includes(word)
      || String(member.userId).includes(word)))
})

/** 查询原始历史消息 */
async function queryMessages(type: number, target: number, maxId?: number) {
  const list = type === ImConversationType.GROUP
    ? (await getGroupMessageList({ groupId: target, maxId, limit: PAGE_SIZE }))
        .map(message => convertGroupMessage(message, userStore.userInfo.userId))
    : (await getPrivateMessageList({ receiverId: target, maxId, limit: PAGE_SIZE }))
        .map(message => convertPrivateMessage(message, userStore.userInfo.userId))
  return list.filter((message): message is Message => !!message)
}

/** 是否命中当前筛选 */
function matchesFilter(item: Message) {
  if (messageType.value && item.type !== messageType.value) {
    return false
  }
  if (activeDate.value && formatDate(item.sendTime) !== formatDate(activeDate.value)) {
    return false
  }
  if (selectedMemberId.value && item.senderId !== selectedMemberId.value) {
    return false
  }
  const word = keyword.value.trim().toLowerCase()
  return !word || getHistorySummary(item).toLowerCase().includes(word)
}

/** 把撤回信号归一化到原消息，并移除信号消息 */
function normalizeRecallMessages(data: Message[]) {
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
    .map(message => message.status === ImMessageStatus.RECALL || recalledMessageIds.has(message.id || 0)
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
  try {
    if (!targetId.value || !await useImRuntimeStore().ensure()) {
      await pagingRef.value?.complete([])
      return
    }
    const type = conversationType.value
    const target = targetId.value
    const clientConversationId = getClientConversationId(type, target)
    if (!localStateLoaded) {
      const [clearBefore, deletedKeys] = await Promise.all([
        getConversationClearBefore(clientConversationId),
        getConversationDeletedMessageKeys(clientConversationId),
      ])
      clearBeforeMessageId.value = clearBefore
      deletedMessageKeys.value = new Set(deletedKeys)
      localStateLoaded = true
    }
    const response = await queryMessages(type, target, pageNo === 1 ? undefined : historyMaxId.value)
    const raw = response.filter(item => item.id > clearBeforeMessageId.value
      && !deletedMessageKeys.value.has(`id:${item.id}`))
    historyMaxId.value = response.at(-1)?.id
    serverNoMore.value = response.length < PAGE_SIZE
      || response.some(item => item.id <= clearBeforeMessageId.value)
    const messages = normalizeRecallMessages(raw)
    await pagingRef.value?.completeByNoMore(messages.filter(matchesFilter), serverNoMore.value)
  } catch {
    await pagingRef.value?.complete(false).catch(() => undefined)
  }
}

/** 设置消息类型筛选 */
function setMessageType(type: number) {
  messageType.value = type
  activeDate.value = undefined
  selectedMemberId.value = undefined
}

/** 确认日期筛选 */
function confirmDate() {
  messageType.value = 0
  selectedMemberId.value = undefined
  activeDate.value = dateValue.value
}

/** 选择群成员筛选 */
function selectMember(member: GroupMember) {
  messageType.value = 0
  activeDate.value = undefined
  selectedMemberId.value = member.userId
  memberVisible.value = false
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
function getSenderName(item: Message) {
  if (item.senderId === userStore.userInfo.userId) {
    return '我'
  }
  return getSenderDisplayName(
    item.senderId,
    conversationType.value,
    targetId.value,
    pageTitle.value,
  )
}

/** 获取发送人真实昵称（头像兜底使用） */
function getSenderRealName(item: Message) {
  if (item.senderId === userStore.userInfo.userId) {
    return userStore.userInfo.nickname || '我'
  }
  return getSenderRealNickname(
    item.senderId,
    conversationType.value,
    targetId.value,
  )
}

/** 获取发送人头像 */
function getSenderAvatar(item: Message) {
  if (item.senderId === userStore.userInfo.userId) {
    return userStore.userInfo.avatar
  }
  return resolveSenderAvatar(item.senderId, conversationType.value, targetId.value)
    || privateFriend.value?.avatar
}

/** 是否系统提示消息 */
function isSystemTip(item: Message) {
  return item.type === ImMessageType.RECALL
    || isFriendChatTip(item.type)
    || isGroupNotification(item.type)
    || isRtcCallTip(item.type)
}

/** 获取历史消息摘要 */
function getHistorySummary(item: Message) {
  if (item.type === ImMessageType.RECALL) {
    return buildRecallTip(
      item.senderId,
      item.senderId === userStore.userInfo.userId,
      conversationType.value,
      targetId.value,
      getSenderName(item),
    )
  }
  const resolveName = conversationType.value === ImConversationType.GROUP
    ? (userId: number) => getMemberDisplayName(groupMembers.value.find(member => member.userId === userId))
    : undefined
  return getMessageSummary(item.type, item.content, resolveName)
}

/** 定位到聊天消息 */
function locateMessage(item: Message) {
  emit('locate', item.id)
}

watch([keyword, messageType, activeDate, selectedMemberId], reload)

/** 初始化群成员 */
onMounted(async () => {
  try {
    if (!await useImRuntimeStore().ensure()) {
      return
    }
    if (conversationType.value === ImConversationType.GROUP && targetId.value) {
      groupMembers.value = await groupStore.fetchGroupMemberList(targetId.value)
    } else if (conversationType.value === ImConversationType.PRIVATE && targetId.value) {
      await friendStore.fetchFriendList()
    }
  } catch (error) {
    console.warn('[IM message history] 初始化失败', error)
  }
})
</script>
