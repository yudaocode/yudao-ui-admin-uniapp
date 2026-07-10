<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="退回任务"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 操作表单 -->
    <view class="p-24rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <!-- 退回节点选择 -->
          <yd-form-picker
            v-model="formData.targetActivityId"
            label="退回节点："
            prop="targetActivityId"
            :columns="activityOptions"
            label-key="name"
            value-key="taskDefinitionKey"
            placeholder="请选择退回节点"
          />
          <!-- 退回原因 -->
          <wd-form-item prop="reason" title="退回原因：" title-width="180rpx">
            <wd-textarea
              v-model="formData.reason"
              placeholder="请输入退回原因"
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
            退回
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
import { getTaskListByReturn, returnTask } from '@/api/bpm/task'
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
const formLoading = ref(false) // 退回提交状态
const formData = reactive({
  targetActivityId: '',
  reason: '',
}) // 表单数据
const formSchema = createFormSchema({
  targetActivityId: [{ required: true, message: '退回节点不能为空' }],
  reason: [{ required: true, message: '退回原因不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const activityOptions = ref<any[]>([])

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-bpm/processInstance/detail/index?id=${processInstanceId.value}&taskId=${taskId.value}`)
}

/** 获取可退回的节点列表 */
async function loadReturnTaskList() {
  const result = await getTaskListByReturn(taskId.value)
  activityOptions.value = result
  if (result.length === 0) {
    toast.show('当前没有可退回的节点')
  }
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
    await returnTask({
      id: taskId.value as string,
      targetTaskDefinitionKey: formData.targetActivityId,
      reason: formData.reason,
    })

    toast.success('退回成功')
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
    return
  }
  loadReturnTaskList()
})
</script>
