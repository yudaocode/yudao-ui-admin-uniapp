<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="IM 申请"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 申请类型 -->
    <wd-tabs v-model="activeTab" line-theme="text" @change="loadData">
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
            <ImAvatar :src="getFriendRequestAvatar(item)" :name="getFriendRequestTitle(item)" />
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
              <view class="mt-8rpx text-24rpx text-[#999]">
                {{ formatDateTime(item.createTime) }}
              </view>
              <view v-if="canHandleFriendRequest(item)" class="mt-20rpx flex gap-16rpx">
                <wd-button class="flex-1" size="small" type="primary" @click="handleAgreeFriend(item)">
                  同意
                </wd-button>
                <wd-button class="flex-1" size="small" type="danger" variant="plain" @click="handleRefuseFriend(item)">
                  拒绝
                </wd-button>
              </view>
            </view>
          </view>
        </view>
        <wd-empty v-if="!loading && friendRequests.length === 0" icon="content" tip="暂无好友申请" />
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
              <view class="mt-8rpx text-24rpx text-[#999]">
                {{ formatDateTime(item.createTime) }}
              </view>
              <view v-if="item.handleResult === ImGroupRequestHandleResult.UNHANDLED" class="mt-20rpx flex gap-16rpx">
                <wd-button class="flex-1" size="small" type="primary" @click="handleAgreeGroup(item)">
                  同意
                </wd-button>
                <wd-button class="flex-1" size="small" type="danger" variant="plain" @click="handleRefuseGroup(item)">
                  拒绝
                </wd-button>
              </view>
            </view>
          </view>
        </view>
        <wd-empty v-if="!loading && groupRequests.length === 0" icon="content" tip="暂无待处理加群申请" />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { ImFriendRequestRespVO } from '@/api/im/friend/request'
import type { ImGroupRequestRespVO } from '@/api/im/group/request'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import {
  agreeFriendRequest,
  getMyFriendRequestList,
  refuseFriendRequest,
} from '@/api/im/friend/request'
import {
  agreeGroupRequest,
  getUnhandledRequestList,
  refuseGroupRequest,
} from '@/api/im/group/request'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, ImFriendRequestHandleResult, ImGroupRequestHandleResult } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ImAvatar from '../components/im-avatar.vue'

const props = defineProps<{
  tab?: string
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
const loading = ref(false) // 加载状态
const friendRequests = ref<ImFriendRequestRespVO[]>([]) // 好友申请
const groupRequests = ref<ImGroupRequestRespVO[]>([]) // 加群申请

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/index/index')
}

/** 好友申请是否可处理 */
function canHandleFriendRequest(item: ImFriendRequestRespVO) {
  return item.handleResult === ImFriendRequestHandleResult.UNHANDLED
    && item.toUserId === userStore.userInfo.userId
}

/** 获取好友申请头像 */
function getFriendRequestAvatar(item: ImFriendRequestRespVO) {
  return item.fromUserId === userStore.userInfo.userId ? item.toAvatar : item.fromAvatar
}

/** 获取好友申请标题 */
function getFriendRequestTitle(item: ImFriendRequestRespVO) {
  if (item.fromUserId === userStore.userInfo.userId) {
    return `我申请添加 ${item.toNickname || item.toUserId}`
  }
  return `${item.fromNickname || item.fromUserId} 申请添加我`
}

/** 同意好友申请 */
async function handleAgreeFriend(item: ImFriendRequestRespVO) {
  await agreeFriendRequest(item.id)
  toast.success('已同意')
  loadData()
}

/** 拒绝好友申请 */
async function handleRefuseFriend(item: ImFriendRequestRespVO) {
  try {
    await dialog.confirm({ title: '提示', msg: '确定拒绝该好友申请吗？' })
  } catch {
    return
  }
  await refuseFriendRequest(item.id)
  toast.success('已拒绝')
  loadData()
}

/** 同意加群申请 */
async function handleAgreeGroup(item: ImGroupRequestRespVO) {
  await agreeGroupRequest(item.id)
  toast.success('已同意')
  loadData()
}

/** 拒绝加群申请 */
async function handleRefuseGroup(item: ImGroupRequestRespVO) {
  try {
    await dialog.confirm({ title: '提示', msg: '确定拒绝该加群申请吗？' })
  } catch {
    return
  }
  await refuseGroupRequest(item.id)
  toast.success('已拒绝')
  loadData()
}

/** 加载申请列表 */
async function loadData() {
  loading.value = true
  try {
    if (activeTab.value === 0) {
      friendRequests.value = await getMyFriendRequestList(50)
    } else {
      groupRequests.value = await getUnhandledRequestList()
    }
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onShow(() => {
  activeTab.value = props.tab === 'group' ? 1 : activeTab.value
  loadData()
})
</script>
