<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏：标题为会员昵称，并提供会员资料入口 -->
    <!-- #ifndef MP-WEIXIN -->
    <wd-navbar
      :title="nickname || '会话'"
      left-arrow placeholder safe-area-inset-top fixed
      right-text="会员资料"
      @click-left="handleBack"
      @click-right="handleMember"
    />
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN -->
    <wd-navbar :title="nickname || '会话'" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="flex items-center gap-26rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <wd-icon name="user" size="40rpx" color="#333" @click="handleMember" />
        </view>
      </template>
    </wd-navbar>
    <!-- #endif -->

    <!-- 消息列表：z-paging 聊天记录模式（最新在底部，下拉加载更早） -->
    <z-paging
      ref="pagingRef"
      v-model="messages"
      use-chat-record-mode
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="PAGE_SIZE"
      safe-area-inset-bottom
      bg-color="#f7f8fa"
      bottom-bg-color="#f7f8fa"
      empty-view-text="暂无消息"
      @query="queryList"
      @cell-style-change="cellStyle = $event"
    >
      <view class="px-24rpx pt-24rpx">
        <view
          v-for="item in renderMessages"
          :key="item.id"
          :style="cellStyle"
          class="mb-24rpx"
        >
          <!-- 时间分隔（间隔较大时展示） -->
          <view v-if="item.showTime" class="mb-16rpx text-center text-22rpx text-[#bbb]">
            {{ formatDate(item.createTime, 'YYYY-MM-DD HH:mm') }}
          </view>

          <!-- 系统消息：居中 -->
          <view v-if="item.kind === 'system'" class="text-center text-22rpx text-[#999]">
            {{ item.text }}
          </view>

          <!-- 用户 / 客服消息：客服(管理员)靠右，用户靠左 -->
          <view v-else class="flex items-start gap-12rpx" :class="item.fromAdmin ? 'flex-row-reverse' : ''">
            <!-- 发送者头像 -->
            <view v-if="item.senderAvatar" class="shrink-0">
              <wd-img :src="item.senderAvatar" width="64rpx" height="64rpx" radius="50%" mode="aspectFill" />
            </view>
            <!-- 图片消息（custom-image 覆盖 wd-img 内部 height:100% 让 widthFix 撑开高度） -->
            <wd-img
              v-if="item.kind === 'image'"
              :src="item.picUrl"
              width="360rpx"
              radius="12rpx"
              mode="widthFix"
              custom-image="!h-auto"
              enable-preview
            />
            <!-- 商品消息 -->
            <view
              v-else-if="item.kind === 'product'"
              class="max-w-460rpx flex items-center rounded-12rpx bg-white p-16rpx shadow-sm"
            >
              <view v-if="item.picUrl" class="mr-16rpx shrink-0">
                <wd-img :src="item.picUrl" width="96rpx" height="96rpx" radius="8rpx" mode="aspectFill" />
              </view>
              <view class="min-w-0 flex-1">
                <view class="line-clamp-2 text-26rpx text-[#333]">
                  {{ item.title || '商品' }}
                </view>
                <view class="mt-8rpx text-26rpx text-[#ff3000]">
                  ￥{{ item.price }}
                </view>
              </view>
            </view>
            <!-- 订单消息 -->
            <view
              v-else-if="item.kind === 'order'"
              class="max-w-460rpx rounded-12rpx bg-white p-20rpx shadow-sm"
            >
              <view class="text-26rpx text-[#333]">
                订单号：{{ item.orderNo || '-' }}
              </view>
              <view class="mt-8rpx text-22rpx text-[#999]">
                共 {{ item.productCount || 0 }} 件，总金额：<text class="text-[#ff3000]">￥{{ item.payPrice }}</text>
              </view>
            </view>
            <!-- 文本消息：客服蓝底白字，用户白底深字 -->
            <view
              v-else
              class="max-w-[70%] whitespace-pre-wrap break-all rounded-12rpx p-20rpx text-28rpx"
              :class="item.fromAdmin ? 'bg-[#1677ff] text-white' : 'bg-white text-[#333] shadow-sm'"
            >
              {{ item.text }}
            </view>
          </view>
        </view>
      </view>

      <!-- 输入区域（固定底部，聊天记录模式键盘自适应；底部安全区域由 z-paging safe-area-inset-bottom 处理） -->
      <template #bottom>
        <view class="border-t border-[#eee] bg-[#f7f8fa]">
          <view class="flex items-end gap-16rpx p-16rpx">
            <!-- 表情切换 -->
            <view class="shrink-0 pb-12rpx" @click="toggleEmoji">
              <wd-icon
                :name="emojiVisible ? 'keyboard' : 'face-smile-fill'"
                size="48rpx"
                :color="emojiVisible ? '#1677ff' : '#7d7d7d'"
              />
            </view>
            <!-- 输入框（白底，与灰色底栏形成对比） -->
            <view class="min-w-0 flex-1 rounded-12rpx bg-white px-20rpx py-12rpx">
              <wd-textarea
                v-model="messageContent"
                placeholder="输入回复内容"
                :maxlength="1000"
                auto-height
                no-border
              />
            </view>
            <!-- 发送图片 -->
            <view class="shrink-0 pb-12rpx" @click="handleSendImage">
              <wd-icon name="image" size="48rpx" color="#7d7d7d" />
            </view>
            <wd-button class="shrink-0" type="primary" size="small" :loading="sending" :disabled="!messageContent.trim()" @click="handleSend">
              发送
            </wd-button>
          </view>

          <!-- 表情面板（淡灰底，微信式） -->
          <view v-if="emojiVisible" class="flex flex-wrap border-t border-[#eee] p-12rpx">
            <view
              v-for="emoji in KEFU_EMOJIS"
              :key="emoji"
              class="w-[12.5%] py-12rpx text-center text-44rpx active:bg-[#e6e6e6]"
              @click="appendEmoji(emoji)"
            >
              {{ emoji }}
            </view>
          </view>
        </view>
      </template>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionKefuMessage } from '@/api/mall/promotion/kefu/message'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  getPromotionKefuMessageList,
  sendPromotionKefuMessage,
  updatePromotionKefuMessageReadStatus,
} from '@/api/mall/promotion/kefu/message'
import { navigateBackPlus } from '@/utils'
import { KeFuMessageContentTypeEnum } from '@/utils/constants'
import { formatDate, formatDateTime, toTimestamp } from '@/utils/date'
import { uploadFileFromPath } from '@/utils/uploadFile'
import { KEFU_EMOJIS, parseKefuMessage } from '../composables/message'
import { connectKefuWebSocket } from '../composables/useKefuWebSocket'

