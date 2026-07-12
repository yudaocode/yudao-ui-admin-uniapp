<template>
  <view v-if="pages?.length" class="mt-20rpx rounded-20rpx bg-[#f5f5f5] px-22rpx py-18rpx">
    <view class="flex items-center justify-between" @click="expanded = !expanded">
      <view class="flex items-center gap-8rpx text-25rpx text-[#333] font-medium">
        <wd-icon name="search" size="28rpx" color="#1677ff" />
        <text>联网搜索结果（{{ pages.length }} 条）</text>
      </view>
      <wd-icon :name="expanded ? 'arrow-up' : 'arrow-down'" size="28rpx" color="#999" />
    </view>
    <view v-if="expanded" class="mt-14rpx flex flex-col gap-12rpx">
      <view
        v-for="page in pages"
        :key="page.url || page.title"
        class="rounded-14rpx bg-white px-18rpx py-16rpx"
        @click="handleOpen(page)"
      >
        <view class="text-22rpx text-[#999]">
          {{ page.name || '网页来源' }}
        </view>
        <view class="line-clamp-2 mt-6rpx text-25rpx text-[#1677ff] font-medium leading-36rpx">
          {{ page.title || page.url || '-' }}
        </view>
        <view class="line-clamp-2 mt-6rpx text-23rpx text-[#666] leading-34rpx">
          {{ page.snippet || page.summary || '-' }}
        </view>
      </view>
    </view>

    <wd-popup
      v-model="visible"
      position="bottom"
      root-portal
      custom-style="max-height: 72vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="bg-white px-28rpx pb-[calc(28rpx+env(safe-area-inset-bottom))] pt-24rpx">
        <view class="flex items-start justify-between gap-20rpx">
          <view class="min-w-0 flex-1 text-30rpx text-[#333] font-semibold leading-42rpx">
            {{ selectedPage?.title || '联网来源' }}
          </view>
          <wd-icon name="close" size="36rpx" color="#666" @click="visible = false" />
        </view>
        <view class="mt-10rpx break-all text-22rpx text-[#999]">
          {{ selectedPage?.url }}
        </view>
        <scroll-view scroll-y class="mt-20rpx max-h-[46vh]">
          <view class="rounded-16rpx bg-[#f5f5f5] px-20rpx py-18rpx text-26rpx text-[#666] leading-42rpx">
            {{ selectedPage?.snippet || '-' }}
          </view>
          <view v-if="selectedPage?.summary" class="mt-16rpx whitespace-pre-wrap text-27rpx text-[#333] leading-44rpx">
            {{ selectedPage.summary }}
          </view>
        </scroll-view>
        <wd-button class="mt-24rpx" block type="primary" @click="openUrl(selectedPage?.url)">
          访问原文
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { openUrl } from '@/utils/url'

interface WebSearchPage {
  name: string
  icon: string
  title: string
  url: string
  snippet: string
  summary: string
}

defineProps<{
  pages?: WebSearchPage[]
}>()

const expanded = ref(false) // 搜索结果展开状态
const visible = ref(false) // 详情弹窗显示状态
const selectedPage = ref<WebSearchPage>() // 当前联网来源

/** 打开联网来源详情 */
function handleOpen(page: WebSearchPage) {
  selectedPage.value = page
  visible.value = true
}
</script>
