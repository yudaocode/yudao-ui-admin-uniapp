<template>
  <view class="relative z-2 pb-[calc(72rpx+env(safe-area-inset-bottom))]">
    <view class="mb-56rpx flex flex-wrap justify-center gap-x-40rpx gap-y-28rpx px-32rpx">
      <view class="flex flex-col items-center gap-14rpx" @click="emit('toggle-mic')">
        <view class="rtc-call-tool" :class="micEnabled ? 'bg-white/20' : 'bg-white text-[#222]'">
          <wd-icon name="mic" size="44rpx" :color="micEnabled ? '#fff' : '#222'" />
        </view>
        <text class="text-24rpx text-white">{{ micEnabled ? '静音' : '取消静音' }}</text>
      </view>
      <view v-if="isVideo" class="flex flex-col items-center gap-14rpx" @click="emit('toggle-camera')">
        <view class="rtc-call-tool" :class="cameraEnabled ? 'bg-white/20' : 'bg-white text-[#222]'">
          <wd-icon name="camera" size="44rpx" :color="cameraEnabled ? '#fff' : '#222'" />
        </view>
        <text class="text-24rpx text-white">{{ cameraEnabled ? '关闭摄像头' : '打开摄像头' }}</text>
      </view>
      <view class="flex flex-col items-center gap-14rpx" @click="emit('toggle-speaker')">
        <view class="rtc-call-tool" :class="speakerEnabled ? 'bg-white/20' : 'bg-white text-[#222]'">
          <wd-icon name="sound-fill" size="44rpx" :color="speakerEnabled ? '#fff' : '#222'" />
        </view>
        <text class="text-24rpx text-white">扬声器</text>
      </view>
      <view
        v-if="isGroup && stage === ImRtcCallStage.RUNNING"
        class="flex flex-col items-center gap-14rpx"
        @click="openInvitePicker"
      >
        <view class="rtc-call-tool bg-white/20">
          <wd-icon name="add" size="44rpx" color="#fff" />
        </view>
        <text class="text-24rpx text-white">邀请成员</text>
      </view>
      <!-- #ifdef H5 -->
      <view
        v-if="stage === ImRtcCallStage.RUNNING"
        class="flex flex-col items-center gap-14rpx"
        @click="emit('toggle-screen-share')"
      >
        <view class="rtc-call-tool" :class="screenShareEnabled ? 'bg-white text-[#222]' : 'bg-white/20'">
          <wd-icon name="computer" size="44rpx" :color="screenShareEnabled ? '#222' : '#fff'" />
        </view>
        <text class="text-24rpx text-white">{{ screenShareEnabled ? '停止共享' : '共享屏幕' }}</text>
      </view>
      <!-- #endif -->
    </view>
    <view class="flex flex-col items-center gap-18rpx" @click="emit('hangup')">
      <view class="rtc-call-action bg-[#fa5151]">
        <wd-icon name="close" size="52rpx" color="#fff" />
      </view>
      <text class="text-26rpx text-white">{{ stage === ImRtcCallStage.INVITING ? '取消' : '挂断' }}</text>
    </view>
  </view>

  <GroupMemberPicker
    ref="invitePickerRef"
    v-model="inviteUserIds"
    title="邀请群成员"
    :members="inviteCandidates"
    @confirm="handleInviteConfirm"
  />
</template>

<script lang="ts" setup>
import type { GroupMember } from '../../../../types'
import type { ImRtcCallStageValue } from '@/pages-im/utils/constants'
import { ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ImRtcCallStage } from '@/pages-im/utils/constants'
import GroupMemberPicker from '../../../../contact/group/components/group-member-picker.vue'

const props = defineProps<{
  stage: ImRtcCallStageValue // 通话阶段
  isGroup: boolean // 是否群通话
  isVideo: boolean // 是否视频通话
  micEnabled: boolean // 麦克风是否开启
  cameraEnabled: boolean // 摄像头是否开启
  speakerEnabled: boolean // 扬声器是否开启
  screenShareEnabled: boolean // 是否共享屏幕
  inviteCandidates: Array<GroupMember & { displayUserName: string }> // 可邀请成员
}>()

const emit = defineEmits<{
  'hangup': [] // 结束通话
  'invite': [userIds: number[]] // 邀请群成员
  'toggle-mic': [] // 切换麦克风
  'toggle-camera': [] // 切换摄像头
  'toggle-speaker': [] // 切换扬声器
  'toggle-screen-share': [] // 切换屏幕共享
}>()

const toast = useToast()
const invitePickerRef = ref<InstanceType<typeof GroupMemberPicker>>() // 邀请成员选择器
const inviteUserIds = ref<number[]>([]) // 当前追加邀请成员编号

/** 打开追加邀请选择器 */
function openInvitePicker() {
  if (props.inviteCandidates.length === 0) {
    toast.show('暂无可邀请成员')
    return
  }
  inviteUserIds.value = []
  invitePickerRef.value?.open([])
}

/** 确认追加邀请 */
function handleInviteConfirm(userIds: number[]) {
  if (userIds.length === 0) {
    toast.show('请选择成员')
    return
  }
  emit('invite', userIds)
}
</script>

<style scoped>
.rtc-call-action {
  width: 124rpx;
  height: 124rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.rtc-call-tool {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
</style>
