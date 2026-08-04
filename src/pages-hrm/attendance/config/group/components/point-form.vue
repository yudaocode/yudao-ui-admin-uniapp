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
          <wd-form-item title="地点名称" prop="name" title-width="180rpx">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入地点名称"
              :maxlength="50"
            />
          </wd-form-item>
          <wd-form-item title="打卡地址" prop="address" title-width="180rpx">
            <wd-input
              v-model="formData.address"
              clearable
              placeholder="请输入打卡地址"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item title="经度" prop="longitude" title-width="180rpx">
            <wd-input-number
              v-model="formData.longitude"
              allow-null
              :min="-180"
              :max="180"
              :precision="6"
            />
          </wd-form-item>
          <wd-form-item title="纬度" prop="latitude" title-width="180rpx">
            <wd-input-number
              v-model="formData.latitude"
              allow-null
              :min="-90"
              :max="90"
              :precision="6"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.radius"
            label="打卡范围"
            label-width="180rpx"
            prop="radius"
            :columns="radiusColumns"
            placeholder="请选择打卡范围"
          />
        </wd-cell-group>
      </wd-form>
      <view class="mt-16rpx text-24rpx text-[#999]">
        移动端请手动填写经纬度；范围单位为米。
      </view>
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
import type { AttendancePoint } from '@/api/hrm/attendance/group'
import { computed, ref } from 'vue'
import { HRM_ATTENDANCE_POINT_RADIUS_OPTIONS } from '@/pages-hrm/utils/constants'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{
  confirm: [point: AttendancePoint]
}>()

const visible = ref(false) // 弹窗显示
const editing = ref(false) // 是否编辑
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<AttendancePoint>(createDefaultPoint()) // 表单数据
const radiusColumns = HRM_ATTENDANCE_POINT_RADIUS_OPTIONS.map(radius => ({ // 打卡范围选项
  label: `${radius} 米`,
  value: radius,
}))
const formSchema = createFormSchema({
  name: [{ required: true, message: '地点名称不能为空' }],
  address: [{ required: true, message: '打卡地址不能为空' }],
  longitude: [{ required: true, message: '经度不能为空' }],
  latitude: [{ required: true, message: '纬度不能为空' }],
  radius: [{ required: true, message: '打卡范围不能为空' }],
})
const title = computed(() => editing.value ? '编辑打卡地址' : '新增打卡地址')

/** 打开弹窗 */
function open(point?: AttendancePoint) {
  editing.value = !!point
  formData.value = point ? { ...point } : createDefaultPoint()
  visible.value = true
}
defineExpose({ open })

/** 确认 */
async function handleConfirm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  emit('confirm', { ...formData.value })
  visible.value = false
}

/** 创建默认打卡地点 */
function createDefaultPoint(): AttendancePoint {
  return {
    name: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    radius: 300,
  }
}
</script>
