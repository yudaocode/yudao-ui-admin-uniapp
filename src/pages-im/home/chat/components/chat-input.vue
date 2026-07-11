<template>
  <view class="shrink-0 border-t border-t-[#eee] bg-white p-16rpx pb-[calc(16rpx+env(safe-area-inset-bottom))]">
    <!-- 回复预览 -->
    <view
      v-if="replyTitle"
      class="mb-14rpx flex items-center gap-12rpx rounded-12rpx bg-[#f7f8fa] px-18rpx py-12rpx"
    >
      <view class="min-w-0 flex-1 text-24rpx text-[#666] leading-34rpx">
        <text selectable>{{ replyTitle }}</text>
      </view>
      <wd-icon name="close" size="28rpx" @click="emit('clear-reply')" />
    </view>
    <!-- 输入栏（微信式：输入框占主，图标在两侧） -->
    <view class="flex items-end gap-16rpx">
      <view class="shrink-0 pb-12rpx" @click="faceVisible = true">
        <wd-icon name="face-smile-fill" size="48rpx" color="#7d7d7d" />
      </view>
      <view class="min-w-0 flex-1 rounded-12rpx bg-[#f7f8fa] px-20rpx py-12rpx">
        <wd-textarea
          v-model="inputContent"
          placeholder="输入消息"
          :maxlength="1000"
          auto-height
          no-border
        />
      </view>
      <view class="shrink-0 pb-12rpx" @click="handleSendImage">
        <wd-icon name="image" size="48rpx" color="#7d7d7d" />
      </view>
      <view v-if="!inputContent.trim()" class="shrink-0 pb-12rpx" @click="moreVisible = true">
        <wd-icon name="plus" size="48rpx" color="#7d7d7d" />
      </view>
      <wd-button v-else class="shrink-0" type="primary" size="small" @click="handleSendText()">
        发送
      </wd-button>
    </view>

    <!-- 更多发送方式 -->
    <wd-popup v-model="moreVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="grid grid-cols-2 gap-20rpx p-24rpx pb-[calc(24rpx+env(safe-area-inset-bottom))]">
        <wd-button v-if="isGroup" block variant="plain" @click="openMention">
          @成员
        </wd-button>
        <wd-button v-if="isGroup" block variant="plain" @click="handleSendText({ receipt: true })">
          回执消息
        </wd-button>
        <wd-button block variant="plain" :loading="fileSending" @click="handleSendFile">
          文件
        </wd-button>
        <wd-button block variant="plain" :loading="videoSending" @click="handleSendVideo">
          视频
        </wd-button>
        <wd-button block variant="plain" :loading="voiceSending" @click="handleVoiceRecord">
          {{ voiceRecording ? '停止录音' : '语音' }}
        </wd-button>
      </view>
    </wd-popup>

    <!-- 表情面板 -->
    <FacePicker v-model="faceVisible" @select="handleSelectFace" />

    <!-- @ 成员面板 -->
    <MentionPicker
      v-model="mentionVisible"
      :members="mentionMembers"
      :can-mention-all="canMentionAll"
      @select="handleSelectMention"
      @select-all="handleSelectMentionAll"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ImFacePackUserItemVO } from '@/api/im/face/pack'
import type { ImFaceUserItemVO } from '@/api/im/face/useritem'
import type { ImGroupMemberRespVO } from '@/api/im/group/member'
import type { ImFaceMessage, ImFileMessage, ImImageMessage, ImMediaMessage } from '@/pages-im/utils/message'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { uploadFile } from '@/api/infra/file'
import {
  IM_AT_ALL_NICKNAME,
  IM_AT_ALL_USER_ID,
  ImConversationType,
  ImGroupMemberRole,
  ImMessageType,
} from '@/utils/constants'
import FacePicker from './face-picker.vue'
import MentionPicker from './mention-picker.vue'

interface SendOptions {
  atUserIds?: number[] // @ 用户编号
  receipt?: boolean // 是否回执消息
}

