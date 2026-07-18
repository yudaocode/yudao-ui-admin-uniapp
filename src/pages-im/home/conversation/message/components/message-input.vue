<template>
  <view class="shrink-0 border-t border-t-[#ddd] bg-[#f7f7f7] px-12rpx py-16rpx pb-[calc(16rpx+env(safe-area-inset-bottom))]">
    <!-- 禁言 / 退群 / 封禁提示 -->
    <view v-if="disabledTip" class="py-20rpx text-center text-27rpx text-[#999]">
      {{ disabledTip }}
    </view>
    <template v-else>
      <!-- 回复预览 -->
      <ReplyPreview
        v-if="replyTarget"
        :quote="replyTarget"
        :sender-name="replySenderName"
        :recalled="replyRecalled"
        closable
        class="mb-14rpx"
        @close="emit('clear-reply')"
      />
      <!-- 回执消息提示 -->
      <ReplyPreview
        v-if="receiptMode"
        title="已开启消息回执，发送后可查看群成员已读情况"
        closable
        class="mb-14rpx"
        @close="receiptMode = false"
      />
      <!-- 输入栏（微信式：输入框占主，图标在两侧） -->
      <view class="flex items-end gap-12rpx">
        <view
          class="h-75rpx w-48rpx flex shrink-0 items-center justify-center"
          @click="voiceMode = !voiceMode"
        >
          <view class="h-48rpx w-48rpx flex items-center justify-center border-3rpx border-[#333] rounded-full border-solid">
            <view
              class="h-32rpx w-32rpx text-[#333]"
              :class="voiceMode ? 'i-carbon-keyboard' : 'i-carbon-volume-up-filled'"
            />
          </view>
        </view>
        <view
          class="max-h-225rpx min-h-75rpx min-w-0 w-0 flex flex-1 items-center overflow-hidden rounded-8rpx bg-white"
        >
          <!-- 两种输入组件保持常驻，避免模式切换中断录音落盘或上传 -->
          <wd-textarea
            v-show="!voiceMode"
            v-model="inputContent"
            placeholder=""
            :maxlength="1000"
            :focus="inputFocused"
            :cursor="inputCursor"
            auto-height
            compact
            disable-default-padding
            custom-class="!w-full !box-border !px-24rpx !py-18rpx"
            custom-textarea-class="!max-h-189rpx !min-h-39rpx !overflow-y-auto !text-30rpx !leading-39rpx !text-[#181818]"
            @input="handleTextInput"
          />
          <VoiceRecorder v-show="voiceMode" @send="handleSendVoice" />
        </view>
        <view class="h-75rpx w-48rpx flex shrink-0 items-center justify-center" @click="faceVisible = true">
          <view class="i-carbon-face-satisfied h-48rpx w-48rpx text-[#333]" />
        </view>
        <view
          v-if="voiceMode || !inputContent.trim()"
          class="h-75rpx w-48rpx flex shrink-0 items-center justify-center"
          @click="moreVisible = true"
        >
          <view class="i-carbon-add-alt h-48rpx w-48rpx text-[#333]" />
        </view>
        <wd-button v-else class="shrink-0" type="primary" size="small" @click="handleSendText()">
          发送
        </wd-button>
      </view>

      <!-- 更多发送方式 -->
      <wd-popup v-model="moreVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
        <view class="grid grid-cols-4 gap-x-18rpx gap-y-30rpx bg-[#f5f5f5] p-28rpx pb-[calc(32rpx+env(safe-area-inset-bottom))]">
          <view class="im-tool-item" @click="handleSendImage(['album'])">
            <view class="im-tool-icon">
              <wd-icon name="image" size="52rpx" color="#555" />
            </view>
            <text>照片</text>
          </view>
          <view class="im-tool-item" @click="handleSendImage(['camera'])">
            <view class="im-tool-icon">
              <wd-icon name="camera" size="52rpx" color="#555" />
            </view>
            <text>拍摄</text>
          </view>
          <view class="im-tool-item" @click="handleSendVideo">
            <view class="im-tool-icon">
              <wd-icon name="video-camera" size="52rpx" color="#555" />
            </view>
            <text>{{ videoSending ? '发送中' : '视频' }}</text>
          </view>
          <view class="im-tool-item" @click="handleSendFile">
            <view class="im-tool-icon">
              <wd-icon name="folder" size="52rpx" color="#555" />
            </view>
            <text>{{ fileSending ? '发送中' : '文件' }}</text>
          </view>
          <view v-if="isGroup" class="im-tool-item" @click="openMentionPicker">
            <view class="im-tool-icon">
              <wd-icon name="user-add" size="52rpx" color="#555" />
            </view>
            <text>@成员</text>
          </view>
          <view v-if="isGroup && MESSAGE_GROUP_READ_ENABLED" class="im-tool-item" @click="enableReceiptMode">
            <view class="im-tool-icon">
              <wd-icon name="check-circle" size="52rpx" color="#555" />
            </view>
            <text>回执消息</text>
          </view>
        </view>
      </wd-popup>

      <!-- 表情面板 -->
      <FacePicker v-model="faceVisible" @select="handleSelectFace" @select-emoji="handleSelectEmoji" />

      <!-- @ 成员面板 -->
      <MentionPicker
        v-model="mentionVisible"
        :members="mentionMembers"
        :can-mention-all="canMentionAll"
        @select="handleSelectMention"
        @select-all="handleSelectMentionAll"
      />
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { ImFacePackUserItemVO } from '@/api/im/face/pack'
import type { ImFaceUserItemVO } from '@/api/im/face/useritem'
import type { GroupMember } from '../../../types'
import type {
  AudioMessage,
  FaceMessage,
  FileMessage,
  ImageMessage,
  QuoteMessage,
  VideoMessage,
} from '@/pages-im/utils/message'
import type { UploadMessageData } from '../../../composables/useMessageSender'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  DANGEROUS_FILE_EXTENSIONS,
  MESSAGE_GROUP_READ_ENABLED,
  MESSAGE_MEDIA_MAX_BYTES,
} from '@/pages-im/utils/config'
import { getMemberDisplayName } from '@/pages-im/utils/user'
import {
  CommonStatusEnum,
  IM_AT_ALL_NICKNAME,
  IM_AT_ALL_USER_ID,
  ImConversationType,
  ImGroupMemberRole,
  ImMessageType,
} from '@/pages-im/utils/constants'
import { useMediaUploader } from '../../../composables/useMediaUploader'
import { generateClientMessageId } from '@/pages-im/utils/message'
import FacePicker from './face-picker.vue'
import MentionPicker from './mention-picker.vue'
import ReplyPreview from './reply-preview.vue'
import VoiceRecorder from './voice-recorder.vue'

