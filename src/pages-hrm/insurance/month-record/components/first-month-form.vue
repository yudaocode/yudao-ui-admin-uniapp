<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="border-radius: 24rpx 24rpx 0 0;"
    @close="visible = false"
  >
    <view class="bg-white px-24rpx pb-24rpx pt-32rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        新建首月社保表
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-form-item
          title="社保月份"
          title-width="180rpx"
          prop="yearMonth"
          is-link
          :value="monthText"
          placeholder="请选择社保月份"
          @click="monthVisible = true"
        />
        <wd-datetime-picker
          v-model="formData.yearMonth"
          v-model:visible="monthVisible"
          title="请选择社保月份"
          type="year-month"
        />
      </wd-form>
      <view class="mt-32rpx flex gap-24rpx">
        <wd-button class="flex-1" variant="plain" :disabled="formLoading" @click="visible = false">
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
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'
import { createFirstInsuranceMonthRecord } from '@/api/hrm/insurance/month-record'
import { createFormSchema } from '@/utils/wot'
import { formatDate } from '@/utils/date'

const emit = defineEmits<{
  success: [year: number]
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const monthVisible = ref(false) // 月份选择器显隐
const formRef = ref<any>() // 表单引用
const formData = ref({
  yearMonth: '' as string | number,
}) // 表单数据

const monthText = computed(() => {
  if (!formData.value.yearMonth) {
    return ''
  }
  return formatDate(formData.value.yearMonth, 'YYYY-MM') || ''
})

const formSchema = createFormSchema({
  yearMonth: [{ required: true, message: '社保月份不能为空' }],
})

/** 打开弹窗 */
function open() {
  formData.value.yearMonth = ''
  visible.value = true
}
defineExpose({ open })

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    const monthDate = dayjs(formData.value.yearMonth)
    const year = monthDate.year()
    const month = monthDate.month() + 1
    await createFirstInsuranceMonthRecord({ year, month })
    toast.success('创建成功')
    visible.value = false
    emit('success', year)
  } finally {
    formLoading.value = false
  }
}
</script>
