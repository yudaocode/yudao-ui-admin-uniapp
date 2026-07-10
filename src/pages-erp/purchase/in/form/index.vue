<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="入库单号" :value="formData.no || '保存时自动生成'" />
          <wd-form-item title="入库时间" title-width="220rpx" prop="inTime" is-link :value="formatDate(formData.inTime) || ''" placeholder="请选择入库时间" @click="dateVisible.inTime = true" />
          <wd-datetime-picker v-model="formData.inTime" v-model:visible="dateVisible.inTime" title="请选择入库时间" type="date" />
          <wd-cell title="关联订单" :value="formData.orderNo || '请选择可入库采购订单'" is-link @click="openOrderSelector" />
          <SupplierFormPicker v-model="formData.supplierId" prop="supplierId" placeholder="选择采购订单后回填" disabled />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrl">
            <yd-upload-file v-model="formData.fileUrl" :limit="1" />
          </wd-form-item>
        </wd-cell-group>

        <!-- 入库明细 -->
        <view class="flex items-center justify-between px-24rpx py-16rpx">
          <text class="text-28rpx text-[#333] font-semibold">入库产品清单</text>
        </view>
        <view class="px-24rpx">
          <InItemForm ref="itemEditorRef" v-model="formData.items" :warehouse-options="warehouseOptions" />
        </view>

        <!-- 结算信息 -->
        <view class="flex items-center justify-between px-24rpx py-16rpx">
          <text class="text-28rpx text-[#333] font-semibold">结算信息</text>
        </view>
        <wd-cell-group border>
          <wd-form-item title="优惠率(%)" title-width="220rpx" prop="discountPercent" center>
            <wd-input-number v-model="formData.discountPercent" :min="0" :precision="2" />
          </wd-form-item>
          <wd-cell title="付款优惠" :value="formatMoney(formData.discountPrice)" />
          <wd-cell title="优惠后金额" :value="formatMoney(preOtherPrice)" />
          <wd-form-item title="其它费用" title-width="220rpx" prop="otherPrice" center>
            <wd-input-number v-model="formData.otherPrice" :min="0" :precision="2" />
          </wd-form-item>
          <AccountFormPicker v-model="formData.accountId" label="结算账户" label-width="220rpx" placeholder="请选择结算账户" :auto-default="!props.id" />
          <wd-cell title="应付金额" :value="formatMoney(formData.totalPrice)" />
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
    <PurchaseOrderInPicker ref="orderSelectorRef" @success="handlePurchaseOrderChange" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { PurchaseIn } from '@/api/erp/purchase/in'
import type { PurchaseOrder } from '@/api/erp/purchase/order'
import type { Warehouse } from '@/api/erp/stock/warehouse'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { createPurchaseIn, getPurchaseIn, updatePurchaseIn } from '@/api/erp/purchase/in'
import { getWarehouseSimpleList } from '@/api/erp/stock/warehouse'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import AccountFormPicker from '@/pages-erp/finance/account/components/account-form-picker.vue'
import SupplierFormPicker from '@/pages-erp/purchase/supplier/components/supplier-form-picker.vue'
import InItemForm from '../components/in-item-form.vue'
import PurchaseOrderInPicker from '../components/purchase-order-in-picker.vue'
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
const getTitle = computed(() => props.id ? '编辑采购入库' : '新增采购入库')
const formLoading = ref(false) // 表单提交状态
const formData = ref<PurchaseIn>({
  id: undefined,
  no: undefined,
  supplierId: undefined,
  accountId: undefined,
  inTime: Date.now(),
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
const itemEditorRef = ref<InstanceType<typeof InItemForm>>()
const orderSelectorRef = ref<InstanceType<typeof PurchaseOrderInPicker>>()
const warehouseOptions = ref<Warehouse[]>([])
const dateVisible = reactive({
  inTime: false,
})
const formSchema = createFormSchema({
  supplierId: [{ required: true, message: '供应商不能为空，请先选择采购订单' }],
  inTime: [{ required: true, message: '入库时间不能为空' }],
})
const preOtherPrice = computed(() => Number(formData.value.totalPrice || 0) - Number(formData.value.otherPrice || 0))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/purchase/in/index')
}

/** 刷新入库金额 */
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
  const warehouses = await getWarehouseSimpleList()
  warehouseOptions.value = warehouses || []
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPurchaseIn(props.id)
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
    const totalCount = toNumber(item.count)
    const inCount = toNumber(item.inCount)
    return {
      ...item,
      id: undefined,
      orderItemId: item.id,
      totalCount,
      inCount,
      count: Number((totalCount - inCount).toFixed(3)),
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
      await updatePurchaseIn(formData.value)
      toast.success('修改成功')
    } else {
      await createPurchaseIn(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:purchase-in:reload')
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
