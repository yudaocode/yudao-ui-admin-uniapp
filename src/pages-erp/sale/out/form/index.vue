<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="出库单号" :value="formData.no || '保存时自动生成'" />
          <wd-form-item title="出库时间" title-width="220rpx" prop="outTime" is-link :value="formatDate(formData.outTime) || ''" placeholder="请选择出库时间" @click="dateVisible.outTime = true" />
          <wd-datetime-picker v-model:visible="dateVisible.outTime" :model-value="formatDate(formData.outTime)" title="请选择出库时间" type="date" @update:model-value="value => formData.outTime = formatOptionalDate(value)" />
          <wd-form-item
            title="关联订单"
            title-width="220rpx"
            prop="orderId"
            is-link
            :value="formData.orderNo || ''"
            placeholder="请选择可出库订单"
            @click="openOrderSelector"
          />
          <yd-form-picker v-model="formData.customerId" label="客户" label-width="220rpx" prop="customerId" :columns="customerOptions" label-key="name" value-key="id" placeholder="请选择客户" disabled />
          <yd-form-picker v-model="formData.saleUserId" label="销售人员" label-width="220rpx" :columns="userOptions" label-key="name" value-key="id" placeholder="请选择销售人员" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrl">
            <yd-upload-file v-model="formData.fileUrl" :limit="1" />
          </wd-form-item>
        </wd-cell-group>

        <!-- 出库明细 -->
        <view class="flex items-center justify-between px-24rpx py-16rpx">
          <text class="text-28rpx text-[#333] font-semibold">出库产品清单</text>
        </view>
        <view class="px-24rpx">
          <OutItemForm ref="itemEditorRef" v-model="formData.items" :warehouse-options="warehouseOptions" />
        </view>

        <!-- 结算信息 -->
        <view class="flex items-center justify-between px-24rpx py-16rpx">
          <text class="text-28rpx text-[#333] font-semibold">结算信息</text>
        </view>
        <wd-cell-group border>
          <wd-form-item title="优惠率(%)" title-width="220rpx" prop="discountPercent" center>
            <wd-input-number v-model="formData.discountPercent" :min="0" :precision="2" />
          </wd-form-item>
          <wd-cell title="收款优惠" :value="formatMoney(formData.discountPrice)" />
          <wd-cell title="优惠后金额" :value="formatMoney(preOtherPrice)" />
          <wd-form-item title="其它费用" title-width="220rpx" prop="otherPrice" center>
            <wd-input-number v-model="formData.otherPrice" :min="0" :precision="2" />
          </wd-form-item>
          <AccountPicker v-model="formData.accountId" :auto-default="!props.id" label="结算账户" label-width="220rpx" placeholder="请选择结算账户" />
          <wd-cell title="应收金额" :value="formatMoney(formData.totalPrice)" />
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

    <!-- 可出库订单选择器 -->
    <SaleOrderOutPicker ref="orderSelectorRef" @success="handleSaleOrderChange" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { SaleOrder } from '@/api/erp/sale/order'
import type { SaleOut } from '@/api/erp/sale/out'
import type { Warehouse } from '@/api/erp/stock/warehouse'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { createSaleOut, getSaleOut, updateSaleOut } from '@/api/erp/sale/out'
import { getWarehouseSimpleList } from '@/api/erp/stock/warehouse'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate, formatOptionalDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import AccountPicker from '@/pages-erp/finance/account/components/account-picker.vue'
import OutItemForm from '../components/out-item-form.vue'
import SaleOrderOutPicker from '../components/sale-order-out-picker.vue'
import { roundPrice } from '@/pages-erp/utils/format'
import { formatMoney, toNumber } from '@/utils/format'
import { getCustomerSimpleList } from '@/api/erp/sale/customer'
import { getSimpleUserList } from '@/api/system/user'

const props = defineProps<{ id?: number }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑销售出库' : '新增销售出库')
const formLoading = ref(false) // 表单提交状态
const formData = ref<SaleOut>({
  id: undefined,
  no: undefined,
  customerId: undefined,
  accountId: undefined,
  saleUserId: undefined,
  orderId: undefined,
  outTime: formatDate(Date.now()),
  orderNo: undefined,
  remark: undefined,
  fileUrl: '',
  discountPercent: 0,
  discountPrice: 0,
  totalPrice: 0,
  otherPrice: 0,
  items: [],
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const itemEditorRef = ref<InstanceType<typeof OutItemForm>>() // 明细组件引用
const orderSelectorRef = ref<InstanceType<typeof SaleOrderOutPicker>>() // 可出库订单选择器引用
const warehouseOptions = ref<Warehouse[]>([]) // 仓库选项
const customerOptions = ref<Record<string, any>[]>([]) // 客户选项
const userOptions = ref<Record<string, any>[]>([]) // 用户选项
const dateVisible = reactive({
  outTime: false,
}) // 日期选择器状态
const formSchema = createFormSchema({
  orderId: [{ required: true, message: '销售订单不能为空' }],
  customerId: [{ required: true, message: '客户不能为空' }],
  outTime: [{ required: true, message: '出库时间不能为空' }],
})
const preOtherPrice = computed(() => Number(formData.value.totalPrice || 0) - Number(formData.value.otherPrice || 0))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/sale/out/index')
}

/** 刷新出库金额 */
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
  const [warehouses, customers, users] = await Promise.all([
    getWarehouseSimpleList(),
    getCustomerSimpleList(),
    getSimpleUserList(),
  ])
  warehouseOptions.value = warehouses || []
  customerOptions.value = customers || []
  userOptions.value = users || []
}

/** 加载销售出库详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getSaleOut(props.id)
  } finally {
    toast.close()
  }
  refreshAmount()
}

/** 打开可出库订单选择器 */
function openOrderSelector() {
  orderSelectorRef.value?.open()
}

/** 应用销售订单到出库单 */
function handleSaleOrderChange(order: SaleOrder) {
  formData.value.orderId = order.id
  formData.value.orderNo = order.no
  formData.value.customerId = order.customerId
  formData.value.accountId = order.accountId || formData.value.accountId
  formData.value.saleUserId = order.saleUserId
  formData.value.discountPercent = order.discountPercent || 0
  formData.value.remark = order.remark
  formData.value.fileUrl = order.fileUrl
  formData.value.items = (order.items || []).map((item) => {
    const totalCount = Number(item.count || 0)
    const outCount = Number(item.outCount || 0)
    return {
      ...item,
      id: undefined,
      orderItemId: item.id,
      totalCount,
      outCount,
      count: Number((totalCount - outCount).toFixed(3)),
    }
  }).filter(item => Number(item.count || 0) > 0)
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
      await updateSaleOut(formData.value)
      toast.success('修改成功')
    } else {
      await createSaleOut(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:sale-out:reload')
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