interface SendPayload {
  type: number // 消息类型 ImMessageType
  payload: Record<string, any> // 消息内容对象
  options?: SendOptions // 额外选项
}

const props = defineProps<{
  conversationType: number // 会话类型
  groupMembers: ImGroupMemberRespVO[] // 群成员
  selfUserId?: number // 当前用户编号
  replyTitle?: string // 回复预览文案（为空表示无回复）
}>()

const emit = defineEmits<{
  'send': [data: SendPayload] // 发送消息
  'clear-reply': [] // 清除回复
}>()

const toast = useToast()
const inputContent = ref('') // 输入内容
const mentionUserIds = ref<number[]>([]) // 本次文本 @ 的用户
const faceVisible = ref(false) // 表情面板
const mentionVisible = ref(false) // @ 成员面板
const moreVisible = ref(false) // 更多发送方式
const imageSending = ref(false) // 图片发送中
const fileSending = ref(false) // 文件发送中
const videoSending = ref(false) // 视频发送中
const voiceSending = ref(false) // 语音发送中
const voiceRecording = ref(false) // 语音录制中
// 录音管理器（仅小程序 / App 支持；H5 不支持，降级为 null）
let recorderManager: UniApp.RecorderManager | null = null
// #ifndef H5
recorderManager = uni.getRecorderManager()
// #endif

const isGroup = computed(() => props.conversationType === ImConversationType.GROUP) // 是否群聊

/** 可 @ 成员（排除自己与退群成员） */
const mentionMembers = computed(() =>
  props.groupMembers.filter(member => member.userId !== props.selfUserId && !member.quitTime),
)

/** 是否可 @ 所有人（群主/管理员） */
const canMentionAll = computed(() => {
  const member = props.groupMembers.find(member => member.userId === props.selfUserId)
  return member?.role === ImGroupMemberRole.OWNER || member?.role === ImGroupMemberRole.ADMIN
})

/** 获取成员名称 */
function getMemberName(item: ImGroupMemberRespVO) {
  return item.displayUserName || item.nickname || `用户 ${item.userId}`
}

/** 发送文本消息 */
function handleSendText(options: SendOptions = {}) {
  const content = inputContent.value.trim()
  if (!content) {
    return
  }
  const atUserIds = isGroup.value ? getValidMentionUserIds(content) : []
  emit('send', {
    type: ImMessageType.TEXT,
    payload: { content },
    options: { atUserIds: atUserIds.length > 0 ? atUserIds : undefined, receipt: options.receipt },
  })
  inputContent.value = ''
  mentionUserIds.value = []
  moreVisible.value = false
}

/** 选中表情：发送表情消息 */
function handleSelectFace(item: ImFacePackUserItemVO | ImFaceUserItemVO) {
  const payload: ImFaceMessage = { url: item.url, name: item.name, width: item.width, height: item.height }
  emit('send', { type: ImMessageType.FACE, payload })
  faceVisible.value = false
}

/** 打开 @ 成员面板 */
function openMention() {
  mentionVisible.value = true
  moreVisible.value = false
}

/** 插入 @ 文案 */
function insertMentionText(name: string, userId: number) {
  const prefix = inputContent.value && !inputContent.value.endsWith(' ') ? ' ' : ''
  inputContent.value = `${inputContent.value}${prefix}@${name} `
  mentionUserIds.value = Array.from(new Set([...mentionUserIds.value, userId]))
  mentionVisible.value = false
}

/** 选中 @ 成员 */
function handleSelectMention(item: ImGroupMemberRespVO) {
  insertMentionText(getMemberName(item), item.userId)
}

/** 选中 @ 所有人 */
function handleSelectMentionAll() {
  insertMentionText(IM_AT_ALL_NICKNAME, IM_AT_ALL_USER_ID)
}

