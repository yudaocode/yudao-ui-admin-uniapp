<template>
  <wd-popup v-model="visible" position="bottom" root-portal custom-style="height: 60vh; border-radius: 24rpx 24rpx 0 0;">
    <view class="h-full flex flex-col bg-white">
      <view class="flex items-center justify-between border-b border-b-[#f2f3f5] px-24rpx py-20rpx">
        <view class="text-32rpx text-[#333] font-semibold">
          消息已读情况
        </view>
        <wd-button size="small" variant="plain" @click="visible = false">
          关闭
        </wd-button>
      </view>

      <wd-tabs v-model="tab" line-theme="text">
        <wd-tab :title="`已读 ${readMembers.length}`" />
        <wd-tab :title="`未读 ${unreadMembers.length}`" />
      </wd-tabs>

      <scroll-view class="min-h-0 flex-1" scroll-y>
        <view
          v-for="member in currentList"
          :key="member.userId"
          class="flex items-center gap-20rpx px-24rpx py-16rpx"
        >
          <ImAvatar :src="member.avatar" :name="member.nickname" :round="false" size="76rpx" />
          <text class="min-w-0 flex-1 truncate text-30rpx text-[#333]">{{ getMemberDisplayName(member) }}</text>
        </view>
        <wd-empty v-if="currentList.length === 0" icon="user" :tip="tab === 0 ? '暂无已读成员' : '全部已读'" />
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { GroupMember } from '../../../types'
import { getMemberDisplayName } from '@/pages-im/utils/user'
import { computed, ref, watch } from 'vue'
import ImAvatar from '../../../components/im-avatar.vue'

const props = defineProps<{
  modelValue: boolean // 是否显示
  readMembers: GroupMember[] // 已读成员
  unreadMembers: GroupMember[] // 未读成员
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const tab = ref(0) // 0=已读 1=未读

/** 当前 tab 成员 */
const currentList = computed(() => (tab.value === 0 ? props.readMembers : props.unreadMembers))

/** 每次打开重置到已读 tab */
watch(visible, (value) => {
  if (value) {
    tab.value = 0
  }
})
</script>
