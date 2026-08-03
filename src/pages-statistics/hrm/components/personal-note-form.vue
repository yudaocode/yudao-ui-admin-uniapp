<template>
  <wd-popup v-model="visible" position="bottom" closable safe-area-inset-bottom @close="handleClose">
    <view class="p-32rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        新增备忘
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item
            title="提醒时间"
            title-width="180rpx"
            prop="reminderTime"
            is-link
            :value="formatDateTime(formData.reminderTime) || ''"
            placeholder="请选择提醒时间"
            @click="reminderTimeVisible = true"
          />
          <wd-datetime-picker
            v-model="formData.reminderTime"
            v-model:visible="reminderTimeVisible"
            type="datetime"
          />
          <wd-form-item title="备忘内容" title-width="180rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              clearable
              placeholder="请输入备忘内容"
              :maxlength="1024"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-32rpx flex gap-24rpx">
        <wd-button class="flex-1" variant="plain" @click="handleClose">
          取消
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { EmployeePersonalNote } from '@/api/hrm/employee/personal-note'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { ref, watch } from 'vue'
import { createEmployeePersonalNote } from '@/api/hrm/employee/personal-note'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  modelValue: boolean
  date?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const reminderTimeVisible = ref(false) // 时间选择弹窗
const formData = ref<EmployeePersonalNote>({
  content: '',
  reminderTime: Date.now(),
}) // 备忘表单
const formSchema = createFormSchema({
  reminderTime: [{ required: true, message: '提醒时间不能为空' }],
  content: [{ required: true, message: '备忘内容不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

watch(() => props.modelValue, (value) => {
  visible.value = value
  if (value) {
    const date = props.date || dayjs().format('YYYY-MM-DD')
    formData.value = {
      content: '',
      reminderTime: dayjs(`${date} ${dayjs().format('HH:mm')}:00`).valueOf(),
    }
  }
})

watch(visible, (value) => {
  emit('update:modelValue', value)
})

/** 关闭弹窗 */
function handleClose() {
  visible.value = false
}

/** 提交新增备忘 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    await createEmployeePersonalNote({
      content: formData.value.content,
      reminderTime: Number(formData.value.reminderTime),
    })
    toast.success('新增备忘成功')
    handleClose()
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
