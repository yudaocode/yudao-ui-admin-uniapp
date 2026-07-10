<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="isDelegate ? '委派任务' : '转办任务'"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 操作表单 -->
    <view class="p-24rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <!-- 用户选择 -->
          <UserFormPicker
            v-model="formData.userId"
            :label="`${isDelegate ? '接收人' : '新审批人'}：`"
            prop="userId"
            :placeholder="`请选择${isDelegate ? '接收人' : '新审批人'}`"
          />
          <!-- 审批意见 -->
          <wd-form-item prop="reason" title="审批意见：" title-width="180rpx">
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
        <view class="mt-48rpx">
          <wd-button
            type="primary"
            block
            :loading="formLoading"
            :disabled="formLoading"
            @click="handleSubmit"
          >
            {{ isDelegate ? '委派' : '转办' }}
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
import { delegateTask, transferTask } from '@/api/bpm/task'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  processInstanceId: string
  taskId: string
  type: string // 'delegate' 或 'transfer'
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const taskId = computed(() => props.taskId)
const processInstanceId = computed(() => props.processInstanceId)
const operationType = computed(() => props.type || 'transfer') // 默认转办
const isDelegate = computed(() => operationType.value === 'delegate')
const toast = useToast()
const formLoading = ref(false) // 转办提交状态
const formData = reactive({
  userId: undefined as number | undefined,
  reason: '',
}) // 表单数据
const formSchema = createFormSchema({
  userId: [{ required: true, message: () => `请选择${isDelegate.value ? '接收人' : '新审批人'}` }],
  reason: [{ required: true, message: '审批意见不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-bpm/processInstance/detail/index?id=${processInstanceId.value}&taskId=${taskId.value}`)
}

/** 提交表单 */
async function handleSubmit() {
  if (formLoading.value) {
    return
  }
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = {
      id: taskId.value as string,
      reason: formData.reason,
    }
    if (isDelegate.value) {
      await delegateTask({
        ...data,
        delegateUserId: formData.userId!,
      })
    } else {
      await transferTask({
        ...data,
        assigneeUserId: formData.userId!,
      })
    }
    toast.success(`${isDelegate.value ? '委派' : '转办'}成功`)
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
