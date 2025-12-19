<template>
  <view class="yd-page-container">
    <!-- TODO @芋艿：还有一些细节，在审批通过没搞完！ -->
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="isApprove ? '审批同意' : '审批拒绝'"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 审批表单 -->
    <view class="p-24rpx">
      <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
        <view class="p-24rpx">
          <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
            审批意见
          </view>
          <wd-textarea
            v-model="formData.reason"
            placeholder="请输入审批意见"
            :maxlength="500"
            show-word-limit
            clearable
            custom-class="border border-solid border-[#e5e5e5] rounded-8rpx"
          />
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="mt-48rpx">
        <wd-button
          :type="isApprove ? 'primary' : 'error'"
          block
          :loading="submitting"
          :disabled="submitting"
          @click="handleSubmit"
        >
          {{ isApprove ? '同意' : '拒绝' }}
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { approveTask, rejectTask } from '@/api/bpm/task'
import { navigateBackPlus } from '@/utils'

const props = defineProps<{
  id?: string | any
  pass?: string | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const taskId = computed(() => props.id || '')
const isPass = computed(() => props.pass !== 'false') // true: 同意, false: 拒绝
const toast = useToast()
const submitting = ref(false)
const formData = reactive({
  reason: '',
})

/** 是否为同意操作 */
const isApprove = computed(() => isPass.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-bpm/processInstance/detail/index?id=${taskId.value}`)
}

/** 初始化校验 */
if (!props.id) {
  toast.show('参数错误')
}

/** 校验表单 */
function validateForm() {
  if (!formData.reason.trim()) {
    toast.show('请输入审批意见')
    return false
  }
  return true
}

/** 提交审批 */
async function handleSubmit() {
  if (submitting.value)
    return
  if (!validateForm())
    return

  submitting.value = true
  try {
    const api = isApprove.value ? approveTask : rejectTask
    const result = await api({
      id: taskId.value as string,
      reason: formData.reason,
    })
    if (result) {
      toast.success('审批成功')
      setTimeout(() => {
        handleBack()
      }, 1500)
    }
  } catch (error) {
    console.error('[audit] 审批失败:', error)
  } finally {
    submitting.value = false
  }
}
</script>
