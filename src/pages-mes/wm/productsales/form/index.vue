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
          <wd-form-item title="出库单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入出库单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="出库单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入出库单名称" />
          </wd-form-item>
          <wd-form-item
            title="发货通知单"
            title-width="200rpx"
            prop="noticeId"
            :is-link="!isHeaderReadonly"
            :value="selectedNoticeText"
            placeholder="请选择发货通知单"
            @click="openNoticePicker"
          />
          <wd-form-item title="销售订单编号" title-width="200rpx" prop="salesOrderCode">
            <wd-input v-model="formData.salesOrderCode" clearable :disabled="isHeaderReadonly" placeholder="请输入销售订单编号" />
          </wd-form-item>
          <wd-form-item
            title="出库日期"
            title-width="200rpx"
            prop="salesDate"
            is-link
            placeholder="请选择出库日期"
            :value="formatDateTime(formData.salesDate)"
            @click="openSalesDatePicker"
          />
          <wd-datetime-picker
            v-model="formData.salesDate"
            v-model:visible="pickerVisible.salesDate"
            title="请选择出库日期"
            type="datetime"
          />
          <ClientFormPicker
            v-model="formData.clientId"
            label="客户"
            label-width="200rpx"
            prop="clientId"
            placeholder="请选择客户"
            :disabled="isHeaderReadonly"
            @change="handleClientChange"
          />
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_PRODUCT_SALES_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="收货人" title-width="200rpx" prop="contactName">
            <wd-input v-model="formData.contactName" clearable :disabled="isHeaderReadonly" placeholder="请输入收货人" />
          </wd-form-item>
          <wd-form-item title="联系方式" title-width="200rpx" prop="contactTelephone">
            <wd-input v-model="formData.contactTelephone" clearable :disabled="isHeaderReadonly" placeholder="请输入联系方式" />
          </wd-form-item>
          <wd-form-item title="收货地址" title-width="200rpx" prop="contactAddress">
            <wd-input v-model="formData.contactAddress" clearable :disabled="isHeaderReadonly" placeholder="请输入收货地址" />
          </wd-form-item>
          <wd-form-item v-if="showShippingInfo" title="承运商" title-width="200rpx" prop="carrier">
            <wd-input v-model="formData.carrier" clearable :disabled="!isShippingEditable" placeholder="请输入承运商" />
          </wd-form-item>
          <wd-form-item v-if="showShippingInfo" title="运输单号" title-width="200rpx" prop="shippingNumber">
            <wd-input v-model="formData.shippingNumber" clearable :disabled="!isShippingEditable" placeholder="请输入运输单号" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :disabled="isHeaderReadonly"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <ProductSalesLineList
        v-if="currentId"
        :sales-id="currentId"
        :notice-id="formData.noticeId"
        :readonly="!isEditable"
        :stock-mode="isStock"
      />
      <view v-if="isStock" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#ad6800]">
        执行拣货会影响后续库存出库流程；H5 验证仅到拣货明细弹层、必填校验和确认提示，不在真实数据上确认保存或执行。
      </view>
      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#ad6800]">
        执行出库会扣减库存；H5 验证仅到确认提示，不在真实数据上确认执行。
      </view>
      <view v-if="isCancel" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff1f0] p-24rpx text-26rpx text-[#cf1322]">
        取消后不可恢复；H5 验证仅到确认提示，不在真实数据上确认取消。
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="isEditable"
          class="flex-1"
          type="primary"
          :loading="formLoading" @click="handleSubmit"
        >
          保存
        </wd-button>
        <wd-button
          v-if="canSubmit"
          class="flex-1"
          type="warning"
          :loading="submitLoading" @click="handleSubmitProductSales"
        >
          提交
        </wd-button>
        <wd-button
          v-if="isStock"
          class="flex-1"
          type="success"
          :loading="actionLoading" @click="handleStockProductSales"
        >
          执行拣货
        </wd-button>
        <wd-button
          v-if="isShipping"
          class="flex-1"
          type="warning"
          :loading="actionLoading" @click="handleShippingProductSales"
        >
          确认填写
        </wd-button>
        <wd-button
          v-if="isFinish"
          class="flex-1"
          type="success"
          :loading="actionLoading" @click="handleFinishProductSales"
        >
          确认出库
        </wd-button>
        <wd-button
          v-if="isCancel"
          class="flex-1"
          type="danger"
          :loading="actionLoading" @click="handleCancelProductSales"
        >
          确认取消
        </wd-button>
      </view>
    </view>
    <SalesNoticePicker ref="noticePickerRef" @confirm="handleNoticeConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdClient } from '@/api/mes/md/client'
import type { WmProductSales } from '@/api/mes/wm/productsales'
import type { WmSalesNotice } from '@/api/mes/wm/salesnotice'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  cancelProductSales,
  checkProductSalesQuantity,
  createProductSales,
  finishProductSales,
  getProductSales,
  shippingProductSales,
  stockProductSales,
  submitProductSales,
  updateProductSales,
} from '@/api/mes/wm/productsales'
import { getSalesNotice } from '@/api/mes/wm/salesnotice'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmProductSalesStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ClientFormPicker from '../../../md/client/components/client-form-picker.vue'
import SalesNoticePicker from '../../salesnotice/components/sales-notice-picker.vue'
import ProductSalesLineList from '../components/product-sales-line-list.vue'

