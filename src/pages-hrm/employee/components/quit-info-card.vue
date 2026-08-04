<template>
  <view v-if="quitInfo?.id" class="mx-24rpx mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
    <view class="mb-16rpx flex items-center justify-between">
      <text class="text-30rpx text-[#333] font-semibold">
        离职信息
      </text>
      <text
        v-if="editable && hasAccessByCodes(['hrm:employee:update'])"
        class="text-28rpx text-[#1677ff]"
        @click="emit('edit')"
      >
        修改
      </text>
    </view>
    <view class="mb-8rpx text-26rpx text-[#666]">
      计划离职：{{ formatDateTime(quitInfo.planQuitTime) || '-' }}
    </view>
    <view class="mb-8rpx text-26rpx text-[#666]">
      申请离职：{{ formatDateTime(quitInfo.applyQuitTime) || '-' }}
    </view>
    <view class="mb-8rpx text-26rpx text-[#666]">
      薪资结算：{{ formatDateTime(quitInfo.salarySettlementTime) || '-' }}
    </view>
    <view class="mb-8rpx text-26rpx text-[#666]">
      离职类型：{{ formatEmployeeQuitType(quitInfo.type) }}
    </view>
    <view class="mb-8rpx text-26rpx text-[#666]">
      离职原因：{{ formatEmployeeQuitReason(quitInfo.reason) }}
    </view>
    <view v-if="quitInfo.remark" class="text-26rpx text-[#666]">
      备注：{{ quitInfo.remark }}
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { EmployeeQuitInfo } from '@/api/hrm/employee/quit-info'
import { onMounted, ref, watch } from 'vue'
import { getEmployeeQuitInfo } from '@/api/hrm/employee/quit-info'
import { useAccess } from '@/hooks/useAccess'
import { formatDateTime } from '@/utils/date'
import {
  formatEmployeeQuitReason,
  formatEmployeeQuitType,
} from '@/pages-hrm/utils/format'

const props = defineProps<{
  employeeId: number
  editable?: boolean
}>()

const emit = defineEmits<{
  edit: []
}>()

const { hasAccessByCodes } = useAccess()
const quitInfo = ref<EmployeeQuitInfo>() // 离职信息

/** 加载离职信息 */
async function getQuitInfo() {
  if (!props.employeeId) {
    quitInfo.value = undefined
    return
  }
  quitInfo.value = await getEmployeeQuitInfo(props.employeeId)
}

watch(() => props.employeeId, () => getQuitInfo())

onMounted(() => {
  getQuitInfo()
})

defineExpose({ getQuitInfo })
</script>
