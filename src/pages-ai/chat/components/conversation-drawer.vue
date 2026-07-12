<template>
  <wd-popup v-model="visible" position="left" custom-style="width: 78vw; height: 100vh;">
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center px-28rpx pb-18rpx pt-[calc(28rpx+env(safe-area-inset-top))]">
        <text class="text-34rpx text-[#333] font-semibold">对话</text>
      </view>
      <view class="px-20rpx">
        <wd-search v-model="keyword" placeholder="搜索历史记录" hide-cancel />
      </view>
      <scroll-view scroll-y class="min-h-0 flex-1 px-20rpx py-12rpx">
        <view v-for="group in conversationGroups" :key="group.label" class="mb-12rpx">
          <view class="px-12rpx py-10rpx text-22rpx text-[#999] font-medium">
            {{ group.label }}
          </view>
          <view
            v-for="item in group.items"
            :key="item.id"
            class="mb-8rpx flex items-center gap-12rpx rounded-24rpx px-22rpx py-20rpx"
            :class="String(item.id) === String(activeConversationId) ? 'bg-[#e6f4ff]' : 'bg-transparent'"
            @click="emit('select', item)"
          >
            <view class="min-w-0 flex-1">
              <view class="truncate text-28rpx text-[#333] font-medium">
                {{ item.title || '新对话' }}
              </view>
              <view class="mt-8rpx text-22rpx text-[#999]">
                {{ item.modelName || item.model || '默认模型' }}
              </view>
            </view>
            <view
              class="mr-8rpx h-56rpx w-56rpx flex shrink-0 items-center justify-center"
              @click.stop="emit('more', item)"
            >
              <wd-icon name="more" size="30rpx" color="#999" />
            </view>
          </view>
        </view>
        <view v-if="conversationGroups.length === 0" class="py-80rpx text-center text-26rpx text-[#999]">
          暂无对话
        </view>
      </scroll-view>
      <view class="shrink-0 border-t border-[#eee] bg-white px-20rpx pb-[calc(20rpx+env(safe-area-inset-bottom))] pt-20rpx">
        <wd-button block type="primary" @click="emit('new')">
          新建对话
        </wd-button>
        <view class="grid grid-cols-2 mt-16rpx gap-16rpx">
          <wd-button variant="plain" @click="emit('role')">
            角色仓库
          </wd-button>
          <wd-button variant="plain" @click="emit('clear')">
            清空未置顶
          </wd-button>
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ChatConversation } from '@/api/ai/chat/conversation'
import { computed, ref } from 'vue'

const props = defineProps<{
  conversations: ChatConversation[]
  activeConversationId?: string
}>()
const emit = defineEmits<{
  select: [conversation: ChatConversation]
  more: [conversation: ChatConversation]
  new: []
  role: []
  clear: []
}>()
const visible = defineModel<boolean>({ default: false })
const keyword = ref('') // 对话搜索关键字
const conversationGroups = computed(() => { // 对话按置顶和时间分组
  const searchKeyword = keyword.value.trim().toLowerCase()
  const groups = [
    { label: '置顶', items: [] as ChatConversation[] },
    { label: '今天', items: [] as ChatConversation[] },
    { label: '最近 7 天', items: [] as ChatConversation[] },
    { label: '更早', items: [] as ChatConversation[] },
  ]
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  for (const conversation of props.conversations) {
    if (searchKeyword && !String(conversation.title || '').toLowerCase().includes(searchKeyword)) {
      continue
    }
    if (conversation.pinned) {
      groups[0].items.push(conversation)
      continue
    }
    const createTime = new Date(conversation.createTime || 0).getTime()
    const interval = now - createTime
    if (interval < oneDay) {
      groups[1].items.push(conversation)
    } else if (interval < 7 * oneDay) {
      groups[2].items.push(conversation)
    } else {
      groups[3].items.push(conversation)
    }
  }
  return groups.filter(group => group.items.length > 0)
})
</script>
