<template>
  <scroll-view v-if="members.length" scroll-x class="mt-30rpx max-w-full whitespace-nowrap">
    <view class="inline-flex gap-22rpx px-16rpx">
      <view v-for="item in members" :key="item.userId" class="w-104rpx flex flex-col items-center">
        <view class="relative">
          <ImAvatar :src="item.avatar" :name="item.nickname" size="76rpx" />
          <view
            class="absolute bottom-0 right-0 h-18rpx w-18rpx border-3rpx border-[#263239] rounded-full"
            :class="item.pending ? 'bg-[#f0ad4e]' : 'bg-[#07c160]'"
          />
        </view>
        <text class="mt-8rpx w-full truncate text-center text-21rpx text-white/80">
          {{ item.nickname }}
        </text>
      </view>
    </view>
  </scroll-view>
</template>

<script lang="ts" setup>
import type { GroupCallMember } from '../../../../composables/useGroupCallMembers'
import ImAvatar from '../../../../components/im-avatar.vue'

defineProps<{
  members: GroupCallMember[] // 通话参与成员
}>()
</script>
