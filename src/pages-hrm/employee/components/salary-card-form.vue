<template>
  <wd-popup v-model="visible" position="bottom" closable safe-area-inset-bottom @close="visible = false">
    <view class="px-32rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        编辑工资卡
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="银行卡号" title-width="200rpx" prop="bankCardNumber">
            <wd-input
              v-model="formData.bankCardNumber"
              clearable
              placeholder="请输入银行卡号"
              :maxlength="64"
            />
          </wd-form-item>
          <yd-tree-select
            v-model="formData.bankAreaId"
            :data="areaTree"
            label="开户地区"
            prop="bankAreaId"
            label-width="200rpx"
            placeholder="请选择开户地区"
          />
          <wd-form-item title="银行名称" title-width="200rpx" prop="bankName">
            <wd-input
              v-model="formData.bankName"
              clearable
              placeholder="请输入银行名称"
              :maxlength="128"
            />
          </wd-form-item>
          <wd-form-item title="开户支行" title-width="200rpx" prop="bankBranchName">
            <wd-input
              v-model="formData.bankBranchName"
              clearable
              placeholder="请输入开户支行"
              :maxlength="255"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-32rpx">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { EmployeeSalaryCard } from '@/api/hrm/employee/salary-card'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import {
  getEmployeeSalaryCard,
  saveEmployeeSalaryCard,
} from '@/api/hrm/employee/salary-card'
import { getAreaTree } from '@/api/system/area'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{ success: [] }>()
const toast = useToast()
const visible = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()
const areaTree = ref<any[]>([])
const formData = ref<EmployeeSalaryCard>({ bankCardNumber: '' })
const formSchema = createFormSchema({
  bankCardNumber: [{ required: true, message: '银行卡号不能为空' }],
})

/** 打开弹窗 */
async function open(employeeId: number) {
  visible.value = true
  formLoading.value = true
  try {
    if (!areaTree.value.length) {
      areaTree.value = await getAreaTree()
    }
    const data = await getEmployeeSalaryCard(employeeId)
    formData.value = {
      bankCardNumber: '',
      bankAreaId: undefined,
      bankName: '',
      bankBranchName: '',
      ...(data || {}),
      employeeId,
    }
  } finally {
    formLoading.value = false
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    await saveEmployeeSalaryCard(formData.value)
    toast.success('保存成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
