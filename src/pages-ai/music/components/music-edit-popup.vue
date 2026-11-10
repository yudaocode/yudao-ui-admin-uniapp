<template>
  <!-- 修改名称与封面 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="px-24rpx pb-28rpx pt-24rpx">
      <view class="mb-20rpx flex items-center justify-between">
        <text class="text-32rpx text-[#222] font-semibold">修改歌曲</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="歌曲名称" title-width="170rpx" prop="title">
            <wd-input v-model="formData.title" :maxlength="100" clearable placeholder="请输入歌曲名称" />
          </wd-form-item>
          <wd-form-item title="封面图片" title-width="170rpx" prop="coverUrl">
            <yd-upload-img v-model="formData.coverUrl" directory="ai/music" :file-type="['jpg', 'jpeg', 'png']" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-24rpx">
        <wd-button block type="primary" :loading="formLoading" @click="handleSubmit">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Music } from '@/api/ai/music'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { updateMyMusic } from '@/api/ai/music'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{
  success: [] // 修改成功
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref({ id: 0, title: '', coverUrl: '' }) // 表单数据
const formSchema = createFormSchema({
  title: [{ required: true, message: '请输入歌曲名称' }],
  coverUrl: [{ required: true, message: '请上传封面图片' }],
})

/** 打开弹窗 */
function open(music: Music) {
  formData.value = {
    id: music.id,
    title: music.title || '',
    coverUrl: music.coverUrl || '',
  }
  visible.value = true
  formRef.value?.reset()
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    await updateMyMusic({
      id: formData.value.id,
      title: formData.value.title.trim(),
      coverUrl: formData.value.coverUrl,
    })
    toast.success('修改成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