interface SendExtOptions {
  atUserIds?: number[] // 群聊 @ 的用户编号列表
  receipt?: boolean // 是否需要消息回执
  quote?: QuoteMessage // 异步媒体上传前固定的引用消息
  quoteCaptured?: boolean // 是否已经固定并消费引用消息
}

interface SendPayload {
  type: number // 消息类型 ImMessageType
  payload: Record<string, any> // 消息内容对象
  options?: SendExtOptions // 额外选项
}

const props = defineProps<{
  conversationType: number // 会话类型
  targetId: number // 会话目标编号
  groupMembers: GroupMember[] // 群成员
  selfUserId?: number // 当前用户编号
  active: boolean // 当前聊天页是否可见
  replyTarget?: QuoteMessage // 当前回复目标
  replySenderName?: string // 回复目标发送人名称
  replyRecalled?: boolean // 回复目标是否已撤回
  disabledTip?: string // 不可发送提示
}>()

const emit = defineEmits<{
  'send': [data: SendPayload] // 发送消息
  'clear-reply': [] // 清除回复
  'upload-start': [data: UploadMessageData, resolve: (accepted: boolean) => void] // 添加上传占位消息
  'upload-progress': [clientMessageId: string, progress: number] // 更新上传进度
  'upload-complete': [data: UploadMessageData] // 完成上传并发送
  'upload-failed': [clientMessageId: string] // 标记上传失败
}>()

