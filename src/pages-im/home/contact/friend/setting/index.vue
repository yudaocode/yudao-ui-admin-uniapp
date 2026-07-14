<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="设置" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <scroll-view class="min-h-0 flex-1 bg-[#ededed]" scroll-y>
      <!-- 备注 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="编辑备注" :value="friend?.displayName || '未设置'" is-link center @click="editRemark" />
        </wd-cell-group>
      </view>

      <!-- 开关项 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="消息免打扰" center>
            <wd-switch v-model="silent" size="40rpx" @change="onSilentChange" />
          </wd-cell>
          <wd-cell title="置顶聊天" center>
            <wd-switch v-model="pinned" size="40rpx" @change="onPinnedChange" />
          </wd-cell>
        </wd-cell-group>
      </view>

      <!-- 黑名单 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="加入黑名单" center>
            <wd-switch v-model="blocked" size="40rpx" @change="onBlockedChange" />
          </wd-cell>
        </wd-cell-group>
      </view>

      <!-- 本地聊天记录 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="清空聊天记录" is-link center @click="clearHistory" />
        </wd-cell-group>
      </view>

      <!-- 删除好友 -->
      <view class="mt-20rpx bg-white">
        <view class="py-30rpx text-center text-32rpx text-[#fa5151]" @click="handleDelete">
          删除好友
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref, watch } from 'vue'
import { getClientConversationId } from '@/pages-im/utils/db'
import { getFriendDisplayName } from '@/pages-im/utils/user'
import { delay, navigateBackPlus } from '@/utils'
import { ImConversationType } from '@/pages-im/utils/constants'
import { useConversationStore } from '../../../store/conversationStore'
import { useFriendStore } from '../../../store/friendStore'
import { useImRuntimeStore } from '../../../store/runtimeStore'

const props = defineProps<{
  friendUserId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const conversationStore = useConversationStore()
const {
  clearConversationMessages,
  ensureConversation,
  setConversationTop,
} = conversationStore
const friendStore = useFriendStore()
const silent = ref(false) // 消息免打扰
const pinned = ref(false) // 置顶
const blocked = ref(false) // 黑名单

/** 好友编号 */
const friendUserId = computed(() => Number(props.friendUserId))
const clientConversationId = computed(() => getClientConversationId(ImConversationType.PRIVATE, friendUserId.value)) // 私聊会话主键
const friend = computed(() => friendStore.isActiveFriend(friendUserId.value)
  ? friendStore.getFriend(friendUserId.value)
  : undefined) // 当前有效好友资料

/** 获取当前私聊会话 */
function getConversation() {
  return conversationStore.conversations.find(item => item.clientConversationId === clientConversationId.value)
}

/** 加载好友资料 */
async function loadFriend() {
  if (!friendUserId.value) {
    return
  }
  await friendStore.fetchFriendInfo(friendUserId.value)
}

/** 返回 */
function handleBack() {
  navigateBackPlus('/pages-im/home/contact/index')
}

/** 编辑备注 */
async function editRemark() {
  let value: string | number | undefined
  try {
    const result = await dialog.prompt({
      title: '编辑备注',
      inputValue: friend.value?.displayName || '',
      inputProps: { maxlength: 16, placeholder: '请输入备注名' },
    })
    value = result.value
  } catch {
    return
  }
  if (!await friendStore.setFriendDisplayName(friendUserId.value, String(value || '').trim())) {
    return
  }
  toast.success('已保存')
}

/** 切换免打扰 */
async function onSilentChange() {
  try {
    if (!await friendStore.setFriendSilent(friendUserId.value, silent.value)) {
      silent.value = !silent.value
      return
    }
  } catch {
    silent.value = !silent.value
  }
}

/** 切换置顶 */
async function onPinnedChange() {
  try {
    if (!getConversation() && pinned.value && friend.value) {
      await ensureConversation({
        type: ImConversationType.PRIVATE,
        targetId: friendUserId.value,
        name: getFriendDisplayName(friend.value),
        avatar: friend.value.avatar || '',
        silent: friend.value.silent,
      })
    }
    if (!getConversation()) {
      pinned.value = !pinned.value
      return
    }
    await setConversationTop(ImConversationType.PRIVATE, friendUserId.value, pinned.value)
  } catch {
    pinned.value = !pinned.value
  }
}

/** 切换黑名单 */
async function onBlockedChange() {
  try {
    const success = blocked.value
      ? await friendStore.blockFriend(friendUserId.value)
      : await friendStore.unblockFriend(friendUserId.value)
    if (!success) {
      blocked.value = !blocked.value
    }
  } catch {
    blocked.value = !blocked.value
  }
}

/** 清空当前私聊的本地聊天记录 */
async function clearHistory() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定清空本机中的聊天记录吗？该操作不可恢复。' })
  } catch {
    return
  }
  await clearConversationMessages(clientConversationId.value)
  toast.success('聊天记录已清空')
}

/** 删除好友 */
async function handleDelete() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定删除该好友吗？' })
  } catch {
    return
  }
  if (!await friendStore.deleteFriend(friendUserId.value)) {
    return
  }
  toast.success('已删除')
  delay(() => navigateBackPlus('/pages-im/home/contact/index'))
}

/** 同步好友和会话实时状态 */
watch(
  () => [friend.value?.silent, friend.value?.blocked, getConversation()?.top] as const,
  ([nextSilent, nextBlocked, nextPinned]) => {
    silent.value = !!nextSilent
    blocked.value = !!nextBlocked
    pinned.value = !!nextPinned
  },
  { immediate: true },
)

/** 每次显示刷新好友资料 */
onShow(() => {
  void (async () => {
    await useImRuntimeStore().ensure()
    await loadFriend()
  })()
})
</script>
