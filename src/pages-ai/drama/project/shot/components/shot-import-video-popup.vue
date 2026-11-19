<template>
  <!-- 导入视频：外部视频直接作为已完成的镜头视频 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="pb-24rpx pt-24rpx">
      <view class="mb-12rpx flex items-center justify-between px-24rpx">
        <text class="text-32rpx text-[#222] font-semibold">导入视频 · #{{ storyboard?.sceneNo ?? '' }}</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <view class="px-24rpx py-16rpx">
        <yd-upload-file
          v-model="fileUrl"
          accept="video"
          :limit="1"
          :file-size="200"
          :file-type="['mp4', 'mov']"
          directory="ai/drama"
        />
      </view>
      <view class="px-24rpx text-22rpx text-[#999]">
        导入后直接作为已完成的镜头视频，并截取尾帧供下一镜承接；宽、高不超过 3840；原视频可在提交记录中恢复
      </view>
      <view class="flex gap-24rpx px-24rpx pt-24rpx">
        <wd-button class="flex-1" variant="plain" @click="visible = false">
          取消
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="saving" :disabled="!fileUrl" @click="handleSubmit">
          导入
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { DramaStoryboard } from '@/api/ai/drama/storyboard'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { importDramaStoryboardVideo } from '@/api/ai/drama/storyboard'

const emit = defineEmits<{
  success: [] // 已导入，需要刷新详情
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const saving = ref(false) // 导入状态
const storyboard = ref<DramaStoryboard>() // 当前镜头
const fileUrl = ref('') // 已上传的视频地址

/** 打开 */
function open(item: DramaStoryboard) {
  storyboard.value = item
  fileUrl.value = ''
  visible.value = true
}

defineExpose({ open })

/** 提交导入 */
async function handleSubmit() {
  saving.value = true
  try {
    await importDramaStoryboardVideo({ id: storyboard.value!.id, fileUrl: fileUrl.value })
    toast.success('已导入')
    visible.value = false
    emit('success')
  } finally {
    saving.value = false
  }
}
</script>
