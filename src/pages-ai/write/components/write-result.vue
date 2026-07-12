<template>
  <scroll-view scroll-y class="min-h-0 flex-1">
    <view v-if="content || writing" class="p-28rpx">
      <view class="mb-20rpx flex items-center justify-between">
        <view class="flex items-center gap-12rpx">
          <view class="h-48rpx w-48rpx flex items-center justify-center rounded-14rpx bg-[#615ced] text-22rpx text-white font-semibold">
            AI
          </view>
          <text class="text-28rpx text-[#333] font-medium">当前文章</text>
        </view>
        <wd-loading v-if="writing" size="30rpx" />
      </view>
      <wd-textarea
        v-model="content"
        auto-height
        compact
        placeholder="生成的内容……"
        custom-style="--wot-textarea-inner-min-height: 560rpx; --wot-textarea-inner-font-size: 28rpx; --wot-textarea-inner-line-height: 46rpx;"
      />
    </view>
    <view v-else class="h-full flex flex-col items-center justify-center px-64rpx text-center">
      <view class="h-112rpx w-112rpx flex items-center justify-center rounded-32rpx bg-[#eeedff]">
        <wd-icon name="edit" size="54rpx" color="#615ced" />
      </view>
      <view class="mt-28rpx text-32rpx text-[#333] font-semibold">
        开始新的创作
      </view>
      <view class="mt-14rpx text-25rpx text-[#999] leading-40rpx">
        输入写作要求，生成结果将显示在这里
      </view>
    </view>
  </scroll-view>
</template>

<script lang="ts" setup>
defineProps<{
  writing: boolean
}>()
const content = defineModel<string>('content', { default: '' })
</script>
