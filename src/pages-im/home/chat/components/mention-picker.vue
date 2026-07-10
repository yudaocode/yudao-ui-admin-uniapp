<template>
  <wd-popup v-model="visible" position="bottom" custom-style="height: 60vh; border-radius: 24rpx 24rpx 0 0;">
    <view class="h-full flex flex-col bg-white">
      <view class="flex items-center justify-between border-b border-b-[#f2f3f5] px-24rpx py-20rpx">
        <view class="text-32rpx text-[#333] font-semibold">
          @ 成员
        </view>
        <wd-button size="small" variant="plain" @click="visible = false">
          关闭
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <view v-if="canMentionAll" class="mention-member" @click="emit('select-all')">
          <view class="h-72rpx w-72rpx flex items-center justify-center rounded-full bg-[#1677ff] text-26rpx text-white">
            全
          </view>
          <view class="min-w-0 flex-1">
            <view class="text-30rpx text-[#333]">
              @{{ IM_AT_ALL_NICKNAME }}
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              提醒群内所有成员
            </view>
          </view>
        </view>
        <view
          v-for="item in members"
          :key="item.userId"
          class="mention-member"
          @click="emit('select', item)"
        >
          <ImAvatar :src="item.avatar" :name="getMemberName(item)" size="72rpx" />
          <view class="min-w-0 flex-1">
            <view class="truncate text-30rpx text-[#333]">
              {{ getMemberName(item) }}
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              用户编号：{{ item.userId }}
            </view>
          </view>
        </view>
        <wd-empty v-if="members.length === 0 && !canMentionAll" icon="content" tip="暂无可 @ 成员" />
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ImGroupMemberRespVO } from '@/api/im/group/member'
import { computed } from 'vue'
import { IM_AT_ALL_NICKNAME } from '@/utils/constants'
import ImAvatar from '../../components/im-avatar.vue'

const props = defineProps<{
  modelValue: boolean // 是否显示
  members: ImGroupMemberRespVO[] // 可 @ 成员（已过滤自己/退群）
  canMentionAll: boolean // 是否可 @ 所有人
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select': [member: ImGroupMemberRespVO] // 选中成员
  'select-all': [] // 选中 @ 所有人
}>()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

/** 获取成员名称 */
function getMemberName(item: ImGroupMemberRespVO) {
  return item.displayUserName || item.nickname || `用户 ${item.userId}`
}
</script>

<style lang="scss" scoped>
.mention-member {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 24rpx;
  border-top: 1rpx solid #f2f3f5;
}
</style>
