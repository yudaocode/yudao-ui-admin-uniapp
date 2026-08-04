<template>
  <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
    <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
      我的概况
    </view>

    <view v-if="employee" class="flex items-start gap-24rpx p-24rpx">
      <view class="h-112rpx w-112rpx shrink-0 overflow-hidden rounded-full bg-[#f0f2f5]">
        <wd-img
          v-if="employee.avatar"
          :src="employee.avatar"
          width="112rpx"
          height="112rpx"
          radius="50%"
          mode="aspectFill"
        />
        <view
          v-else
          class="h-full w-full flex items-center justify-center text-40rpx text-[#1677ff] font-semibold"
        >
          {{ (employee.name || '?').slice(0, 1) }}
        </view>
      </view>

      <view class="min-w-0 flex-1">
        <view class="text-34rpx text-[#333] font-semibold">
          Hi，{{ employee.name || '-' }}
        </view>
        <view class="mt-12rpx text-26rpx text-[#666] leading-40rpx">
          这是你在{{ employee.deptName || '部门' }}的第
          <text class="text-[#333] font-semibold">
            {{ employee.entryDay || 0 }}
          </text>
          天
        </view>
        <view class="mt-16rpx text-26rpx text-[#666] leading-40rpx">
          部门
          <text class="text-[#333] font-semibold">
            {{ employee.deptName || '未设置' }}
          </text>
          ，岗位
          <text class="text-[#333] font-semibold">
            {{ employee.postName || '未设置' }}
          </text>
          ，工号
          <text class="text-[#333] font-semibold">
            {{ employee.jobNumber || '未设置' }}
          </text>
          <text v-if="employee.entryTime">
            ，
            <text class="text-[#333] font-semibold">
              {{ formatHrmDate(employee.entryTime) }}
            </text>
            入职
          </text>
          <text v-if="showRegularDate">
            ，将于
            <text class="text-[#333] font-semibold">
              {{ formatHrmDate(employee.regularTime) }}
            </text>
            转正
          </text>
        </view>
        <view
          v-if="salarySlipSummary?.reminder"
          class="mt-16rpx text-26rpx text-[#1677ff] leading-40rpx"
          @click.stop="goSalarySlip"
        >
          {{ salarySlipSummary.reminder }} >>
        </view>
      </view>
    </view>

    <view v-else class="py-64rpx text-center text-26rpx text-[#999]">
      当前账号未绑定员工档案
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PortalEmployee } from '@/api/hrm/portal/employee'
import type { SalarySlipUnreadSummary } from '@/api/hrm/portal/salary/slip'
import dayjs from 'dayjs'
import { computed } from 'vue'
import { formatHrmDate } from '@/pages-hrm/utils/format'

const props = defineProps<{
  employee?: PortalEmployee
  salarySlipSummary?: SalarySlipUnreadSummary
}>()

const showRegularDate = computed(() => { // 未到转正日才展示预计转正
  const regularTime = props.employee?.regularTime
  return regularTime ? dayjs().isBefore(dayjs(regularTime)) : false
})

/** 前往我的工资条 */
function goSalarySlip() {
  uni.navigateTo({ url: '/pages-hrm/portal/salary/slip/index' })
}
</script>
