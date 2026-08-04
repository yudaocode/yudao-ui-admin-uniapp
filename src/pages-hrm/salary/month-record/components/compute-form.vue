<template>
  <wd-popup v-model="visible" position="bottom" closable safe-area-inset-bottom>
    <view class="p-24rpx pb-48rpx">
      <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
        核算工资表
      </view>
      <wd-cell-group border>
        <wd-cell title="工资表" :value="currentRecord?.title || '-'" />
        <wd-cell title="计薪人员" :value="`${payrollEmployeeCount} 人`" />
        <wd-cell title="社保数据" center>
          <wd-switch v-model="syncInsuranceData" />
        </wd-cell>
        <wd-cell title="同步考勤" center>
          <wd-switch v-model="syncAttendanceData" />
        </wd-cell>
      </wd-cell-group>
      <view class="mt-16rpx text-24rpx text-[#999]">
        开启「社保数据」将从社保表同步；开启「同步考勤」将从考勤统计同步。Excel 导入请在 PC 端操作。
      </view>
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
import type { SalaryMonthRecord } from '@/api/hrm/salary/month-record'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import {
  computeSalaryMonthRecordWithImport,
  getSalaryPayrollReadiness,
} from '@/api/hrm/salary/month-record'

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示
const formLoading = ref(false) // 提交中
const currentRecord = ref<SalaryMonthRecord>() // 当前工资表
const payrollEmployeeCount = ref(0) // 可计薪人数
const syncInsuranceData = ref(true) // 是否同步社保
const syncAttendanceData = ref(true) // 是否同步考勤

/** 打开核算弹窗 */
async function open(record: SalaryMonthRecord) {
  currentRecord.value = record
  payrollEmployeeCount.value = record.employeeCount || 0
  syncInsuranceData.value = true
  syncAttendanceData.value = true
  visible.value = true
  const readiness = await getSalaryPayrollReadiness(record.id)
  payrollEmployeeCount.value = readiness.payrollEmployeeCount || 0
}
defineExpose({ open })

/** 提交核算 */
async function handleSubmit() {
  if (!currentRecord.value?.id) {
    return
  }
  formLoading.value = true
  try {
    await computeSalaryMonthRecordWithImport({
      id: currentRecord.value.id,
      syncInsuranceData: syncInsuranceData.value,
      syncAttendanceData: syncAttendanceData.value,
    })
    toast.success('核算成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