const toast = useToast()
const {
  chooseChatFile,
  validateFileSize,
  uploadLocalFile,
  uploadBlob,
  getLocalImageInfo,
  getLocalVideoInfo,
} = useMediaUploader()
const inputContent = defineModel<string>({ default: '' }) // 输入内容
const mentionUserIds = ref<number[]>([]) // 本次文本 @ 的用户
const faceVisible = ref(false) // 表情面板
const mentionVisible = ref(false) // @ 成员面板
const moreVisible = ref(false) // 更多发送方式
const imageSending = ref(false) // 图片发送中
const fileSending = ref(false) // 文件发送中
const videoSending = ref(false) // 视频发送中
const voiceMode = ref(false) // 是否语音输入模式
const receiptMode = ref(false) // 是否为下一条文本消息开启回执
const inputFocused = ref(false) // 是否聚焦文本输入框
const inputCursor = ref(-1) // 文本输入框光标位置
const mentionTriggerIndex = ref<number>() // 输入框内触发 @ 的位置
let previousInputContent = inputContent.value // 上一次输入内容，用于识别新输入的 @
let disposed = false // 组件是否已卸载

const isGroup = computed(() => props.conversationType === ImConversationType.GROUP) // 是否群聊

/** 可 @ 成员（排除自己与退群成员） */
const mentionMembers = computed(() =>
  props.groupMembers.filter(member =>
    member.userId !== props.selfUserId
    && member.status !== CommonStatusEnum.DISABLE),
)

/** 是否可 @ 所有人（群主/管理员） */
const canMentionAll = computed(() => {
  const member = props.groupMembers.find(member => member.userId === props.selfUserId)
  return member?.role === ImGroupMemberRole.OWNER || member?.role === ImGroupMemberRole.ADMIN
})

/** 发送文本消息 */
function handleSendText() {
  if (!canSend()) {
    return
  }
  const content = inputContent.value.trim()
  if (!content) {
    return
  }
  const atUserIds = isGroup.value ? getValidMentionUserIds(content) : []
  emit('send', {
    type: ImMessageType.TEXT,
    payload: { content },
    options: {
      atUserIds: atUserIds.length > 0 ? atUserIds : undefined,
      receipt: receiptMode.value || undefined,
    },
  })
  inputContent.value = ''
  mentionUserIds.value = []
  receiptMode.value = false
  moreVisible.value = false
}

/** 开启下一条文本消息的回执 */
function enableReceiptMode() {
  receiptMode.value = true
  voiceMode.value = false
  moreVisible.value = false
  void focusTextInput()
}

/** 从更多面板打开 @ 成员搜索 */
function openMentionPicker() {
  mentionTriggerIndex.value = undefined
  moreVisible.value = false
  mentionVisible.value = true
}

/** 选中表情：发送表情消息 */
function handleSelectFace(item: ImFacePackUserItemVO | ImFaceUserItemVO) {
  if (!canSend()) {
    return
  }
  const payload: FaceMessage = { url: item.url, name: item.name, width: item.width, height: item.height }
  emit('send', { type: ImMessageType.FACE, payload })
  faceVisible.value = false
}

/** 插入文本表情 */
function handleSelectEmoji(value: string) {
  if (inputContent.value.length + value.length <= 1000) {
    inputContent.value += value
  }
}

