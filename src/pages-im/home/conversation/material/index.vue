<template>
  <view class="yd-page-container yd-page-container-paging bg-white">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="频道消息"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 文章详情 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view v-if="loading" class="flex justify-center py-160rpx">
        <wd-loading />
      </view>
      <view v-else-if="detail" class="px-32rpx pb-80rpx pt-36rpx">
        <view class="text-42rpx text-[#222] font-semibold leading-58rpx">
          {{ detail.title || '频道消息' }}
        </view>
        <view v-if="detail.summary" class="mt-20rpx text-27rpx text-[#888] leading-42rpx">
          {{ detail.summary }}
        </view>
        <wd-img
          v-if="detail.coverUrl"
          :src="detail.coverUrl"
          custom-class="mt-28rpx bg-[#f2f3f5]"
          width="100%"
          height="360rpx"
          radius="8rpx"
          mode="aspectFill"
        />
        <rich-text
          v-if="detail.content"
          class="article-content mt-32rpx text-30rpx text-[#333] leading-52rpx"
          :nodes="detail.content"
          selectable
        />
        <view
          v-if="detail.url"
          class="mt-32rpx break-all text-28rpx text-[#576b95] leading-44rpx"
          @click="openSafeUrl(detail.url)"
        >
          查看原文
        </view>
        <wd-empty v-if="!detail.content && !detail.url" class="mt-80rpx" icon="content" tip="暂无正文" />
      </view>
      <wd-empty v-else class="mt-160rpx" icon="content" tip="频道消息不存在" />
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { ImChannelMaterialRespVO } from '@/api/im/channel/material'
import { onMounted, ref } from 'vue'
import { getChannelMaterial } from '@/api/im/channel/material'
import { buildConversationMessageUrl } from '@/pages-im/utils/conversation'
import { ImConversationType } from '@/pages-im/utils/constants'
import { navigateBackPlus } from '@/utils'
import { openSafeUrl } from '@/utils/url'

const props = defineProps<{
  id?: number | string
  type?: number | string
  targetId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const loading = ref(false) // 详情加载状态
const detail = ref<ImChannelMaterialRespVO>() // 频道素材详情

/** 返回聊天页 */
function handleBack() {
  const type = Number(props.type)
  const targetId = Number(props.targetId)
  const fallbackUrl = type && targetId
    ? buildConversationMessageUrl({ type, targetId })
    : detail.value?.channelId
      ? buildConversationMessageUrl({ type: ImConversationType.CHANNEL, targetId: detail.value.channelId })
      : '/pages-im/home/conversation/index'
  navigateBackPlus(fallbackUrl)
}

/** 加载频道素材详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  loading.value = true
  try {
    detail.value = await getChannelMaterial(Number(props.id))
  } finally {
    loading.value = false
  }
}

/** 初始化频道素材详情 */
onMounted(getDetail)
</script>

<style lang="scss" scoped>
.article-content {
  :deep(img) {
    height: auto;
    max-width: 100%;
  }

  :deep(p) {
    margin: 20rpx 0;
  }
}
</style>
