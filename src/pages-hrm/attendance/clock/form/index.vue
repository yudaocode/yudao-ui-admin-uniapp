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
          <EmployeeFormPicker
            v-model="formData.employeeId"
            label="员工"
            prop="employeeId"
            placeholder="请选择员工"
            :disabled="!!props.id"
            :entry-status="HrmEmployeeEntryStatus.ACTIVE"
            @confirm="handleShiftConditionChange"
          />
          <yd-form-picker
            v-model="formData.type"
            label="打卡类型"
            label-width="180rpx"
            prop="type"
            :dict-type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_TYPE"
            placeholder="请选择打卡类型"
            @confirm="applyShiftDefaultTime"
          />
          <wd-form-item title="打卡日期" title-width="180rpx" prop="attendanceDate" is-link :value="attendanceDateText" placeholder="请选择打卡日期" @click="dateVisible = true" />
          <wd-datetime-picker
            v-model="attendanceDate"
            v-model:visible="dateVisible"
            title="请选择打卡日期"
            type="date"
            @confirm="handleAttendanceDateConfirm"
          />
          <wd-form-item title="打卡时间" title-width="180rpx" prop="clockTime" is-link :value="clockTimePicker || ''" placeholder="请选择打卡时间" @click="timeVisible = true" />
          <wd-datetime-picker
            v-model="clockTimePicker"
            v-model:visible="timeVisible"
            title="请选择打卡时间"
            type="time"
            @confirm="syncClockTimeModel"
          />
          <wd-form-item title="备注" title-width="180rpx" prop="remark" vertical>
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="请输入备注"
              :maxlength="255"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 班次提示 -->
      <view v-if="shiftInfo" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#e6f4ff] p-24rpx text-26rpx text-[#1677ff]">
        {{ shiftTimeTip }}
      </view>
      <view
        v-else-if="formData.employeeId && attendanceDate && !shiftLoading"
        class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#fa8c16]"
      >
        该员工当天未配置有效班次，不能补录打卡
      </view>
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
import type { AttendanceClock, AttendanceClockShift } from '@/api/hrm/attendance/clock'
import dayjs from 'dayjs'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, ref } from 'vue'
import {
  createAttendanceClock,
  getAttendanceClock,
  getAttendanceClockShift,
  updateAttendanceClock,
} from '@/api/hrm/attendance/clock'
import {
  HrmAttendanceClockType,
  HrmEmployeeEntryStatus,
} from '@/pages-hrm/utils/constants'
import EmployeeFormPicker from '@/pages-hrm/employee/components/employee-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, padTimeSeconds, toTimestamp } from '@/utils/date'
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
const getTitle = computed(() => props.id ? '编辑打卡记录' : '手工录入打卡')
const formLoading = ref(false) // 表单提交状态
const shiftLoading = ref(false) // 班次加载状态
const shiftInfo = ref<AttendanceClockShift>() // 员工当天实际班次
const dateVisible = ref(false) // 打卡日期选择器显隐
const timeVisible = ref(false) // 打卡时间选择器显隐
const attendanceDate = ref<number | string>(Date.now()) // 打卡日期本地值
const clockTimePicker = ref<string>('') // 打卡时间本地值 HH:mm
const formData = ref<AttendanceClock & {
  attendanceDate?: number | string
  clockTime?: string
}>({ // 表单数据；attendanceDate/clockTime 承接本地选择器与必填星号
  id: undefined,
  employeeId: undefined,
  type: HrmAttendanceClockType.ON_DUTY,
  attendanceDate: Date.now(),
  clockTime: '',
  remark: '',
})
const formSchema = createFormSchema({
  employeeId: [{ required: true, message: '员工不能为空' }],
  type: [{ required: true, message: '打卡类型不能为空' }],
  attendanceDate: [{
    required: true,
    message: '打卡日期不能为空',
    validator: () => {
      if (!attendanceDate.value) {
        return '打卡日期不能为空'
      }
      return true
    },
  }],
  clockTime: [{
    required: true,
    message: '打卡时间不能为空',
    validator: () => {
      if (!clockTimePicker.value) {
        return '打卡时间不能为空'
      }
      return true
    },
  }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const attendanceDateText = computed(() => formatDate(attendanceDate.value, 'YYYY-MM-DD')) // 打卡日期展示文案

/** 同步打卡日期到表单模型（必填星号与校验） */
function syncAttendanceDateModel() {
  formData.value.attendanceDate = attendanceDate.value
}

/** 同步打卡时间到表单模型（必填星号与校验） */
function syncClockTimeModel() {
  formData.value.clockTime = clockTimePicker.value || ''
}

/** 班次提示文案 */
const shiftTimeTip = computed(() => {
  if (!shiftInfo.value) {
    return ''
  }
  const clockInRange = formatShiftTimeRange(
    shiftInfo.value.clockInStartTime,
    shiftInfo.value.clockInEndTime,
  )
  const clockOutRange = formatShiftTimeRange(
    shiftInfo.value.clockOutStartTime,
    shiftInfo.value.clockOutEndTime,
  )
  return `班次 ${formatDate(shiftInfo.value.startTime, 'HH:mm')}-${formatDate(shiftInfo.value.endTime, 'HH:mm')}；上班可打卡 ${clockInRange}；下班可打卡 ${clockOutRange}`
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/attendance/clock/index')
}

/** 加载打卡记录详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formLoading.value = true
  try {
    const data = await getAttendanceClock(Number(props.id))
    formData.value = {
      id: data.id,
      employeeId: data.employeeId,
      type: data.type,
      attendanceDate: toTimestamp(data.attendanceTime) || Date.now(),
      clockTime: formatDate(data.clockTime, 'HH:mm'),
      remark: data.remark || '',
    }
    attendanceDate.value = formData.value.attendanceDate!
    clockTimePicker.value = formData.value.clockTime || ''
    await loadShift()
  } finally {
    formLoading.value = false
  }
}

/** 打卡日期确认后同步并刷新班次 */
function handleAttendanceDateConfirm() {
  syncAttendanceDateModel()
  handleShiftConditionChange()
}

/** 重新加载员工当天实际班次 */
function handleShiftConditionChange() {
  nextTick(() => loadShift(true))
}

/** 加载员工当天实际班次 */
async function loadShift(applyDefaultTime = false) {
  shiftInfo.value = undefined
  if (!formData.value.employeeId || !attendanceDate.value) {
    return
  }
  shiftLoading.value = true
  try {
    shiftInfo.value = await getAttendanceClockShift({
      employeeId: formData.value.employeeId,
      attendanceTime: formatDate(attendanceDate.value, 'YYYY-MM-DD HH:mm:ss'),
    })
    if (applyDefaultTime) {
      applyShiftDefaultTime()
    }
  } finally {
    shiftLoading.value = false
  }
}

/** 根据打卡类型回填实际班次的应打卡时间 */
function applyShiftDefaultTime() {
  if (!shiftInfo.value) {
    clockTimePicker.value = ''
    syncClockTimeModel()
    return
  }
  const defaultTime = formData.value.type === HrmAttendanceClockType.ON_DUTY
    ? shiftInfo.value.startTime
    : shiftInfo.value.endTime
  clockTimePicker.value = formatDate(defaultTime, 'HH:mm')
  syncClockTimeModel()
}

/** 构建实际打卡时间，并兼容跨日打卡范围 */
function buildClockTime(beginTime: Date | string | number, endTime: Date | string | number) {
  const timeText = padTimeSeconds(clockTimePicker.value) || '00:00:00'
  let clockTime = dayjs(`${formatDate(attendanceDate.value, 'YYYY-MM-DD')} ${timeText}`)
  const begin = dayjs(beginTime)
  const end = dayjs(endTime)
  const nextDayClockTime = clockTime.add(1, 'day')
  if (
    clockTime.isBefore(begin)
    && (nextDayClockTime.isBefore(end) || nextDayClockTime.isSame(end))
  ) {
    clockTime = nextDayClockTime
  }
  return clockTime.isBefore(begin) || clockTime.isAfter(end) ? undefined : clockTime.valueOf()
}

/** 格式化允许打卡时间范围 */
function formatShiftTimeRange(beginTime: Date | string | number, endTime: Date | string | number) {
  return `${formatDate(beginTime, 'MM-DD HH:mm')} 至 ${formatDate(endTime, 'MM-DD HH:mm')}`
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!shiftInfo.value) {
    toast.warning('该员工当天未配置有效班次，不能补录打卡')
    return
  }

  const attendanceTime = formData.value.type === HrmAttendanceClockType.ON_DUTY
    ? shiftInfo.value.startTime
    : shiftInfo.value.endTime
  const beginClockTime = formData.value.type === HrmAttendanceClockType.ON_DUTY
    ? shiftInfo.value.clockInStartTime
    : shiftInfo.value.clockOutStartTime
  const endClockTime = formData.value.type === HrmAttendanceClockType.ON_DUTY
    ? shiftInfo.value.clockInEndTime
    : shiftInfo.value.clockOutEndTime
  const clockTime = buildClockTime(beginClockTime, endClockTime)
  if (!clockTime) {
    toast.warning(`打卡时间需在 ${formatShiftTimeRange(beginClockTime, endClockTime)} 内`)
    return
  }

  formLoading.value = true
  try {
    const data: AttendanceClock = {
      id: formData.value.id,
      employeeId: formData.value.employeeId,
      type: formData.value.type,
      attendanceTime: toTimestamp(attendanceTime),
      clockTime,
      remark: formData.value.remark,
    }
    if (props.id) {
      await updateAttendanceClock(data)
      toast.success('修改成功')
    } else {
      await createAttendanceClock(data)
      toast.success('新增成功')
    }
    uni.$emit('hrm:attendance:clock:reload')
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