/** 输入 @ 时打开成员面板 */
function handleTextInput(detail: { value?: string, cursor?: number }) {
  if (!isGroup.value) {
    return
  }
  const content = detail.value ?? inputContent.value
  const cursor = detail.cursor ?? content.length
  const triggerIndex = cursor - 1
  const changedRange = getChangedRange(previousInputContent, content)
  const isNewMentionTrigger = triggerIndex >= 0
    && content[triggerIndex] === '@'
    && triggerIndex >= changedRange.start
    && triggerIndex < changedRange.end
  if (!isNewMentionTrigger) {
    return
  }
  mentionTriggerIndex.value = triggerIndex
  inputFocused.value = false
  mentionVisible.value = true
}

/** 插入 @ 文案 */
function insertMentionText(name: string, userId: number) {
  const content = inputContent.value
  const triggerIndex = mentionTriggerIndex.value
  let cursor = content.length
  if (triggerIndex != null && content[triggerIndex] === '@') {
    const prefix = content.slice(0, triggerIndex)
    const suffix = content.slice(triggerIndex + 1)
    const separator = /^\s/.test(suffix) ? '' : ' '
    inputContent.value = `${prefix}@${name}${separator}${suffix}`
    cursor = prefix.length + name.length + 2
  } else {
    const prefix = content && !content.endsWith(' ') ? ' ' : ''
    inputContent.value = `${content}${prefix}@${name} `
    cursor = inputContent.value.length
  }
  mentionUserIds.value = Array.from(new Set([...mentionUserIds.value, userId]))
  mentionTriggerIndex.value = undefined
  mentionVisible.value = false
  void focusTextInput(cursor)
}

/** 选中 @ 成员 */
function handleSelectMention(item: GroupMember) {
  insertMentionText(getMemberDisplayName(item), item.userId)
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
    return member ? content.includes(`@${getMemberDisplayName(member)}`) : true
  })
}

/** 获取两次输入之间新文本的变更区间 */
function getChangedRange(previous: string, current: string) {
  let start = 0
  while (start < previous.length && start < current.length && previous[start] === current[start]) {
    start++
  }
  let previousEnd = previous.length
  let currentEnd = current.length
  while (previousEnd > start && currentEnd > start && previous[previousEnd - 1] === current[currentEnd - 1]) {
    previousEnd--
    currentEnd--
  }
  return { start, end: currentEnd }
}

/** 聚焦文本输入框并一次性设置光标位置 */
async function focusTextInput(cursor = -1) {
  inputFocused.value = false
  inputCursor.value = cursor
  await nextTick()
  inputFocused.value = true
  if (cursor >= 0) {
    await nextTick()
    inputCursor.value = -1
  }
}

/** 记录上一次输入内容 */
watch(inputContent, (value) => {
  previousInputContent = value
})

/** 发送图片消息 */
function handleSendImage(sourceType: Array<'album' | 'camera'> = ['album', 'camera']) {
  if (imageSending.value || !canSend()) {
    return
  }
  const context = getSendContext()
  uni.chooseImage({
    count: 1,
    sourceType,
    success: async (res) => {
      if (!isSendContextActive(context)) {
        return
      }
      const filePath = res.tempFilePaths?.[0]
      if (!filePath) {
        return
      }
      if (!validateFileSize(res.tempFiles?.[0]?.size, MESSAGE_MEDIA_MAX_BYTES)) {
        return
      }
      imageSending.value = true
      let clientMessageId: string | undefined
      try {
        const imageInfo = await getLocalImageInfo(filePath)
        if (!isSendContextActive(context) || !canSend()) {
          return
        }
        const quote = consumeReply()
        clientMessageId = startMediaUpload(ImMessageType.IMAGE, {
          url: filePath,
          width: imageInfo?.width,
          height: imageInfo?.height,
          size: res.tempFiles?.[0]?.size,
        }, quote)
        if (!clientMessageId) {
          return
        }
        const url = await uploadLocalFile(filePath, 'im/message', progress =>
          emit('upload-progress', clientMessageId, progress))
        const payload: ImageMessage = {
          url,
          width: imageInfo?.width,
          height: imageInfo?.height,
          size: res.tempFiles?.[0]?.size,
        }
        emit('upload-complete', {
          clientMessageId,
          type: ImMessageType.IMAGE,
          payload,
          options: { quote, quoteCaptured: true },
        })
        moreVisible.value = false
      } catch {
        if (clientMessageId) {
          emit('upload-failed', clientMessageId)
        }
      } finally {
        imageSending.value = false
      }
    },
  })
}

