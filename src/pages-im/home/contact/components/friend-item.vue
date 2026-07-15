<template>
  <view class="flex items-center gap-20rpx px-24rpx active:bg-[#f5f5f5]" @click="emit('open', friend)">
    <view class="py-16rpx">
      <ImAvatar :src="friend.avatar" :name="friend.nickname" size="84rpx" :round="false" />
    </view>
    <view class="min-w-0 flex-1 border-b border-b-[#f2f3f5] py-16rpx">
      <view class="line-clamp-1 text-30rpx text-[#222] font-medium">
        {{ friend.displayName || friend.nickname }}
      </view>
      <view class="line-clamp-1 mt-4rpx text-24rpx text-[#999]">
        昵称：{{ friend.nickname || '-' }}
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FriendLite } from '../../types'
import ImAvatar from '../../components/im-avatar.vue'

defineProps<{
  friend: FriendLite // 好友数据
}>()

const emit = defineEmits<{
  open: [friend: FriendLite] // 打开好友资料
}>()
</script>
