<template>
  <!-- 作品详情弹窗：本人的作品，或已公开的作品 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="max-height: 86vh; border-radius: 32rpx 32rpx 0 0; background-color: #f5f5f5;"
    @after-leave="detail = undefined"
  >
    <view class="pb-24rpx pt-24rpx">
      <view class="mb-20rpx flex items-center justify-between px-24rpx">
        <text class="text-32rpx text-[#222] font-semibold">作品详情</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <view v-if="loading" class="py-80rpx text-center">
        <wd-loading />
      </view>
      <template v-else-if="detail">
        <scroll-view scroll-y class="max-h-[64vh]">
          <VideoDetail :video="detail" />
        </scroll-view>

        <!-- 操作 -->
        <view class="flex gap-24rpx px-24rpx pt-24rpx">
          <wd-button v-if="detail.videoUrl" class="flex-1" variant="plain" @click="handleCopy(detail.videoUrl)">
            复制视频地址
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSame">
            做同款
          </wd-button>
        </view>
      </template>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Video } from '@/api/ai/video'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { getVideoDetail } from '@/api/ai/video'
import VideoDetail from './video-detail.vue'

const emit = defineEmits<{
  same: [item: Video]
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const loading = ref(false) // 加载状态
const detail = ref<Video>() // 详情数据

/** 打开：本人或已公开的作品；无权查看时后端返回“视频不存在” */
async function open(id: number) {
  visible.value = true
  detail.value = undefined
  loading.value = true
  try {
    detail.value = await getVideoDetail(id)
  } catch {
    visible.value = false
  } finally {
    loading.value = false
  }
}

/** 复制视频地址 */
function handleCopy(url: string) {
  uni.setClipboardData({
    data: url,
    success: () => toast.success('已复制地址'),
  })
}

/** 做同款 */
function handleSame() {
  emit('same', detail.value!)
  visible.value = false
}

defineExpose({ open })
</script>