/** 发送文件消息 */
async function handleSendFile() {
  if (fileSending.value || !canSend()) {
    return
  }
  const context = getSendContext()
  const file = await chooseChatFile()
  if (!isSendContextActive(context) || !file?.path) {
    return
  }
  const extension = file.name?.split('.').pop()?.toLowerCase() || ''
  if (extension && DANGEROUS_FILE_EXTENSIONS.includes(extension)) {
    toast.show(`不允许发送 .${extension} 类型文件`)
    return
  }
  if (!validateFileSize(file.size, MESSAGE_MEDIA_MAX_BYTES)) {
    return
  }
  if (!canSend()) {
    return
  }
  const quote = consumeReply()
  fileSending.value = true
  const clientMessageId = startMediaUpload(ImMessageType.FILE, {
    url: file.path,
    name: file.name || '文件',
    size: file.size,
    type: file.type,
  }, quote)
  if (!clientMessageId) {
    fileSending.value = false
    return
  }
  try {
    const url = await uploadLocalFile(file.path, 'im/file', progress =>
      emit('upload-progress', clientMessageId, progress))
    const payload: FileMessage = { url, name: file.name || '文件', size: file.size, type: file.type }
    emit('upload-complete', {
      clientMessageId,
      type: ImMessageType.FILE,
      payload,
      options: { quote, quoteCaptured: true },
    })
    moreVisible.value = false
  } catch {
    emit('upload-failed', clientMessageId)
  } finally {
    fileSending.value = false
  }
}

/** 发送视频消息 */
function handleSendVideo() {
  if (videoSending.value || !canSend()) {
    return
  }
  const context = getSendContext()
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    compressed: true,
    success: async (res) => {
      if (!isSendContextActive(context) || !res.tempFilePath) {
        return
      }
      if (!validateFileSize(res.size, MESSAGE_MEDIA_MAX_BYTES)) {
        return
      }
      videoSending.value = true
      let clientMessageId: string | undefined
      try {
        const videoInfo = await getLocalVideoInfo(res.tempFilePath)
        const coverPath = String(videoInfo?.thumbTempFilePath || (res as any).thumbTempFilePath || '')
        const width = Number(videoInfo?.width || (res as any).width || 0) || undefined
        const height = Number(videoInfo?.height || (res as any).height || 0) || undefined
        const duration = Math.round(res.duration || Number(videoInfo?.duration) || 0)
        if (!isSendContextActive(context) || !canSend()) {
          return
        }
        const quote = consumeReply()
        clientMessageId = startMediaUpload(ImMessageType.VIDEO, {
          url: res.tempFilePath,
          coverUrl: coverPath || undefined,
          duration,
          width,
          height,
          size: res.size,
        }, quote)
        if (!clientMessageId) {
          return
        }
        const url = await uploadLocalFile(res.tempFilePath, 'im/video', progress =>
          emit('upload-progress', clientMessageId, Math.round(progress * (coverPath ? 0.9 : 1))))
        let coverUrl: string | undefined
        if (coverPath) {
          try {
            coverUrl = await uploadLocalFile(coverPath, 'im/video-cover', progress =>
              emit('upload-progress', clientMessageId, 90 + Math.round(progress * 0.1)))
          } catch (error) {
            console.warn('[IM 消息输入] 视频封面上传失败，继续发送原视频', error)
          }
        }
        const payload: VideoMessage = { url, coverUrl, duration, width, height, size: res.size }
        emit('upload-complete', {
          clientMessageId,
          type: ImMessageType.VIDEO,
          payload,
          options: { quote, quoteCaptured: true },
        })
        moreVisible.value = false
      } catch {
        if (clientMessageId) {
          emit('upload-failed', clientMessageId)
        }
      } finally {
        videoSending.value = false
      }
    },
  })
}

