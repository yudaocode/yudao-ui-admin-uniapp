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
          添加参保人员
        </view>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-form-item title="员工" title-width="120rpx" prop="employeeIds">
            <view
              class="min-h-72rpx flex items-center justify-end text-28rpx"
              :class="selectedText ? 'text-[#333]' : 'text-[#999]'"
            >
              {{ selectedText || '请选择员工' }}
            </view>
          </wd-form-item>
        </wd-form>
      </view>

      <view class="min-h-0 flex-1 overflow-hidden">
        <scroll-view scroll-y class="h-full p-24rpx">
          <view v-if="loading" class="py-80rpx text-center text-28rpx text-[#999]">
            加载中...
          </view>
          <view v-else-if="!employeeList.length" class="py-80rpx text-center text-28rpx text-[#999]">
            暂无可添加员工
          </view>
          <view
            v-for="item in employeeList"
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
            确定（{{ formData.employeeIds.length }}）
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
import {
  createInsuranceMonthEmployeeRecordList,
  getUninsuredEmployeeList,
} from '@/api/hrm/insurance/month-record/employee'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const loading = ref(false) // 未参保员工加载中
const monthRecordId = ref<number>() // 月度社保表编号
const formRef = ref<any>() // 表单引用
const employeeList = ref<Employee[]>([]) // 可添加员工
const formData = ref({
  employeeIds: [] as number[],
}) // 表单数据

const selectedText = computed(() => {
  if (!formData.value.employeeIds.length) {
    return ''
  }
  return `已选 ${formData.value.employeeIds.length} 人`
})

const formSchema = createFormSchema({
  employeeIds: [{ required: true, message: '请选择员工' }],
})

/** 是否已选 */
function isSelected(id?: number) {
  return id != null && formData.value.employeeIds.includes(id)
}

/** 切换选中 */
function toggleItem(item: Employee) {
  if (item.id == null) {
    return
  }
  if (isSelected(item.id)) {
    formData.value.employeeIds = formData.value.employeeIds.filter(id => id !== item.id)
    return
  }
  formData.value.employeeIds = [...formData.value.employeeIds, item.id]
}

/** 打开弹窗 */
async function open(recordId: number) {
  visible.value = true
  monthRecordId.value = recordId
  formData.value.employeeIds = []
  employeeList.value = []
  loading.value = true
  try {
    employeeList.value = await getUninsuredEmployeeList(recordId)
  } finally {
    loading.value = false
  }
}
defineExpose({ open })

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !monthRecordId.value) {
    return
  }
  formLoading.value = true
  try {
    await createInsuranceMonthEmployeeRecordList({
      monthRecordId: monthRecordId.value,
      employeeIds: formData.value.employeeIds,
    })
    toast.success('添加成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
