<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="singleGroupId ? '进群申请' : 'IM 申请'"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 申请类型 -->
    <wd-tabs v-if="!singleGroupId" v-model="activeTab" line-theme="text" @change="loadData">
      <wd-tab title="好友申请" :name="0" />
      <wd-tab title="加群申请" :name="1" />
    </wd-tabs>

    <!-- 好友申请 -->
    <scroll-view v-if="activeTab === 0" class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view
          v-for="item in friendRequests"
          :key="item.id"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="flex items-start gap-20rpx">
            <ImAvatar :src="getFriendRequestAvatar(item)" :name="getFriendRequestPeerName(item)" />
            <view class="min-w-0 flex-1">
              <view class="flex items-center justify-between gap-12rpx">
                <view class="truncate text-30rpx text-[#333] font-semibold">
                  {{ getFriendRequestTitle(item) }}
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
              <view v-if="canHandleFriendRequest(item)" class="mt-20rpx flex gap-16rpx">
                <wd-button
                  class="flex-1"
                  size="small"
                  type="primary"
                  :loading="actingId === item.id && actingAction === 'agree'"
                  :disabled="actingId != null"
                  @click.stop="handleAgreeFriend(item)"
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
                  @click.stop="handleRefuseFriend(item)"
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
            v-if="friendRequestHasMore"
            size="small"
            variant="plain"
            :loading="friendRequestLoadingMore"
            @click="loadMoreFriendRequests"
          >
            加载更多
          </wd-button>
          <text v-else class="text-24rpx text-[#aaa]">没有更早的申请了</text>
        </view>
      </view>
    </scroll-view>

    <!-- 加群申请 -->
    <scroll-view v-else class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view
          v-for="item in groupRequests"
          :key="item.id"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="flex items-start gap-20rpx">
            <ImAvatar :src="item.userAvatar" :name="item.userNickname || String(item.userId)" />
            <view class="min-w-0 flex-1">
              <view class="flex items-center justify-between gap-12rpx">
                <view class="truncate text-30rpx text-[#333] font-semibold">
                  {{ item.userNickname || `用户 ${item.userId}` }}
                </view>
                <dict-tag :type="DICT_TYPE.IM_GROUP_REQUEST_HANDLE_RESULT" :value="item.handleResult" />
              </view>
              <view class="mt-8rpx text-26rpx text-[#666]">
                申请加入：{{ item.groupName || `群 ${item.groupId}` }}
              </view>
              <view class="mt-8rpx text-26rpx text-[#666]">
                {{ item.applyContent || '暂无申请理由' }}
              </view>
              <view v-if="item.handleContent" class="mt-8rpx text-24rpx text-[#999]">
                拒绝理由：{{ item.handleContent }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                {{ formatDateTime(item.createTime) }}
              </view>
              <view v-if="item.handleResult === ImGroupRequestHandleResult.UNHANDLED" class="mt-20rpx flex gap-16rpx">
                <wd-button
                  class="flex-1"
                  size="small"
                  type="primary"
                  :loading="actingId === item.id && actingAction === 'agree'"
                  :disabled="actingId != null"
                  @click="handleAgreeGroup(item)"
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
                  @click="handleRefuseGroup(item)"
                >
                  拒绝
                </wd-button>
              </view>
            </view>
          </view>
        </view>
        <wd-empty
          v-if="!loading && groupRequests.length === 0"
          icon="content"
          :tip="singleGroupId ? '暂无进群申请记录' : '暂无待处理加群申请'"
        />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { FriendRequest } from '../../types'
import type { ImGroupRequestRespVO } from '@/api/im/group/request'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { getGroupRequestListByGroupId } from '@/api/im/group/request'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, ImFriendRequestHandleResult, ImGroupRequestHandleResult } from '@/pages-im/utils/constants'
import { formatDateTime } from '@/utils/date'
import { useFriendStore } from '../../store/friendStore'
import { useGroupRequestStore } from '../../store/groupRequestStore'
import { useImRuntimeStore } from '../../store/runtimeStore'
import ImAvatar from '../../components/im-avatar.vue'

const props = defineProps<{
  tab?: string
  groupId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const userStore = useUserStore()
const dialog = useDialog()
const toast = useToast()
const activeTab = ref(props.tab === 'group' ? 1 : 0) // 当前申请类型
const singleGroupId = computed(() => Number(props.groupId) || 0) // 指定群聊编号
const singleGroupRequests = ref<ImGroupRequestRespVO[]>([]) // 指定群聊的全部申请记录
const singleGroupLoading = ref(false) // 指定群聊申请加载状态
const actingId = ref<number>() // 当前处理的申请编号
const actingAction = ref<'agree' | 'refuse'>() // 当前申请操作
const friendStore = useFriendStore()
const groupRequestStore = useGroupRequestStore()
const {
  friendRequests,
  hasMoreFriendRequests: friendRequestHasMore,
  requestLoading: friendRequestLoading,
  requestLoadingMore: friendRequestLoadingMore,
} = storeToRefs(friendStore)
const { unhandledList: globalGroupRequests, loading: groupRequestLoading } = storeToRefs(groupRequestStore)
const groupRequests = computed(() => singleGroupId.value ? singleGroupRequests.value : globalGroupRequests.value) // 当前加群申请列表
const loading = computed(() => singleGroupId.value
  ? singleGroupLoading.value
  : activeTab.value === 0 ? friendRequestLoading.value : groupRequestLoading.value) // 当前页签加载状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/contact/index')
}

