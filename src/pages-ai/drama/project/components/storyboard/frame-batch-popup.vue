<template>
  <!-- 批量生成关键帧弹窗：当前剧本中镜头序号在范围内、还没有关键帧的镜头 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="pb-24rpx pt-24rpx">
      <view class="mb-12rpx flex items-center justify-between px-24rpx">
        <text class="text-32rpx text-[#222] font-semibold">批量生成关键帧</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <view class="flex items-center gap-16rpx px-24rpx py-16rpx">
        <text class="text-28rpx text-[#333]">镜头序号</text>
        <wd-input-number v-model="formData.startSceneNo" :min="1" />
        <text class="text-28rpx text-[#333]">至</text>
        <wd-input-number v-model="formData.endSceneNo" :min="formData.startSceneNo" />
      </view>
      <view class="px-24rpx">
        <text class="text-26rpx text-[#1677ff]" @click="setOpening">开场 10 镜</text>
      </view>
      <view class="px-24rpx pt-16rpx text-22rpx text-[#999]">
        一次最多 40 个镜头；已有关键帧、出图中、镜头视频生成中的跳过，需要重画时请在镜头上单独生成
      </view>
      <view class="flex gap-24rpx px-24rpx pt-24rpx">
        <wd-button class="flex-1" variant="plain" @click="visible = false">
          取消
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="submitting" @click="handleSubmit">
          生成
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { reactive, ref, watch } from 'vue'
import { generateDramaStoryboardFrameBatch } from '@/api/ai/drama/storyboard'

const props = defineProps<{
  projectId: number // 项目编号
  modelId?: number // 绘画模型
}>()

const emit = defineEmits<{
  success: [] // 已提交，需要刷新详情
}>()

const visible = defineModel<boolean>({ default: false }) // 弹窗显示状态
const toast = useToast()
const submitting = ref(false) // 提交状态
const formData = reactive({ startSceneNo: 1, endSceneNo: 10 }) // 镜头序号范围

/** 开场 10 镜 */
function setOpening() {
  formData.startSceneNo = 1
  formData.endSceneNo = 10
}

/** 提交批量生成 */
async function handleSubmit() {
  if (!props.modelId) {
    toast.warning('请先选择默认绘画模型')
    return
  }
  if (formData.endSceneNo < formData.startSceneNo) {
    toast.warning('结束序号不能小于起始序号')
    return
  }
  if (formData.endSceneNo - formData.startSceneNo + 1 > 40) {
    toast.warning('一次最多 40 个镜头')
    return
  }
  submitting.value = true
  try {
    const count = await generateDramaStoryboardFrameBatch({
      projectId: props.projectId,
      modelId: props.modelId,
      ...formData,
    })
    toast.success(count ? `已提交 ${count} 个镜头` : '没有需要生成关键帧的镜头')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}

/** 打开时恢复为开场 10 镜 */
watch(visible, (value) => {
  if (value) {
    setOpening()
  }
})
</script>
