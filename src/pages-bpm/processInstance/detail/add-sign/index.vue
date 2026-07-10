<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="加签任务"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 操作表单 -->
    <view class="p-24rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <!-- 加签处理人 -->
          <UserFormPicker
            v-model="formData.userIds"
            label="加签处理人："
            label-width="200rpx"
            prop="userIds"
            placeholder="请选择加签处理人"
            type="checkbox"
          />
          <!-- 审批意见 -->
          <wd-form-item prop="reason" title="审批意见：" title-width="200rpx">
            <wd-textarea
              v-model="formData.reason"
              placeholder="请输入审批意见"
              :maxlength="500"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
        <!-- 提交按钮 -->
        <view class="mt-48rpx flex gap-16rpx">
          <wd-button
            type="primary"
            class="flex-1"
            variant="plain"
            :loading="formLoading"
            :disabled="formLoading"
            @click="handleSubmit('before')"
          >
            向前加签
          </wd-button>
          <wd-button
            type="primary"
            class="flex-1"
            :loading="formLoading"
            :disabled="formLoading"
            @click="handleSubmit('after')"
          >
            向后加签
          </wd-button>
        </view>
      </wd-form>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import { signCreateTask } from '@/api/bpm/task'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  processInstanceId: string
  taskId: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const taskId = computed(() => props.taskId)
const processInstanceId = computed(() => props.processInstanceId)
const toast = useToast()
const formLoading = ref(false) // 加签提交状态
const formData = reactive({
  userIds: [] as number[],
  reason: '',
}) // 表单数据
const formSchema = createFormSchema({
  userIds: [{ required: true, message: '加签处理人不能为空' }],
  reason: [{ required: true, message: '审批意见不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-bpm/processInstance/detail/index?id=${processInstanceId.value}&taskId=${taskId.value}`)
}

/** 提交表单 */
async function handleSubmit(type: 'before' | 'after') {
  if (formLoading.value) {
    return
  }
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    await signCreateTask({
      id: taskId.value as string,
      type,
      userIds: formData.userIds,
      reason: formData.reason,
    })
    const actionText = type === 'before' ? '向前加签' : '向后加签'
    toast.success(`${actionText}成功`)
    uni.$emit('bpm:processInstance:reload')
    uni.$emit('bpm:task:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  if (!props.taskId || !props.processInstanceId) {
    toast.show('参数错误')
  }
})
</script>
