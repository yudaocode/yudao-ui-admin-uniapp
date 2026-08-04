<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item
            title="日期"
            title-width="180rpx"
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
          <yd-form-picker
            v-model="formData.type"
            label="日期类型"
            label-width="180rpx"
            prop="type"
            :dict-type="DICT_TYPE.HRM_ATTENDANCE_HOLIDAY_TYPE"
            placeholder="请选择日期类型"
          />
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AttendanceHoliday } from '@/api/hrm/attendance/holiday'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createAttendanceHoliday,
  getAttendanceHoliday,
  updateAttendanceHoliday,
} from '@/api/hrm/attendance/holiday'
import { HrmAttendanceHolidayType } from '@/pages-hrm/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑节假日' : '新增节假日')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const dateVisible = ref(false) // 日期选择器显隐
const datePicker = ref<number | string>('') // 日期本地值
const formData = ref<AttendanceHoliday>({ // 表单数据
  id: undefined,
  date: undefined,
  type: HrmAttendanceHolidayType.REST,
})
const formSchema = createFormSchema({
  date: [{ required: true, message: '日期不能为空' }],
  type: [{ required: true, message: '日期类型不能为空' }],
})
const dateText = computed(() => formatDate(formData.value.date) || '')

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/attendance/config/holiday/index')
}

/** 同步日期到表单 */
function syncDateModel() {
  formData.value.date = datePicker.value ? Number(datePicker.value) : undefined
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getAttendanceHoliday(Number(props.id))
  datePicker.value = formData.value.date ? Number(formData.value.date) : ''
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateAttendanceHoliday(formData.value)
      toast.success('修改成功')
    } else {
      await createAttendanceHoliday(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('hrm:attendance:holiday:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
