<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    closable
    safe-area-inset-bottom
    custom-style="height: 90%;"
    @close="visible = false"
  >
    <view class="h-full flex flex-col overflow-hidden">
      <view class="shrink-0 p-32rpx pb-16rpx text-center text-32rpx text-[#333] font-semibold">
        {{ title }}
      </view>
      <scroll-view scroll-y class="min-h-0 flex-1">
        <view class="px-24rpx pb-32rpx">
          <wd-form ref="formRef" :model="formData" :schema="formSchema">
            <wd-cell-group border>
              <wd-form-item title="工作日" prop="weeks" title-width="180rpx" vertical>
                <wd-checkbox-group v-model="formData.weeks" shape="button">
                  <wd-checkbox
                    v-for="item in HRM_WEEK_OPTIONS"
                    :key="item.value"
                    :name="item.value"
                  >
                    {{ item.label }}
                  </wd-checkbox>
                </wd-checkbox-group>
              </wd-form-item>
              <view class="mx-24rpx mb-16rpx rounded-12rpx bg-[#e6f4ff] px-24rpx py-16rpx text-24rpx text-[#1677ff]">
                打卡窗口需覆盖对应上下班时间；结束早于开始按次日计算。
              </view>
              <wd-form-item
                title="上班时间"
                title-width="180rpx"
                prop="startTime"
                is-link
                :value="formData.startTime || ''"
                placeholder="请选择"
                @click="openTimePicker('startTime')"
              />
              <wd-form-item
                title="下班时间"
                title-width="180rpx"
                prop="endTime"
                is-link
                :value="formData.endTime || ''"
                placeholder="请选择"
                @click="openTimePicker('endTime')"
              />
              <wd-form-item
                title="上班打卡开始"
                title-width="180rpx"
                prop="clockInStartTime"
                is-link
                :value="formData.clockInStartTime || ''"
                placeholder="请选择"
                @click="openTimePicker('clockInStartTime')"
              />
              <wd-form-item
                title="上班打卡结束"
                title-width="180rpx"
                prop="clockInEndTime"
                is-link
                :value="formData.clockInEndTime || ''"
                placeholder="请选择"
                @click="openTimePicker('clockInEndTime')"
              />
              <wd-form-item
                title="下班打卡开始"
                title-width="180rpx"
                prop="clockOutStartTime"
                is-link
                :value="formData.clockOutStartTime || ''"
                placeholder="请选择"
                @click="openTimePicker('clockOutStartTime')"
              />
              <wd-form-item
                title="下班打卡结束"
                title-width="180rpx"
                prop="clockOutEndTime"
                is-link
                :value="formData.clockOutEndTime || ''"
                placeholder="请选择"
                @click="openTimePicker('clockOutEndTime')"
              />
              <wd-form-item
                title="休息开始"
                title-width="180rpx"
                prop="restStartTime"
                is-link
                :value="formData.restStartTime || ''"
                placeholder="请选择"
                @click="openTimePicker('restStartTime')"
              />
              <wd-form-item
                title="休息结束"
                title-width="180rpx"
                prop="restEndTime"
                is-link
                :value="formData.restEndTime || ''"
                placeholder="请选择"
                @click="openTimePicker('restEndTime')"
              />
              <wd-cell title="不计入工作时长" title-width="240rpx">
                <wd-switch v-model="formData.excludeRestTime" />
              </wd-cell>
              <wd-cell title="合计工作时长" :value="formatHrmAttendanceShiftDuration(formData)" />
            </wd-cell-group>
          </wd-form>
        </view>
      </scroll-view>
      <view class="shrink-0 border-t border-[#eee] p-24rpx">
        <wd-button type="primary" block @click="handleConfirm">
          确定
        </wd-button>
      </view>
    </view>

    <wd-datetime-picker
      v-model="timePickerValue"
      v-model:visible="timeVisible"
      title="请选择时间"
      type="time"
      @confirm="confirmTimePicker"
    />
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AttendanceShift } from '@/api/hrm/attendance/group'
import { computed, ref } from 'vue'
import { HRM_WEEK_OPTIONS } from '@/pages-hrm/utils/constants'
import { formatHrmAttendanceShiftDuration } from '@/pages-hrm/utils/format'
import { createFormSchema } from '@/utils/wot'

type TimeField = keyof Pick<
  AttendanceShift,
  | 'startTime'
  | 'endTime'
  | 'clockInStartTime'
  | 'clockInEndTime'
  | 'clockOutStartTime'
  | 'clockOutEndTime'
  | 'restStartTime'
  | 'restEndTime'
>

const emit = defineEmits<{
  confirm: [shift: AttendanceShift]
}>()

const visible = ref(false) // 弹窗显示
const editing = ref(false) // 是否编辑
const formRef = ref<FormInstance>() // 表单引用
const timeVisible = ref(false) // 时间选择器显隐
const timePickerValue = ref<string>('') // 时间本地值
const currentTimeField = ref<TimeField>('startTime') // 当前编辑时间字段
const formData = ref<AttendanceShift>(createDefaultShift()) // 表单数据
const formSchema = createFormSchema({
  weeks: [{ required: true, message: '工作日不能为空' }],
  startTime: [{ required: true, message: '上班时间不能为空' }],
  endTime: [{ required: true, message: '下班时间不能为空' }],
  clockInStartTime: [{ required: true, message: '上班打卡开始时间不能为空' }],
  clockInEndTime: [{ required: true, message: '上班打卡结束时间不能为空' }],
  clockOutStartTime: [{ required: true, message: '下班打卡开始时间不能为空' }],
  clockOutEndTime: [{ required: true, message: '下班打卡结束时间不能为空' }],
  restStartTime: [{ required: true, message: '休息开始时间不能为空' }],
  restEndTime: [{ required: true, message: '休息结束时间不能为空' }],
})
const title = computed(() => editing.value ? '编辑班次' : '新增班次')

/** 打开弹窗 */
function open(shift?: AttendanceShift) {
  editing.value = !!shift
  formData.value = shift
    ? { ...shift, weeks: [...shift.weeks] }
    : createDefaultShift()
  visible.value = true
}
defineExpose({ open })

/** 打开时间选择 */
function openTimePicker(field: TimeField) {
  currentTimeField.value = field
  timePickerValue.value = formData.value[field] || ''
  timeVisible.value = true
}

/** 确认时间 */
function confirmTimePicker() {
  formData.value[currentTimeField.value] = String(timePickerValue.value || '')
}

/** 确认 */
async function handleConfirm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  emit('confirm', {
    ...formData.value,
    weeks: [...formData.value.weeks].sort(),
  })
  visible.value = false
}

/** 创建默认班次 */
function createDefaultShift(): AttendanceShift {
  return {
    weeks: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '18:00',
    clockInStartTime: '05:00',
    clockInEndTime: '17:59',
    clockOutStartTime: '09:01',
    clockOutEndTime: '04:59',
    restStartTime: '12:00',
    restEndTime: '13:00',
    excludeRestTime: false,
  }
}
</script>