const props = defineProps<{
  id?: number | any // 会话编号
  userId?: number | any // 会员编号
  nickname?: string // 会员昵称（导航标题）
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const PAGE_SIZE = 10 // 单页消息数，与后端 LIMIT 对齐
const TIME_GAP = 5 * 60 * 1000 // 时间分隔阈值：相邻消息间隔超 5 分钟时展示时间

const conversationId = computed(() => props.id != null && props.id !== '' ? Number(props.id) : undefined) // 会话编号
const nickname = computed(() => props.nickname ? decodeURIComponent(String(props.nickname)) : '') // 会员昵称
const receiverId = computed(() => props.userId != null && props.userId !== '' ? Number(props.userId) : undefined) // 接收者（会员）编号

const pagingRef = ref<any>() // z-paging 引用
const messages = ref<PromotionKefuMessage[]>([]) // 消息列表（最新在前）
const cellStyle = ref<Record<string, string>>({ transform: 'scaleY(-1)' }) // 聊天记录模式单元格倒置样式
const messageContent = ref('') // 输入内容
const sending = ref(false) // 发送状态
const historyCursor = ref<string>() // 历史游标（已加载最早一条 createTime）
const emojiVisible = ref(false) // 表情面板是否展开
const firstPageLoading = ref(true) // 首屏消息加载状态
const pendingLatestMessages = ref<PromotionKefuMessage[]>([]) // 首屏加载期间待追加消息

/** 毫秒时间戳，解析失败按 0（用于时间间隔比较） */
function toMs(time?: string | number) {
  const ms = toTimestamp(time)
  return Number.isNaN(ms) ? 0 : ms
}

/** 渲染用消息：数组下一条为更早消息，与其间隔超阈值时展示时间分隔 */
const renderMessages = computed(() => {
  const arr = messages.value
  return arr.map((item, index) => {
    const older = arr[index + 1]
    const showTime = !older || toMs(item.createTime) - toMs(older.createTime) > TIME_GAP
    return { ...parseKefuMessage(item), showTime }
  })
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/kefu/index')
}

/** 进入会员资料 */
function handleMember() {
  if (receiverId.value == null) {
    return
  }
  uni.navigateTo({ url: `/pages-mall/kefu/member/index?userId=${receiverId.value}` })
}

/** 标记会话已读，并通知会话列表刷新未读数 */
async function markRead() {
  if (!conversationId.value) {
    return
  }
  await updatePromotionKefuMessageReadStatus(conversationId.value)
  uni.$emit('mall:kefu:read')
}

/** 分页查询：pageNo===1 取最新（无游标），更多按 createTime 游标向更早翻页 */
async function queryList(pageNo: number) {
  const isFirstPage = pageNo === 1
  let querySucceeded = false
  if (isFirstPage) {
    firstPageLoading.value = true
  }
  if (!conversationId.value) {
    await pagingRef.value?.complete([])
    if (isFirstPage) {
      flushPendingLatestMessages()
    }
    return
  }
  try {
    const createTime = pageNo === 1 ? undefined : historyCursor.value
    const res = await getPromotionKefuMessageList({ conversationId: conversationId.value, createTime })
    const list = res || []
    if (list.length) {
      historyCursor.value = formatDateTime(list.at(-1)!.createTime)
    }
    await pagingRef.value?.complete(list)
    querySucceeded = true
  } catch {
    await pagingRef.value?.complete(false).catch(() => undefined)
  } finally {
    if (isFirstPage && querySucceeded) {
      flushPendingLatestMessages()
    }
  }
}

/** 拉取最新消息补入底部，按 id 去重 */
async function syncLatest() {
  if (!conversationId.value) {
    return
  }
  const res = await getPromotionKefuMessageList({ conversationId: conversationId.value })
  // 倒序逐条插入，使最新消息落在最底部
  for (const item of [...(res || [])].reverse()) {
    addLatestMessage(item)
  }
}

/** 发送文本消息 */
async function handleSend() {
  if (!conversationId.value || !messageContent.value.trim()) {
    return
  }
  sending.value = true
  try {
    await sendPromotionKefuMessage({
      conversationId: conversationId.value,
      contentType: KeFuMessageContentTypeEnum.TEXT,
      content: JSON.stringify({ text: messageContent.value.trim() }),
    })
    messageContent.value = ''
    emojiVisible.value = false
    await syncLatest()
  } finally {
    sending.value = false
  }
}

/** 发送图片消息：选图 → 上传 → 发送 */
function handleSendImage() {
  if (!conversationId.value || sending.value) {
    return
  }
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const path = res.tempFilePaths?.[0]
      if (!path) {
        return
      }
      sending.value = true
      try {
        const picUrl = await uploadFileFromPath(path, 'mall/kefu')
        await sendPromotionKefuMessage({
          conversationId: conversationId.value,
          contentType: KeFuMessageContentTypeEnum.IMAGE,
          content: JSON.stringify({ picUrl }),
        })
        await syncLatest()
      } finally {
        sending.value = false
      }
    },
  })
}

