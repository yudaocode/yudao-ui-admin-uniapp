<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <CustomerFormPicker
            v-model="formData.customerId"
            prop="customerId"
            @change="handleCustomerChange"
          />
          <ContractFormPicker
            v-model="formData.contractId"
            prop="contractId"
            :customer-id="formData.customerId"
            :option-filter="contractFilter"
            @change="handleContractChange"
          />
          <ReceivablePlanFormPicker
            v-model="formData.planId"
            prop="planId"
            :customer-id="formData.customerId"
            :contract-id="formData.contractId"
            :option-filter="planFilter"
            @change="handlePlanChange"
          />
          <yd-form-picker v-model="formData.returnType" label="回款方式" prop="returnType" :dict-type="DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE" placeholder="请选择回款方式" />
          <wd-form-item title="回款金额" title-width="200rpx" prop="price">
            <wd-input-number v-model="formData.price" :min="0.01" :precision="2" input-type="number" allow-null placeholder="请输入回款金额" />
          </wd-form-item>
          <wd-form-item title="回款日期" title-width="200rpx" prop="returnTime" is-link placeholder="请选择回款日期" :value="formatDate(formData.returnTime)" @click="pickerVisible.returnTime = true" />
          <wd-datetime-picker v-model="formData.returnTime" v-model:visible="pickerVisible.returnTime" title="请选择回款日期" type="date" />
          <UserFormPicker v-model="formData.ownerUserId" label="负责人" prop="ownerUserId" placeholder="请选择负责人" :disabled="!!props.id" />
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Contract } from '@/api/crm/contract'
import type { Receivable } from '@/api/crm/receivable'
import type { ReceivablePlan } from '@/api/crm/receivable/plan'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { CrmAuditStatusEnum } from '@/api/crm/permission'
import { createReceivable, getReceivable, updateReceivable } from '@/api/crm/receivable'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { useUserStore } from '@/store/user'
import { currRoute, delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ContractFormPicker from '@/pages-crm/contract/components/contract-form-picker.vue'
import CustomerFormPicker from '@/pages-crm/customer/components/customer-form-picker.vue'
import ReceivablePlanFormPicker from '@/pages-crm/receivable-plan/components/receivable-plan-form-picker.vue'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const userStore = useUserStore()
const getTitle = computed(() => props.id ? '编辑回款' : '新增回款')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Receivable>({
  id: undefined,
  customerId: undefined,
  contractId: undefined,
  planId: undefined,
  returnType: undefined,
  price: undefined,
  returnTime: undefined,
  ownerUserId: undefined,
  remark: '',
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const formSchema = createFormSchema({
  contractId: [{ required: true, message: '合同名称不能为空' }],
  price: [{ required: true, message: '回款金额不能为空' }],
  returnTime: [{ required: true, message: '回款日期不能为空' }],
  ownerUserId: [{ required: true, message: '负责人不能为空' }],
})

/** 合同选项过滤：仅展示已审核通过的合同 */
function contractFilter(raw: Record<string, any>) {
  return raw.auditStatus === CrmAuditStatusEnum.APPROVE
}

/** 回款计划选项过滤：仅展示未关联回款的计划 */
function planFilter(raw: Record<string, any>) {
  return !raw.receivableId
}

/** 客户变更后清空合同、回款期数 */
function handleCustomerChange() {
  formData.value.contractId = undefined
  formData.value.planId = undefined
}

/** 合同变更后清空回款期数，并回填应回款金额（合同金额 - 已回款金额） */
function handleContractChange(contract?: Contract) {
  formData.value.planId = undefined
  const remaining = Number(contract?.totalPrice || 0) - Number(contract?.totalReceivablePrice || 0)
  formData.value.price = Math.round(remaining * 100) / 100
}

/** 回款计划变更后回填金额与回款方式 */
function handlePlanChange(plan?: ReceivablePlan) {
  if (plan?.price !== undefined) {
    formData.value.price = plan.price
  }
  if (plan?.returnType !== undefined) {
    formData.value.returnType = plan.returnType
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/receivable/index')
}

/** 应用页面预填参数 */
function applyQueryDefaults() {
  if (props.id) {
    return
  }
  const query = currRoute().query
  const numericKeys = ['customerId', 'contractId', 'planId', 'price', 'returnType', 'ownerUserId']
  numericKeys.forEach((key) => {
    const value = query[key]
    if (value !== undefined && value !== '') {
      (formData.value as Record<string, any>)[key] = Number(value)
    }
  })
}

/** 加载回款详情 */
async function getDetail() {
  if (!props.id) {
    // 新增时默认负责人为当前登录用户
    if (!formData.value.ownerUserId) {
      const userId = userStore.userInfo?.userId
      if (userId && userId !== -1) {
        formData.value.ownerUserId = userId
      }
    }
    return
  }
  formData.value = await getReceivable(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateReceivable(formData.value)
      toast.success('修改成功')
    } else {
      await createReceivable(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('crm:receivable:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  applyQueryDefaults()
  await getDetail()
})
</script>
