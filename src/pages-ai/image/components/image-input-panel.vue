<template>
  <view class="shrink-0 bg-[#f7f8fa] px-20rpx pb-[calc(18rpx+env(safe-area-inset-bottom))] pt-10rpx">
    <scroll-view scroll-x class="w-full whitespace-nowrap" :show-scrollbar="false">
      <view class="inline-flex gap-12rpx pb-14rpx pr-20rpx">
        <view
          v-for="word in hotWords"
          :key="word"
          class="max-w-320rpx truncate rounded-full bg-white px-22rpx py-12rpx text-23rpx text-[#666] shadow-[0_4rpx_18rpx_rgba(0,0,0,0.04)]"
          @click="formData.prompt = word"
        >
          {{ word }}
        </view>
      </view>
    </scroll-view>
    <view class="border border-[#eee] rounded-28rpx bg-white px-22rpx pb-16rpx pt-18rpx shadow-[0_12rpx_48rpx_rgba(0,0,0,0.08)]">
      <wd-textarea
        v-model="formData.prompt"
        placeholder="描述你想生成的图片"
        :maxlength="1200"
        auto-height
        compact
        custom-style="--wot-textarea-inner-min-height: 54rpx; --wot-textarea-inner-max-height: 180rpx; --wot-textarea-inner-font-size: 28rpx; --wot-textarea-inner-line-height: 42rpx;"
      />
      <view class="mt-14rpx flex items-center justify-between">
        <view class="max-w-500rpx flex items-center gap-8rpx rounded-full bg-[#f5f5f5] px-18rpx py-10rpx" @click="emit('openSettings')">
          <wd-icon name="settings" size="26rpx" color="#666" />
          <text class="truncate text-22rpx text-[#555]">{{ selectedModelName }}</text>
        </view>
        <view
          class="h-64rpx w-64rpx flex items-center justify-center rounded-full"
          :class="formData.prompt.trim() && !drawing ? 'bg-[#615ced]' : 'bg-[#d9d9d9]'"
          @click="emit('draw')"
        >
          <wd-loading v-if="drawing" color="#fff" size="34rpx" />
          <wd-icon v-else name="arrow-up" size="34rpx" color="#fff" />
        </view>
      </view>
    </view>
    <view class="pt-10rpx text-center text-20rpx text-[#aaa]">
      内容由 AI 生成，请注意甄别
    </view>
  </view>
</template>

<script lang="ts" setup>
interface ImageInputForm {
  prompt: string
}

defineProps<{
  drawing: boolean
  hotWords: string[]
  selectedModelName: string
}>()
const emit = defineEmits<{
  draw: []
  openSettings: []
}>()
const formData = defineModel<ImageInputForm>({ required: true })
</script>
