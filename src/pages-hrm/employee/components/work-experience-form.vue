<template>
  <wd-popup v-model="visible" position="bottom" closable safe-area-inset-bottom @close="visible = false">
    <scroll-view scroll-y class="max-h-80vh px-32rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ title }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="工作单位" title-width="200rpx" prop="workUnit">
            <wd-input v-model="formData.workUnit" clearable placeholder="请输入工作单位" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="职务" title-width="200rpx" prop="postName">
            <wd-input v-model="formData.postName" clearable placeholder="请输入职务" :maxlength="128" />
          </wd-form-item>
          <wd-form-item title="开始日期" title-width="200rpx" prop="startTime" center>
            <view class="w-full" @click="startVisible = true">
              <wd-input
                :model-value="formatDate(startPicker) || ''"
                readonly
                align-right
                placeholder="请选择"
              />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="startPicker"
            v-model:visible="startVisible"
            type="date"
            title="开始日期"
          />
          <wd-form-item title="结束日期" title-width="200rpx" prop="endTime" center>
            <view class="w-full" @click="endVisible = true">
              <wd-input
                :model-value="formatDate(endPicker) || ''"
                readonly
                align-right
                placeholder="请选择"
              />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="endPicker"
            v-model:visible="endVisible"
            type="date"
            title="结束日期"
          />
          <wd-form-item title="离职原因" title-width="200rpx" prop="reason">
            <wd-input v-model="formData.reason" clearable placeholder="请输入离职原因" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="证明人" title-width="200rpx" prop="witnessName">
            <wd-input v-model="formData.witnessName" clearable placeholder="请输入证明人" :maxlength="64" />
          </wd-form-item>
          <wd-form-item title="证明人手机" title-width="200rpx" prop="witnessPhone">
            <wd-input v-model="formData.witnessPhone" clearable placeholder="请输入证明人手机号" :maxlength="40" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-input v-model="formData.remark" clearable placeholder="请输入备注" :maxlength="500" />
          </wd-form-item>
          <wd-form-item title="排序" title-width="200rpx" prop="sort">
            <wd-input-number v-model="formData.sort" allow-null :min="0" :precision="0" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-32rpx">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </scroll-view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { EmployeeWorkExperience } from '@/api/hrm/employee/work-experience'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import {
  createEmployeeWorkExperience,
  updateEmployeeWorkExperience,
} from '@/api/hrm/employee/work-experience'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{ success: [] }>()
const toast = useToast()
const visible = ref(false)
const formLoading = ref(false)
const startVisible = ref(false)
const endVisible = ref(false)
const startPicker = ref<number | string>('') // 开始日期本地值
const endPicker = ref<number | string>('') // 结束日期本地值
const formRef = ref<FormInstance>()
const formData = ref<EmployeeWorkExperience>({ sort: 1 })
const formSchema = createFormSchema({
  workUnit: [{ required: true, message: '工作单位不能为空' }],
  postName: [{ required: true, message: '职务不能为空' }],
})
const title = computed(() => formData.value.id ? '修改工作经历' : '新增工作经历')

/** 响应日期归一为时间戳或空串 */
// TODO @AI：看看能不能全局复用；看看别的模块是怎么处理的。
function toPickerValue(value?: Date | string | number) {
  if (value == null || value === '') {
    return ''
  }
  const num = Number(value)
  return Number.isNaN(num) ? '' : num
}

/** 打开弹窗 */
function open(employeeId: number, row?: EmployeeWorkExperience) {
  visible.value = true
  formData.value = {
    sort: 1,
    employeeId,
    ...row,
  }
  startPicker.value = toPickerValue(row?.startTime)
  endPicker.value = toPickerValue(row?.endTime)
}

/** 提交表单 */
async function handleSubmit() {
  formData.value.startTime = startPicker.value ? Number(startPicker.value) : undefined
  formData.value.endTime = endPicker.value ? Number(endPicker.value) : undefined
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateEmployeeWorkExperience(formData.value)
    } else {
      await createEmployeeWorkExperience(formData.value)
    }
    toast.success('保存成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
