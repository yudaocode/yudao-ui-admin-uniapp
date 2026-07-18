<template>
  <view class="w-380rpx overflow-hidden rounded-8rpx bg-white" @click="emit('click')">
    <view class="flex items-center gap-16rpx px-20rpx py-18rpx">
      <ImAvatar :src="card.avatar" :name="card.name" :round="false" size="80rpx" />
      <view class="min-w-0 flex-1">
        <view class="truncate text-30rpx text-[#333]">
          {{ card.name }}
        </view>
        <view v-if="isGroup" class="mt-6rpx text-22rpx text-[#999]">
          {{ card.memberCount ? `${card.memberCount} 人群聊` : '群聊' }}
        </view>
      </view>
    </view>
    <view class="border-t border-t-[#f2f3f5] px-20rpx py-10rpx text-22rpx text-[#999]">
      {{ isGroup ? '群名片' : '个人名片' }}
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { CardMessage } from '@/pages-im/utils/message'
import { computed } from 'vue'
import { ImConversationType } from '@/pages-im/utils/constants'
import ImAvatar from '../im-avatar.vue'

const props = defineProps<{
  card: CardMessage // 名片数据
}>()

const emit = defineEmits<{
  click: [] // 点击名片
}>()

const isGroup = computed(() => props.card.targetType === ImConversationType.GROUP) // 是否群名片
</script>
