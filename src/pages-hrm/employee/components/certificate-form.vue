<template>
  <wd-popup v-model="visible" position="bottom" closable safe-area-inset-bottom @close="visible = false">
    <scroll-view scroll-y class="max-h-80vh px-32rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ title }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="证书名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入证书名称" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="证书级别" title-width="200rpx" prop="level">
            <wd-input v-model="formData.level" clearable placeholder="请输入证书级别" :maxlength="64" />
          </wd-form-item>
          <wd-form-item title="证书编码" title-width="200rpx" prop="no">
            <wd-input v-model="formData.no" clearable placeholder="请输入证书编码" :maxlength="128" />
          </wd-form-item>
          <wd-form-item title="有效开始" title-width="200rpx" prop="startTime" center>
            <view class="w-full" @click="startVisible = true">
              <wd-input :model-value="formatDate(formData.startTime) || ''" readonly align-right placeholder="请选择" />
            </view>
          </wd-form-item>
          <wd-datetime-picker v-model="formData.startTime" v-model:visible="startVisible" type="date" title="有效开始日期" />
          <wd-form-item title="有效结束" title-width="200rpx" prop="endTime" center>
            <view class="w-full" @click="endVisible = true">
              <wd-input :model-value="formatDate(formData.endTime) || ''" readonly align-right placeholder="请选择" />
            </view>
          </wd-form-item>
          <wd-datetime-picker v-model="formData.endTime" v-model:visible="endVisible" type="date" title="有效结束日期" />
          <wd-form-item title="发证机构" title-width="200rpx" prop="issuingAuthority">
            <wd-input v-model="formData.issuingAuthority" clearable placeholder="请输入发证机构" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="发证日期" title-width="200rpx" prop="issuingTime" center>
            <view class="w-full" @click="issuingVisible = true">
              <wd-input :model-value="formatDate(formData.issuingTime) || ''" readonly align-right placeholder="请选择" />
            </view>
          </wd-form-item>
          <wd-datetime-picker v-model="formData.issuingTime" v-model:visible="issuingVisible" type="date" title="发证日期" />
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
import type { EmployeeCertificate } from '@/api/hrm/employee/certificate'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import {
  createEmployeeCertificate,
  updateEmployeeCertificate,
} from '@/api/hrm/employee/certificate'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{ success: [] }>()
const toast = useToast()
const visible = ref(false)
const formLoading = ref(false)
const startVisible = ref(false)
const endVisible = ref(false)
const issuingVisible = ref(false)
const formRef = ref<FormInstance>()
const formData = ref<EmployeeCertificate>({
  sort: 1,
  startTime: '' as any,
  endTime: '' as any,
  issuingTime: '' as any,
})
const formSchema = createFormSchema({
  name: [{ required: true, message: '证书名称不能为空' }],
})
const title = computed(() => formData.value.id ? '修改证书' : '新增证书')

function open(employeeId: number, row?: EmployeeCertificate) {
  visible.value = true
  formData.value = {
    sort: 1,
    employeeId,
    ...row,
    startTime: (row?.startTime ?? '') as any,
    endTime: (row?.endTime ?? '') as any,
    issuingTime: (row?.issuingTime ?? '') as any,
  }
}

async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      startTime: formData.value.startTime || undefined,
      endTime: formData.value.endTime || undefined,
      issuingTime: formData.value.issuingTime || undefined,
    }
    if (data.id) {
      await updateEmployeeCertificate(data)
    } else {
      await createEmployeeCertificate(data)
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
