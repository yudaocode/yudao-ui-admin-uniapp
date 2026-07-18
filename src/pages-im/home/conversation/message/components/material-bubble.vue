<template>
  <view class="w-460rpx" @click="emit('click', props.material)">
    <template v-if="props.conversationType === ImConversationType.CHANNEL">
      <wd-img
        v-if="props.material.coverUrl"
        :src="props.material.coverUrl"
        custom-class="mb-12rpx bg-[#f2f3f5]"
        width="100%"
        height="220rpx"
        radius="8rpx"
        mode="aspectFill"
      />
      <view class="text-30rpx text-[#333] font-semibold leading-40rpx">
        {{ props.material.title || '频道消息' }}
      </view>
    </template>
    <template v-else>
      <view class="flex items-start gap-16rpx">
        <view class="min-w-0 flex-1">
          <view class="text-30rpx text-[#333] font-semibold leading-40rpx">
            {{ props.material.title || '频道消息' }}
          </view>
          <view v-if="props.material.summary" class="mt-8rpx text-24rpx text-[#999] leading-34rpx">
            {{ props.material.summary }}
          </view>
        </view>
        <wd-img
          v-if="props.material.coverUrl"
          :src="props.material.coverUrl"
          custom-class="shrink-0 bg-[#f2f3f5]"
          width="120rpx"
          height="120rpx"
          radius="8rpx"
          mode="aspectFill"
        />
      </view>
      <view class="mt-12rpx flex items-center gap-10rpx border-t border-t-[#f2f3f5] pt-10rpx text-22rpx text-[#999]">
        <wd-img
          v-if="sourceChannel?.avatar"
          :src="sourceChannel.avatar"
          width="32rpx"
          height="32rpx"
          radius="50%"
          mode="aspectFill"
        />
        <wd-icon v-else name="message" size="28rpx" />
        <text class="min-w-0 flex-1 truncate">{{ sourceChannel?.name || '频道消息' }}</text>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { MaterialMessage } from '@/pages-im/utils/message'
import { computed } from 'vue'
import { ImConversationType } from '@/pages-im/utils/constants'
import { useChannelStore } from '@/pages-im/home/store/channelStore'

const props = defineProps<{
  material: MaterialMessage // 素材消息数据
  conversationType?: number // 当前会话类型
}>()

const emit = defineEmits<{
  click: [payload: MaterialMessage] // 点击素材
}>()

const channelStore = useChannelStore()
const sourceChannel = computed(() => props.material.channelId
  ? channelStore.getChannel(props.material.channelId)
  : undefined) // 素材来源频道
</script>