/** 获取有效 @ 用户（文案中仍存在的 @） */
function getValidMentionUserIds(content: string) {
  return mentionUserIds.value.filter((userId) => {
    if (userId === IM_AT_ALL_USER_ID) {
      return content.includes(`@${IM_AT_ALL_NICKNAME}`)
    }
    const member = props.groupMembers.find(member => member.userId === userId)
    return member ? content.includes(`@${getMemberName(member)}`) : true
  })
}

/** 发送图片消息 */
function handleSendImage() {
  if (imageSending.value) {
    return
  }
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const filePath = res.tempFilePaths?.[0]
      if (!filePath) {
        return
      }
      imageSending.value = true
      try {
        const [url, imageInfo] = await Promise.all([uploadFile(filePath, 'im/message'), getLocalImageInfo(filePath)])
        const payload: ImImageMessage = {
          url,
          width: imageInfo?.width,
          height: imageInfo?.height,
          size: res.tempFiles?.[0]?.size,
        }
        emit('send', { type: ImMessageType.IMAGE, payload })
      } finally {
        imageSending.value = false
      }
    },
  })
}

/** 发送文件消息 */
function handleSendFile() {
  if (fileSending.value) {
    return
  }
  const chooseFile = (uni as any).chooseFile
  if (typeof chooseFile !== 'function') {
    toast.show('当前端暂不支持选择文件')
    return
  }
  chooseFile({
    count: 1,
    success: async (res: { tempFiles?: Array<{ name?: string, path?: string, size?: number, type?: string }> }) => {
      const file = res.tempFiles?.[0]
      if (!file?.path) {
        return
      }
      fileSending.value = true
      try {
        const url = await uploadFile(file.path, 'im/file')
        const payload: ImFileMessage = { url, name: file.name || '文件', size: file.size, type: file.type }
        emit('send', { type: ImMessageType.FILE, payload })
        moreVisible.value = false
      } finally {
        fileSending.value = false
      }
    },
  })
}

/** 发送视频消息 */
function handleSendVideo() {
  if (videoSending.value) {
    return
  }
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    compressed: true,
    success: async (res) => {
      if (!res.tempFilePath) {
        return
      }
      videoSending.value = true
      try {
        const url = await uploadFile(res.tempFilePath, 'im/video')
        const payload: ImMediaMessage = { url, duration: Math.round(res.duration || 0), size: res.size }
        emit('send', { type: ImMessageType.VIDEO, payload })
        moreVisible.value = false
      } finally {
        videoSending.value = false
      }
    },
  })
}

/** 录制语音 */
function handleVoiceRecord() {
  if (voiceSending.value) {
    return
  }
  if (!recorderManager) {
    toast.show('当前端暂不支持录音')
    return
  }
  if (voiceRecording.value) {
    recorderManager.stop()
    return
  }
  try {
    recorderManager.start({ duration: 60000, format: 'mp3' })
    voiceRecording.value = true
    toast.show('开始录音')
  } catch {
    toast.error('当前端暂不支持录音')
  }
}

/** 获取本地图片信息 */
function getLocalImageInfo(src: string) {
  return new Promise<UniApp.GetImageInfoSuccessData | null>((resolve) => {
    uni.getImageInfo({ src, success: resolve, fail: () => resolve(null) })
  })
}

/** 录音监听 */
onMounted(() => {
  if (!recorderManager) {
    return
  }
  recorderManager.onStop(async (res) => {
    voiceRecording.value = false
    if (!res.tempFilePath) {
      return
    }
    voiceSending.value = true
    try {
      const url = await uploadFile(res.tempFilePath, 'im/voice')
      const payload: ImMediaMessage = { url, duration: Math.round((res.duration || 0) / 1000), size: res.fileSize }
      emit('send', { type: ImMessageType.VOICE, payload })
      moreVisible.value = false
    } finally {
      voiceSending.value = false
    }
  })
  recorderManager.onError(() => {
    voiceRecording.value = false
    voiceSending.value = false
    toast.error('录音失败')
  })
})

/** 卸载时停止录音 */
onUnmounted(() => {
  if (recorderManager && voiceRecording.value) {
    recorderManager.stop()
  }
})
</script>
