<template>
  <view class="yd-page-container bg-[#f5f6f7]">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="SSE 测试"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 连接状态卡片 -->
    <view class="mx-24rpx mt-24rpx rounded-16rpx bg-white p-32rpx shadow-sm">
      <view class="mb-24rpx flex items-center">
        <view class="mr-16rpx h-20rpx w-20rpx rounded-full" :class="connected ? 'bg-[#07c160]' : 'bg-[#fa5151]'" />
        <text class="text-32rpx font-semibold">连接管理</text>
      </view>
      <view class="mb-24rpx flex items-center rounded-12rpx bg-[#f7f8fa] p-24rpx">
        <text class="mr-16rpx text-28rpx text-[#666]">连接状态:</text>
        <wd-tag :type="connected ? 'success' : 'danger'">
          {{ status }}
        </wd-tag>
      </view>
      <view class="mb-24rpx rounded-12rpx bg-[#f7f8fa] p-24rpx">
        <text class="break-all text-24rpx text-[#666]">{{ maskedServerUrl }}</text>
      </view>
      <!-- 连接操作：左侧状态说明，右侧操作按钮 -->
      <view class="flex items-center justify-between gap-16rpx rounded-12rpx bg-[#f7f8fa] px-24rpx py-16rpx">
        <text class="text-24rpx text-[#999]">{{ statusHint }}</text>
        <view class="flex shrink-0 gap-16rpx">
          <wd-button size="small" type="primary" :disabled="!!source" @click="connect">
            开启连接
          </wd-button>
          <wd-button size="small" type="danger" variant="plain" :disabled="!source" @click="disconnect">
            关闭连接
          </wd-button>
        </view>
      </view>
    </view>

    <!-- 发送测试事件卡片 -->
    <view class="mx-24rpx mt-24rpx rounded-16rpx bg-white p-32rpx shadow-sm">
      <view class="mb-24rpx">
        <text class="text-32rpx font-semibold">发送测试事件</text>
      </view>
      <view class="mb-24rpx rounded-12rpx bg-[#f7f8fa] p-24rpx">
        <wd-textarea v-model="sendText" placeholder="SSE 没有上行通道，通过 HTTP 发布测试事件" :maxlength="500" />
      </view>
      <wd-button block type="primary" :disabled="!connected || !sendText" @click="sendDemo">
        发送 SSE 测试事件
      </wd-button>
    </view>

    <!-- 事件流卡片 -->
    <view class="mx-24rpx mb-24rpx mt-24rpx rounded-16rpx bg-white p-32rpx shadow-sm">
      <view class="mb-20rpx flex items-center justify-between">
        <view class="flex items-center">
          <text class="text-32rpx font-semibold">事件流</text>
          <wd-tag v-if="events.length" type="primary" variant="plain" class="ml-16rpx">
            {{ events.length }} 条
          </wd-tag>
        </view>
        <wd-button v-if="events.length" size="small" type="info" variant="plain" @click="events = []">
          清空
        </wd-button>
      </view>
      <!-- 事件筛选：全部、业务、系统 -->
      <wd-segmented v-model:value="filter" :options="FILTER_OPTIONS" />
      <text class="mb-16rpx mt-16rpx block text-24rpx text-[#999]">
        业务事件 {{ businessCount }} · 系统事件 {{ events.length - businessCount }}
      </text>
      <view v-if="filteredEvents.length">
        <view v-for="item in filteredEvents" :key="item.id" class="mb-16rpx rounded-12rpx bg-[#f7f8fa] p-20rpx">
          <view class="flex justify-between">
            <wd-tag size="small">
              {{ item.kind }}
            </wd-tag>
            <text class="text-22rpx text-[#999]">{{ item.time }}</text>
          </view>
          <text class="mt-12rpx block break-all text-26rpx">{{ item.text }}</text>
        </view>
      </view>
      <view v-else class="py-80rpx text-center text-26rpx text-[#999]">
        {{ events.length === 0 ? '暂无 SSE 事件' : `暂无${filter}事件` }}
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { closeSseConnection, getSseConfig, sendSseDemo } from '@/api/infra/sse'
import { isDoubleTokenRes } from '@/api/types/login'
import { useTokenStore } from '@/store/token'
import { getEnvBaseUrlRoot, navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: 'SSE 测试',
    navigationStyle: 'custom',
  },
})

