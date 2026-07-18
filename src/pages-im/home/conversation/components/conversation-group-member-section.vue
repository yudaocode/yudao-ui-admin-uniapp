<template>
  <view class="bg-white px-24rpx pb-12rpx pt-24rpx">
    <wd-search v-model="keyword" placeholder="搜索群成员" hide-cancel />
    <view class="grid grid-cols-5 gap-y-24rpx">
      <view
        v-for="item in displayMembers"
        :key="item.userId"
        class="flex flex-col items-center gap-8rpx"
        @click="handleMemberClick(item)"
        @longpress.stop="handleMemberLongpress(item)"
      >
        <ImAvatar :src="item.avatar" :name="item.nickname" :round="false" size="96rpx" />
        <text class="w-96rpx truncate text-center text-22rpx text-[#666]">{{ getMemberDisplayName(item) }}</text>
        <text
          v-if="getGroupMemberRoleLabel(item.role)"
          class="rounded-6rpx bg-[#edf5ff] px-8rpx py-1rpx text-18rpx text-[#4d80f0] -mt-4rpx"
        >
          {{ getGroupMemberRoleLabel(item.role) }}
        </text>
      </view>
      <view v-if="canInvite" class="flex flex-col items-center gap-8rpx" @click="emit('invite')">
        <view class="h-96rpx w-96rpx flex items-center justify-center border border-[#ddd] rounded-12rpx border-dashed">
          <wd-icon name="plus" size="48rpx" color="#bbb" />
        </view>
      </view>
      <view v-if="canManage" class="flex flex-col items-center gap-8rpx" @click="emit('manage')">
        <view class="h-96rpx w-96rpx flex items-center justify-center border border-[#ddd] rounded-12rpx border-dashed">
          <wd-icon name="minus" size="48rpx" color="#bbb" />
        </view>
      </view>
    </view>
    <view
      v-if="members.length > memberLimit"
      class="mt-16rpx py-8rpx text-center text-26rpx text-[#999]"
      @click="expanded = !expanded"
    >
      {{ expanded ? '收起' : `查看全部 ${members.length} 名成员` }}
      <wd-icon :name="expanded ? 'arrow-up' : 'arrow-down'" size="24rpx" />
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { GroupMember } from '../../types'
import { computed, onUnmounted, ref } from 'vue'
import { getGroupMemberRoleLabel, getMemberDisplayName } from '@/pages-im/utils/user'
import ImAvatar from '../../components/im-avatar.vue'

const props = withDefaults(defineProps<{
  members: GroupMember[] // 当前有效群成员
  canInvite?: boolean // 是否可邀请成员
  canManage?: boolean // 是否可管理成员
  memberLimit?: number // 折叠展示成员数
}>(), {
  canInvite: false,
  canManage: false,
  memberLimit: 10,
})

const emit = defineEmits<{
  'member-click': [member: GroupMember] // 点击群成员
  'member-longpress': [member: GroupMember] // 长按群成员
  'invite': [] // 邀请群成员
  'manage': [] // 查看成员管理提示
}>()

const keyword = ref('') // 群成员关键词
const expanded = ref(false) // 是否展开全部成员
let longpressedUserId = 0 // 刚触发长按的成员编号
let longpressResetTimer: ReturnType<typeof setTimeout> | undefined
const filteredMembers = computed(() => { // 搜索后的群成员
  const value = keyword.value.trim().toLowerCase()
  return value
    ? props.members.filter(item => getMemberDisplayName(item).toLowerCase().includes(value))
    : props.members
})
const displayMembers = computed(() => expanded.value || keyword.value
  ? filteredMembers.value
  : filteredMembers.value.slice(0, props.memberLimit)) // 当前展示成员

/** 短按查看成员资料 */
function handleMemberClick(member: GroupMember) {
  if (longpressedUserId === member.userId) {
    longpressedUserId = 0
    return
  }
  emit('member-click', member)
}

/** 长按打开成员管理 */
function handleMemberLongpress(member: GroupMember) {
  longpressedUserId = member.userId
  if (longpressResetTimer) {
    clearTimeout(longpressResetTimer)
  }
  longpressResetTimer = setTimeout(() => {
    if (longpressedUserId === member.userId) {
      longpressedUserId = 0
    }
  }, 800)
  emit('member-longpress', member)
}

/** 释放长按抑制定时器 */
onUnmounted(() => clearTimeout(longpressResetTimer))
</script>
