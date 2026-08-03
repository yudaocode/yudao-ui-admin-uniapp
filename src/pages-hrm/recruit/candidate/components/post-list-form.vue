<template>
  <wd-popup v-model="visible" position="bottom" safe-area-inset-bottom @close="visible = false">
    <view class="bg-white px-24rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        修改应聘职位
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="候选人数" title-width="180rpx">
            <text>{{ candidateIds.length }} 人</text>
          </wd-form-item>
          <PostFormPicker v-model="formData.postId" prop="postId" :clearable="false" />
        </wd-cell-group>
      </wd-form>
      <view class="mt-32rpx flex gap-24rpx">
        <wd-button class="flex-1" variant="plain" @click="visible = false">
          取消
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { ref } from 'vue'
import { updateRecruitCandidatePost } from '@/api/hrm/recruit/candidate'
import { createFormSchema } from '@/utils/wot'
import { executeBatch } from '@/pages-hrm/utils/batch'
import PostFormPicker from '@/pages-hrm/recruit/post/components/post-form-picker.vue'

const emit = defineEmits<{
  success: []
}>()

const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const candidateIds = ref<number[]>([]) // 候选人编号数组
const formData = ref({
  postId: undefined as number | undefined,
})
const formSchema = createFormSchema({
  postId: [{ required: true, message: '应聘职位不能为空' }],
})
const formRef = ref<FormInstance>() // 表单引用

/** 打开弹窗 */
function open(ids: number[]) {
  candidateIds.value = [...ids]
  formData.value = { postId: undefined }
  visible.value = true
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || formData.value.postId == null) {
    return
  }
  formLoading.value = true
  try {
    const hasSuccess = await executeBatch(
      candidateIds.value.map(id => updateRecruitCandidatePost({
        id,
        postId: formData.value.postId!,
      })),
    )
    if (!hasSuccess) {
      return
    }
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
