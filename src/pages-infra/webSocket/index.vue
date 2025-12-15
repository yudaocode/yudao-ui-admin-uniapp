<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="WebSocket 测试"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 连接状态卡片 -->
    <view class="mx-24rpx mt-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
      <view class="p-32rpx">
        <!-- 状态指示器 -->
        <view class="mb-24rpx flex items-center">
          <view
            class="mr-16rpx h-20rpx w-20rpx rounded-full"
            :class="isConnected ? 'bg-[#07c160]' : 'bg-[#fa5151]'"
          />
          <text class="text-32rpx text-[#333] font-semibold">连接管理</text>
        </view>
        <!-- 连接状态 -->
        <view class="mb-24rpx flex items-center rounded-12rpx bg-[#f7f8fa] p-24rpx">
          <text class="mr-16rpx text-28rpx text-[#666]">连接状态:</text>
          <wd-tag :type="isConnected ? 'success' : 'danger'">
            {{ statusText }}
          </wd-tag>
        </view>
        <!-- 服务地址 -->
        <view class="mb-24rpx">
          <text class="mb-12rpx block text-26rpx text-[#999]">服务地址</text>
          <view class="rounded-12rpx bg-[#f7f8fa] p-24rpx">
            <text class="break-all text-26rpx text-[#666]">{{ serverUrl }}</text>
          </view>
        </view>
        <!-- 连接按钮 -->
        <wd-button
          block
          :type="isConnected ? 'error' : 'primary'"
          @click="toggleConnection"
        >
          {{ isConnected ? '断开连接' : '建立连接' }}
        </wd-button>
      </view>
    </view>

    <!-- 发送消息卡片 -->
    <view class="mx-24rpx mt-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
      <view class="p-32rpx">
        <view class="mb-24rpx flex items-center">
          <wd-icon name="chat" size="36rpx" color="#1989fa" class="mr-12rpx" />
          <text class="text-32rpx text-[#333] font-semibold">发送消息</text>
        </view>
        <!-- 接收人选择 -->
        <view class="mb-24rpx">
          <text class="mb-12rpx block text-26rpx text-[#999]">接收人</text>
          <wd-picker
            v-model="sendUserId"
            :columns="userColumns"
            :disabled="!isConnected"
            @confirm="handleUserChange"
          >
            <view class="flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx">
              <text class="text-28rpx" :class="isConnected ? 'text-[#333]' : 'text-[#c8c9cc]'">
                {{ selectedUserLabel }}
              </text>
              <wd-icon name="arrow-down" size="32rpx" :color="isConnected ? '#666' : '#c8c9cc'" />
            </view>
          </wd-picker>
        </view>
        <!-- 消息内容 -->
        <view class="mb-24rpx">
          <text class="mb-12rpx block text-26rpx text-[#999]">消息内容</text>
          <wd-textarea
            v-model="sendText"
            placeholder="请输入要发送的消息..."
            :disabled="!isConnected"
            :maxlength="500"
            show-word-limit
            auto-height
            :min-height="120"
          />
        </view>

        <!-- 发送按钮 -->
        <wd-button
          block
          type="primary"
          :disabled="!isConnected || !sendText.trim()"
          @click="handleSend"
        >
          <wd-icon name="send" size="32rpx" class="mr-8rpx" />
          发送消息
        </wd-button>
      </view>
    </view>

    <!-- 消息记录卡片 -->
    <view class="mx-24rpx mb-24rpx mt-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
      <view class="p-32rpx">
        <view class="mb-24rpx flex items-center justify-between">
          <view class="flex items-center">
            <wd-icon name="list" size="36rpx" color="#1989fa" class="mr-12rpx" />
            <text class="text-32rpx text-[#333] font-semibold">消息记录</text>
            <wd-tag v-if="messageList.length > 0" type="primary" plain class="ml-16rpx">
              {{ messageList.length }} 条
            </wd-tag>
          </view>
          <wd-button
            v-if="messageList.length > 0"
            size="small"
            type="error"
            plain
            @click="clearMessages"
          >
            清空
          </wd-button>
        </view>

        <!-- 消息列表 -->
        <scroll-view
          scroll-y
          class="message-list rounded-12rpx bg-[#f7f8fa]"
          :style="{ height: '600rpx' }"
        >
          <view v-if="messageList.length === 0" class="h-full flex flex-col items-center justify-center">
            <wd-icon name="inbox" size="80rpx" color="#c8c9cc" />
            <text class="mt-16rpx text-26rpx text-[#c8c9cc]">暂无消息记录</text>
          </view>
          <view v-else class="p-20rpx">
            <view
              v-for="(msg, index) in messageReverseList"
              :key="index"
              class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            >
              <view class="mb-12rpx flex items-center justify-between">
                <view class="flex items-center">
                  <view
                    class="mr-12rpx h-16rpx w-16rpx rounded-full"
                    :style="{ backgroundColor: getMessageBadgeColor(msg.type) }"
                  />
                  <text class="text-26rpx text-[#666] font-medium">
                    {{ getMessageTypeText(msg.type) }}
                  </text>
                  <text v-if="msg.userId" class="ml-16rpx text-24rpx text-[#999]">
                    用户 ID: {{ msg.userId }}
                  </text>
                </view>
                <text class="text-22rpx text-[#c8c9cc]">
                  {{ formatDateTime(msg.time) }}
                </text>
              </view>
              <view class="break-words text-28rpx text-[#333]">
                {{ msg.text }}
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 底部安全区域 -->
    <view class="h-env(safe-area-inset-bottom)" />
  </view>
