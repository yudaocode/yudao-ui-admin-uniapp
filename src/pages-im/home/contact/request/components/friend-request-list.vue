<template>
  <scroll-view class="min-h-0 flex-1" scroll-y>
    <view class="p-24rpx">
      <view
        v-for="item in friendRequests"
        :key="item.id"
        class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="flex items-start gap-20rpx">
          <ImAvatar :src="getRequestAvatar(item)" :name="getPeerName(item)" />
          <view class="min-w-0 flex-1">
            <view class="flex items-center justify-between gap-12rpx">
              <view class="truncate text-30rpx text-[#333] font-semibold">
                {{ getRequestTitle(item) }}
              </view>
              <dict-tag :type="DICT_TYPE.IM_FRIEND_REQUEST_HANDLE_RESULT" :value="item.handleResult" />
            </view>
            <view class="mt-8rpx text-26rpx text-[#666]">
              {{ item.applyContent || '申请添加好友' }}
            </view>
            <view v-if="item.handleContent" class="mt-8rpx text-24rpx text-[#999]">
              拒绝理由：{{ item.handleContent }}
            </view>
            <view v-if="item.addSource != null" class="mt-8rpx flex items-center gap-8rpx text-24rpx text-[#999]">
              <text>来源：</text>
              <dict-tag :type="DICT_TYPE.IM_FRIEND_ADD_SOURCE" :value="item.addSource" />
            </view>
            <view class="mt-8rpx text-24rpx text-[#999]">
              {{ formatDateTime(item.createTime) }}
            </view>
            <view v-if="canHandle(item)" class="mt-20rpx flex gap-16rpx">
              <wd-button
                class="flex-1"
                size="small"
                type="primary"
                :loading="actingId === item.id && actingAction === 'agree'"
                :disabled="actingId != null"
                @click.stop="handleAgree(item)"
              >
                同意
              </wd-button>
              <wd-button
                class="flex-1"
                size="small"
                type="danger"
                variant="plain"
                :loading="actingId === item.id && actingAction === 'refuse'"
                :disabled="actingId != null"
                @click.stop="handleRefuse(item)"
              >
                拒绝
              </wd-button>
            </view>
            <view
              v-else-if="item.handleResult === ImFriendRequestHandleResult.AGREED"
              class="mt-18rpx text-25rpx text-[#576b95]"
              @click="openFriendDetail(item)"
            >
              查看好友资料
            </view>
          </view>
        </view>
      </view>
      <wd-empty v-if="!loading && friendRequests.length === 0" icon="content" tip="暂无好友申请" />
      <view v-if="friendRequests.length > 0" class="pb-24rpx pt-8rpx text-center">
        <wd-button
          v-if="hasMore"
          size="small"
          variant="plain"
          :loading="loadingMore"
          @click="loadMore"
        >
          加载更多
        </wd-button>
        <text v-else class="text-24rpx text-[#aaa]">没有更早的申请了</text>
      </view>
    </view>
  </scroll-view>
</template>

<script lang="ts" setup>
import type { FriendRequest } from '../../../types'
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { DICT_TYPE, ImFriendRequestHandleResult } from '@/pages-im/utils/constants'
import { useUserStore } from '@/store/user'
import { formatDateTime } from '@/utils/date'
import { useFriendStore } from '../../../store/friendStore'
import ImAvatar from '../../../components/im-avatar.vue'

const userStore = useUserStore()
const friendStore = useFriendStore()
const dialog = useDialog()
const toast = useToast()
const actingId = ref<number>() // 当前处理的申请编号
const actingAction = ref<'agree' | 'refuse'>() // 当前申请操作
const {
  friendRequests,
  hasMoreFriendRequests: hasMore,
  requestLoading: loading,
  requestLoadingMore: loadingMore,
} = storeToRefs(friendStore)

/** 好友申请是否可处理 */
function canHandle(item: FriendRequest) {
  return item.handleResult === ImFriendRequestHandleResult.UNHANDLED
    && item.toUserId === userStore.userInfo.userId
}

/** 获取好友申请头像 */
function getRequestAvatar(item: FriendRequest) {
  return item.fromUserId === userStore.userInfo.userId ? item.toAvatar : item.fromAvatar
}

/** 获取好友申请对端真实昵称 */
function getPeerName(item: FriendRequest) {
  return item.fromUserId === userStore.userInfo.userId
    ? item.toNickname || String(item.toUserId)
    : item.fromNickname || String(item.fromUserId)
}

/** 获取好友申请标题 */
function getRequestTitle(item: FriendRequest) {
  return item.fromUserId === userStore.userInfo.userId
    ? `我申请添加 ${getPeerName(item)}`
    : `${getPeerName(item)} 申请添加我`
}

/** 打开申请对端的好友资料 */
function openFriendDetail(item: FriendRequest) {
  const peerUserId = item.fromUserId === userStore.userInfo.userId ? item.toUserId : item.fromUserId
  uni.navigateTo({ url: `/pages-im/home/contact/friend/detail/index?friendUserId=${peerUserId}` })
}

/** 同意好友申请 */
async function handleAgree(item: FriendRequest) {
  if (actingId.value != null || !canHandle(item)) {
    return
  }
  actingId.value = item.id
  actingAction.value = 'agree'
  try {
    if (await friendStore.agreeFriendRequest(item.id)) {
      toast.success('已同意')
    }
  } finally {
    actingId.value = undefined
    actingAction.value = undefined
  }
}

/** 拒绝好友申请 */
async function handleRefuse(item: FriendRequest) {
  if (actingId.value != null || !canHandle(item)) {
    return
  }
  let handleContent: string | undefined
  try {
    const result = await dialog.prompt({
      title: '拒绝好友申请',
      msg: '可填写拒绝理由（选填）',
      inputProps: { maxlength: 255, placeholder: '不填则不告知对方原因' },
    })
    handleContent = String(result.value || '').trim() || undefined
  } catch {
    return
  }
  if (actingId.value != null || !canHandle(item)) {
    return
  }
  actingId.value = item.id
  actingAction.value = 'refuse'
  try {
    if (await friendStore.refuseFriendRequest(item.id, handleContent)) {
      toast.success('已拒绝')
    }
  } finally {
    actingId.value = undefined
    actingAction.value = undefined
  }
}

/** 加载好友申请 */
function load() {
  return friendStore.fetchFriendRequestList()
}

/** 加载更早的好友申请 */
function loadMore() {
  if (loadingMore.value || !hasMore.value) {
    return
  }
  return friendStore.loadMoreFriendRequestList()
}

defineExpose({ load })
</script>
