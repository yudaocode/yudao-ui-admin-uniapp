<template>
  <ForwardPicker
    v-model="visible"
    :excluded-keys="excludedKeys"
    allow-create-group
    @confirm="handleConfirm"
    @create-group="createGroupAndRecommend"
  >
    <template #footer>
      <view class="shrink-0 border-t border-t-[#e5e7eb] bg-white px-24rpx pb-[calc(16rpx+env(safe-area-inset-bottom))] pt-16rpx">
        <view class="flex items-center gap-12rpx rounded-12rpx bg-[#f5f6f7] px-20rpx py-16rpx">
          <wd-icon name="edit" size="30rpx" color="#9ca3af" />
          <wd-input
            v-model="leaveMessage"
            custom-class="min-w-0 flex-1"
            :maxlength="100"
            placeholder="给朋友留言（选填）"
            compact
            clearable
          />
        </view>
      </view>
    </template>
  </ForwardPicker>
</template>

<script lang="ts" setup>
import type { ConversationDO } from '@/pages-im/utils/db'
import type { CardMessage } from '@/pages-im/utils/message'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { serializeMessage } from '@/pages-im/utils/message'
import { ImConversationType, ImMessageType } from '@/pages-im/utils/constants'
import { getClientConversationId } from '@/pages-im/utils/db'
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

/** 发送名片到选中会话 */
async function handleConfirm(targets: ConversationDO[]) {
  waitingCreatedGroup.value = false
  const content = serializeMessage(props.card)
  const leaveText = leaveMessage.value.trim()
  const failedNames: string[] = []
  for (const target of targets) {
    try {
      const success = await sendMessageToConversation(
        target,
        ImMessageType.CARD,
        content,
      )
      if (!success) {
        failedNames.push(target.name || '未命名会话')
        continue
      }
      if (leaveText && !await sendMessageToConversation(
        target,
        ImMessageType.TEXT,
        leaveText,
      )) {
        failedNames.push(target.name || '未命名会话')
      }
    } catch {
      failedNames.push(target.name || '未命名会话')
    }
  }
  await conversationStore.pushRecentForwardConversationKeyList(
    targets.map(item => item.clientConversationId),
  )
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
  uni.navigateTo({
    url: '/pages-im/home/contact/group/form/index',
    events: {
      created: handleGroupCreated,
    },
  })
}

/** 向刚创建的群推荐名片 */
function handleGroupCreated(group: { id: number, name?: string, avatar?: string }) {
  if (!waitingCreatedGroup.value || !group.id) {
    return
  }
  waitingCreatedGroup.value = false
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

/** 每次打开时重置推荐留言 */
watch(visible, (value) => {
  if (value) {
    leaveMessage.value = ''
  }
})
</script>
