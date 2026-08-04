<template>
  <wd-popup v-model="visible" position="bottom" closable safe-area-inset-bottom @close="visible = false">
    <scroll-view scroll-y class="max-h-80vh px-32rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        编辑社保资料
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <SchemeFormPicker
            v-model="formData.schemeId"
            label="参保方案"
            label-width="220rpx"
            prop="schemeId"
            :clearable="false"
            placeholder="请选择参保方案"
          />
          <wd-cell title="起缴月份" :value="formatHrmMonth(formData.socialSecurityStartMonth)" />
          <yd-form-picker
            v-model="formData.firstSocialSecurity"
            label="本地首次缴纳社保"
            label-width="220rpx"
            prop="firstSocialSecurity"
            :columns="yesNoColumns"
            placeholder="请选择"
          />
          <yd-form-picker
            v-model="formData.firstAccumulationFund"
            label="本地首次缴纳公积金"
            label-width="220rpx"
            prop="firstAccumulationFund"
            :columns="yesNoColumns"
            placeholder="请选择"
          />
          <wd-form-item title="个人社保号" title-width="220rpx" prop="socialSecurityNumber">
            <wd-input
              v-model="formData.socialSecurityNumber"
              clearable
              placeholder="请输入个人社保号"
              :maxlength="64"
            />
          </wd-form-item>
          <wd-form-item title="个人公积金号" title-width="220rpx" prop="accumulationFundNumber">
            <wd-input
              v-model="formData.accumulationFundNumber"
              clearable
              placeholder="请输入个人公积金号"
              :maxlength="64"
            />
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
import type { InsuranceEmployeeInfo } from '@/api/hrm/insurance/employee-info'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { saveInsuranceEmployeeInfo } from '@/api/hrm/insurance/employee-info'
import SchemeFormPicker from '@/pages-hrm/insurance/month-record/components/scheme-form-picker.vue'
import { formatHrmMonth } from '@/pages-hrm/utils/format'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{ success: [] }>()
const toast = useToast()
const visible = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()
const formData = ref<InsuranceEmployeeInfo>({})
const yesNoColumns = [
  { label: '是', value: true },
  { label: '否', value: false },
]
const formSchema = createFormSchema({
  firstSocialSecurity: [{ required: true, message: '请选择是否本地首次缴纳社保' }],
  firstAccumulationFund: [{ required: true, message: '请选择是否本地首次缴纳公积金' }],
})

/** 打开弹窗 */
function open(row: InsuranceEmployeeInfo) {
  visible.value = true
  formData.value = {
    ...row,
    socialSecurityNumber: row.socialSecurityNumber || '',
    accumulationFundNumber: row.accumulationFundNumber || '',
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
    await saveInsuranceEmployeeInfo(formData.value)
    toast.success('保存成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