/** 好友申请是否可处理 */
function canHandleFriendRequest(item: FriendRequest) {
  return item.handleResult === ImFriendRequestHandleResult.UNHANDLED
    && item.toUserId === userStore.userInfo.userId
}

/** 获取好友申请头像 */
function getFriendRequestAvatar(item: FriendRequest) {
  return item.fromUserId === userStore.userInfo.userId ? item.toAvatar : item.fromAvatar
}

/** 获取好友申请标题 */
function getFriendRequestTitle(item: FriendRequest) {
  if (item.fromUserId === userStore.userInfo.userId) {
    return `我申请添加 ${getFriendRequestPeerName(item)}`
  }
  return `${getFriendRequestPeerName(item)} 申请添加我`
}

/** 获取好友申请对端真实昵称 */
function getFriendRequestPeerName(item: FriendRequest) {
  return item.fromUserId === userStore.userInfo.userId
    ? item.toNickname || String(item.toUserId)
    : item.fromNickname || String(item.fromUserId)
}

/** 打开申请对端的好友资料 */
function openFriendDetail(item: FriendRequest) {
  const peerUserId = item.fromUserId === userStore.userInfo.userId
    ? item.toUserId
    : item.fromUserId
  uni.navigateTo({ url: `/pages-im/home/contact/friend/detail/index?friendUserId=${peerUserId}` })
}

/** 同意好友申请 */
async function handleAgreeFriend(item: FriendRequest) {
  if (actingId.value != null || !canHandleFriendRequest(item)) {
    return
  }
  actingId.value = item.id
  actingAction.value = 'agree'
  try {
    if (!await friendStore.agreeFriendRequest(item.id)) {
      return
    }
    toast.success('已同意')
  } finally {
    actingId.value = undefined
    actingAction.value = undefined
  }
}

/** 拒绝好友申请 */
async function handleRefuseFriend(item: FriendRequest) {
  if (actingId.value != null || !canHandleFriendRequest(item)) {
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
  if (actingId.value != null || !canHandleFriendRequest(item)) {
    return
  }
  actingId.value = item.id
  actingAction.value = 'refuse'
  try {
    if (!await friendStore.refuseFriendRequest(item.id, handleContent)) {
      return
    }
    toast.success('已拒绝')
  } finally {
    actingId.value = undefined
    actingAction.value = undefined
  }
}

/** 同意加群申请 */
async function handleAgreeGroup(item: ImGroupRequestRespVO) {
  if (actingId.value != null || item.handleResult !== ImGroupRequestHandleResult.UNHANDLED) {
    return
  }
  actingId.value = item.id
  actingAction.value = 'agree'
  try {
    if (!await groupRequestStore.agreeGroupRequest(item.id)) {
      return
    }
    markSingleGroupRequestHandled(item.id, ImGroupRequestHandleResult.AGREED)
    toast.success('已同意')
  } finally {
    actingId.value = undefined
    actingAction.value = undefined
  }
}

/** 拒绝加群申请 */
async function handleRefuseGroup(item: ImGroupRequestRespVO) {
  if (actingId.value != null || item.handleResult !== ImGroupRequestHandleResult.UNHANDLED) {
    return
  }
  let handleContent: string | undefined
  try {
    const result = await dialog.prompt({
      title: '拒绝加群申请',
      msg: '可填写拒绝理由（选填）',
      inputProps: { maxlength: 255, placeholder: '不填则不告知对方原因' },
    })
    handleContent = String(result.value || '').trim() || undefined
  } catch {
    return
  }
  if (actingId.value != null || item.handleResult !== ImGroupRequestHandleResult.UNHANDLED) {
    return
  }
  actingId.value = item.id
  actingAction.value = 'refuse'
  try {
    if (!await groupRequestStore.refuseGroupRequest(item.id, handleContent)) {
      return
    }
    markSingleGroupRequestHandled(item.id, ImGroupRequestHandleResult.REFUSED, handleContent)
    toast.success('已拒绝')
  } finally {
    actingId.value = undefined
    actingAction.value = undefined
  }
}

/** 更新指定群聊中的申请处理结果 */
function markSingleGroupRequestHandled(id: number, handleResult: number, handleContent?: string) {
  if (!singleGroupId.value) {
    return
  }
  const request = singleGroupRequests.value.find(item => item.id === id)
  if (!request) {
    return
  }
  request.handleResult = handleResult
  request.handleTime = new Date().toISOString()
  if (handleContent !== undefined) {
    request.handleContent = handleContent
  }
}

/** 加载申请列表 */
async function loadData() {
  if (singleGroupId.value) {
    singleGroupLoading.value = true
    try {
      singleGroupRequests.value = await getGroupRequestListByGroupId(singleGroupId.value)
    } finally {
      singleGroupLoading.value = false
    }
    return
  }
  if (activeTab.value === 0) {
    await friendStore.fetchFriendRequestList()
  } else {
    await groupRequestStore.fetchUnhandledGroupRequestList()
  }
}

/** 加载更早的好友申请 */
async function loadMoreFriendRequests() {
  if (friendRequestLoadingMore.value || !friendRequestHasMore.value) {
    return
  }
  await friendStore.loadMoreFriendRequestList()
}

/** 初始化 */
onShow(() => {
  void useImRuntimeStore().ensure()
  activeTab.value = singleGroupId.value || props.tab === 'group' ? 1 : activeTab.value
  loadData()
})
</script>
