<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack">
      <template #right>
        <view class="pr-8rpx" @click="goSetting">
          <wd-icon name="more" size="44rpx" color="#333" />
        </view>
      </template>
    </wd-navbar>

    <scroll-view class="min-h-0 flex-1 bg-[#ededed]" scroll-y>
      <!-- 资料卡 -->
      <view class="flex items-center gap-28rpx bg-white px-32rpx py-44rpx">
        <ImAvatar :src="friend?.avatar" :name="displayName" :round="false" size="128rpx" />
        <view class="min-w-0 flex-1">
          <view class="line-clamp-1 text-40rpx text-[#1f1f1f] font-medium">
            {{ displayName }}
          </view>
          <view class="mt-12rpx text-26rpx text-[#999]">
            账号：{{ friend?.friendUserId ?? '-' }}
          </view>
          <view v-if="friend?.displayName" class="mt-6rpx text-26rpx text-[#999]">
            昵称：{{ friend?.nickname || '-' }}
          </view>
        </view>
      </view>

      <!-- 设置备注 -->
      <view class="mt-20rpx bg-white">
        <wd-cell title="朋友资料" is-link center @click="goSetting" />
      </view>

      <!-- 聊天与推荐 -->
      <view class="mt-20rpx bg-white">
        <wd-cell-group border>
          <wd-cell title="查找聊天内容" is-link center @click="goHistory" />
          <wd-cell title="把他推荐给朋友" is-link center @click="recommendVisible = true" />
          <wd-cell title="发起群聊" is-link center @click="createGroupWithFriend" />
        </wd-cell-group>
      </view>

      <!-- 操作：发消息 / 音视频通话 -->
      <view class="mt-20rpx bg-white">
        <view class="flex items-center justify-center gap-12rpx py-30rpx text-32rpx text-[#576b95]" @click="sendMessage">
          <wd-icon name="message" size="40rpx" />
          发消息
        </view>
        <!-- #ifdef H5 -->
        <view class="mx-32rpx h-1rpx bg-[#f2f3f5]" />
        <view class="flex items-center justify-center gap-12rpx py-30rpx text-32rpx text-[#576b95]" @click="handleCall">
          <wd-icon name="phone" size="40rpx" />
          音视频通话
        </view>
        <!-- #endif -->
      </view>
    </scroll-view>

    <!-- 推荐个人名片 -->
    <RecommendCardPicker v-model="recommendVisible" :card="friendCard" />

    <!-- 通话方式菜单 -->
    <!-- #ifdef H5 -->
    <wd-action-sheet v-model="callActionVisible" :actions="callActions" @select="handleCallAction" />
    <!-- #endif -->
  </view>
</template>

<script lang="ts" setup>
import type { ImFriendRespVO } from '@/api/im/friend'
import type { ImCardMessage } from '@/pages-im/utils/message'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getFriend } from '@/api/im/friend'
import { getFriendDisplayName } from '@/pages-im/utils/user'
import { navigateBackPlus } from '@/utils'
import { ImConversationType, ImRtcCallMediaType } from '@/utils/constants'
import { useImRtc } from '../../composables/useImRtc'
import ImAvatar from '../../components/im-avatar.vue'
import RecommendCardPicker from '../../components/recommend-card-picker.vue'

const props = defineProps<{
  friendUserId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const friend = ref<ImFriendRespVO>() // 好友资料
const recommendVisible = ref(false) // 推荐名片弹窗
const callActionVisible = ref(false) // 通话方式菜单显示状态
const callActions = [ // 通话方式菜单项
  { name: '语音通话', value: ImRtcCallMediaType.VOICE },
  { name: '视频通话', value: ImRtcCallMediaType.VIDEO },
]
const { start: startRtcCall } = useImRtc()

/** 好友编号 */
const friendUserId = computed(() => Number(props.friendUserId))

/** 展示名称：备注优先 */
const displayName = computed(() => friend.value
  ? getFriendDisplayName(friend.value)
  : `用户 ${friendUserId.value}`)
const friendCard = computed<ImCardMessage>(() => ({ // 个人名片
  targetType: ImConversationType.PRIVATE,
  targetId: friendUserId.value,
  name: displayName.value,
  avatar: friend.value?.avatar,
}))

/** 加载好友资料 */
async function loadFriend() {
  if (!friendUserId.value) {
    return
  }
  friend.value = await getFriend(friendUserId.value)
}

/** 返回 */
function handleBack() {
  navigateBackPlus('/pages-im/home/friend/index')
}

/** 进入好友设置 */
function goSetting() {
  uni.navigateTo({ url: `/pages-im/home/friend/setting/index?friendUserId=${friendUserId.value}` })
}

/** 发消息 */
function sendMessage() {
  uni.navigateTo({
    url: `/pages-im/home/chat/index?type=${ImConversationType.PRIVATE}&targetId=${friendUserId.value}&title=${encodeURIComponent(displayName.value)}`,
  })
}

/** 查找聊天内容 */
function goHistory() {
  uni.navigateTo({
    url: `/pages-im/home/history/index?type=${ImConversationType.PRIVATE}&targetId=${friendUserId.value}&title=${encodeURIComponent(displayName.value)}`,
  })
}

/** 与当前好友发起群聊 */
function createGroupWithFriend() {
  uni.navigateTo({ url: `/pages-im/home/group/form/index?memberUserIds=${friendUserId.value}` })
}

/** 选择并发起音视频通话 */
function handleCall() {
  callActionVisible.value = true
}

/** 发起指定方式的通话 */
function handleCallAction({ item }: { item: { value: number } }) {
  startRtcCall({
    conversationType: ImConversationType.PRIVATE,
    mediaType: item.value,
    inviteeIds: [friendUserId.value],
    name: displayName.value,
    avatar: friend.value?.avatar,
  })
}

/** 每次显示刷新（从设置页返回同步备注等） */
onShow(() => {
  loadFriend()
})
</script>
