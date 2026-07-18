<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="title" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <!-- 群聊设置 -->
    <ConversationGroupSide
      :id="id"
      :active="active"
      @close="handleBack"
      @edit="openEdit"
      @history="openHistory"
      @requests="openRequests"
      @member-profile="openMemberProfile"
      @loaded="handleLoaded"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Group, GroupMember } from '../../../types'
import { onHide, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { ImConversationType, ImFriendAddSource } from '@/pages-im/utils/constants'
import { navigateBackPlus } from '@/utils'
import ConversationGroupSide from '../../../conversation/components/conversation-group-side.vue'

defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const active = ref(true) // 页面是否显示
const title = ref('聊天信息') // 导航栏标题

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/contact/index')
}

/** 编辑群资料 */
function openEdit(groupId: number) {
  uni.navigateTo({ url: `/pages-im/home/contact/group/form/index?id=${groupId}` })
}

/** 查找群聊内容 */
function openHistory(group: Group) {
  uni.navigateTo({
    url: `/pages-im/home/conversation/history/index?type=${ImConversationType.GROUP}&targetId=${group.id}&title=${encodeURIComponent(group.name)}`,
  })
}

/** 查看进群申请 */
function openRequests(groupId: number) {
  uni.navigateTo({ url: `/pages-im/home/contact/request/index?tab=group&groupId=${groupId}` })
}

/** 查看群成员资料 */
function openMemberProfile(member: GroupMember, groupName: string) {
  uni.navigateTo({
    url: `/pages-im/home/contact/friend/detail/index?friendUserId=${member.userId}&source=${ImFriendAddSource.GROUP}&sourceExtra=${encodeURIComponent(groupName)}`,
  })
}

/** 更新群成员数量标题 */
function handleLoaded(_group: Group, memberCount: number) {
  title.value = `聊天信息(${memberCount})`
}

onShow(() => {
  active.value = true
})

onHide(() => {
  active.value = false
})
</script>
