<template>
  <view v-if="readiness?.noSalaryGroupEmployeeCount" class="mx-24rpx mt-16rpx rounded-8rpx bg-[#fff7e6] px-16rpx py-16rpx">
    <view class="text-26rpx text-[#d48806]">
      有 {{ readiness.noSalaryGroupEmployeeCount }} 名员工未加入任何薪资组，无法参与工资核算。
    </view>
    <view
      class="mt-8rpx text-26rpx text-[#1677ff]"
      @click="openEmployeeList('noSalaryGroup')"
    >
      查看员工
    </view>
  </view>
  <view v-if="readiness?.noSalaryEmployeeCount" class="mx-24rpx mt-16rpx rounded-8rpx bg-[#fff7e6] px-16rpx py-16rpx">
    <view class="text-26rpx text-[#d48806]">
      有 {{ readiness.noSalaryEmployeeCount }} 名员工没有生效薪资档案，将优先继承上月工资；无上月工资时按 0 核算。
    </view>
    <view
      class="mt-8rpx text-26rpx text-[#1677ff]"
      @click="openEmployeeList('noSalary')"
    >
      查看员工
    </view>
  </view>

  <wd-popup v-model="listVisible" position="bottom" closable safe-area-inset-bottom>
    <view class="max-h-70vh p-24rpx">
      <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
        {{ listTitle }}
      </view>
      <scroll-view scroll-y class="max-h-60vh">
        <view
          v-for="item in currentEmployees"
          :key="item.employeeId"
          class="mb-16rpx rounded-12rpx bg-[#f7f8fa] p-20rpx"
        >
          <view class="mb-8rpx text-30rpx text-[#333] font-semibold">
            {{ item.employeeName || '-' }}
          </view>
          <view class="mb-4rpx text-26rpx text-[#666]">
            工号：{{ item.jobNumber || '-' }}
          </view>
          <view class="mb-4rpx text-26rpx text-[#666]">
            部门：{{ item.deptName || '-' }}
          </view>
          <view class="mb-4rpx text-26rpx text-[#666]">
            岗位：{{ item.postName || '-' }}
          </view>
          <view class="text-26rpx text-[#666]">
            入职：{{ formatHrmDate(item.entryTime) }}
          </view>
        </view>
        <view v-if="!currentEmployees.length" class="py-48rpx text-center text-28rpx text-[#999]">
          暂无员工
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { SalaryPayrollReadiness, SalaryPayrollReadinessEmployee } from '@/api/hrm/salary/month-record'
import { computed, ref, watch } from 'vue'
import { getSalaryPayrollReadiness } from '@/api/hrm/salary/month-record'
import { formatHrmDate } from '@/pages-hrm/utils/format'

const props = defineProps<{
  monthRecordId?: number
}>()

const readiness = ref<SalaryPayrollReadiness>() // 核算准备
const listVisible = ref(false) // 员工列表弹窗
const listType = ref<'noSalaryGroup' | 'noSalary'>('noSalaryGroup') // 当前查看类型

const listTitle = computed(() => { // 弹窗标题
  return listType.value === 'noSalaryGroup' ? '未加入薪资组的员工' : '未设置薪资档案的员工'
})

const currentEmployees = computed<SalaryPayrollReadinessEmployee[]>(() => { // 当前弹窗员工
  if (listType.value === 'noSalaryGroup') {
    return readiness.value?.noSalaryGroupEmployees || []
  }
  return readiness.value?.noSalaryEmployees || []
})

/** 刷新薪资核算准备状态 */
async function refresh() {
  if (!props.monthRecordId) {
    readiness.value = undefined
    return
  }
  readiness.value = await getSalaryPayrollReadiness(props.monthRecordId)
}
defineExpose({ refresh })

/** 打开员工列表 */
function openEmployeeList(type: 'noSalaryGroup' | 'noSalary') {
  listType.value = type
  listVisible.value = true
}

/** 月表切换时刷新 */
watch(
  () => props.monthRecordId,
  () => {
    refresh()
  },
)
</script>
