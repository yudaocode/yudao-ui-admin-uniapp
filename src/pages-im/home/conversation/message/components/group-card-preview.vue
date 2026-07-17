<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    custom-style="border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="bg-[#f5f5f5] pb-[calc(24rpx+env(safe-area-inset-bottom))]">
      <!-- 顶部标题 -->
      <view class="flex items-center justify-between bg-white px-28rpx py-22rpx">
        <text class="text-32rpx text-[#333] font-semibold">群聊资料</text>
        <wd-icon name="close" size="34rpx" color="#999" @click="visible = false" />
      </view>

      <!-- 群资料摘要 -->
      <view class="flex flex-col items-center bg-white px-32rpx pb-38rpx pt-24rpx">
        <ImAvatar :src="card.avatar" :name="card.name" :round="false" size="128rpx" />
        <text class="mt-20rpx max-w-full truncate text-36rpx text-[#222] font-medium">
          {{ card.name || '群聊' }}
        </text>
        <text class="mt-10rpx text-25rpx text-[#999]">
          {{ card.memberCount ? `${card.memberCount} 位成员` : '群聊' }}
        </text>
      </view>

      <!-- 名片来源 -->
      <view class="mt-20rpx bg-white">
        <wd-cell title="来源" value="群名片" center />
      </view>

      <!-- 加群操作 -->
      <view class="px-28rpx pt-28rpx">
        <wd-button v-if="canApply" type="primary" block @click="handleApply">
          申请加入群聊
        </wd-button>
        <view v-else class="py-20rpx text-center text-26rpx text-[#999]">
          该群聊当前不可加入
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { CardMessage } from '@/pages-im/utils/message'
import { computed } from 'vue'
import ImAvatar from '../../../components/im-avatar.vue'

const props = withDefaults(defineProps<{
  modelValue: boolean // 是否显示
  card: CardMessage // 群名片快照
  canApply?: boolean // 是否允许申请加入
}>(), {
  canApply: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'apply': [card: CardMessage]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

/** 申请加入群聊 */
function handleApply() {
  visible.value = false
  emit('apply', props.card)
}
</script>