/** 需要订阅的业务事件：服务端使用 messageType 作为 SSE 的 event 名，必须按名称订阅，onmessage 收不到 */
const BUSINESS_EVENTS = ['demo-sse-test', 'notice-push']
/** 系统事件：连接、关闭、异常，其它均为业务事件 */
const SYSTEM_EVENTS = ['connected', 'close', 'error']
const FILTER_OPTIONS = ['全部', '业务', '系统'] // 事件筛选，与 Vue3、Vben 的事件流语义一致
const CLIENT_ID_KEY = 'yudao.sse.client-id'

const toast = useToast()
const tokenStore = useTokenStore()
const tokenInfo = tokenStore.tokenInfo
// 使用 refreshToken 的原因：与 WebSocket 一样，EventSource 无法方便的刷新访问令牌
const token = isDoubleTokenRes(tokenInfo) ? tokenInfo.refreshToken : tokenStore.validToken

/** 客户端编号：每个标签页一个，同一标签页重连时服务端替换旧连接 */
function getClientId() {
  let clientId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(CLIENT_ID_KEY) : null
  if (!clientId || !/^[\w-]{1,64}$/.test(clientId)) {
    clientId = `uni-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(CLIENT_ID_KEY, clientId)
    }
  }
  return clientId
}

const clientId = getClientId()
const ssePath = ref('/infra/sse') // SSE 接口路径前缀
const serverUrl = computed(() => `${getEnvBaseUrlRoot()}${ssePath.value}/connect?clientId=${clientId}&token=${encodeURIComponent(token)}`)
/** 展示用的服务地址：令牌只保留首尾 4 位 */
const maskedServerUrl = computed(() => {
  const masked = token && token.length > 8 ? `${token.slice(0, 4)}****${token.slice(-4)}` : '****'
  return serverUrl.value.replace(encodeURIComponent(token || ''), masked)
})
const connected = ref(false) // 是否已连接
const status = ref('CLOSED') // 连接状态
const statusHint = computed(() => { // 连接操作区的状态说明
  switch (status.value) {
    case 'OPEN':
      return '连接已建立，可以发送测试事件'
    case 'CONNECTING':
      return '正在建立连接…'
    case 'RECONNECTING':
      return '连接中断，EventSource 正在自动重连…'
    default:
      return '连接未建立，开启连接后才能接收事件'
  }
})
const events = ref<{ id: string, kind: string, time: string, text: string }[]>([]) // 事件列表，最新的在前
const filter = ref('全部') // 当前筛选
const businessCount = computed(() => events.value.filter(item => !SYSTEM_EVENTS.includes(item.kind)).length) // 业务事件数量
const filteredEvents = computed(() => {
  if (filter.value === '全部') {
    return events.value
  }
  return events.value.filter(item => SYSTEM_EVENTS.includes(item.kind) === (filter.value === '系统'))
}) // 筛选后的事件
const sendText = ref('hello sse') // 发送内容
const source = shallowRef<EventSource>() // EventSource 实例
let connectionId = '' // 服务端分配的连接编号，用于主动关闭
const receivedEventIds: string[] = [] // 最近收到的 eventId，前端兜底去重

/** 追加事件 */
function append(kind: string, text: string) {
  events.value.unshift({ id: `${Date.now()}-${Math.random()}`, kind, text, time: new Date().toLocaleTimeString() })
}

/** 解析 JSON，失败时返回 undefined */
function parseJson(text?: string) {
  try {
    return text ? JSON.parse(text) : undefined
  } catch {
    return undefined
  }
}

/** 关闭本地的 EventSource，停止自动重连 */
function closeSource() {
  source.value?.close()
  source.value = undefined
  connected.value = false
  status.value = 'CLOSED'
}

/** 处理 connected 事件 */
function handleConnected(event: MessageEvent) {
  const data = parseJson(event.data) || {}
  connectionId = data.connectionId || ''
  append('connected', JSON.stringify(data))
}

/** 处理 close 事件：reconnect=false 时（TOKEN_INVALID、REPLACED、CLIENT_CLOSE）停止重连 */
function handleClose(event: MessageEvent) {
  const data = parseJson(event.data) || {}
  append('close', JSON.stringify(data))
  if (data.reconnect === false) {
    closeSource()
    connectionId = ''
    toast.warning(`SSE 连接已被服务端关闭：${data.message || data.reason}`)
  }
}

/** 处理业务事件：data 与 WebSocket 一致，为 {type, content, eventId, timestamp} */
function handleBusinessEvent(event: MessageEvent) {
  const data = parseJson(event.data)
  if (!data) {
    append(event.type, event.data)
    return
  }
  const eventId = data.eventId || event.lastEventId
  if (eventId) {
    if (receivedEventIds.includes(eventId)) {
      append(event.type, `已去重：重复的 eventId(${eventId})`)
      return
    }
    receivedEventIds.push(eventId)
    if (receivedEventIds.length > 256) {
      receivedEventIds.shift()
    }
  }
  const content = parseJson(data.content) || {}
  let text = data.content
  if (data.type === 'demo-sse-test') {
    text = `【${content.single ? '单发' : '群发'}】用户编号(${content.fromUserId})：${content.text}`
  } else if (data.type === 'notice-push') {
    text = `【系统通知】：${content.title}`
  }
  append(event.type, `${text}\neventId：${eventId}`)
}

/** 开启连接 */
function connect() {
  if (typeof EventSource === 'undefined') {
    append('error', '当前运行环境不支持 EventSource，请在 H5 环境验收 SSE')
    return
  }
  closeSource()
  status.value = 'CONNECTING'
  const eventSource = new EventSource(serverUrl.value)
  source.value = eventSource
  eventSource.onopen = () => {
    connected.value = true
    status.value = 'OPEN'
  }
  eventSource.addEventListener('connected', event => handleConnected(event as MessageEvent))
  eventSource.addEventListener('close', event => handleClose(event as MessageEvent))
  BUSINESS_EVENTS.forEach(name => eventSource.addEventListener(name, event => handleBusinessEvent(event as MessageEvent)))
  eventSource.onmessage = handleBusinessEvent // 未指定 event 名的消息
  eventSource.onerror = () => {
    if (source.value !== eventSource) {
      return
    }
    connected.value = false
    // 非 200 响应（例如说令牌失效、SSE 未开启、连接数已满）时，浏览器不会再重连
    if (eventSource.readyState === EventSource.CLOSED) {
      closeSource()
      append('error', '连接失败，请检查登录状态，或确认已配置 yudao.sse.enable=true')
      return
    }
    status.value = 'RECONNECTING'
    append('error', '连接异常，EventSource 将按 retry 自动重连')
  }
}

/** 关闭连接：先关闭本地连接，再通知服务端释放 */
async function disconnect() {
  closeSource()
  if (connectionId) {
    await closeSseConnection(connectionId, ssePath.value).catch(() => undefined)
  }
  connectionId = ''
  append('close', '已主动关闭 SSE 连接')
}

/** 发送测试事件 */
async function sendDemo() {
  await sendSseDemo({ text: sendText.value })
  toast.success('测试事件已发送')
}

function handleBack() {
  navigateBackPlus('/pages-infra/index')
}

/** 读取 SSE 配置：接口路径 */
onMounted(async () => {
  const config = await getSseConfig()
  ssePath.value = config?.ssePath || '/infra/sse'
})

onUnmounted(() => closeSource())
</script>
