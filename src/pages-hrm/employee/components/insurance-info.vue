<template>
  <view v-if="hasAccessByCodes(['hrm:insurance:employee-info:query'])" class="rounded-12rpx bg-white p-24rpx shadow-sm">
    <view class="mb-16rpx flex items-center justify-between gap-16rpx">
      <text class="text-30rpx text-[#333] font-semibold">
        社保资料
      </text>
      <text
        v-if="hasAccessByCodes(['hrm:insurance:employee-info:update'])"
        class="text-28rpx text-[#1677ff]"
        @click="openForm"
      >
        编辑
      </text>
    </view>
    <view v-if="loading" class="py-20rpx text-center text-28rpx text-[#999]">
      加载中...
    </view>
    <template v-else>
      <view class="mb-8rpx text-26rpx text-[#666]">
        社保编号：{{ insuranceInfo?.socialSecurityNumber || '-' }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        公积金编号：{{ insuranceInfo?.accumulationFundNumber || '-' }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        社保起始月：{{ formatHrmMonth(insuranceInfo?.socialSecurityStartMonth) }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        参保方案：{{ insuranceInfo?.schemeName || insuranceInfo?.schemeId || '-' }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        本地首次缴纳社保：{{ formatHrmYesNo(insuranceInfo?.firstSocialSecurity) }}
      </view>
      <view class="text-26rpx text-[#666]">
        本地首次缴纳公积金：{{ formatHrmYesNo(insuranceInfo?.firstAccumulationFund) }}
      </view>
    </template>
    <InsuranceInfoForm ref="formRef" @success="getInsuranceInfo" />
  </view>
</template>

<script lang="ts" setup>
import type { InsuranceEmployeeInfo } from '@/api/hrm/insurance/employee-info'
import { onMounted, ref, watch } from 'vue'
import { getInsuranceEmployeeInfo } from '@/api/hrm/insurance/employee-info'
import { useAccess } from '@/hooks/useAccess'
import { formatHrmMonth, formatHrmYesNo } from '@/pages-hrm/utils/format'
import InsuranceInfoForm from './insurance-info-form.vue'

const props = defineProps<{
  employeeId: number
}>()

const { hasAccessByCodes } = useAccess()
const loading = ref(false)
const formRef = ref<InstanceType<typeof InsuranceInfoForm>>()
const insuranceInfo = ref<InsuranceEmployeeInfo>()

/** 加载参保资料 */
async function getInsuranceInfo() {
  if (!props.employeeId || !hasAccessByCodes(['hrm:insurance:employee-info:query'])) {
    insuranceInfo.value = undefined
    return
  }
  loading.value = true
  try {
    insuranceInfo.value = await getInsuranceEmployeeInfo(props.employeeId) || {
      employeeId: props.employeeId,
      firstSocialSecurity: false,
      firstAccumulationFund: false,
      socialSecurityNumber: '',
      accumulationFundNumber: '',
    }
  } finally {
    loading.value = false
  }
}

/** 打开编辑弹窗 */
function openForm() {
  formRef.value?.open({
    employeeId: props.employeeId,
    firstSocialSecurity: false,
    firstAccumulationFund: false,
    socialSecurityNumber: '',
    accumulationFundNumber: '',
    ...insuranceInfo.value,
  })
}

watch(() => props.employeeId, () => {
  getInsuranceInfo()
})

onMounted(() => {
  getInsuranceInfo()
})
</script>
