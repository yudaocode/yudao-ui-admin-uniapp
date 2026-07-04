<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="订单单号" :value="formData.no || '保存时自动生成'" />
          <wd-form-item
            title="订单时间"
            title-width="220rpx"
            prop="orderTime"
            is-link
            :value="formatDate(formData.orderTime) || ''"
            placeholder="请选择订单时间"
            @click="dateVisible.orderTime = true"
          />
          <wd-datetime-picker
            v-model:visible="dateVisible.orderTime"
            :model-value="formatDate(formData.orderTime)"
            title="请选择订单时间"
            type="date"
            @update:model-value="value => formData.orderTime = formatOptionalDate(value)"
          />
          <yd-form-picker v-model="formData.customerId" label="客户" label-width="220rpx" prop="customerId" :columns="customerOptions" label-key="name" value-key="id" placeholder="请选择客户" />
          <yd-form-picker v-model="formData.saleUserId" label="销售人员" label-width="220rpx" :columns="userOptions" label-key="name" value-key="id" placeholder="请选择销售人员" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrl">
            <yd-upload-file v-model="formData.fileUrl" :limit="1" />
          </wd-form-item>
        </wd-cell-group>

        <!-- 产品明细 -->
        <view class="flex items-center justify-between px-24rpx py-16rpx">
          <text class="text-28rpx text-[#333] font-semibold">订单产品清单</text>
          <wd-button size="small" type="primary" variant="plain" @click="itemEditorRef?.handleAdd()">
            添加
          </wd-button>
        </view>
        <view class="px-24rpx">
          <OrderItemForm
            ref="itemEditorRef"
            v-model="formData.items"
            :product-options="productOptions"
          />
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
          <wd-cell title="优惠后金额" :value="formatMoney(formData.totalPrice)" />
          <AccountPicker v-model="formData.accountId" :auto-default="!props.id" label="结算账户" label-width="220rpx" placeholder="请选择结算账户" />
          <wd-form-item title="收取订金" title-width="220rpx" prop="depositPrice" center>
            <wd-input-number v-model="formData.depositPrice" :min="0" :precision="2" />
          </wd-form-item>
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
import type { Product } from '@/api/erp/product/product'
import type { SaleOrder } from '@/api/erp/sale/order'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getProductSimpleList } from '@/api/erp/product/product'
import { createSaleOrder, getSaleOrder, updateSaleOrder } from '@/api/erp/sale/order'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate, formatOptionalDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import AccountPicker from '@/pages-erp/finance/account/components/account-picker.vue'
import OrderItemForm from '../components/order-item-form.vue'
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
const getTitle = computed(() => props.id ? '编辑销售订单' : '新增销售订单')
const formLoading = ref(false) // 表单提交状态
const formData = ref<SaleOrder>({
  id: undefined,
  no: undefined,
  customerId: undefined,
  accountId: undefined,
  saleUserId: undefined,
  orderTime: formatDate(Date.now()),
  remark: undefined,
  fileUrl: '',
  discountPercent: 0,
  discountPrice: 0,
  totalPrice: 0,
  depositPrice: 0,
  items: [],
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const itemEditorRef = ref<InstanceType<typeof OrderItemForm>>() // 明细组件引用
const productOptions = ref<Product[]>([]) // 产品选项
const customerOptions = ref<Record<string, any>[]>([]) // 客户选项
const userOptions = ref<Record<string, any>[]>([]) // 用户选项
const dateVisible = reactive({
  orderTime: false,
}) // 日期选择器状态
const formSchema = createFormSchema({
  customerId: [{ required: true, message: '客户不能为空' }],
  orderTime: [{ required: true, message: '订单时间不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/sale/order/index')
}

/** 刷新订单金额 */
function refreshOrderAmount() {
  const items = Array.isArray(formData.value.items) ? formData.value.items : []
  const totalCount = items.reduce((sum, item) => sum + toNumber(item.count), 0)
  const totalPrice = items.reduce((sum, item) => sum + toNumber(item.totalPrice), 0)
  const discountPrice = roundPrice(totalPrice * toNumber(formData.value.discountPercent) / 100)
  formData.value.totalCount = Number(totalCount.toFixed(3))
  formData.value.discountPrice = discountPrice
  formData.value.totalPrice = roundPrice(totalPrice - discountPrice)
}

/** 加载基础选项 */
async function loadOptions() {
  const [products, customers, users] = await Promise.all([
    getProductSimpleList(),
    getCustomerSimpleList(),
    getSimpleUserList(),
  ])
  productOptions.value = products || []
  customerOptions.value = customers || []
  userOptions.value = users || []
}

/** 加载销售订单详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getSaleOrder(props.id)
  } finally {
    toast.close()
  }
  refreshOrderAmount()
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !itemEditorRef.value?.validate()) {
    return
  }

  refreshOrderAmount()
  formLoading.value = true
  try {
    if (props.id) {
      await updateSaleOrder(formData.value)
      toast.success('修改成功')
    } else {
      await createSaleOrder(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:sale-order:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 明细变更后刷新金额 */
watch(() => [formData.value.items, formData.value.discountPercent], refreshOrderAmount, { deep: true })

/** 初始化 */
onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
