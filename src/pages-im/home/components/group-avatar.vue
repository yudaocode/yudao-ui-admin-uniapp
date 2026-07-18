<template>
  <view
    class="grid flex-shrink-0 overflow-hidden bg-[#d8d8d8]"
    :class="round ? 'rounded-full' : 'rounded-12rpx'"
    :style="avatarStyle"
  >
    <wd-img v-if="src" :src="src" width="100%" height="100%" mode="aspectFill" />
    <template v-else-if="members.length">
      <view
        v-for="member in members"
        :key="member.userId"
        class="min-h-0 min-w-0 flex items-center justify-center overflow-hidden"
        :style="getMemberStyle(member.nickname)"
      >
        <wd-img v-if="member.avatar" :src="member.avatar" width="100%" height="100%" mode="aspectFill" />
        <text v-else>{{ getAvatarText(member.nickname) }}</text>
      </view>
    </template>
    <view v-else class="flex items-center justify-center" :style="fallbackStyle">
      {{ getAvatarText(name) }}
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { CommonStatusEnum } from '@/pages-im/utils/constants'
import { getGroupAvatarGridColumns } from '@/pages-im/utils/group'
import { getAvatarBgColor, getAvatarText } from '@/pages-im/utils/user'
import { useGroupStore } from '../store/groupStore'

const props = withDefaults(defineProps<{
  groupId?: number
  name?: string
  round?: boolean
  size?: string
  src?: string
}>(), {
  groupId: 0,
  name: '',
  round: false,
  size: '80rpx',
  src: '',
})

const groupStore = useGroupStore()
const members = computed(() => (groupStore.getGroup(props.groupId)?.members || [])
  .filter(member => member.status !== CommonStatusEnum.DISABLE)
  .slice(0, 9)) // 群头像成员
const columns = computed(() => getGroupAvatarGridColumns(members.value.length)) // 群头像网格列数
const fontSize = computed(() => {
  const value = Number.parseInt(props.size)
  return Number.isNaN(value) ? '20rpx' : `${Math.max(16, Math.floor(value * 0.18))}rpx`
})
const avatarStyle = computed(() => ({
  width: props.size,
  height: props.size,
  padding: members.value.length ? '4rpx' : '0',
  gap: members.value.length ? '3rpx' : '0',
  gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`,
  fontSize: fontSize.value,
}))
const fallbackStyle = computed(() => ({
  width: '100%',
  height: '100%',
  backgroundColor: getAvatarBgColor(props.name),
  color: '#fff',
}))

/** 获取成员头像兜底样式 */
function getMemberStyle(name?: string) {
  return {
    backgroundColor: getAvatarBgColor(name || ''),
    color: '#fff',
  }
}

/** 从本地缓存加载无自定义头像群的成员 */
watch(() => [props.groupId, props.src] as const, ([groupId, src]) => {
  if (groupId && !src && !groupStore.getGroup(groupId)?.membersLoaded) {
    void groupStore.loadGroupMemberList(groupId).catch(() => undefined)
  }
}, { immediate: true })
</script>
