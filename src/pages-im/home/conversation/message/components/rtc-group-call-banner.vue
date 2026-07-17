<template>
  <view v-if="activeCall" class="flex items-center gap-16rpx bg-[#e8f7ec] px-24rpx py-18rpx" @click="handleJoin">
    <wd-icon :name="activeCall.mediaType === ImRtcCallMediaType.VIDEO ? 'camera' : 'phone'" size="34rpx" color="#07c160" />
    <text class="line-clamp-1 min-w-0 flex-1 text-27rpx text-[#16733d]">
      {{ bannerText }}，点击加入
    </text>
    <wd-icon name="arrow-right" size="30rpx" color="#8aa994" />
  </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { ImRtcCallMediaType } from '@/pages-im/utils/constants'
import { useGroupCallMembers } from '../../../composables/useGroupCallMembers'
import { useImRtc } from '../../../composables/useImRtc'
import { useGroupStore } from '../../../store/groupStore'
import { useRtcStore } from '../../../store/rtcStore'

const props = defineProps<{
  groupId: number // 群编号
}>()

const groupStore = useGroupStore()
const rtcStore = useRtcStore()
const { join } = useImRtc()
const activeCall = computed(() => rtcStore.getGroupCall(props.groupId)) // 当前群活跃通话
const members = computed(() => groupStore.getGroup(props.groupId)?.members || []) // 当前群成员
const callMembers = useGroupCallMembers(
  computed(() => props.groupId),
  computed(() => activeCall.value?.inviterId || 0),
  members,
)
const bannerText = computed(() => { // 群通话媒体类型与参与人数
  const mediaLabel = activeCall.value?.mediaType === ImRtcCallMediaType.VIDEO ? '视频' : '语音'
  return callMembers.value.length > 0
    ? `正在${mediaLabel}通话（${callMembers.value.length} 人）`
    : `正在${mediaLabel}通话`
})

/** 加入当前群通话 */
async function handleJoin() {
  if (activeCall.value) {
    await join(activeCall.value.room)
  }
}
</script>
