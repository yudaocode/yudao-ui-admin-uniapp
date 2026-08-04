<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    closable
    safe-area-inset-bottom
    @close="visible = false"
  >
    <view class="p-32rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ title }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-form-picker
            v-model="formData.type"
            label="特殊日期类型"
            label-width="200rpx"
            prop="type"
            :columns="typeColumns"
            placeholder="请选择类型"
          />
          <wd-form-item
            title="日期"
            title-width="200rpx"
            prop="date"
            is-link
            :value="dateText"
            placeholder="请选择日期"
            @click="dateVisible = true"
          />
          <wd-datetime-picker
            v-model="datePicker"
            v-model:visible="dateVisible"
            title="请选择日期"
            type="date"
            @confirm="syncDateModel"
          />
        </wd-cell-group>
      </wd-form>
      <view class="mt-32rpx">
        <wd-button type="primary" block @click="handleConfirm">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AttendanceSpecialDate } from '@/api/hrm/attendance/group'
import { computed, ref } from 'vue'
import { HrmAttendanceHolidayType } from '@/pages-hrm/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{
  confirm: [specialDate: AttendanceSpecialDate]
}>()

const visible = ref(false) // 弹窗显示
const editing = ref(false) // 是否编辑
const formRef = ref<FormInstance>() // 表单引用
const dateVisible = ref(false) // 日期选择器显隐
const datePicker = ref<number | string>('') // 日期本地值
const formData = ref<AttendanceSpecialDate>(createDefaultSpecialDate()) // 表单数据
const typeColumns = [ // 特殊日期类型选项
  { label: '上班', value: HrmAttendanceHolidayType.WORK },
  { label: '休息', value: HrmAttendanceHolidayType.REST },
]
const formSchema = createFormSchema({
  type: [{ required: true, message: '特殊日期类型不能为空' }],
  date: [{ required: true, message: '日期不能为空' }],
})
const title = computed(() => editing.value ? '编辑特殊日期' : '新增特殊日期')
const dateText = computed(() => formatDate(formData.value.date) || '')

/** 打开弹窗 */
function open(specialDate?: AttendanceSpecialDate) {
  editing.value = !!specialDate
  formData.value = specialDate
    ? { ...specialDate }
    : createDefaultSpecialDate()
  datePicker.value = formData.value.date ? Number(formData.value.date) : ''
  visible.value = true
}
defineExpose({ open })

/** 同步日期 */
function syncDateModel() {
  formData.value.date = datePicker.value ? Number(datePicker.value) : undefined
}

/** 确认 */
async function handleConfirm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  emit('confirm', { ...formData.value })
  visible.value = false
}

/** 创建默认特殊日期 */
function createDefaultSpecialDate(): AttendanceSpecialDate {
  return {
    type: HrmAttendanceHolidayType.WORK,
    date: undefined,
  }
}
</script>
