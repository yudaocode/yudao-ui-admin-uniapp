<template>
  <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
    <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
      待办提醒
    </view>
    <view class="grid grid-cols-3 gap-16rpx p-24rpx">
      <view
        v-for="todo in todoItems"
        :key="todo.label"
        class="rounded-12rpx bg-[#f7f8fa] px-12rpx py-24rpx text-center"
        :class="todo.disabled ? 'opacity-80' : 'active:opacity-80'"
        @click="goTodo(todo.action)"
      >
        <view class="text-36rpx text-[#333] font-semibold">
          {{ todo.value }}
        </view>
        <view class="mt-8rpx text-24rpx text-[#999]">
          {{ todo.label }}
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { HrHomeTodoSurvey } from '@/api/hrm/home'
import { computed } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { HrmEmployeeStatusTab, HrmEmployeeTodoType } from '@/pages-hrm/utils/constants'

type TodoAction = 'salary' | 'leave' | 'contract' | 'regular' | 'entry' | 'birthday'

const props = defineProps<{
  survey?: HrHomeTodoSurvey
}>()

const { hasAccessByCodes } = useAccess()

const todoItems = computed(() => [
  {
    label: '待核算薪资',
    value: props.survey?.toSalaryComputeCount || 0,
    action: 'salary' as TodoAction,
    disabled: !hasAccessByCodes(['hrm:salary:month-record:query']) || !props.survey?.toSalaryComputeCount,
  },
  {
    label: '待离职',
    value: props.survey?.toLeaveCount || 0,
    action: 'leave' as TodoAction,
    disabled: !hasAccessByCodes(['hrm:employee:query']),
  },
  {
    label: '合同到期',
    value: props.survey?.toExpireContractCount || 0,
    action: 'contract' as TodoAction,
    disabled: !hasAccessByCodes(['hrm:employee:query']),
  },
  {
    label: '待转正',
    value: props.survey?.toRegularCount || 0,
    action: 'regular' as TodoAction,
    disabled: !hasAccessByCodes(['hrm:employee:query']),
  },
  {
    label: '待入职',
    value: props.survey?.toEntryCount || 0,
    action: 'entry' as TodoAction,
    disabled: !hasAccessByCodes(['hrm:employee:query']),
  },
  {
    label: '生日',
    value: props.survey?.toBirthdayCount || 0,
    action: 'birthday' as TodoAction,
    disabled: !hasAccessByCodes(['hrm:employee:query']),
  },
])

/** 打开待办对应的业务列表 */
function goTodo(action: TodoAction) {
  if (action === 'salary') {
    if (hasAccessByCodes(['hrm:salary:month-record:query'])) {
      uni.navigateTo({ url: '/pages-hrm/salary/month-record/index' })
    }
    return
  }
  if (!hasAccessByCodes(['hrm:employee:query'])) {
    return
  }
  const employeeFilters = {
    leave: {
      todoType: HrmEmployeeTodoType.PENDING_LEAVE,
      statusCategory: HrmEmployeeStatusTab.PENDING_LEAVE,
    },
    contract: {
      todoType: HrmEmployeeTodoType.CONTRACT_EXPIRE,
      statusCategory: HrmEmployeeStatusTab.ACTIVE,
    },
    regular: {
      todoType: HrmEmployeeTodoType.REGULAR,
      statusCategory: HrmEmployeeStatusTab.ACTIVE,
    },
    entry: {
      todoType: HrmEmployeeTodoType.PENDING_ENTRY,
      statusCategory: HrmEmployeeStatusTab.PENDING_ENTRY,
    },
    birthday: {
      todoType: HrmEmployeeTodoType.BIRTHDAY,
      statusCategory: HrmEmployeeStatusTab.ACTIVE,
    },
  }
  const filter = employeeFilters[action]
  uni.navigateTo({
    url: `/pages-hrm/employee/index?todoType=${filter.todoType}&statusCategory=${filter.statusCategory}`,
  })
}
</script>
