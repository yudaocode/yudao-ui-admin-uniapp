<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <!-- #ifndef MP-WEIXIN -->
    <wd-navbar title="" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack">
      <template #right>
        <view class="pr-8rpx" @click="goSetting">
          <wd-icon name="more" size="44rpx" color="#333" />
        </view>
      </template>
    </wd-navbar>
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN -->
    <wd-navbar title="" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="flex items-center gap-26rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <wd-icon name="more" size="42rpx" color="#333" @click="goSetting" />
        </view>
      </template>
    </wd-navbar>
    <!-- #endif -->

    <scroll-view class="min-h-0 flex-1 bg-[#ededed]" scroll-y>
      <!-- 资料卡 -->
      <view class="flex items-center gap-28rpx bg-white px-32rpx py-44rpx">
        <ImAvatar
          :src="friend?.avatar"
          :name="friend?.nickname || simpleUser?.nickname || ''"
          :round="false"
          size="128rpx"
        />
        <view class="min-w-0 flex-1">
          <view class="flex items-center gap-12rpx">
            <text class="line-clamp-1 min-w-0 text-40rpx text-[#1f1f1f] font-medium">
              {{ displayName }}
            </text>
            <dict-tag
              v-if="simpleUser?.sex != null"
              :type="DICT_TYPE.SYSTEM_USER_SEX"
              :value="simpleUser.sex"
            />
          </view>
          <view class="mt-12rpx text-26rpx text-[#999]">
            账号：{{ friend?.friendUserId ?? '-' }}
          </view>
          <view v-if="friend?.displayName" class="mt-6rpx text-26rpx text-[#999]">
            昵称：{{ friend?.nickname || '-' }}
          </view>
          <view class="mt-6rpx text-26rpx text-[#999]">
            部门：{{ simpleUser?.deptName || '-' }}
          </view>
        </view>
      </view>

      <!-- 朋友资料 -->
      <view class="mt-20rpx bg-white">
        <wd-cell-group border>
          <wd-cell title="朋友资料" is-link center @click="goSetting" />
          <wd-cell v-if="friend?.addSource != null" title="来源" center>
            <dict-tag :type="DICT_TYPE.IM_FRIEND_ADD_SOURCE" :value="friend.addSource" />
          </wd-cell>
          <wd-cell
            v-if="friend?.addTime"
            title="添加时间"
            :value="formatDate(friend.addTime, 'YYYY-MM-DD')"
            center
          />
        </wd-cell-group>
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
        <view class="mx-32rpx h-1rpx bg-[#f2f3f5]" />
        <view class="flex items-center justify-center gap-12rpx py-30rpx text-32rpx text-[#576b95]" @click="handleCall">
          <wd-icon name="phone" size="40rpx" />
          音视频通话
        </view>
      </view>
    </scroll-view>

    <!-- 推荐个人名片 -->
    <RecommendCardPicker v-if="friendCard" v-model="recommendVisible" :card="friendCard" />

    <!-- 通话方式菜单 -->
    <wd-action-sheet v-model="callActionVisible" :actions="callActions" @select="handleCallAction" />
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import type { User } from '@/api/system/user'
import { getSimpleUser } from '@/api/system/user'
import { toUserCardTarget } from '@/pages-im/utils/message'
import { buildConversationMessageUrl } from '@/pages-im/utils/conversation'
import { getFriendDisplayName } from '@/pages-im/utils/user'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { DICT_TYPE } from '@/utils/constants'
import { ImConversationType, ImRtcCallMediaType } from '@/pages-im/utils/constants'
import { useUserStore } from '@/store/user'
import { useImRtc } from '../../../composables/useImRtc'
import { useFriendStore } from '../../../store/friendStore'
import { useImRuntimeStore } from '../../../store/runtimeStore'
import ImAvatar from '../../../components/im-avatar.vue'
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

const friendStore = useFriendStore()
const userStore = useUserStore()
const simpleUser = ref<User>() // 系统用户精简资料
const recommendVisible = ref(false) // 推荐名片弹窗
const callActionVisible = ref(false) // 通话方式菜单显示状态
const callActions = [ // 通话方式菜单项
  { name: '语音通话', value: ImRtcCallMediaType.VOICE },
  { name: '视频通话', value: ImRtcCallMediaType.VIDEO },
]
const { start: startRtcCall } = useImRtc()

/** 好友编号 */
const friendUserId = computed(() => Number(props.friendUserId))
const friend = computed(() => friendStore.isActiveFriend(friendUserId.value)
  ? friendStore.getFriend(friendUserId.value)
  : undefined) // 当前有效好友资料

/** 展示名称：备注优先 */
const displayName = computed(() => friend.value
  ? getFriendDisplayName(friend.value)
  : `用户 ${friendUserId.value}`)
const friendCard = computed(() => toUserCardTarget({ // 个人名片只携带真实昵称，不携带当前用户备注
  id: friendUserId.value,
  nickname: friend.value?.nickname,
  avatar: friend.value?.avatar,
}))

/** 加载好友资料 */
async function loadFriend() {
  const currentUserId = userStore.userInfo.userId
  const userId = friendUserId.value
  if (!currentUserId || !userId) {
    return
  }
  const [, user] = await Promise.all([
    friendStore.fetchFriendInfo(userId),
    getSimpleUser(userId),
  ])
  if (userStore.userInfo.userId === currentUserId && friendUserId.value === userId) {
    simpleUser.value = user
  }
}

/** 返回 */
function handleBack() {
  navigateBackPlus('/pages-im/home/contact/index')
}

/** 进入好友设置 */
function goSetting() {
  uni.navigateTo({ url: `/pages-im/home/contact/friend/setting/index?friendUserId=${friendUserId.value}` })
}

/** 发消息 */
function sendMessage() {
  uni.navigateTo({
    url: buildConversationMessageUrl({
      type: ImConversationType.PRIVATE,
      targetId: friendUserId.value,
    }),
  })
}

/** 查找聊天内容 */
function goHistory() {
  uni.navigateTo({
    url: `/pages-im/home/conversation/history/index?type=${ImConversationType.PRIVATE}&targetId=${friendUserId.value}&title=${encodeURIComponent(displayName.value)}`,
  })
}

/** 与当前好友发起群聊 */
function createGroupWithFriend() {
  uni.navigateTo({ url: `/pages-im/home/contact/group/form/index?memberUserIds=${friendUserId.value}` })
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
  })
}

/** 每次显示刷新（从设置页返回同步备注等） */
onShow(() => {
  void useImRuntimeStore().ensure()
  loadFriend()
})
</script>
