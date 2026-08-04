<template>
  <wd-popup v-model="visible" position="bottom" closable safe-area-inset-bottom @close="visible = false">
    <view class="px-32rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ title }}
      </view>
      <view class="mb-24rpx rounded-12rpx bg-[#f7f8fa] p-24rpx text-26rpx text-[#666]">
        <view>员工：{{ employee?.name || '-' }}</view>
        <view class="mt-8rpx">
          岗位：{{ employee?.postName || '-' }}
        </view>
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-form-picker
            v-model="formData.reason"
            label="异动原因"
            label-width="200rpx"
            prop="reason"
            :columns="reasonColumns"
            placeholder="请选择异动原因"
          />
          <wd-form-item title="生效日期" title-width="200rpx" prop="effectTime" center>
            <view class="w-full" @click="effectTimeVisible = true">
              <wd-input
                :model-value="formatDate(formData.effectTime) || ''"
                readonly
                align-right
                placeholder="请选择"
              />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.effectTime"
            v-model:visible="effectTimeVisible"
            type="date"
            title="生效日期"
          />
          <wd-form-item
            v-if="showProbation"
            title="试用期（月）"
            title-width="200rpx"
            prop="probation"
          >
            <wd-input-number
              v-model="formData.probation"
              allow-null
              :min="0"
              :max="6"
              :precision="0"
            />
          </wd-form-item>
          <DeptFormPicker
            v-model="formData.newDeptId"
            label="新部门"
            label-width="200rpx"
            prop="newDeptId"
            placeholder="请选择新部门"
          />
          <wd-form-item title="新岗位" title-width="200rpx" prop="newPostName">
            <wd-input
              v-model="formData.newPostName"
              clearable
              :placeholder="optionalPlaceholder"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item title="新职级" title-width="200rpx" prop="newPostLevel">
            <wd-input
              v-model="formData.newPostLevel"
              clearable
              :placeholder="optionalPlaceholder"
              :maxlength="255"
            />
          </wd-form-item>
          <EmployeeFormPicker
            v-model="formData.newLeaderEmployeeId"
            label="新直属上级"
            label-width="200rpx"
            prop="newLeaderEmployeeId"
            :placeholder="optionalPlaceholder"
            :entry-status="HrmEmployeeEntryStatus.ACTIVE"
            :disabled-ids="employee?.id ? [employee.id] : []"
          />
          <wd-form-item title="新工作地点" title-width="200rpx" prop="newWorkAddress">
            <wd-input
              v-model="formData.newWorkAddress"
              clearable
              :placeholder="optionalPlaceholder"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark" vertical>
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="500"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-32rpx flex gap-24rpx">
        <wd-button class="flex-1" variant="plain" @click="visible = false">
          取消
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Employee, EmployeeConvertToFullTimeReq, EmployeeTransferReq } from '@/api/hrm/employee'
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  convertEmployeeToFullTime,
  demoteEmployee,
  promoteEmployee,
  regularEmployee,
  transferEmployee,
} from '@/api/hrm/employee'
import DeptFormPicker from '@/components/system-select/dept-form-picker.vue'
import { createFormSchema } from '@/utils/wot'
import { formatDate } from '@/utils/date'
import {
  HRM_EMPLOYEE_NO_PROBATION_MONTHS,
  HrmEmployeeChangeReason,
  HrmEmployeeChangeReasonOptions,
  HrmEmployeeChangeType,
  HrmEmployeeEntryStatus,
} from '@/pages-hrm/utils/constants'
import EmployeeFormPicker from './employee-form-picker.vue'

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示
const formLoading = ref(false) // 提交状态
const changeType = ref<number>(HrmEmployeeChangeType.TRANSFER) // 异动类型
const employee = ref<Employee>() // 当前员工
const effectTimeVisible = ref(false) // 生效日期选择
const formRef = ref<any>() // 表单引用
const formData = ref<EmployeeTransferReq & { probation?: number }>({}) // 表单数据

const titleMap: Record<number, string> = {
  [HrmEmployeeChangeType.REGULAR]: '办理转正',
  [HrmEmployeeChangeType.TRANSFER]: '调整部门/岗位',
  [HrmEmployeeChangeType.PROMOTION]: '晋升',
  [HrmEmployeeChangeType.DEMOTION]: '降级',
  [HrmEmployeeChangeType.FULL_TIME]: '转为全职',
}

const title = computed(() => titleMap[changeType.value] || '办理异动')
const showProbation = computed(() => changeType.value === HrmEmployeeChangeType.FULL_TIME)
const optionalPlaceholder = computed(() => { // 可选字段占位
  if (
    changeType.value === HrmEmployeeChangeType.REGULAR
    || changeType.value === HrmEmployeeChangeType.FULL_TIME
  ) {
    return '未调整则保持当前值'
  }
  return '请输入'
})

const reasonColumns = computed(() => {
  const options = HrmEmployeeChangeReasonOptions.filter(item =>
    changeType.value === HrmEmployeeChangeType.DEMOTION
      ? item.value >= HrmEmployeeChangeReason.VIOLATION
      : item.value <= HrmEmployeeChangeReason.WORK_ARRANGEMENT,
  )
  return options.map(item => ({ label: item.label, value: item.value }))
})

const formSchema = createFormSchema({
  reason: [{ required: true, message: '请选择异动原因' }],
  effectTime: [{ required: true, message: '请选择生效日期' }],
  probation: [{
    required: () => showProbation.value,
    message: '请输入试用期',
  }],
})

/** 打开弹窗 */
function open(row: Employee, type: number) {
  visible.value = true
  employee.value = row
  changeType.value = type
  formData.value = {
    employeeId: row.id,
    reason: undefined,
    newDeptId: row.deptId,
    newPostName: row.postName || '',
    newPostLevel: row.postLevel || '',
    newWorkAddress: row.workAddress || '',
    newLeaderEmployeeId: row.leaderEmployeeId,
    effectTime: Date.now(),
    remark: '',
    probation: HRM_EMPLOYEE_NO_PROBATION_MONTHS,
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    const payload = { ...formData.value }
    if (changeType.value === HrmEmployeeChangeType.REGULAR) {
      await regularEmployee(payload)
    } else if (changeType.value === HrmEmployeeChangeType.TRANSFER) {
      await transferEmployee(payload)
    } else if (changeType.value === HrmEmployeeChangeType.PROMOTION) {
      await promoteEmployee(payload)
    } else if (changeType.value === HrmEmployeeChangeType.DEMOTION) {
      await demoteEmployee(payload)
    } else if (changeType.value === HrmEmployeeChangeType.FULL_TIME) {
      await convertEmployeeToFullTime(payload as EmployeeConvertToFullTimeReq)
    }
    toast.success('保存成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
