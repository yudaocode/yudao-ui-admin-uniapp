<template>
  <!-- 作品详情弹窗：我的作品为主人视角，公开画廊为公开视角 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="max-height: 86vh; border-radius: 32rpx 32rpx 0 0; background-color: #f5f5f5;"
  >
    <view class="pb-24rpx pt-24rpx">
      <view class="mb-20rpx flex items-center justify-between px-24rpx">
        <text class="text-32rpx text-[#222] font-semibold">作品详情</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <view v-if="loading" class="py-80rpx text-center">
        <wd-loading />
      </view>
      <scroll-view v-else-if="detail" scroll-y class="max-h-[74vh]">
        <ImageDetail :image="detail" :scope="scope" @open="open($event, scope)" />
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { AiImage } from '@/api/ai/image'
import { ref } from 'vue'
import { getImageMy, getImagePublic } from '@/api/ai/image'
import ImageDetail from './image-detail.vue'

const visible = ref(false) // 弹窗显示状态
const loading = ref(false) // 加载状态
const scope = ref('mine') // 详情的来源：mine - 我的作品；public - 公开画廊
const detail = ref<AiImage>() // 详情数据
let requestId = 0 // 请求序号：关闭或打开其它作品后，忽略上一次的返回

/** 打开详情 */
async function open(id: number, detailScope: string) {
  const currentRequestId = ++requestId
  visible.value = true
  scope.value = detailScope
  detail.value = undefined
  loading.value = true
  try {
    const result = detailScope === 'public' ? await getImagePublic(id) : await getImageMy(id)
    if (currentRequestId === requestId) {
      detail.value = result
    }
  } catch {
    if (currentRequestId === requestId) {
      visible.value = false
    }
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

defineExpose({ open })
</script>
