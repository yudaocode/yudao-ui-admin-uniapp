<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 80vh; border-radius: 24rpx 24rpx 0 0;"
    @close="visible = false"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="bg-white px-24rpx pb-16rpx pt-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          添加参评员工
        </view>
        <wd-input v-model="keyword" placeholder="搜索姓名/工号/手机号" clearable />
      </view>

      <view class="min-h-0 flex-1 overflow-hidden">
        <scroll-view scroll-y class="h-full p-24rpx">
          <view v-if="loading" class="py-80rpx text-center text-28rpx text-[#999]">
            加载中...
          </view>
          <view v-else-if="!filteredList.length" class="py-80rpx text-center text-28rpx text-[#999]">
            暂无可添加员工
          </view>
          <view
            v-for="item in filteredList"
            :key="item.id"
            class="mb-20rpx flex items-center gap-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="isSelected(item.id) ? 'ring-2 ring-[#1677ff]' : ''"
            @click="toggleItem(item)"
          >
            <wd-checkbox :model-value="isSelected(item.id)" />
            <view class="min-w-0 flex-1">
              <view class="truncate text-30rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <view class="mt-10rpx truncate text-24rpx text-[#999]">
                {{ item.deptName || '-' }} · {{ item.jobNumber || '-' }} · {{ item.mobile || '-' }}
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="bg-white px-24rpx py-20rpx">
        <view class="flex gap-24rpx">
          <wd-button class="flex-1" variant="plain" :disabled="formLoading" @click="visible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
            确定（{{ selectedIds.length }}）
          </wd-button>
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Employee } from '@/api/hrm/employee'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getEmployeeSimpleList } from '@/api/hrm/employee'
import {
  addPerformancePlanEmployees,
  getPerformancePlanUnassignedEmployeeIdList,
} from '@/api/hrm/performance/assessment'

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const loading = ref(false) // 可添加员工加载中
const planId = ref<number>() // 绩效计划编号
const keyword = ref('') // 本地搜索关键字
const employeeList = ref<Employee[]>([]) // 可添加员工
const selectedIds = ref<number[]>([]) // 已选员工编号

const filteredList = computed(() => { // 本地过滤后的员工
  const text = keyword.value.trim()
  if (!text) {
    return employeeList.value
  }
  return employeeList.value.filter((item) => {
    return [item.name, item.jobNumber, item.mobile].some(field => field?.includes(text))
  })
})

/** 打开弹窗 */
async function open(id: number) {
  visible.value = true
  planId.value = id
  keyword.value = ''
  selectedIds.value = []
  loading.value = true
  try {
    const unassignedIds = await getPerformancePlanUnassignedEmployeeIdList(id)
    if (!unassignedIds?.length) {
      employeeList.value = []
      return
    }
    employeeList.value = await getEmployeeSimpleList(unassignedIds)
  } finally {
    loading.value = false
  }
}
defineExpose({ open })

/** 是否已选 */
function isSelected(id?: number) {
  return !!id && selectedIds.value.includes(id)
}

/** 切换选中 */
function toggleItem(item: Employee) {
  if (!item.id) {
    return
  }
  if (isSelected(item.id)) {
    selectedIds.value = selectedIds.value.filter(id => id !== item.id)
    return
  }
  selectedIds.value = [...selectedIds.value, item.id]
}

/** 提交表单 */
async function handleSubmit() {
  if (!planId.value) {
    return
  }
  if (!selectedIds.value.length) {
    toast.show('请选择参评员工')
    return
  }
  formLoading.value = true
  try {
    await addPerformancePlanEmployees({
      planId: planId.value,
      employeeIds: selectedIds.value,
    })
    toast.success('参评员工添加成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
