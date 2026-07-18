<template>
  <view v-if="user" class="min-h-full bg-[#ededed]">
    <!-- 用户资料 -->
    <view class="flex items-center gap-28rpx bg-white px-32rpx py-44rpx">
      <ImAvatar :src="user.avatar" :name="user.nickname" :round="false" size="128rpx" />
      <view class="min-w-0 flex-1">
        <view class="flex items-center gap-12rpx">
          <text class="line-clamp-1 min-w-0 text-40rpx text-[#1f1f1f] font-medium">{{ resolvedDisplayName }}</text>
          <dict-tag v-if="user.sex != null" :type="DICT_TYPE.SYSTEM_USER_SEX" :value="user.sex" />
        </view>
        <view class="mt-12rpx text-26rpx text-[#999]">
          账号：{{ user.id ?? '-' }}
        </view>
        <view v-if="friend?.displayName" class="mt-6rpx text-26rpx text-[#999]">
          昵称：{{ user.nickname || '-' }}
        </view>
        <view class="mt-6rpx text-26rpx text-[#999]">
          部门：{{ user.deptName || '-' }}
        </view>
      </view>
    </view>

    <!-- 好友资料与关系操作 -->
    <view v-if="relation === 'friend'" class="mt-20rpx">
      <wd-cell-group border>
        <wd-cell title="备注" :value="friend?.displayName || '未设置'" is-link center @click="editRemark" />
        <wd-cell v-if="friend?.addSource != null" title="来源" center>
          <dict-tag :type="DICT_TYPE.IM_FRIEND_ADD_SOURCE" :value="friend.addSource" />
        </wd-cell>
        <wd-cell v-if="friend?.addTime" title="添加时间" :value="formatDate(friend.addTime, 'YYYY-MM-DD')" center />
        <wd-cell title="把他推荐给朋友" is-link center @click="recommendVisible = true" />
        <wd-cell title="加入黑名单" center>
          <wd-switch v-model="blocked" size="40rpx" @change="onBlockedChange" />
        </wd-cell>
      </wd-cell-group>
    </view>

    <!-- 主操作 -->
    <view v-if="relation !== 'self'" class="mt-20rpx bg-white">
      <view v-if="relation === 'friend'" class="flex items-center justify-center gap-12rpx py-30rpx text-32rpx text-[#576b95]" @click="emit('chat', user)">
        <wd-icon name="message" size="40rpx" />
        发消息
      </view>
      <view v-else class="flex items-center justify-center gap-12rpx py-30rpx text-32rpx text-[#576b95]" @click="emitAddFriend">
        <wd-icon name="plus" size="40rpx" />
        添加朋友
      </view>
    </view>

    <!-- 删除好友 -->
    <view v-if="relation === 'friend'" class="mt-20rpx bg-white">
      <view class="py-30rpx text-center text-32rpx text-[#fa5151]" @click="handleDelete">
        删除好友
      </view>
    </view>

    <RecommendCardPicker v-if="friendCard" v-model="recommendVisible" :card="friendCard" />
  </view>
</template>

<script lang="ts" setup>
import type { User } from '@/api/system/user'
import type { Friend } from '../../types'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { ImFriendAddSource } from '@/pages-im/utils/constants'
import { toUserCardTarget } from '@/pages-im/utils/message'
import { getFriendDisplayName } from '@/pages-im/utils/user'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { useUserStore } from '@/store/user'
import { useFriendStore } from '../../store/friendStore'
import ImAvatar from '../im-avatar.vue'
import RecommendCardPicker from './recommend-card-picker.vue'

export type UserInfoRelation = 'friend' | 'stranger' | 'self'

const props = defineProps<{
  user: User | null
  relation: UserInfoRelation
  displayName?: string
  addSource?: number
  addSourceExtra?: string
}>()

const emit = defineEmits<{
  'saved': [value: string] // 好友备注已保存
  'chat': [user: User] // 发消息
  'deleted': [user: User] // 好友已删除
  'add-friend': [user: User, source: number, sourceExtra?: string] // 添加好友
}>()

const toast = useToast()
const dialog = useDialog()
const friendStore = useFriendStore()
const userStore = useUserStore()
const recommendVisible = ref(false) // 推荐名片弹窗
const blocked = ref(false) // 是否加入黑名单
const friend = computed<Friend | undefined>(() => props.user?.id
  ? friendStore.getFriend(props.user.id)
  : undefined) // 当前好友关系
const resolvedDisplayName = computed(() => props.displayName
  || (friend.value ? getFriendDisplayName(friend.value) : props.user?.nickname)
  || '') // 用户展示名称
const friendCard = computed(() => props.user?.id
  ? toUserCardTarget({
      id: props.user.id,
      nickname: props.user.nickname,
      avatar: props.user.avatar,
    })
  : undefined) // 个人名片

/** 判断账号与目标仍属于当前资料上下文 */
function isContextActive(accountId: number, targetId: number) {
  return userStore.userInfo.userId === accountId && props.user?.id === targetId
}

/** 编辑好友备注 */
async function editRemark() {
  const accountId = userStore.userInfo.userId
  const targetId = props.user?.id
  const inputValue = friend.value?.displayName || ''
  if (!accountId || !targetId) {
    return
  }
  let value: string | number | undefined
  try {
    const result = await dialog.prompt({
      title: '编辑备注',
      inputValue,
      inputProps: { maxlength: 16, placeholder: '请输入备注名' },
    })
    value = result.value
  } catch {
    return
  }
  if (!isContextActive(accountId, targetId)) {
    return
  }
  const displayName = String(value || '').trim()
  if (await friendStore.setFriendDisplayName(targetId, displayName)
    && isContextActive(accountId, targetId)) {
    toast.success('已保存')
    emit('saved', displayName)
  }
}

/** 切换黑名单 */
async function onBlockedChange() {
  const accountId = userStore.userInfo.userId
  const targetId = props.user?.id
  const nextBlocked = blocked.value
  if (!accountId || !targetId) {
    return
  }
  try {
    const success = nextBlocked
      ? await friendStore.blockFriend(targetId)
      : await friendStore.unblockFriend(targetId)
    if (isContextActive(accountId, targetId) && !success) {
      blocked.value = !nextBlocked
    }
  } catch {
    if (isContextActive(accountId, targetId)) {
      blocked.value = !nextBlocked
    }
  }
}

/** 删除好友 */
async function handleDelete() {
  const accountId = userStore.userInfo.userId
  const target = props.user
  const targetId = target?.id
  if (!accountId || !targetId || !target) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定删除该好友吗？' })
  } catch {
    return
  }
  if (!isContextActive(accountId, targetId)) {
    return
  }
  if (await friendStore.deleteFriend(targetId) && isContextActive(accountId, targetId)) {
    toast.success('已删除')
    emit('deleted', target)
  }
}

/** 添加好友 */
function emitAddFriend() {
  if (props.user) {
    emit('add-friend', props.user, props.addSource ?? ImFriendAddSource.SEARCH, props.addSourceExtra)
  }
}

watch(() => friend.value?.blocked, value => blocked.value = !!value, { immediate: true })
</script>
