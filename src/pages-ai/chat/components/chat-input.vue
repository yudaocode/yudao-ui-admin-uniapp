<template>
  <view class="shrink-0 px-24rpx pb-[calc(18rpx+env(safe-area-inset-bottom))] pt-10rpx">
    <view class="rounded-32rpx bg-white px-22rpx pb-18rpx pt-20rpx shadow-[0_12rpx_48rpx_rgba(0,0,0,0.08)]">
      <view v-if="attachmentUrls.length" class="mb-14rpx flex flex-wrap gap-10rpx">
        <view
          v-for="(url, index) in attachmentUrls"
          :key="url"
          class="max-w-full flex items-center gap-8rpx rounded-full bg-[#f5f5f5] px-14rpx py-8rpx"
        >
          <wd-icon name="file" size="24rpx" color="#1677ff" />
          <text class="max-w-360rpx truncate text-22rpx text-[#666]">{{ getFileNameFromUrl(url) || '附件' }}</text>
          <wd-icon name="close" size="24rpx" color="#999" @click="handleRemoveAttachment(index)" />
        </view>
      </view>
      <wd-textarea
        v-model="prompt"
        placeholder="有问题，尽管问"
        :maxlength="2000"
        auto-height
        compact
        custom-style="--wot-textarea-inner-min-height: 48rpx; --wot-textarea-inner-font-size: 28rpx; --wot-textarea-inner-line-height: 42rpx;"
      />
      <view class="mt-14rpx flex items-center justify-between">
        <view class="flex items-center gap-12rpx">
          <view
            class="relative h-54rpx w-54rpx flex items-center justify-center rounded-full bg-[#f5f5f5]"
            @click="attachmentVisible = true"
          >
            <wd-icon name="folder" size="30rpx" color="#666" />
            <view
              v-if="attachmentUrls.length"
              class="absolute min-w-28rpx rounded-full bg-[#f5222d] px-6rpx text-center text-18rpx text-white leading-28rpx -right-6rpx -top-6rpx"
            >
              {{ attachmentUrls.length }}
            </view>
          </view>
          <view
            class="rounded-full px-18rpx py-10rpx text-23rpx"
            :class="enableContext ? 'bg-[#e6f4ff] text-[#1677ff]' : 'bg-[#f5f5f5] text-[#666]'"
            @click="enableContext = !enableContext"
          >
            上下文
          </view>
          <view
            class="rounded-full px-18rpx py-10rpx text-23rpx"
            :class="enableWebSearch ? 'bg-[#e6f4ff] text-[#1677ff]' : 'bg-[#f5f5f5] text-[#666]'"
            @click="enableWebSearch = !enableWebSearch"
          >
            联网
          </view>
        </view>
        <view
          class="h-68rpx w-68rpx flex items-center justify-center rounded-full"
          :class="inProgress || prompt.trim() ? 'bg-[#1677ff]' : 'bg-[#d9d9d9]'"
          @click="handleSubmit"
        >
          <view v-if="inProgress" class="h-22rpx w-22rpx rounded-4rpx bg-white" />
          <wd-icon v-else name="arrow-up" size="34rpx" color="#fff" />
        </view>
      </view>
    </view>

    <!-- 附件上传 -->
    <wd-popup
      v-model="attachmentVisible"
      position="bottom"
      root-portal
      custom-style="border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="bg-white px-28rpx pb-[calc(32rpx+env(safe-area-inset-bottom))] pt-24rpx">
        <view class="mb-24rpx flex items-center justify-between">
          <view>
            <view class="text-31rpx text-[#333] font-semibold">
              添加附件
            </view>
            <view class="mt-6rpx text-22rpx text-[#999]">
              最多 5 个，单个不超过 10MB
            </view>
          </view>
          <wd-icon name="close" size="36rpx" color="#666" @click="attachmentVisible = false" />
        </view>
        <yd-upload-file
          v-model="attachmentUrls"
          directory="ai/chat"
          :limit="5"
          :file-size="10"
          :is-show-tip="false"
        />
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { getFileNameFromUrl } from '@/utils/download'

const props = defineProps<{
  inProgress: boolean
}>()
const emit = defineEmits<{
  send: []
  stop: []
}>()
const prompt = defineModel<string>('prompt', { default: '' })
const attachmentUrls = defineModel<string[]>('attachmentUrls', { default: () => [] })
const enableContext = defineModel<boolean>('enableContext', { default: true })
const enableWebSearch = defineModel<boolean>('enableWebSearch', { default: false })
const attachmentVisible = ref(false) // 附件弹窗显示状态

/** 移除待发送附件 */
function handleRemoveAttachment(index: number) {
  attachmentUrls.value.splice(index, 1)
}

/** 发送或停止生成 */
function handleSubmit() {
  if (props.inProgress) {
    emit('stop')
  } else {
    emit('send')
  }
}
</script>
