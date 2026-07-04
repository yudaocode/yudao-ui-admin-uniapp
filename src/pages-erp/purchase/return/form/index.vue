<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="退货单号" :value="formData.no || '保存时自动生成'" />
          <wd-form-item title="退货时间" title-width="220rpx" prop="returnTime" is-link :value="formatDate(formData.returnTime) || ''" placeholder="请选择退货时间" @click="dateVisible.returnTime = true" />
          <wd-datetime-picker v-model="formData.returnTime" v-model:visible="dateVisible.returnTime" title="请选择退货时间" type="date" />
          <wd-cell title="关联订单" :value="formData.orderNo || '请选择可退货采购订单'" is-link @click="openOrderSelector" />
          <wd-form-item title="供应商" title-width="220rpx" prop="supplierId">
            <wd-input :model-value="supplierDisplayValue" placeholder="选择采购订单后回填" disabled />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrl">
            <yd-upload-file v-model="formData.fileUrl" :limit="1" />
          </wd-form-item>
        </wd-cell-group>

        <!-- 退货明细 -->
        <view class="flex items-center justify-between px-24rpx py-16rpx">
          <text class="text-28rpx text-[#333] font-semibold">退货产品清单</text>
        </view>
        <view class="px-24rpx">
          <ReturnItemForm ref="itemEditorRef" v-model="formData.items" :warehouse-options="warehouseOptions" />
        </view>

        <!-- 结算信息 -->
        <view class="flex items-center justify-between px-24rpx py-16rpx">
          <text class="text-28rpx text-[#333] font-semibold">结算信息</text>
        </view>
        <wd-cell-group border>
          <wd-form-item title="优惠率(%)" title-width="220rpx" prop="discountPercent" center>
            <wd-input-number v-model="formData.discountPercent" :min="0" :precision="2" />
          </wd-form-item>
          <wd-cell title="退款优惠" :value="formatMoney(formData.discountPrice)" />
          <wd-cell title="优惠后金额" :value="formatMoney(preOtherPrice)" />
          <wd-form-item title="其它费用" title-width="220rpx" prop="otherPrice" center>
            <wd-input-number v-model="formData.otherPrice" :min="0" :precision="2" />
          </wd-form-item>
          <AccountPicker v-model="formData.accountId" :auto-default="!props.id" label="结算账户" label-width="220rpx" placeholder="请选择结算账户" />
          <wd-cell title="应退金额" :value="formatMoney(formData.totalPrice)" />
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
    <PurchaseOrderReturnPicker ref="orderSelectorRef" @success="handlePurchaseOrderChange" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { PurchaseOrder } from '@/api/erp/purchase/order'
import type { PurchaseReturn } from '@/api/erp/purchase/return'
import type { Supplier } from '@/api/erp/purchase/supplier'
import type { Warehouse } from '@/api/erp/stock/warehouse'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getSupplierSimpleList } from '@/api/erp/purchase/supplier'
import { createPurchaseReturn, getPurchaseReturn, updatePurchaseReturn } from '@/api/erp/purchase/return'
import { getWarehouseSimpleList } from '@/api/erp/stock/warehouse'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import AccountPicker from '@/pages-erp/finance/account/components/account-picker.vue'
import PurchaseOrderReturnPicker from '../components/purchase-order-return-picker.vue'
import ReturnItemForm from '../components/return-item-form.vue'
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
const getTitle = computed(() => props.id ? '编辑采购退货' : '新增采购退货')
const formLoading = ref(false) // 表单提交状态
const formData = ref<PurchaseReturn>({
  id: undefined,
  no: undefined,
  supplierId: undefined,
  accountId: undefined,
  returnTime: Date.now(),
  orderNo: undefined,
  remark: undefined,
  fileUrl: '',
  discountPercent: 0,
  discountPrice: 0,
  totalPrice: 0,
  otherPrice: 0,
  items: [],
}) // 表单数据
const formRef = ref<FormInstance>()
const itemEditorRef = ref<InstanceType<typeof ReturnItemForm>>()
const orderSelectorRef = ref<InstanceType<typeof PurchaseOrderReturnPicker>>()
const supplierOptions = ref<Supplier[]>([])
const warehouseOptions = ref<Warehouse[]>([])
const dateVisible = reactive({ returnTime: false })
const formSchema = createFormSchema({
  supplierId: [{ required: true, message: '供应商不能为空，请先选择采购订单' }],
  returnTime: [{ required: true, message: '退货时间不能为空' }],
})
const supplierDisplayValue = computed(() => getWotPickerFormValue(supplierOptions.value, formData.value.supplierId, { valueKey: 'id', labelKey: 'name' }))
const preOtherPrice = computed(() => Number(formData.value.totalPrice || 0) - Number(formData.value.otherPrice || 0))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/purchase/return/index')
}

/** 刷新退货金额 */
function refreshAmount() {
  const items = Array.isArray(formData.value.items) ? formData.value.items : []
  const totalCount = items.reduce((sum, item) => sum + toNumber(item.count), 0)
  const totalPrice = items.reduce((sum, item) => sum + toNumber(item.totalPrice), 0)
  const discountPrice = roundPrice(totalPrice * toNumber(formData.value.discountPercent) / 100)
  formData.value.totalCount = Number(totalCount.toFixed(3))
  formData.value.discountPrice = discountPrice
  formData.value.totalPrice = roundPrice(totalPrice - discountPrice + toNumber(formData.value.otherPrice))
}

/** 加载基础选项 */
async function loadOptions() {
  const [suppliers, warehouses] = await Promise.all([
    getSupplierSimpleList(),
    getWarehouseSimpleList(),
  ])
  supplierOptions.value = suppliers || []
  warehouseOptions.value = warehouses || []
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPurchaseReturn(props.id)
  } finally {
    toast.close()
  }
  refreshAmount()
}

/** 打开采购订单选择器 */
function openOrderSelector() {
  orderSelectorRef.value?.open()
}

/** 选择采购订单后回填 */
function handlePurchaseOrderChange(order: PurchaseOrder) {
  formData.value.orderId = order.id
  formData.value.orderNo = order.no
  formData.value.supplierId = order.supplierId
  formData.value.accountId = order.accountId || formData.value.accountId
  formData.value.discountPercent = order.discountPercent || 0
  formData.value.remark = order.remark
  formData.value.fileUrl = order.fileUrl
  formData.value.items = (order.items || []).map((item) => {
    const inCount = toNumber(item.inCount)
    const returnCount = toNumber(item.returnCount)
    return {
      ...item,
      id: undefined,
      orderItemId: item.id,
      inCount,
      returnCount,
      count: Number((inCount - returnCount).toFixed(3)),
    }
  }).filter(item => toNumber(item.count) > 0)
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
      await updatePurchaseReturn(formData.value)
      toast.success('修改成功')
    } else {
      await createPurchaseReturn(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:purchase-return:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 明细变更后刷新金额 */
watch(() => [formData.value.items, formData.value.discountPercent, formData.value.otherPrice], refreshAmount, { deep: true })

/** 初始化 */
onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