const props = defineProps<{
  id?: number | string
  noticeId?: number | string
  mode?: 'stock' | 'shipping' | 'finish' | 'cancel' | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const routeId = computed(() => props.id ? Number(props.id) : undefined) // 路由编号
const routeNoticeId = computed(() => (props.noticeId === undefined || props.noticeId === '' ? undefined : Number(props.noticeId))) // 路由发货通知编号
const routeMode = computed(() => String(props.mode || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentNoticeId = ref<number>() // 当前发货通知编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'stock') {
    return '执行拣货'
  }
  if (currentMode.value === 'shipping') {
    return '填写运单'
  }
  if (currentMode.value === 'finish') {
    return '执行出库'
  }
  if (currentMode.value === 'cancel') {
    return '取消销售出库'
  }
  return currentId.value ? '编辑销售出库' : '新增销售出库'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const actionLoading = ref(false) // 状态动作状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmProductSales>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '出库单编号不能为空' }],
  name: [{ required: true, message: '出库单名称不能为空' }],
  clientId: [{ required: true, message: '客户不能为空' }],
  salesDate: [{ required: true, message: '出库日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const noticePickerRef = ref<InstanceType<typeof SalesNoticePicker>>() // 发货通知选择器引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isStock = computed(() => currentMode.value === 'stock' && formData.value.status === MesWmProductSalesStatusEnum.APPROVING)
const isShipping = computed(() => currentMode.value === 'shipping' && formData.value.status === MesWmProductSalesStatusEnum.SHIPPING)
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmProductSalesStatusEnum.APPROVED)
const isCancel = computed(() => currentMode.value === 'cancel' && (
  formData.value.status === MesWmProductSalesStatusEnum.CONFIRMED
  || formData.value.status === MesWmProductSalesStatusEnum.APPROVING
  || formData.value.status === MesWmProductSalesStatusEnum.SHIPPING
  || formData.value.status === MesWmProductSalesStatusEnum.APPROVED
))
const isEditable = computed(() => {
  if (!currentId.value) {
    return true
  }
  return (!currentMode.value || currentMode.value === 'update')
    && formData.value.status === MesWmProductSalesStatusEnum.PREPARE
})
const isHeaderReadonly = computed(() => Boolean(currentId.value) && !isEditable.value)
const isShippingEditable = computed(() => isShipping.value)
const showShippingInfo = computed(() => (
  isShipping.value
  || Boolean(formData.value.carrier)
  || Boolean(formData.value.shippingNumber)
))
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmProductSalesStatusEnum.PREPARE
))
const selectedNoticeText = computed(() => formData.value.noticeCode ?? '')

/** 默认表单数据 */
function getDefaultFormData(): WmProductSales {
  return {}
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/productsales/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = await getProductSales(currentId.value)
}

/** 按发货通知预填新增表单 */
async function loadNoticePreset() {
  if (!currentNoticeId.value || currentId.value) {
    return
  }
  const notice = await getSalesNotice(currentNoticeId.value)
  handleNoticeConfirm(notice)
  if (!formData.value.name) {
    formData.value.name = notice.name || notice.code
  }
  if (!formData.value.salesDate) {
    formData.value.salesDate = notice.salesDate
  }
}

/** 打开出库日期选择 */
function openSalesDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.salesDate = true
}

/** 打开发货通知选择器 */
function openNoticePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  noticePickerRef.value?.open()
}

/** 客户变更 */
function handleClientChange(client?: MdClient) {
  formData.value.clientId = client?.id
  formData.value.clientCode = client?.code
  formData.value.clientName = client?.name
}

/** 确认选择发货通知 */
function handleNoticeConfirm(notice: WmSalesNotice) {
  formData.value.noticeId = notice.id
  formData.value.noticeCode = notice.code
  formData.value.salesOrderCode = notice.salesOrderCode
  formData.value.clientId = notice.clientId
  formData.value.clientCode = notice.clientCode
  formData.value.clientName = notice.clientName
  formData.value.contactName = notice.recipientName
  formData.value.contactTelephone = notice.recipientTelephone
  formData.value.contactAddress = notice.recipientAddress
}

/** 生成出库单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_PRODUCT_SALES_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (currentId.value) {
      await updateProductSales(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createProductSales(formData.value)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmProductSalesStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:productsales:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交销售出库单 */
async function handleSubmitProductSales() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该销售出库单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateProductSales(formData.value)
    await submitProductSales(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:productsales:reload')
    await getDetail()
  } finally {
    submitLoading.value = false
  }
}

/** 执行拣货 */
async function handleStockProductSales() {
  if (!currentId.value) {
    return
  }
  actionLoading.value = true
  try {
    const quantityMatch = await checkProductSalesQuantity(currentId.value)
    if (!quantityMatch) {
      try {
        await dialog.confirm({
          title: '提示',
          msg: '出库数量与拣货数量不一致，确认执行拣货？',
        })
      } catch {
        return
      }
    } else {
      try {
        await dialog.confirm({
          title: '提示',
          msg: '确认执行拣货？',
        })
      } catch {
        return
      }
    }
    await stockProductSales(currentId.value)
    toast.success('拣货成功')
    uni.$emit('mes:wm:productsales:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 填写运单 */
async function handleShippingProductSales() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交运单信息？',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await shippingProductSales({
      id: currentId.value,
      carrier: formData.value.carrier,
      shippingNumber: formData.value.shippingNumber,
    })
    toast.success('运单信息填写成功')
    uni.$emit('mes:wm:productsales:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 执行出库 */
async function handleFinishProductSales() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行出库？执行后将扣减库存。',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await finishProductSales(currentId.value)
    toast.success('出库成功')
    uni.$emit('mes:wm:productsales:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 取消销售出库单 */
async function handleCancelProductSales() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该销售出库单？取消后不可恢复。',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await cancelProductSales(currentId.value)
    toast.success('取消成功')
    uni.$emit('mes:wm:productsales:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  currentId.value = routeId.value
  currentNoticeId.value = routeNoticeId.value
  currentMode.value = routeMode.value
  if (!currentId.value) {
    await loadNoticePreset()
    return
  }
  await getDetail()
})
</script>
