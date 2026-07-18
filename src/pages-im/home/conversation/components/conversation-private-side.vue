<template>
  <scroll-view class="h-full bg-[#ededed]" scroll-y>
    <!-- 会话设置 -->
    <view class="mt-20rpx">
      <wd-cell-group border>
        <wd-cell title="编辑备注" :value="friend?.displayName || '未设置'" is-link center @click="editRemark" />
        <wd-cell title="消息免打扰" center>
          <wd-switch v-model="silent" size="40rpx" @change="onSilentChange" />
        </wd-cell>
        <wd-cell title="置顶聊天" center>
          <wd-switch v-model="pinned" size="40rpx" :disabled="pinPending" @change="onPinnedChange" />
        </wd-cell>
      </wd-cell-group>
    </view>
    <!-- 会话操作 -->
    <view class="mt-20rpx">
      <wd-cell-group border>
        <wd-cell title="查找聊天内容" is-link center @click="emit('history', friendUserId, displayName)" />
        <wd-cell title="创建群聊" is-link center @click="emit('create-group', friendUserId)" />
        <wd-cell title="清空聊天记录" is-link center @click="clearHistory" />
      </wd-cell-group>
    </view>
  </scroll-view>
</template>

<script lang="ts" setup>
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { getClientConversationId } from '@/pages-im/utils/db'
import { getFriendDisplayName } from '@/pages-im/utils/user'
import { ImConversationType } from '@/pages-im/utils/constants'
import { useUserStore } from '@/store/user'
import { useConversationStore } from '../../store/conversationStore'
import { useFriendStore } from '../../store/friendStore'
import { useImRuntimeStore } from '../../store/runtimeStore'

const props = defineProps<{
  friendUserId?: number | string
  active?: boolean
}>()

const emit = defineEmits<{
  'history': [friendUserId: number, displayName: string] // 查找聊天内容
  'create-group': [friendUserId: number] // 与好友创建群聊
}>()

const toast = useToast()
const dialog = useDialog()
const userStore = useUserStore()
const conversationStore = useConversationStore()
const { clearConversationMessages, ensureConversation, setConversationTop } = conversationStore
const friendStore = useFriendStore()
const silent = ref(false) // 消息免打扰
const pinned = ref(false) // 是否置顶
const pinPending = ref(false) // 置顶状态提交中
let pinEpoch = 0 // 置顶操作轮次
const friendUserId = computed(() => Number(props.friendUserId)) // 好友编号
const friend = computed(() => friendStore.isActiveFriend(friendUserId.value)
  ? friendStore.getFriend(friendUserId.value)
  : undefined) // 当前有效好友资料
const displayName = computed(() => friend.value ? getFriendDisplayName(friend.value) : `用户 ${friendUserId.value}`) // 好友展示名

/** 获取当前私聊会话 */
function getConversation(targetId = friendUserId.value) {
  return conversationStore.conversations.find(item =>
    item.clientConversationId === getClientConversationId(ImConversationType.PRIVATE, targetId))
}

/** 判断账号与目标仍属于当前组件上下文 */
function isContextActive(accountId: number, targetId: number) {
  return userStore.userInfo.userId === accountId && friendUserId.value === targetId
}

/** 编辑好友备注 */
async function editRemark() {
  const accountId = userStore.userInfo.userId
  const targetId = friendUserId.value
  const currentFriend = friend.value
  if (!accountId || !targetId || !currentFriend) {
    return
  }
  let value: string | number | undefined
  try {
    const result = await dialog.prompt({
      title: '编辑备注',
      inputValue: currentFriend.displayName || '',
      inputProps: { maxlength: 16, placeholder: '请输入备注名' },
    })
    value = result.value
  } catch {
    return
  }
  if (!isContextActive(accountId, targetId)) {
    return
  }
  if (await friendStore.setFriendDisplayName(targetId, String(value || '').trim())
    && isContextActive(accountId, targetId)) {
    toast.success('已保存')
  }
}

/** 切换免打扰 */
async function onSilentChange() {
  const accountId = userStore.userInfo.userId
  const targetId = friendUserId.value
  const nextSilent = silent.value
  try {
    const success = await friendStore.setFriendSilent(targetId, nextSilent)
    if (isContextActive(accountId, targetId) && !success) {
      silent.value = !nextSilent
    }
  } catch {
    if (isContextActive(accountId, targetId)) {
      silent.value = !nextSilent
    }
  }
}

/** 切换置顶 */
async function onPinnedChange() {
  const nextPinned = pinned.value
  const operationUserId = userStore.userInfo.userId
  const targetId = friendUserId.value
  const operationEpoch = ++pinEpoch
  const currentFriend = friend.value
  pinPending.value = true
  try {
    if (!getConversation(targetId) && nextPinned && currentFriend) {
      await ensureConversation({
        type: ImConversationType.PRIVATE,
        targetId,
        name: getFriendDisplayName(currentFriend),
        avatar: currentFriend.avatar || '',
        silent: currentFriend.silent,
      })
    }
    if (!isContextActive(operationUserId, targetId)
      || operationEpoch !== pinEpoch
      || !getConversation(targetId)) {
      pinned.value = false
      return
    }
    await setConversationTop(ImConversationType.PRIVATE, targetId, nextPinned)
    if (isContextActive(operationUserId, targetId) && operationEpoch === pinEpoch) {
      pinned.value = nextPinned
    }
  } catch {
    if (isContextActive(operationUserId, targetId) && operationEpoch === pinEpoch) {
      pinned.value = !!getConversation(targetId)?.top
    }
  } finally {
    if (operationEpoch === pinEpoch) {
      pinPending.value = false
    }
  }
}

/** 清空当前私聊的本地聊天记录 */
async function clearHistory() {
  const accountId = userStore.userInfo.userId
  const targetId = friendUserId.value
  try {
    await dialog.confirm({ title: '提示', msg: '确定清空本机中的聊天记录吗？该操作不可恢复。' })
  } catch {
    return
  }
  if (!isContextActive(accountId, targetId)) {
    return
  }
  await clearConversationMessages(getClientConversationId(ImConversationType.PRIVATE, targetId))
  if (isContextActive(accountId, targetId)) {
    toast.success('聊天记录已清空')
  }
}

watch(
  () => [friend.value?.silent, getConversation()?.top] as const,
  ([nextSilent, nextPinned]) => {
    silent.value = !!nextSilent
    if (!pinPending.value) {
      pinned.value = !!nextPinned
    }
  },
  { immediate: true },
)

/** 激活时刷新好友与会话状态 */
watch(() => props.active, (active) => {
  if (active === false || !friendUserId.value) {
    return
  }
  const userId = userStore.userInfo.userId
  const targetId = friendUserId.value
  void (async () => {
    await useImRuntimeStore().ensure()
    await friendStore.fetchFriendInfo(targetId)
    if (!isContextActive(userId, targetId)) {
      return
    }
    silent.value = !!friend.value?.silent
    pinned.value = !!getConversation()?.top
  })()
}, { immediate: true })
</script>
