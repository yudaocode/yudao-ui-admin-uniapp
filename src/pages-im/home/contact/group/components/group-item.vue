<template>
  <view class="flex items-center gap-20rpx px-24rpx active:bg-[#f5f5f5]" @click="emit('open', group)">
    <view class="py-16rpx">
      <ImAvatar :src="group.avatar" :name="groupName" :round="false" size="84rpx" />
    </view>
    <view class="min-w-0 flex-1 border-b border-b-[#f2f3f5] py-16rpx">
      <view class="flex items-center gap-10rpx">
        <text class="line-clamp-1 text-30rpx text-[#222] font-medium">{{ groupName }}</text>
        <wd-tag v-if="group.banned" type="danger" plain custom-class="scale-90">
          已封禁
        </wd-tag>
        <wd-tag v-if="group.mutedAll" type="warning" plain custom-class="scale-90">
          全员禁言
        </wd-tag>
      </view>
      <view class="line-clamp-1 mt-4rpx text-24rpx text-[#999]">
        {{ group.notice || '暂无群公告' }}
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Group } from '../../../types'
import { computed } from 'vue'
import { getGroupDisplayName } from '@/pages-im/utils/user'
import ImAvatar from '../../../components/im-avatar.vue'

const props = defineProps<{
  group: Group // 群聊数据
}>()

const emit = defineEmits<{
  open: [group: Group] // 打开群聊
}>()

const groupName = computed(() => getGroupDisplayName(props.group)) // 群聊展示名称
</script>
