<template>
  <ForwardPicker
    v-model="visible"
    :excluded-keys="excludedKeys"
    allow-create-group
    @confirm="handleConfirm"
    @create-group="createGroupAndRecommend"
  >
    <template #footer>
      <view class="border-t border-t-[#f2f3f5] px-24rpx py-16rpx">
        <wd-input v-model="leaveMessage" :maxlength="100" placeholder="给朋友留言" clearable />
      </view>
    </template>
  </ForwardPicker>
</template>

<script lang="ts" setup>
import type { ConversationDO } from '@/pages-im/utils/db'
import type { CardMessage } from '@/pages-im/utils/message'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { generateClientMessageId, serializeMessage } from '@/pages-im/utils/message'
import { ImConversationType, ImMessageType } from '@/pages-im/utils/constants'
import { getClientConversationId } from '@/pages-im/utils/db'
import { useUserStore } from '@/store/user'
import { useConversationStore } from '../../store/conversationStore'
import { sendMessageToConversation } from '../../composables/useMessageSender'
import ForwardPicker from '../../conversation/message/components/forward-picker.vue'

const props = defineProps<{
  modelValue: boolean // 是否显示
  card: CardMessage // 待推荐名片
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const toast = useToast()
const userStore = useUserStore()
const conversationStore = useConversationStore()
const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
const excludedKeys = computed(() => [
  getClientConversationId(props.card.targetType, props.card.targetId),
]) // 名片所属对象的原会话不作为推荐目标
const waitingCreatedGroup = ref(false) // 是否等待新群创建完成
const leaveMessage = ref('') // 推荐留言
let createdGroupToken = '' // 新建群结果关联标识

/** 发送名片到选中会话 */
async function handleConfirm(targets: ConversationDO[]) {
  waitingCreatedGroup.value = false
  createdGroupToken = ''
  const expectedUserId = userStore.userInfo.userId
  const isActive = () => expectedUserId > 0 && userStore.userInfo.userId === expectedUserId
  if (!isActive()) {
    return
  }
  const content = serializeMessage(props.card)
  const leaveText = leaveMessage.value.trim()
  const failedNames: string[] = []
  for (const target of targets) {
    if (!isActive()) {
      return
    }
    try {
      const success = await sendMessageToConversation(
        target,
        ImMessageType.CARD,
        content,
        {},
        expectedUserId,
      )
      if (!success) {
        failedNames.push(target.name || '未命名会话')
        continue
      }
      if (leaveText && !await sendMessageToConversation(
        target,
        ImMessageType.TEXT,
        leaveText,
        {},
        expectedUserId,
      )) {
        failedNames.push(target.name || '未命名会话')
      }
    } catch {
      failedNames.push(target.name || '未命名会话')
    }
  }
  if (!isActive()) {
    return
  }
  await conversationStore.pushRecentForwardConversationKeyList(
    targets.map(item => item.clientConversationId),
    expectedUserId,
  )
  if (!isActive()) {
    return
  }
  if (failedNames.length === 0) {
    toast.success('名片已发送')
  } else if (failedNames.length === targets.length) {
    toast.error(`发送失败：${failedNames.join('、')}`)
  } else {
    toast.warning(`名片已发送，但 ${failedNames.join('、')} 失败`)
  }
}

/** 创建新群后推荐名片 */
function createGroupAndRecommend() {
  leaveMessage.value = ''
  waitingCreatedGroup.value = true
  createdGroupToken = generateClientMessageId()
  uni.navigateTo({
    url: `/pages-im/home/contact/group/form/index?forward=1&forwardToken=${encodeURIComponent(createdGroupToken)}`,
  })
}

/** 向刚创建的群推荐名片 */
function handleGroupCreated(group: { id: number, name?: string, avatar?: string, token?: string }) {
  if (!waitingCreatedGroup.value || !createdGroupToken || group.token !== createdGroupToken) {
    return
  }
  waitingCreatedGroup.value = false
  createdGroupToken = ''
  void handleConfirm([{
    clientConversationId: getClientConversationId(ImConversationType.GROUP, group.id),
    type: ImConversationType.GROUP,
    targetId: group.id,
    name: group.name || '群聊',
    avatar: group.avatar || '',
    unreadCount: 0,
    lastContent: '',
    lastSendTime: 0,
  }])
}

/** 订阅新群创建结果 */
onMounted(() => uni.$on('im:forward-group-created', handleGroupCreated))

/** 每次打开时重置推荐留言 */
watch(visible, (value) => {
  if (value) {
    leaveMessage.value = ''
  }
})

/** 释放新群创建订阅 */
onUnmounted(() => uni.$off('im:forward-group-created', handleGroupCreated))
</script>
