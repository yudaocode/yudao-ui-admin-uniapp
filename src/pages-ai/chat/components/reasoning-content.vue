<template>
  <view class="mb-18rpx">
    <view
      class="inline-flex items-center gap-8rpx py-8rpx text-23rpx text-[#777]"
      @click="expanded = !expanded"
    >
      <text>{{ inProgress ? '深度思考中' : '已深度思考' }}</text>
      <wd-icon
        name="arrow-down"
        size="22rpx"
        color="#999"
        :custom-class="expanded ? 'transition-transform duration-200 rotate-180' : 'transition-transform duration-200'"
      />
    </view>
    <view class="h-1rpx bg-[#eee]" />
    <view
      v-if="expanded"
      class="px-2rpx pb-8rpx pt-18rpx text-[#666]"
    >
      <YdMarkdown :content="content" />
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import YdMarkdown from '@/pages-ai/components/yd-markdown/yd-markdown.vue'

const props = defineProps<{
  content: string
  inProgress?: boolean
}>()
const expanded = ref(!!props.inProgress) // 思考内容展开状态

/** 流式思考时自动展开 */
watch(() => props.inProgress, (inProgress) => {
  if (inProgress) {
    expanded.value = true
  }
})
</script>
