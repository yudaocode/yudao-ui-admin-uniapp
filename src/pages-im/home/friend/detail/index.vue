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

      <!-- 操作：发消息 / 音视频通话 -->
      <view class="mt-20rpx bg-white">
        <view class="flex items-center justify-center gap-12rpx py-30rpx text-32rpx text-[#576b95]" @click="sendMessage">
          <wd-icon name="message" size="40rpx" />
          发消息
        </view>
        <view class="mx-32rpx h-1rpx bg-[#f2f3f5]" />
        <view class="flex items-center justify-center gap-12rpx py-30rpx text-32rpx text-[#576b95]" @click="handleCall">
          <wd-icon name="phone" size="40rpx" />
          音视频通话
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { ImFriendRespVO } from '@/api/im/friend'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getFriend } from '@/api/im/friend'
import { navigateBackPlus } from '@/utils'
import { ImConversationType } from '@/utils/constants'
import ImAvatar from '../../components/im-avatar.vue'

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
const friend = ref<ImFriendRespVO>() // 好友资料

/** 好友编号 */
const friendUserId = computed(() => Number(props.friendUserId))

/** 展示名称：备注优先 */
const displayName = computed(() => friend.value?.displayName || friend.value?.nickname || `用户 ${friendUserId.value}`)

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

/** 音视频通话（RTC 后置） */
function handleCall() {
  toast.show('音视频通话开发中')
}

/** 每次显示刷新（从设置页返回同步备注等） */
onShow(() => {
  loadFriend()
})
</script>
