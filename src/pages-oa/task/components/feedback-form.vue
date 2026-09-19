<template>
  <wd-popup v-model="visible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
    <view class="p-24rpx">
      <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
        任务反馈
      </view>
      <yd-form-picker v-model="status" label="反馈状态" :columns="options" />
      <wd-textarea v-model="content" :maxlength="1000" show-word-limit placeholder="请输入反馈内容" />
      <wd-button class="mt-24rpx" type="primary" block :loading="loading" @click="submit">
        提交反馈
      </wd-button>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { feedbackTask } from '@/api/oa/task'

const props = defineProps<{
  taskId: number
  publisher: boolean
  options: { label: string, value: number }[]
}>()
const emit = defineEmits<{ success: [] }>()
const visible = defineModel<boolean>('visible', { default: false })
const status = defineModel<number | undefined>('status')
const toast = useToast()
const content = ref('')
const loading = ref(false)

/** 打开反馈时清空上次填写内容 */
function resetContent() {
  content.value = ''
}

/** 提交反馈 */
async function submit() {
  if (status.value === undefined) {
    toast.warning('请选择反馈状态')
    return
  }
  loading.value = true
  try {
    await feedbackTask({ taskId: props.taskId, publisher: props.publisher, status: status.value, content: content.value.trim() || undefined })
    toast.success('反馈成功')
    visible.value = false
    emit('success')
  } finally {
    loading.value = false
  }
}

defineExpose({ resetContent })
</script>
