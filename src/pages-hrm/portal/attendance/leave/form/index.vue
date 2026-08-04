<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="请假申请"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-form-picker
            v-model="formData.type"
            label="请假类型"
            label-width="200rpx"
            prop="type"
            :dict-type="DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE"
            dict-kind="str"
            placeholder="请选择请假类型"
          />
          <wd-form-item
            title="开始时间"
            title-width="200rpx"
            prop="startTime"
            center
          >
            <view class="w-full" @click="startVisible = true">
              <wd-input
                :model-value="formatDateTime(formData.startTime) || ''"
                readonly
                align-right
                placeholder="请选择开始时间"
              />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.startTime"
            v-model:visible="startVisible"
            type="datetime"
            title="开始时间"
          />
          <wd-form-item
            title="结束时间"
            title-width="200rpx"
            prop="endTime"
            center
          >
            <view class="w-full" @click="endVisible = true">
              <wd-input
                :model-value="formatDateTime(formData.endTime) || ''"
                readonly
                align-right
                placeholder="请选择结束时间"
              />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.endTime"
            v-model:visible="endVisible"
            type="datetime"
            title="结束时间"
          />
          <wd-form-item title="请假天数" title-width="200rpx" prop="day">
            <wd-input-number
              v-model="formData.day"
              :min="0.01"
              :precision="2"
              :step="0.5"
            />
          </wd-form-item>
          <wd-form-item title="请假事由" title-width="200rpx" prop="reason" vertical>
            <wd-textarea
              v-model="formData.reason"
              clearable
              placeholder="请输入请假事由"
              :maxlength="300"
              show-word-limit
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark" vertical>
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="请输入备注"
              :maxlength="500"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部提交按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          提交
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { PortalAttendanceLeaveCreateReq } from '@/api/hrm/portal/attendance/leave'
import { onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createMyAttendanceLeave } from '@/api/hrm/portal/attendance/leave'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const startVisible = ref(false) // 开始时间选择器显隐
const endVisible = ref(false) // 结束时间选择器显隐
const formData = ref({ // 表单数据
  type: undefined as string | undefined,
  startTime: '' as number | string,
  endTime: '' as number | string,
  day: 1,
  reason: '',
  remark: '',
})
const formSchema = createFormSchema({
  type: [{ required: true, message: '请选择请假类型' }],
  startTime: [{ required: true, message: '请选择开始时间' }],
  endTime: [{
    required: true,
    message: '请选择结束时间',
    validator: () => {
      if (!formData.value.endTime) {
        return Promise.reject(new Error('请选择结束时间'))
      }
      if (
        formData.value.startTime
        && Number(formData.value.endTime) <= Number(formData.value.startTime)
      ) {
        return Promise.reject(new Error('结束时间必须晚于开始时间'))
      }
      return Promise.resolve()
    },
  }],
  day: [{ required: true, message: '请输入请假天数' }],
  reason: [{ required: true, message: '请输入请假事由' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/portal/attendance/report/index')
}

/** 提交请假申请 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    const data: PortalAttendanceLeaveCreateReq = {
      type: formData.value.type!,
      startTime: Number(formData.value.startTime),
      endTime: Number(formData.value.endTime),
      day: Number(formData.value.day),
      reason: formData.value.reason,
      remark: formData.value.remark || undefined,
    }
    await createMyAttendanceLeave(data)
    toast.success('请假申请已提交')
    handleBack()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  if (!(await checkHrmPortalAccess())) {
    return
  }
})
</script>
