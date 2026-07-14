<template>
  <wd-popup v-model="visible" position="bottom" root-portal custom-style="height: 80vh; border-radius: 24rpx 24rpx 0 0;">
    <view class="h-full flex flex-col bg-white">
      <view class="flex items-center justify-between border-b border-b-[#f2f3f5] px-24rpx py-20rpx">
        <view class="min-w-0 flex flex-1 items-center gap-16rpx">
          <wd-icon v-if="stack.length > 1" name="arrow-left" size="34rpx" color="#666" @click="handleBack" />
          <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
            {{ currentPayload?.title || '聊天记录' }}
          </view>
        </view>
        <wd-button size="small" variant="plain" @click="visible = false">
          关闭
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <view class="p-24rpx">
          <view v-for="(item, index) in messages" :key="index" class="mb-28rpx flex items-start gap-16rpx">
            <ImAvatar :src="item.senderAvatar" :name="item.senderNickname" :round="false" size="72rpx" />
            <view class="min-w-0 flex-1">
              <view class="mb-8rpx flex items-center justify-between gap-16rpx text-24rpx text-[#999]">
                <text class="truncate">{{ item.senderNickname || '' }}</text>
                <text class="shrink-0">{{ formatMergeItemTime(item.sendTime) }}</text>
              </view>
              <view class="inline-block rounded-12rpx bg-[#f7f8fa] px-22rpx py-16rpx text-28rpx text-[#333] leading-42rpx">
                <MessageContent
                  :type="item.type"
                  :content="item.content"
                  @merge-click="handleNestedOpen"
                  @material-click="emit('material-click', $event)"
                  @card-click="emit('card-click', $event)"
                />
              </view>
            </view>
          </view>
          <wd-empty v-if="messages.length === 0" icon="content" tip="暂无内容" />
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import type { CardMessage, MaterialMessage, MergeMessage } from '@/pages-im/utils/message'
import { computed, ref, watch } from 'vue'
import MessageContent from '@/pages-im/components/message-content.vue'
import { formatMergeItemTime } from '@/pages-im/utils/time'
import ImAvatar from '../../../components/im-avatar.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false }, // 是否显示
  payload: { type: Object as PropType<MergeMessage>, default: undefined }, // 合并转发内容
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'material-click': [payload: MaterialMessage]
  'card-click': [payload: CardMessage]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const stack = ref<MergeMessage[]>([]) // 嵌套合并消息栈
const currentPayload = computed(() => stack.value[stack.value.length - 1]) // 当前展示的合并消息
const messages = computed(() => currentPayload.value?.messages || []) // 当前层消息列表

/** 打开嵌套合并消息 */
function handleNestedOpen(payload: MergeMessage) {
  stack.value.push(payload)
}

/** 返回上一层合并消息 */
function handleBack() {
  if (stack.value.length > 1) {
    stack.value.pop()
  }
}

/** 打开时从顶层合并消息开始 */
watch([visible, () => props.payload], ([isVisible, payload]) => {
  stack.value = isVisible && payload ? [payload] : []
})
</script>
