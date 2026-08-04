<template>
  <view class="p-24rpx pb-160rpx">
    <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-16rpx flex items-center justify-between gap-16rpx">
        <text class="text-30rpx text-[#333] font-semibold">
          工资卡信息
        </text>
        <view class="flex shrink-0 gap-24rpx">
          <text
            v-if="hasAccessByCodes(['hrm:employee:update'])"
            class="text-28rpx text-[#1677ff]"
            @click="openForm"
          >
            编辑
          </text>
          <text
            v-if="salaryCard?.id && hasAccessByCodes(['hrm:employee:update'])"
            class="text-28rpx text-[#f5222d]"
            @click="handleDelete"
          >
            删除
          </text>
        </view>
      </view>
      <view v-if="!salaryCard?.id" class="py-20rpx text-center text-28rpx text-[#999]">
        暂无工资卡信息
      </view>
      <template v-else>
        <view class="mb-8rpx text-26rpx text-[#666]">
          银行卡号：{{ salaryCard.bankCardNumber || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          开户地区：{{ salaryCard.bankAreaName || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          银行名称：{{ salaryCard.bankName || '-' }}
        </view>
        <view class="text-26rpx text-[#666]">
          开户支行：{{ salaryCard.bankBranchName || '-' }}
        </view>
      </template>
    </view>

    <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
        社保公积金账号
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        个人社保账号：{{ socialSecurityNumber || '-' }}
      </view>
      <view class="text-26rpx text-[#666]">
        个人公积金账号：{{ accumulationFundNumber || '-' }}
      </view>
    </view>

    <view class="mt-24rpx">
      <InsuranceInfo :employee-id="employeeId" />
    </view>

    <SalaryCardForm ref="formRef" @success="getSalaryCard" />
  </view>
</template>

<script lang="ts" setup>
import type { EmployeeSalaryCard } from '@/api/hrm/employee/salary-card'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref, watch } from 'vue'
import {
  deleteEmployeeSalaryCard,
  getEmployeeSalaryCard,
} from '@/api/hrm/employee/salary-card'
import { useAccess } from '@/hooks/useAccess'
import InsuranceInfo from './insurance-info.vue'
import SalaryCardForm from './salary-card-form.vue'

const props = defineProps<{
  employeeId: number
  socialSecurityNumber?: string
  accumulationFundNumber?: string
}>()

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const salaryCard = ref<EmployeeSalaryCard>()
const formRef = ref<InstanceType<typeof SalaryCardForm>>()

/** 加载工资卡 */
async function getSalaryCard() {
  if (!props.employeeId) {
    salaryCard.value = undefined
    return
  }
  salaryCard.value = await getEmployeeSalaryCard(props.employeeId)
}

/** 编辑工资卡 */
function openForm() {
  formRef.value?.open(props.employeeId)
}

/** 删除工资卡 */
async function handleDelete() {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定删除当前员工的工资卡信息吗？',
    })
  } catch {
    return
  }
  await deleteEmployeeSalaryCard(props.employeeId)
  toast.success('工资卡删除成功')
  await getSalaryCard()
}

watch(() => props.employeeId, () => getSalaryCard())
onMounted(() => getSalaryCard())
defineExpose({ getSalaryCard, openForm })
</script>
