<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="编辑员工工资"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <view class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="mb-8rpx truncate text-32rpx text-[#333] font-semibold">
          {{ formData.employeeName || '-' }}
        </view>
        <view class="text-26rpx text-[#999]">
          {{ formData.jobNumber || '-' }} · {{ formData.deptName || '-' }}
        </view>
      </view>

      <view class="mx-24rpx mt-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          可编辑工资项
        </view>
        <view
          v-for="option in editableOptions"
          :key="option.code"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx text-28rpx text-[#333]">
            {{ option.name }}
          </view>
          <wd-input-number
            :model-value="getOptionValue(option.code)"
            allow-null
            :precision="2"
            :min="0"
            :max="100000000"
            @update:model-value="(value) => updateOptionValue(option.code, value)"
          />
        </view>
        <view v-if="!editableOptions.length" class="rounded-12rpx bg-white p-48rpx text-center text-28rpx text-[#999]">
          暂无可编辑工资项
        </view>
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SalaryOption } from '@/api/hrm/salary/config/option'
import type { SalaryMonthEmployeeRecord } from '@/api/hrm/salary/month-record/employee'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getSalaryMonthRecord } from '@/api/hrm/salary/month-record'
import {
  getSalaryMonthEmployeeRecordList,
  updateSalaryMonthEmployeeRecordList,
} from '@/api/hrm/salary/month-record/employee'
import { HRM_SALARY_COMPUTED_OPTION_CODES } from '@/pages-hrm/utils/constants'
import { getSalaryLeafOptions } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'

const props = defineProps<{
  monthRecordId?: number | any
  employeeId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formLoading = ref(false) // 表单提交状态
const formData = ref<SalaryMonthEmployeeRecord>({}) // 员工工资
const leafOptions = ref<SalaryOption[]>([]) // 叶子薪资项

const editableOptions = computed(() => { // 可编辑薪资项
  return leafOptions.value.filter(option => !HRM_SALARY_COMPUTED_OPTION_CODES.has(option.code))
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 获得指定薪资项金额 */
function getOptionValue(optionCode: number) {
  return formData.value.optionValues?.find(option => option.code === optionCode)?.value
}

/** 更新指定薪资项金额 */
function updateOptionValue(optionCode: number, value: number | null | undefined) {
  const optionValue = formData.value.optionValues?.find(option => option.code === optionCode)
  if (optionValue) {
    optionValue.value = Number(value || 0)
    return
  }
  formData.value.optionValues = [
    ...(formData.value.optionValues || []),
    { code: optionCode, value: Number(value || 0) },
  ]
}

/** 加载详情 */
async function getDetail() {
  if (!props.monthRecordId || !props.employeeId) {
    return
  }
  const [monthRecord, list] = await Promise.all([
    getSalaryMonthRecord(Number(props.monthRecordId)),
    getSalaryMonthEmployeeRecordList({
      monthRecordId: Number(props.monthRecordId),
      employeeId: Number(props.employeeId),
    }),
  ])
  leafOptions.value = getSalaryLeafOptions(monthRecord.optionHeaders)
  formData.value = list[0] || {}
}

/** 提交表单 */
async function handleSubmit() {
  if (!formData.value.id) {
    return
  }
  formLoading.value = true
  try {
    await updateSalaryMonthEmployeeRecordList([{
      id: formData.value.id,
      optionValues: formData.value.optionValues || [],
    }])
    toast.success('保存成功')
    uni.$emit('hrm:salary:month-record:reload')
    navigateBackPlus()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
