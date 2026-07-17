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
                  @material-click="handleMaterialClick"
                  @card-click="handleCardClick"
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
import type { GroupCardPreviewOptions } from '../../../composables/useMessageContentActions'
import type { MergeMessage } from '@/pages-im/utils/message'
import { computed, ref } from 'vue'
import MessageContent from '@/pages-im/home/components/message-content.vue'
import { parseMessage } from '@/pages-im/utils/message'
import { formatMergeItemTime } from '@/pages-im/utils/time'
import { useMessageContentActions } from '../../../composables/useMessageContentActions'
import ImAvatar from '../../../components/im-avatar.vue'

const props = defineProps<{
  conversationType: number // 当前会话类型
  targetId: number // 当前会话目标编号
  openGroupCardPreview: (options: GroupCardPreviewOptions) => void // 打开群名片资料
}>()

const visible = ref(false) // 是否显示
const stack = ref<MergeMessage[]>([]) // 嵌套合并消息栈
const currentPayload = computed(() => stack.value[stack.value.length - 1]) // 当前展示的合并消息
const messages = computed(() => currentPayload.value?.messages || []) // 当前层消息列表
const { handleMaterialClick, handleCardClick } = useMessageContentActions({
  conversationType: computed(() => props.conversationType),
  targetId: computed(() => props.targetId),
  openGroupCardPreview: props.openGroupCardPreview,
})

/** 打开合并消息详情 */
function open(content: string) {
  const payload = parseMessage<MergeMessage>(content)
  stack.value = payload ? [payload] : []
  visible.value = true
}

/** 打开嵌套合并消息 */
function handleNestedOpen(content: string) {
  const payload = parseMessage<MergeMessage>(content)
  if (payload) {
    stack.value.push(payload)
  }
}

/** 返回上一层合并消息 */
function handleBack() {
  if (stack.value.length > 1) {
    stack.value.pop()
  }
}

defineExpose({ open })
</script>
