<template>
  <wd-popup v-model="visible" position="bottom" closable safe-area-inset-bottom @close="visible = false">
    <scroll-view scroll-y class="max-h-80vh px-32rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ title }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="合同编号" title-width="200rpx" prop="no">
            <wd-input v-model="formData.no" clearable placeholder="请输入合同编号" :maxlength="128" />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.type"
            label="合同类型"
            label-width="200rpx"
            prop="type"
            :columns="contractTypeColumns"
            placeholder="请选择合同类型"
            @confirm="handleTypeChange"
          />
          <wd-form-item title="开始日期" title-width="200rpx" prop="startTime" center>
            <view class="w-full" @click="startVisible = true">
              <wd-input :model-value="formatDate(startPicker) || ''" readonly align-right placeholder="请选择" />
            </view>
          </wd-form-item>
          <wd-datetime-picker v-model="startPicker" v-model:visible="startVisible" type="date" title="开始日期" />
          <wd-form-item title="结束日期" title-width="200rpx" prop="endTime" center>
            <view class="w-full" @click="endVisible = true">
              <wd-input :model-value="formatDate(endPicker) || ''" readonly align-right placeholder="请选择" />
            </view>
          </wd-form-item>
          <wd-datetime-picker v-model="endPicker" v-model:visible="endVisible" type="date" title="结束日期" />
          <yd-form-picker
            v-if="formData.type !== HrmEmployeeContractType.NON_FIXED_TERM_LABOR_CONTRACT"
            v-model="formData.term"
            label="期限（年）"
            label-width="200rpx"
            prop="term"
            :columns="termColumns"
            placeholder="请选择合同期限"
          />
          <yd-form-picker
            v-model="formData.status"
            label="状态"
            label-width="200rpx"
            prop="status"
            :columns="statusColumns"
            placeholder="请选择状态"
          />
          <wd-form-item title="签约公司" title-width="200rpx" prop="signCompany">
            <wd-input v-model="formData.signCompany" clearable placeholder="请输入签约公司" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="签订日期" title-width="200rpx" prop="signTime" center>
            <view class="w-full" @click="signVisible = true">
              <wd-input :model-value="formatDate(signPicker) || ''" readonly align-right placeholder="请选择" />
            </view>
          </wd-form-item>
          <wd-datetime-picker v-model="signPicker" v-model:visible="signVisible" type="date" title="签订日期" />
          <wd-form-item title="到期提醒" title-width="200rpx" prop="expireRemind" center>
            <wd-switch v-model="formData.expireRemind" />
          </wd-form-item>
          <wd-form-item title="附件" title-width="200rpx" prop="fileUrls" vertical>
            <yd-upload-file v-model="formData.fileUrls" :limit="10" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-input v-model="formData.remark" clearable placeholder="请输入备注" :maxlength="500" />
          </wd-form-item>
          <wd-form-item title="排序" title-width="200rpx" prop="sort">
            <wd-input-number v-model="formData.sort" allow-null :min="0" :precision="0" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-32rpx">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </scroll-view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { EmployeeContract } from '@/api/hrm/employee/contract'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import {
  createEmployeeContract,
  updateEmployeeContract,
} from '@/api/hrm/employee/contract'
import { formatDate, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import {
  HrmEmployeeContractStatus,
  HrmEmployeeContractStatusOptions,
  HrmEmployeeContractTermOptions,
  HrmEmployeeContractType,
  HrmEmployeeContractTypeOptions,
} from '@/pages-hrm/utils/constants'

const emit = defineEmits<{ success: [] }>()
const toast = useToast()
const visible = ref(false)
const formLoading = ref(false)
const startVisible = ref(false)
const endVisible = ref(false)
const signVisible = ref(false)
const startPicker = ref<number | string>('') // 开始日期本地值
const endPicker = ref<number | string>('') // 结束日期本地值
const signPicker = ref<number | string>('') // 签订日期本地值
const formRef = ref<FormInstance>()
const formData = ref<EmployeeContract>({
  sort: 1,
  expireRemind: false,
  status: HrmEmployeeContractStatus.IN_PROGRESS,
  fileUrls: [],
})
const contractTypeColumns = [...HrmEmployeeContractTypeOptions]
const termColumns = [...HrmEmployeeContractTermOptions]
const statusColumns = [...HrmEmployeeContractStatusOptions]
const formSchema = createFormSchema({
  type: [{ required: true, message: '合同类型不能为空' }],
  startTime: [{ required: true, message: '开始日期不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const title = computed(() => formData.value.id ? '修改合同' : '新增合同')

/** 打开弹窗 */
function open(employeeId: number, row?: EmployeeContract) {
  visible.value = true
  formData.value = {
    sort: 1,
    expireRemind: false,
    status: HrmEmployeeContractStatus.IN_PROGRESS,
    employeeId,
    ...row,
    fileUrls: row?.fileUrls ? [...row.fileUrls] : [],
  }
  startPicker.value = toTimestamp(row?.startTime) || ''
  endPicker.value = toTimestamp(row?.endTime) || ''
  signPicker.value = toTimestamp(row?.signTime) || ''
}

/** 无固定期限时清空期限 */
function handleTypeChange() {
  if (formData.value.type === HrmEmployeeContractType.NON_FIXED_TERM_LABOR_CONTRACT) {
    formData.value.term = undefined
  }
}

/** 提交表单 */
async function handleSubmit() {
  formData.value.startTime = startPicker.value || undefined
  formData.value.endTime = endPicker.value || undefined
  formData.value.signTime = signPicker.value || undefined
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateEmployeeContract(formData.value)
    } else {
      await createEmployeeContract(formData.value)
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
