<template>
  <view class="flex items-center gap-16rpx bg-[#e8f7ec] px-24rpx py-18rpx" @click="emit('join')">
    <wd-icon :name="activeCall.mediaType === ImRtcCallMediaType.VIDEO ? 'camera' : 'phone'" size="34rpx" color="#07c160" />
    <text class="line-clamp-1 min-w-0 flex-1 text-27rpx text-[#16733d]">
      {{ bannerText }}，点击加入
    </text>
    <wd-icon name="arrow-right" size="30rpx" color="#8aa994" />
  </view>
</template>

<script lang="ts" setup>
import type { ImRtcGroupCallRespVO } from '@/api/im/rtc'
import type { GroupMember } from '../../../types'
import { computed, toRef } from 'vue'
import { ImRtcCallMediaType } from '@/pages-im/utils/constants'
import { useGroupCallMembers } from '../../../composables/useGroupCallMembers'

const props = defineProps<{
  activeCall: ImRtcGroupCallRespVO // 当前群活跃通话
  members: GroupMember[] // 当前群成员
}>()

const emit = defineEmits<{
  join: []
}>()

const callMembers = useGroupCallMembers(
  computed(() => props.activeCall.groupId),
  computed(() => props.activeCall.inviterId),
  toRef(props, 'members'),
)
const bannerText = computed(() => { // 群通话媒体类型与参与人数
  const mediaLabel = props.activeCall.mediaType === ImRtcCallMediaType.VIDEO ? '视频' : '语音'
  return callMembers.value.length > 0
    ? `正在${mediaLabel}通话（${callMembers.value.length} 人）`
    : `正在${mediaLabel}通话`
})
</script>
