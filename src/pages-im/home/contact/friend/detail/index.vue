<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <!-- #ifndef MP-WEIXIN -->
    <wd-navbar title="" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack">
      <template v-if="relation === 'friend'" #right>
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
          <wd-icon v-if="relation === 'friend'" name="more" size="42rpx" color="#333" @click="goSetting" />
        </view>
      </template>
    </wd-navbar>
    <!-- #endif -->

    <!-- 用户资料 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <UserInfo
        v-if="user && relation"
        :user="user"
        :relation="relation"
        :display-name="displayName"
        :add-source="addSource"
        :add-source-extra="addSourceExtra"
        @chat="sendMessage"
        @deleted="handleDeleted"
        @add-friend="openFriendApply"
      />
      <view v-else-if="loading" class="py-80rpx">
        <wd-loading />
      </view>
      <view v-else class="py-80rpx">
        <wd-empty tip="用户资料加载失败">
          <wd-button size="small" @click="loadUserInfo">
            重新加载
          </wd-button>
        </wd-empty>
      </view>
      <view v-if="relation === 'friend'" class="mt-20rpx bg-white">
        <view class="flex items-center justify-center gap-12rpx py-30rpx text-32rpx text-[#576b95]" @click="callActionVisible = true">
          <wd-icon name="phone" size="40rpx" />音视频通话
        </view>
      </view>
    </scroll-view>
    <wd-action-sheet v-model="callActionVisible" :actions="callActions" @select="handleCallAction" />
  </view>
</template>

<script lang="ts" setup>
import type { User } from '@/api/system/user'
import type { UserInfoRelation } from '../../../components/user/user-info.vue'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getSimpleUser } from '@/api/system/user'
import { buildConversationMessageUrl } from '@/pages-im/utils/conversation'
import { getFriendDisplayName } from '@/pages-im/utils/user'
import { ImConversationType, ImFriendAddSource, ImRtcCallMediaType } from '@/pages-im/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { useUserStore } from '@/store/user'
import { useImRtc } from '../../../composables/useImRtc'
import { useFriendStore } from '../../../store/friendStore'
import { useImRuntimeStore } from '../../../store/runtimeStore'
import UserInfo from '../../../components/user/user-info.vue'

const props = defineProps<{
  friendUserId?: number | string
  source?: number | string
  sourceExtra?: string
}>()

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const userStore = useUserStore()
const friendStore = useFriendStore()
const user = ref<User | null>(null) // 用户精简资料
const relation = ref<UserInfoRelation | null>(null) // 当前用户关系
const loading = ref(false) // 资料加载状态
let loadEpoch = 0 // 资料加载轮次
let loadedAccountId = 0 // 当前展示资料所属账号
let loadedTargetId = 0 // 当前展示资料目标编号
const callActionVisible = ref(false) // 通话方式菜单显示状态
const callActions = [ // 通话方式菜单项
  { name: '语音通话', value: ImRtcCallMediaType.VOICE },
  { name: '视频通话', value: ImRtcCallMediaType.VIDEO },
]
const { start: startRtcCall } = useImRtc()
const friendUserId = computed(() => Number(props.friendUserId)) // 目标用户编号
const addSource = computed(() => Number(props.source || ImFriendAddSource.SEARCH)) // 添加来源
const addSourceExtra = computed(() => { // 已解码的添加来源扩展信息
  if (!props.sourceExtra) {
    return undefined
  }
  try {
    return decodeURIComponent(props.sourceExtra)
  } catch {
    return props.sourceExtra
  }
})
const friend = computed(() => friendStore.isActiveFriend(friendUserId.value)
  ? friendStore.getFriend(friendUserId.value)
  : undefined) // 当前好友资料
const displayName = computed(() => friend.value ? getFriendDisplayName(friend.value) : user.value?.nickname || '') // 展示名称

/** 加载用户关系和资料 */
async function loadUserInfo() {
  const epoch = ++loadEpoch
  const accountId = userStore.userInfo.userId
  const targetId = friendUserId.value
  if (!accountId || !targetId) {
    return
  }
  loading.value = true
  if (loadedAccountId !== accountId || loadedTargetId !== targetId) {
    user.value = null
    relation.value = null
  }
  try {
    await useImRuntimeStore().ensure()
    await friendStore.fetchFriendList(true)
    if (epoch !== loadEpoch
      || userStore.userInfo.userId !== accountId
      || friendUserId.value !== targetId) {
      return
    }
    const initialRelation: UserInfoRelation = targetId === accountId
      ? 'self'
      : friendStore.isActiveFriend(targetId) ? 'friend' : 'stranger'
    if (initialRelation === 'friend') {
      await friendStore.fetchFriendInfo(targetId)
    }
    const nextUser = await getSimpleUser(targetId)
    if (epoch === loadEpoch
      && userStore.userInfo.userId === accountId
      && friendUserId.value === targetId) {
      const nextRelation: UserInfoRelation = targetId === accountId
        ? 'self'
        : friendStore.isActiveFriend(targetId) ? 'friend' : 'stranger'
      user.value = nextUser
      relation.value = nextRelation
      loadedAccountId = accountId
      loadedTargetId = targetId
    }
  } finally {
    if (epoch === loadEpoch) {
      loading.value = false
    }
  }
}

/** 返回联系人页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/contact/index')
}

/** 打开聊天设置 */
function goSetting() {
  uni.navigateTo({ url: `/pages-im/home/contact/friend/setting/index?friendUserId=${friendUserId.value}` })
}

/** 发消息 */
function sendMessage() {
  uni.navigateTo({ url: buildConversationMessageUrl({ type: ImConversationType.PRIVATE, targetId: friendUserId.value }) })
}

/** 打开好友申请 */
function openFriendApply(target: User, source: number, sourceExtra?: string) {
  const extra = sourceExtra ? `&sourceExtra=${encodeURIComponent(sourceExtra)}` : ''
  uni.navigateTo({ url: `/pages-im/home/contact/friend/apply/index?toUserId=${target.id}&source=${source}${extra}` })
}

/** 删除后返回 */
function handleDeleted() {
  delay(handleBack)
}

/** 发起指定方式的通话 */
function handleCallAction({ item }: { item: { value: number } }) {
  startRtcCall({ conversationType: ImConversationType.PRIVATE, mediaType: item.value, inviteeIds: [friendUserId.value] })
}

onShow(() => void loadUserInfo())
</script>