</template>

<script lang="ts" setup>
import type { User } from '@/api/system/user'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getSimpleUserList } from '@/api/system/user'
import { useTokenStore } from '@/store/token'
import { getEnvBaseUrlRoot, navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

// ======================= 状态定义 =======================
const tokenStore = useTokenStore()
const toast = useToast()

// WebSocket 相关状态
const socketTask = ref<UniApp.SocketTask | null>(null)
const isConnected = ref(false)
const statusText = computed(() => (isConnected.value ? '已连接' : '未连接'))

// 服务地址
const serverUrl = computed(() => {
  const baseUrl = getEnvBaseUrlRoot()
  const wsUrl = baseUrl.replace('http', 'ws')
  const tokenInfo = tokenStore.tokenInfo as any
  const token = tokenInfo?.refreshToken || tokenStore.validToken
  return `${wsUrl}/infra/ws?token=${token}`
})

// 消息相关状态
interface Message {
  text: string
  time: number
  type?: 'single' | 'group' | 'system'
  userId?: string
}
const messageList = ref<Message[]>([])
const messageReverseList = computed(() => [...messageList.value].reverse())

// 发送消息相关
const sendText = ref('')
const sendUserId = ref('all')
const userList = ref<User[]>([])
const userColumns = computed(() => {
  const list = [
    { value: 'all', label: '所有人' },
    ...userList.value.map(user => ({
      value: String(user.id),
      label: user.nickname || user.username,
    })),
  ]
  return [list]
}) // 用户选择器列表
const selectedUserLabel = computed(() => {
  if (sendUserId.value === 'all') {
    return '所有人'
  }
  const user = userList.value.find(u => String(u.id) === sendUserId.value)
  return user?.nickname || user?.username || '所有人'
}) // 选中的用户标签

// ======================= WebSocket 方法 =======================

/** 建立 WebSocket 连接 */
function connect() {
  if (socketTask.value) {
    return
  }

  // 1.1 发起连接请求
  socketTask.value = uni.connectSocket({
    url: serverUrl.value,
    success: () => {
      console.log('WebSocket 连接请求已发送')
    },
    fail: (err) => {
      console.error('WebSocket 连接失败:', err)
      toast.error('连接失败')
    },
  })
  // 1.2 监听连接打开
  socketTask.value.onOpen(() => {
    console.log('WebSocket 连接已打开')
    isConnected.value = true
    toast.success('连接成功')
    // 开始心跳
    startHeartbeat()
  })

  // 2. 监听消息
  socketTask.value.onMessage((res) => {
    handleMessage(res.data as string)
  })

  // 3.1 监听连接关闭
  socketTask.value.onClose(() => {
    console.log('WebSocket 连接已关闭')
    isConnected.value = false
    socketTask.value = null
    stopHeartbeat()
  })
  // 3.2 监听错误
  socketTask.value.onError((err) => {
    console.error('WebSocket 错误:', err)
    isConnected.value = false
    socketTask.value = null
    stopHeartbeat()
    toast.error('连接异常')
  })
}

/** 关闭 WebSocket 连接 */
function disconnect() {
  if (!socketTask.value) {
    return
  }
  socketTask.value.close({
    success: () => {
      console.log('WebSocket 连接已主动关闭')
      toast.success('已断开')
    },
  })
  socketTask.value = null
  isConnected.value = false
  stopHeartbeat()
}

/** 切换连接状态 */
function toggleConnection() {
  if (isConnected.value) {
    disconnect()
  } else {
    connect()
  }
}

// ======================= 心跳机制 =======================
let heartbeatTimer: ReturnType<typeof setInterval> | null = null

/** 启动心跳机制 */
function startHeartbeat() {
  stopHeartbeat()
  // 30 秒发送一次心跳
  heartbeatTimer = setInterval(() => {
    if (socketTask.value && isConnected.value) {
      socketTask.value.send({
        data: 'ping',
        fail: (err) => {
          console.error('心跳发送失败:', err)
        },
      })
    }
  }, 30000)
}

/** 停止心跳机制 */
function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

// ======================= 消息处理 =======================

/** 处理接收到的消息 */
function handleMessage(data: string) {
  if (!data) {
    return
  }

  try {
    // 心跳响应
    if (data === 'pong') {
      return
    }

    // 1. 解析消息
    const jsonMessage = JSON.parse(data)
    const type = jsonMessage.type
    const content = JSON.parse(jsonMessage.content)
    if (!type) {
      console.warn('未知的消息类型:', data)
      return
    }

    // 2.1 处理 demo-message-receive 消息
    if (type === 'demo-message-receive') {
      const single = content.single
      messageList.value.push({
        text: content.text,
        time: Date.now(),
        type: single ? 'single' : 'group',
        userId: content.fromUserId,
      })
      return
    }

    // 2.2 处理 notice-push 消息
    if (type === 'notice-push') {
      messageList.value.push({
        text: content.title,
        time: Date.now(),
        type: 'system',
      })
      return
    }

    console.warn('未处理的消息类型:', type, data)
  } catch (error) {
    console.error('消息解析失败:', error, data)
  }
}

/** 发送消息 */
function handleSend() {
  if (!sendText.value.trim()) {
    toast.show('请输入消息内容')
    return
  }
  if (!socketTask.value || !isConnected.value) {
    toast.show('请先建立连接')
    return
  }

  // 1.1 构建消息内容
  const messageContent = JSON.stringify({
    text: sendText.value,
    toUserId: sendUserId.value === 'all' ? undefined : sendUserId.value,
  })
  // 1.2 构建完整消息
  const jsonMessage = JSON.stringify({
    type: 'demo-message-send',
    content: messageContent,
  })

  // 2. 发送消息
  socketTask.value.send({
    data: jsonMessage,
    success: () => {
      toast.success('发送成功')
      sendText.value = ''
    },
    fail: (err) => {
      console.error('消息发送失败:', err)
      toast.error('发送失败')
    },
  })
}

/** 清空消息记录 */
function clearMessages() {
  messageList.value = []
}

// ======================= 工具方法 =======================

/** 获取消息类型的徽标颜色 */
function getMessageBadgeColor(type?: string) {
  switch (type) {
    case 'group':
      return '#07c160'
    case 'single':
      return '#1989fa'
    case 'system':
      return '#fa5151'
    default:
      return '#c8c9cc'
  }
}

/** 获取消息类型的文本 */
function getMessageTypeText(type?: string) {
  switch (type) {
    case 'group':
      return '群发'
    case 'single':
      return '单发'
    case 'system':
      return '系统'
    default:
      return '未知'
  }
}

/** 处理用户选择变化 */
function handleUserChange({ value }: { value: string[] }) {
  sendUserId.value = value[0] || 'all'
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

// ======================= 生命周期 =======================

/** 初始化 */
onMounted(async () => {
  // 获取用户列表
  try {
    userList.value = await getSimpleUserList()
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
})

/** 页面卸载 */
onUnmounted(() => {
  // 页面销毁时断开连接
  disconnect()
})
</script>

<style lang="scss" scoped>
.message-list {
  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