/** 发送录音组件产出的语音 */
function handleSendVoice(payload: AudioMessage) {
  if (!canSend()) {
    return
  }
  emit('send', { type: ImMessageType.VOICE, payload })
  moreVisible.value = false
}

/** 添加媒体上传占位消息 */
function startMediaUpload(
  type: number,
  payload: Record<string, any>,
  quote?: QuoteMessage,
) {
  const clientMessageId = generateClientMessageId()
  let accepted = false
  emit('upload-start', {
    clientMessageId,
    type,
    payload,
    options: { quote, quoteCaptured: true },
  }, value => accepted = value)
  return accepted ? clientMessageId : undefined
}

// #ifdef H5
/** H5 粘贴图片直接发送 */
async function handleH5Paste(event: ClipboardEvent) {
  const context = getSendContext()
  if (!isSendContextActive(context)) {
    return
  }
  const image = Array.from(event.clipboardData?.items || [])
    .find(item => item.kind === 'file' && item.type.startsWith('image/'))
    ?.getAsFile()
  if (!image || imageSending.value || !canSend()) {
    return
  }
  if (!validateFileSize(image.size, MESSAGE_MEDIA_MAX_BYTES)) {
    return
  }
  event.preventDefault()
  const quote = consumeReply()
  imageSending.value = true
  const blobUrl = URL.createObjectURL(image)
  const clientMessageId = startMediaUpload(ImMessageType.IMAGE, {
    url: blobUrl,
    size: image.size,
  }, quote)
  if (!clientMessageId) {
    URL.revokeObjectURL(blobUrl)
    imageSending.value = false
    return
  }
  try {
    const extension = image.type.split('/')[1] || 'png'
    const url = await uploadBlob(image, `paste-${Date.now()}.${extension}`, 'im/message')
    emit('upload-progress', clientMessageId, 100)
    emit('upload-complete', {
      clientMessageId,
      type: ImMessageType.IMAGE,
      payload: { url, size: image.size } satisfies ImageMessage,
      options: { quote, quoteCaptured: true },
    })
  } catch {
    emit('upload-failed', clientMessageId)
  } finally {
    URL.revokeObjectURL(blobUrl)
    imageSending.value = false
  }
}
// #endif

/** 校验当前是否允许发送 */
function canSend() {
  if (!props.disabledTip) {
    return true
  }
  toast.show(props.disabledTip)
  return false
}

/** 固定并消费当前引用消息 */
function consumeReply() {
  const quote = props.replyTarget
  if (quote) {
    emit('clear-reply')
  }
  return quote
}

/** 快照异步上传发起时的账号与会话 */
function getSendContext() {
  return {
    userId: props.selfUserId,
    conversationType: props.conversationType,
    targetId: props.targetId,
  }
}

/** 判断异步上传结果是否仍属于当前账号与会话 */
function isSendContextActive(context: ReturnType<typeof getSendContext>) {
  return !disposed && props.active
    && context.userId === props.selfUserId
    && context.conversationType === props.conversationType
    && context.targetId === props.targetId
}

/** 监听 H5 粘贴图片 */
onMounted(() => {
  // #ifdef H5
  document.addEventListener('paste', handleH5Paste)
  // #endif
})

/** 移除 H5 粘贴图片监听 */
onUnmounted(() => {
  disposed = true
  // #ifdef H5
  document.removeEventListener('paste', handleH5Paste)
  // #endif
})
</script>

<style lang="scss" scoped>
.im-tool-item {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 12rpx;
  color: #777;
  font-size: 23rpx;
}

.im-tool-icon {
  width: 112rpx;
  height: 112rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  background: #fff;
}
</style>
