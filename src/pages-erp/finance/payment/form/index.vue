<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="付款单号" :value="formData.no || '保存时自动生成'" />
          <wd-form-item title="付款时间" title-width="220rpx" prop="paymentTime" is-link :value="formatDate(formData.paymentTime) || ''" placeholder="请选择付款时间" @click="dateVisible.paymentTime = true" />
          <wd-datetime-picker v-model="formData.paymentTime" v-model:visible="dateVisible.paymentTime" title="请选择付款时间" type="date" />
          <SupplierFormPicker v-model="formData.supplierId" prop="supplierId" />
          <UserFormPicker v-model="formData.financeUserId" label="财务人员" label-width="220rpx" placeholder="请选择财务人员" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrl">
            <yd-upload-file v-model="formData.fileUrl" :limit="1" />
          </wd-form-item>
        </wd-cell-group>

        <!-- 付款明细 -->
        <view class="flex items-center justify-between px-24rpx py-16rpx">
          <text class="text-28rpx text-[#333] font-semibold">采购入库、退货单</text>
          <view class="flex gap-12rpx">
            <wd-button size="small" type="primary" variant="plain" @click="itemEditorRef?.openPurchaseInPicker()">
              采购入库
            </wd-button>
            <wd-button size="small" type="primary" variant="plain" @click="itemEditorRef?.openPurchaseReturnPicker()">
              采购退货
            </wd-button>
          </view>
        </view>
        <view class="px-24rpx">
          <PaymentItemForm ref="itemEditorRef" v-model="formData.items" :supplier-id="formData.supplierId" />
        </view>

        <!-- 付款信息 -->
        <view class="flex items-center justify-between px-24rpx py-16rpx">
          <text class="text-28rpx text-[#333] font-semibold">付款信息</text>
        </view>
        <wd-cell-group border>
          <AccountFormPicker v-model="formData.accountId" label="付款账户" label-width="220rpx" prop="accountId" placeholder="请选择付款账户" :auto-default="!props.id" />
          <wd-cell title="合计付款" :value="formatMoney(formData.totalPrice)" />
          <wd-form-item title="优惠金额" title-width="220rpx" prop="discountPrice" center>
            <wd-input-number v-model="formData.discountPrice" :min="0" :precision="2" />
          </wd-form-item>
          <wd-cell title="实际付款" :value="formatMoney(formData.paymentPrice)" />
        </wd-cell-group>
      </wd-form>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

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
import type { FinancePayment } from '@/api/erp/finance/payment'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { createFinancePayment, getFinancePayment, updateFinancePayment } from '@/api/erp/finance/payment'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import { UserFormPicker } from '@/components/system-select'
import AccountFormPicker from '@/pages-erp/finance/account/components/account-form-picker.vue'
import SupplierFormPicker from '@/pages-erp/purchase/supplier/components/supplier-form-picker.vue'
import PaymentItemForm from '../components/payment-item-form.vue'
import { roundPrice } from '@/pages-erp/utils/format'
import { formatMoney, toNumber } from '@/utils/format'

const props = defineProps<{ id?: number }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑付款单' : '新增付款单')
const formLoading = ref(false) // 表单提交状态
const formData = ref<FinancePayment>({
  id: undefined,
  no: undefined,
  supplierId: undefined,
  accountId: undefined,
  financeUserId: undefined,
  paymentTime: Date.now(),
  remark: undefined,
  fileUrl: '',
  totalPrice: 0,
  discountPrice: 0,
  paymentPrice: 0,
  items: [],
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const itemEditorRef = ref<InstanceType<typeof PaymentItemForm>>() // 明细组件引用
const dateVisible = reactive({
  paymentTime: false,
}) // 日期选择器状态
const formSchema = createFormSchema({
  supplierId: [{ required: true, message: '供应商不能为空' }],
  accountId: [{ required: true, message: '付款账户不能为空' }],
  paymentTime: [{ required: true, message: '付款时间不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/finance/payment/index')
}

/** 刷新付款金额 */
function refreshAmount() {
  const items = Array.isArray(formData.value.items) ? formData.value.items : []
  const totalPrice = items.reduce((sum, item) => sum + toNumber(item.paymentPrice), 0)
  formData.value.totalPrice = roundPrice(totalPrice)
  formData.value.paymentPrice = roundPrice(totalPrice - toNumber(formData.value.discountPrice))
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getFinancePayment(props.id)
  } finally {
    toast.close()
  }
  refreshAmount()
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !itemEditorRef.value?.validate()) {
    return
  }

  refreshAmount()
  formLoading.value = true
  try {
    if (props.id) {
      await updateFinancePayment(formData.value)
      toast.success('修改成功')
    } else {
      await createFinancePayment(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:finance-payment:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 明细变更后刷新金额 */
watch(() => [formData.value.items, formData.value.discountPrice], refreshAmount, { deep: true })

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
