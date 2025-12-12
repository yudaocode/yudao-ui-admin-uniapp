<template>
  <view class="min-h-screen bg-[#f5f5f5]">
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
import { onLoad } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'
import { approveTask, rejectTask } from '@/api/bpm/task'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const taskId = ref('')
const pass = ref(true) // true: 同意, false: 拒绝
const submitting = ref(false)
const formData = reactive({
  reason: '',
})

/** 是否为同意操作 */
const isApprove = computed(() => pass.value)

/** 返回上一页 */
function handleBack() {
  uni.navigateBack()
}

/** 校验表单 */
function validateForm() {
  if (!formData.reason.trim()) {
    uni.showToast({
      title: '请输入审批意见',
      icon: 'none',
    })
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
      id: taskId.value,
      reason: formData.reason,
    })
    if (result) {
      uni.showToast({
        title: '审批成功',
        icon: 'success',
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  }
  catch (error) {
    console.error('[audit] 审批失败:', error)
  }
  finally {
    submitting.value = false
  }
}

/** 初始化 */
onLoad((options) => {
  if (!options?.id) {
    uni.showToast({
      title: '参数错误',
      icon: 'none',
    })
    return
  }
  taskId.value = options.id
  pass.value = options.pass !== 'false' // 默认为同意
})
</script>