/** 切换表情面板 */
function toggleEmoji() {
  emojiVisible.value = !emojiVisible.value
}

/** 选择表情：追加到输入框 */
function appendEmoji(emoji: string) {
  messageContent.value += emoji
}

/** 去重后追加最新消息并滚动到底部 */
function addLatestMessage(message: PromotionKefuMessage) {
  if (message.id && (messages.value.some(item => item.id === message.id)
    || pendingLatestMessages.value.some(item => item.id === message.id))) {
    return
  }
  if (firstPageLoading.value) {
    pendingLatestMessages.value.push(message)
    return
  }
  if (pagingRef.value) {
    pagingRef.value.addChatRecordData(message)
  } else {
    messages.value = [message, ...messages.value]
  }
}

/** 追加首屏加载期间收到的新消息 */
function flushPendingLatestMessages() {
  firstPageLoading.value = false
  const pending = [...pendingLatestMessages.value]
    .sort((left, right) => (left.id || 0) - (right.id || 0))
  pendingLatestMessages.value = []
  pending.forEach(message => addLatestMessage(message))
}

/** 收到新消息：属于当前会话时追加底部，并标记已读 */
function handleWsMessage(message: PromotionKefuMessage) {
  if (!message || message.conversationId !== conversationId.value) {
    return
  }
  addLatestMessage(message)
  markRead()
}

/** 初始化：连接 WebSocket + 标记已读 + 监听新消息 */
onMounted(() => {
  connectKefuWebSocket()
  markRead()
  uni.$on('mall:kefu:message', handleWsMessage)
})

/** 卸载：移除本页监听，不断开 WebSocket */
function cleanup() {
  uni.$off('mall:kefu:message', handleWsMessage)
}

onUnmounted(cleanup)
onUnload(cleanup)
</script>
