<template>
  <view class="p-24rpx">
    <view v-if="!list.length" class="py-40rpx text-center text-28rpx text-[#999]">
      暂无异动记录
    </view>
    <view
      v-for="item in list"
      :key="item.id"
      class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
    >
      <view class="mb-12rpx flex items-center justify-between gap-16rpx">
        <text class="text-30rpx text-[#333] font-semibold">
          {{ formatEmployeeChangeType(item.type) }}
        </text>
        <text class="text-26rpx text-[#999]">
          {{ formatDateTime(item.effectTime) || '-' }}
        </text>
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        原因：{{ formatEmployeeChangeReason(item.reason) }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        部门：{{ item.oldDeptName || '-' }} → {{ item.newDeptName || '-' }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        岗位：{{ item.oldPostName || '-' }} → {{ item.newPostName || '-' }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        职级：{{ item.oldPostLevel || '-' }} → {{ item.newPostLevel || '-' }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        上级：{{ item.oldLeaderEmployeeName || '-' }} → {{ item.newLeaderEmployeeName || '-' }}
      </view>
      <view v-if="item.remark" class="text-26rpx text-[#666]">
        备注：{{ item.remark }}
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { EmployeeChangeRecord } from '@/api/hrm/employee/change-record'
import { onMounted, ref, watch } from 'vue'
import { getEmployeeChangeRecordList } from '@/api/hrm/employee/change-record'
import { formatDateTime } from '@/utils/date'
import {
  formatEmployeeChangeReason,
  formatEmployeeChangeType,
} from '@/pages-hrm/utils/format'

const props = defineProps<{
  employeeId: number
}>()

const list = ref<EmployeeChangeRecord[]>([]) // 异动记录

/** 加载异动记录 */
async function getList() {
  if (!props.employeeId) {
    list.value = []
    return
  }
  list.value = await getEmployeeChangeRecordList(props.employeeId)
}

watch(() => props.employeeId, () => getList())

onMounted(() => {
  getList()
})

defineExpose({ getList })
</script>
