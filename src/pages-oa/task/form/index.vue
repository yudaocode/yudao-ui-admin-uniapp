<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-form-picker
            v-model="formData.type"
            label="任务类型"
            label-width="180rpx"
            prop="type"
            :dict-type="DICT_TYPE.OA_TASK_TYPE"
            placeholder="请选择任务类型"
          />
          <yd-form-picker
            v-model="formData.status"
            label="任务状态"
            label-width="180rpx"
            prop="status"
            :columns="taskStatusOptions"
            placeholder="请选择任务状态"
          />
          <wd-form-item title="任务标题" title-width="180rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              :maxlength="255"
              placeholder="请输入任务标题"
            />
          </wd-form-item>
          <wd-form-item title="开始时间" title-width="180rpx" prop="startTime">
            <view class="flex items-center justify-end gap-12rpx" @click="startTimeVisible = true">
              <text class="text-28rpx" :class="startTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ startTime === '' ? '请选择开始时间' : formatDateTime(startTime) }}
              </text>
              <text v-if="startTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="startTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="结束时间" title-width="180rpx" prop="endTime">
            <view class="flex items-center justify-end gap-12rpx" @click="endTimeVisible = true">
              <text class="text-28rpx" :class="endTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ endTime === '' ? '请选择结束时间' : formatDateTime(endTime) }}
              </text>
              <text v-if="endTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="endTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <UserFormPicker
            v-model="formData.receiverUserIds"
            label="接收人"
            label-width="180rpx"
            prop="receiverUserIds"
            type="checkbox"
            placeholder="请选择接收人"
          />
          <wd-form-item title="是否置顶" title-width="180rpx" prop="top" center>
            <wd-switch v-model="formData.top" />
          </wd-form-item>
          <wd-form-item title="是否取消" title-width="180rpx" prop="canceled" center>
            <wd-switch v-model="formData.canceled" />
          </wd-form-item>
          <wd-form-item title="任务描述" title-width="180rpx" prop="description">
            <wd-textarea
              v-model="formData.description"
              clearable
              :maxlength="2000"
              show-word-limit
              placeholder="请输入任务描述"
            />
          </wd-form-item>
          <wd-form-item title="任务评价" title-width="180rpx" prop="comment">
            <wd-textarea
              v-model="formData.comment"
              clearable
              :maxlength="1000"
              show-word-limit
              placeholder="请输入任务评价"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="startTime" v-model:visible="startTimeVisible" type="datetime" title="开始时间" />
      <wd-datetime-picker v-model="endTime" v-model:visible="endTimeVisible" type="datetime" title="结束时间" />
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Task } from '@/api/oa/task'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createTask, getTask, updateTask } from '@/api/oa/task'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { getDictLabel } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import { OA_TASK_STATUS, OA_TASK_TYPE } from '../../utils/constants'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑任务' : '新增任务')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<Task>>({
  id: undefined,
  type: OA_TASK_TYPE.WORK,
  status: OA_TASK_STATUS.NEW,
  title: '',
  description: '',
  comment: '',
  top: false,
  canceled: false,
  receiverUserIds: [],
}) // 表单数据
const startTime = ref<number | ''>('') // 开始时间选择器值，空字符串承接未选择
const endTime = ref<number | ''>('') // 结束时间选择器值，空字符串承接未选择
const startTimeVisible = ref(false) // 开始时间选择器显示状态
const endTimeVisible = ref(false) // 结束时间选择器显示状态
const taskStatusOptions = Object.values(OA_TASK_STATUS).map(value => ({ // 任务状态选项，标签取字典
  label: getDictLabel(DICT_TYPE.OA_TASK_STATUS, value),
  value,
}))
const formSchema = createFormSchema({ // 表单校验规则
  type: [{ required: true, message: '任务类型不能为空' }],
  status: [{ required: true, message: '任务状态不能为空' }],
  title: [{ required: true, message: '任务标题不能为空' }, { max: 255 }],
  description: [{ required: true, message: '任务描述不能为空' }, { max: 2000 }],
  comment: [{ max: 1000 }],
  receiverUserIds: [{ required: true, message: '任务接收人不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/task/list/index')
}

/** 加载任务详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getTask(Number(props.id))
  formData.value = {
    ...data,
    receiverUserIds: data.receivers?.map(item => item.userId) ?? [],
  }
  startTime.value = data.startTime ? toTimestamp(data.startTime) : ''
  endTime.value = data.endTime ? toTimestamp(data.endTime) : ''
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (startTime.value === '' || endTime.value === '') {
    toast.warning('请选择开始时间和结束时间')
    return
  }
  if (Number(startTime.value) >= Number(endTime.value)) {
    toast.warning('开始时间必须早于结束时间')
    return
  }

  formLoading.value = true
  try {
    // 时间戳由后端 Jackson 反序列化为 LocalDateTime
    const data = {
      ...formData.value,
      startTime: startTime.value,
      endTime: endTime.value,
    } as unknown as Task
    if (props.id) {
      await updateTask(data)
      toast.success('修改成功')
    } else {
      await createTask(data)
      toast.success('新增成功')
    }
    uni.$emit('oa:task:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  if (!props.id) {
    // 新增时默认任务周期为当前时间起的一天
    const now = new Date()
    now.setSeconds(0, 0)
    startTime.value = now.getTime()
    endTime.value = now.getTime() + 24 * 60 * 60 * 1000
  }
})
</script>
