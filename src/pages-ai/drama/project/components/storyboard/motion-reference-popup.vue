<template>
  <!-- 添加动作参考视频：可在镜头的动作参考视频中选用 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="max-height: 80vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="flex flex-col">
      <!-- 标题 -->
      <view class="flex items-center justify-between px-24rpx py-24rpx">
        <text class="text-32rpx text-[#222] font-semibold">添加动作参考</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>

      <!-- 表单区域 -->
      <scroll-view scroll-y class="min-h-0 flex-1">
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="名称" title-width="180rpx" prop="name">
              <wd-input v-model="formData.name" :maxlength="120" clearable placeholder="例如：转身挥手" />
            </wd-form-item>
            <wd-form-item title="视频文件" title-width="180rpx" prop="fileUrl" layout="vertical">
              <yd-upload-file
                v-model="formData.fileUrl"
                accept="video"
                :limit="1"
                :file-size="100"
                :file-type="['mp4', 'mov']"
                directory="ai/drama"
              />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="px-24rpx py-16rpx text-22rpx text-[#999]">
          2 ~ 30 秒、24 ~ 60fps 的 H.264 / H.265 视频，宽高比 0.4 ~ 2.5，且不低于 480p；不符合要求时，保存会提示具体原因
        </view>
      </scroll-view>

      <!-- 底部保存按钮 -->
      <view class="bg-white p-24rpx">
        <wd-button block type="primary" :loading="saving" @click="handleSubmit">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { createDramaMotionReference } from '@/api/ai/drama/asset'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  projectId: number // 项目编号
}>()

const emit = defineEmits<{
  success: [] // 已添加，需要刷新详情
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const saving = ref(false) // 保存状态
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref({ name: '', fileUrl: '' }) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '名称不能为空' }],
  fileUrl: [{ required: true, message: '请上传视频' }],
})

/** 打开 */
function open() {
  formData.value = { name: '', fileUrl: '' }
  visible.value = true
}

defineExpose({ open })

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  saving.value = true
  try {
    await createDramaMotionReference({ projectId: props.projectId, ...formData.value })
    toast.success('已添加')
    visible.value = false
    emit('success')
  } finally {
    saving.value = false
  }
}
</script>
