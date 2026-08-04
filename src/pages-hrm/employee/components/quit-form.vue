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
          <wd-form-item title="计划离职时间" title-width="220rpx" prop="planQuitTime" center>
            <view class="w-full" @click="planQuitVisible = true">
              <wd-input
                :model-value="formatDateTime(formData.planQuitTime) || ''"
                readonly
                align-right
                placeholder="请选择"
              />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.planQuitTime"
            v-model:visible="planQuitVisible"
            type="datetime"
            title="计划离职时间"
          />
          <wd-form-item title="申请离职日期" title-width="220rpx" prop="applyQuitTime" center>
            <view class="w-full" @click="applyQuitVisible = true">
              <wd-input
                :model-value="formatDate(formData.applyQuitTime) || ''"
                readonly
                align-right
                placeholder="请选择"
              />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.applyQuitTime"
            v-model:visible="applyQuitVisible"
            type="date"
            title="申请离职日期"
          />
          <yd-form-picker
            v-model="formData.type"
            label="离职类型"
            label-width="220rpx"
            prop="type"
            :columns="quitTypeColumns"
            placeholder="请选择离职类型"
            @confirm="handleQuitTypeChange"
          />
          <yd-form-picker
            v-if="formData.type !== HrmEmployeeQuitType.RETIREMENT"
            v-model="formData.reason"
            label="离职原因"
            label-width="220rpx"
            prop="reason"
            :columns="quitReasonColumns"
            placeholder="请选择离职原因"
          />
          <wd-form-item title="薪资结算日期" title-width="220rpx" prop="salarySettlementTime" center>
            <view class="w-full" @click="salarySettlementVisible = true">
              <wd-input
                :model-value="formatDate(formData.salarySettlementTime) || ''"
                readonly
                align-right
                placeholder="请选择"
              />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.salarySettlementTime"
            v-model:visible="salarySettlementVisible"
            type="date"
            title="薪资结算日期"
          />
          <wd-form-item title="备注" title-width="220rpx" prop="remark" vertical>
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
import type { Employee, EmployeeQuitReq } from '@/api/hrm/employee'
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { quitEmployee } from '@/api/hrm/employee'
import { getEmployeeQuitInfo } from '@/api/hrm/employee/quit-info'
import { createFormSchema } from '@/utils/wot'
import { formatDate, formatDateTime } from '@/utils/date'
import {
  HrmEmployeeEntryStatus,
  HrmEmployeeQuitReasonOptions,
  HrmEmployeeQuitType,
  HrmEmployeeQuitTypeOptions,
} from '@/pages-hrm/utils/constants'

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示
const formLoading = ref(false) // 提交状态
const employee = ref<Employee>() // 当前员工
const planQuitVisible = ref(false) // 计划离职时间选择
const applyQuitVisible = ref(false) // 申请离职日期选择
const salarySettlementVisible = ref(false) // 薪资结算日期选择
const formRef = ref<any>() // 表单引用
const formData = ref<EmployeeQuitReq>({}) // 表单数据

const title = computed(() => // 弹窗标题
  employee.value?.entryStatus === HrmEmployeeEntryStatus.LEFT ? '修改离职信息' : '办理离职')

const quitTypeColumns = HrmEmployeeQuitTypeOptions.map(item => ({
  label: item.label,
  value: item.value,
}))

const quitReasonColumns = computed(() =>
  HrmEmployeeQuitReasonOptions
    .filter(item => item.quitType === formData.value.type)
    .map(item => ({ label: item.label, value: item.value })),
)

const formSchema = createFormSchema({
  planQuitTime: [{ required: true, message: '请选择计划离职时间' }],
  applyQuitTime: [{ required: true, message: '请选择申请离职日期' }],
  salarySettlementTime: [{ required: true, message: '请选择薪资结算日期' }],
  type: [{ required: true, message: '请选择离职类型' }],
  reason: [{
    required: () => formData.value.type !== HrmEmployeeQuitType.RETIREMENT,
    message: '请选择离职原因',
  }],
})

/** 打开弹窗 */
async function open(row: Employee) {
  visible.value = true
  employee.value = row
  formData.value = {
    employeeId: row.id,
    planQuitTime: undefined,
    applyQuitTime: undefined,
    salarySettlementTime: undefined,
    type: HrmEmployeeQuitType.VOLUNTARY,
    reason: undefined,
    remark: '',
  }
  if (!row.id) {
    return
  }
  formLoading.value = true
  try {
    const quitInfo = await getEmployeeQuitInfo(row.id)
    if (quitInfo?.id) {
      formData.value = {
        employeeId: row.id,
        planQuitTime: quitInfo.planQuitTime ? Number(quitInfo.planQuitTime) : undefined,
        applyQuitTime: quitInfo.applyQuitTime ? Number(quitInfo.applyQuitTime) : undefined,
        salarySettlementTime: quitInfo.salarySettlementTime
          ? Number(quitInfo.salarySettlementTime)
          : undefined,
        type: quitInfo.type,
        reason: quitInfo.reason,
        remark: quitInfo.remark || '',
      }
    }
  } finally {
    formLoading.value = false
  }
}

/** 离职类型变更 */
function handleQuitTypeChange() {
  formData.value.reason = undefined
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    await quitEmployee({
      ...formData.value,
      reason: formData.value.type === HrmEmployeeQuitType.RETIREMENT
        ? undefined
        : formData.value.reason,
    })
    toast.success('保存成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
