<template>
  <wd-popup
    v-if="visible"
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    @close="visible = false"
  >
    <view class="bg-white px-24rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        停止招聘
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="职位名称" title-width="180rpx">
            <text>{{ postName || '-' }}</text>
          </wd-form-item>
          <wd-form-item title="停止原因" title-width="180rpx" prop="stopReason" vertical>
            <wd-textarea
              v-model="formData.stopReason"
              clearable
              placeholder="例如：岗位暂停"
              :maxlength="255"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-32rpx flex gap-24rpx">
        <wd-button class="flex-1" variant="plain" @click="visible = false">
          取消
        </wd-button>
        <wd-button class="flex-1" type="warning" :loading="formLoading" @click="handleSubmit">
          确认停止
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { updateRecruitPostStatus } from '@/api/hrm/recruit/post'
import { createFormSchema } from '@/utils/wot'
import { HrmRecruitPostStatus } from '@/pages-hrm/utils/constants'

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const postId = ref<number>() // 招聘职位编号
const postName = ref('') // 职位名称
const formData = ref({
  stopReason: '',
})
const formSchema = createFormSchema({
  stopReason: [{ required: true, message: '停止原因不能为空' }],
})
const formRef = ref<FormInstance>() // 表单引用

/** 打开弹窗 */
function open(id: number, name = '') {
  postId.value = id
  postName.value = name
  formData.value = { stopReason: '' }
  visible.value = true
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !postId.value) {
    return
  }
  const stopReason = formData.value.stopReason.trim()
  if (!stopReason) {
    toast.error('停止原因不能为空')
    return
  }
  formLoading.value = true
  try {
    await updateRecruitPostStatus({
      id: postId.value,
      status: HrmRecruitPostStatus.STOPPED,
      stopReason,
    })
    toast.success('停止招聘成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
