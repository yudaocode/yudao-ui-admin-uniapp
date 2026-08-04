<template>
  <wd-popup v-model="visible" position="bottom" closable safe-area-inset-bottom @close="visible = false">
    <scroll-view scroll-y class="max-h-80vh px-32rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ title }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="培训课程" title-width="200rpx" prop="course">
            <wd-input v-model="formData.course" clearable placeholder="请输入培训课程" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="培训机构" title-width="200rpx" prop="organizationName">
            <wd-input v-model="formData.organizationName" clearable placeholder="请输入培训机构" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="开始日期" title-width="200rpx" prop="startTime" center>
            <view class="w-full" @click="startVisible = true">
              <wd-input :model-value="formatDate(formData.startTime) || ''" readonly align-right placeholder="请选择" />
            </view>
          </wd-form-item>
          <wd-datetime-picker v-model="formData.startTime" v-model:visible="startVisible" type="date" title="开始日期" />
          <wd-form-item title="结束日期" title-width="200rpx" prop="endTime" center>
            <view class="w-full" @click="endVisible = true">
              <wd-input :model-value="formatDate(formData.endTime) || ''" readonly align-right placeholder="请选择" />
            </view>
          </wd-form-item>
          <wd-datetime-picker v-model="formData.endTime" v-model:visible="endVisible" type="date" title="结束日期" />
          <wd-form-item title="培训时长" title-width="200rpx" prop="duration">
            <wd-input v-model="formData.duration" clearable placeholder="请输入培训时长" :maxlength="64" />
          </wd-form-item>
          <wd-form-item title="培训成绩" title-width="200rpx" prop="result">
            <wd-input v-model="formData.result" clearable placeholder="请输入培训成绩" :maxlength="64" />
          </wd-form-item>
          <wd-form-item title="证书名称" title-width="200rpx" prop="certificateName">
            <wd-input v-model="formData.certificateName" clearable placeholder="请输入培训证书名称" :maxlength="255" />
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
import type { EmployeeTrainingExperience } from '@/api/hrm/employee/training-experience'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import {
  createEmployeeTrainingExperience,
  updateEmployeeTrainingExperience,
} from '@/api/hrm/employee/training-experience'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{ success: [] }>()
const toast = useToast()
const visible = ref(false)
const formLoading = ref(false)
const startVisible = ref(false)
const endVisible = ref(false)
const formRef = ref<FormInstance>()
const formData = ref<EmployeeTrainingExperience>({ sort: 1 })
const formSchema = createFormSchema({
  course: [{ required: true, message: '培训课程不能为空' }],
})
const title = computed(() => formData.value.id ? '修改培训经历' : '新增培训经历')

function open(employeeId: number, row?: EmployeeTrainingExperience) {
  visible.value = true
  formData.value = { sort: 1, employeeId, ...row }
}

async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateEmployeeTrainingExperience(formData.value)
    } else {
      await createEmployeeTrainingExperience(formData.value)
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
