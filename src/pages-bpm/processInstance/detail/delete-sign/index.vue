<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="减签任务"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 操作表单 -->
    <view class="p-24rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <!-- 减签人员选择 -->
          <yd-form-picker
            v-model="formData.deleteSignTaskId"
            label="减签人员："
            label-width="180rpx"
            prop="deleteSignTaskId"
            :columns="taskOptions"
            value-key="id"
            placeholder="请选择减签人员"
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
            减签
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
import { signDeleteTask } from '@/api/bpm/task'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  processInstanceId: string
  taskId: string
  children?: string // JSON 字符串格式的子任务数据
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
const formLoading = ref(false) // 减签提交状态
const formData = reactive({
  deleteSignTaskId: '',
  reason: '',
}) // 表单数据
const formSchema = createFormSchema({
  deleteSignTaskId: [{ required: true, message: '减签人员不能为空' }],
  reason: [{ required: true, message: '审批意见不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const taskOptions = ref<any[]>([])

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-bpm/processInstance/detail/index?id=${processInstanceId.value}&taskId=${taskId.value}`)
}

/** 获取减签人员标签 */
function getDeleteSignUserLabel(task: any): string {
  const deptName = task?.assigneeUser?.deptName || task?.ownerUser?.deptName
  const nickname = task?.assigneeUser?.nickname || task?.ownerUser?.nickname
  return `${nickname} ( 所属部门：${deptName} )`
}

/** 获取可减签的任务列表 */
async function loadDeleteSignTaskList() {
  let childTasks = []
  // 从 props 中获取子任务数据
  if (props.children) {
    try {
      childTasks = JSON.parse(decodeURIComponent(props.children))
    } catch (parseError) {
      console.error('[delete-sign] 解析子任务数据失败:', parseError)
    }
  }
  // 提示没有子任务数据
  if (childTasks.length === 0) {
    toast.show('没有可减签的任务')
    return
  }

  taskOptions.value = childTasks.map(task => ({
    id: task.id,
    label: getDeleteSignUserLabel(task),
  }))
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
    await signDeleteTask({
      id: formData.deleteSignTaskId,
      reason: formData.reason,
    })
    toast.success('减签成功')
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
  loadDeleteSignTaskList()
})
</script>
