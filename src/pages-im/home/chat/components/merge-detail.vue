<template>
  <wd-popup v-model="visible" position="bottom" custom-style="height: 80vh; border-radius: 24rpx 24rpx 0 0;">
    <view class="h-full flex flex-col bg-white">
      <view class="flex items-center justify-between border-b border-b-[#f2f3f5] px-24rpx py-20rpx">
        <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
          {{ payload?.title || '聊天记录' }}
        </view>
        <wd-button size="small" variant="plain" @click="visible = false">
          关闭
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <view class="p-24rpx">
          <view v-for="(item, index) in messages" :key="index" class="mb-28rpx">
            <view class="mb-8rpx text-24rpx text-[#999]">
              {{ item.senderNickname || '' }}
            </view>
            <view class="inline-block rounded-12rpx bg-[#f7f8fa] px-22rpx py-16rpx text-28rpx text-[#333] leading-42rpx">
              <MessageContent :type="item.type" :content="item.content" />
            </view>
          </view>
          <wd-empty v-if="messages.length === 0" icon="content" tip="暂无内容" />
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import type { ImMergeMessage } from '@/pages-im/utils/message'
import { computed } from 'vue'
import MessageContent from '@/pages-im/components/message-content.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false }, // 是否显示
  payload: { type: Object as PropType<ImMergeMessage>, default: undefined }, // 合并转发内容
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

/** 合并的消息列表 */
const messages = computed(() => props.payload?.messages || [])
</script>
