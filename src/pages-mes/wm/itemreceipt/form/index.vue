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
          <wd-form-item title="入库单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入入库单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="入库单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入入库单名称" />
          </wd-form-item>
          <wd-form-item
            title="入库日期"
            title-width="200rpx"
            prop="receiptDate"
            is-link
            placeholder="请选择入库日期"
            :value="formatDate(formData.receiptDate)"
            @click="openReceiptDatePicker"
          />
          <wd-datetime-picker
            v-model="formData.receiptDate"
            v-model:visible="pickerVisible.receiptDate"
            title="请选择入库日期"
            type="date"
          />
          <wd-form-item
            title="到货通知"
            title-width="200rpx"
            prop="noticeId"
            :is-link="!isHeaderReadonly"
            :value="selectedNoticeText"
            placeholder="请选择到货通知单"
            @click="openNoticePicker"
          />
          <VendorFormPicker v-model="formData.vendorId" label="供应商" label-width="200rpx" prop="vendorId" placeholder="请选择供应商" :disabled="isHeaderReadonly" />
          <wd-form-item title="采购订单" title-width="200rpx" prop="purchaseOrderCode">
            <wd-input v-model="formData.purchaseOrderCode" clearable :disabled="isHeaderReadonly" placeholder="请输入采购订单号" />
          </wd-form-item>
          <wd-form-item v-if="formData.iqcCode" title="来料检验" title-width="200rpx" prop="iqcCode">
            <text>{{ formData.iqcCode }}</text>
          </wd-form-item>
          <wd-form-item v-if="formData.id" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_ITEM_RECEIPT_STATUS" :value="formData.status" />
            <text v-else>-</text>
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
      <ItemReceiptLineList
        v-if="formData.id"
        :receipt-id="formData.id"
        :notice-id="formData.noticeId"
        :readonly="!isEditable"
        :stock-mode="isStock"
      />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
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
          :loading="submitLoading" @click="handleSubmitReceipt"
        >
          提交
        </wd-button>
        <wd-button
          v-if="isStock"
          class="flex-1"
          type="success"
          :loading="stockLoading" @click="handleStockReceipt"
        >
          执行上架
        </wd-button>
        <wd-button
          v-if="isFinish"
          class="flex-1"
          type="success"
          :loading="finishLoading" @click="handleFinishReceipt"
        >
          执行入库
        </wd-button>
      </view>
    </view>
    <ArrivalNoticePicker
      ref="noticePickerRef"
      :status="MesWmArrivalNoticeStatusEnum.PENDING_RECEIPT"
      @confirm="handleNoticeConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { WmArrivalNotice } from '@/api/mes/wm/arrivalnotice'
import type { WmItemReceipt } from '@/api/mes/wm/itemreceipt'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getArrivalNotice } from '@/api/mes/wm/arrivalnotice'
import { createItemReceipt, finishItemReceipt, getItemReceipt, stockItemReceipt, submitItemReceipt, updateItemReceipt } from '@/api/mes/wm/itemreceipt'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmArrivalNoticeStatusEnum, MesWmItemReceiptStatusEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import VendorFormPicker from '../../../md/vendor/components/vendor-form-picker.vue'
import ArrivalNoticePicker from '../../arrivalnotice/components/arrival-notice-picker.vue'
import ItemReceiptLineList from '../components/item-receipt-line-list.vue'

const props = defineProps<{
  id?: number | string
  noticeId?: number | string
  mode?: 'stock' | 'finish' | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const routeNoticeId = computed(() => (props.noticeId === undefined || props.noticeId === '' ? undefined : Number(props.noticeId))) // 路由到货通知编号
const routeMode = computed(() => String(props.mode || '')) // 路由模式
const getTitle = computed(() => {
  if (routeMode.value === 'stock') {
    return '执行上架'
  }
  if (routeMode.value === 'finish') {
    return '执行入库'
  }
  return props.id ? '编辑采购入库' : '新增采购入库'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const stockLoading = ref(false) // 上架状态
const finishLoading = ref(false) // 入库状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmItemReceipt>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '入库单编号不能为空' }],
  name: [{ required: true, message: '入库单名称不能为空' }],
  vendorId: [{ required: true, message: '供应商不能为空' }],
  receiptDate: [{ required: true, message: '入库日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const noticePickerRef = ref<InstanceType<typeof ArrivalNoticePicker>>() // 到货通知选择器引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isEditable = computed(() => (
  ((!props.id && !formData.value.id) || formData.value.status === MesWmItemReceiptStatusEnum.PREPARE)
  && (!routeMode.value || routeMode.value === 'update')
))
const isStock = computed(() => routeMode.value === 'stock' && formData.value.status === MesWmItemReceiptStatusEnum.APPROVING)
const isFinish = computed(() => routeMode.value === 'finish' && formData.value.status === MesWmItemReceiptStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => Boolean(formData.value.id || props.id) && !isEditable.value)
const canSubmit = computed(() => (
  isEditable.value
  && formData.value.id
  && formData.value.status === MesWmItemReceiptStatusEnum.PREPARE
))
const selectedNoticeText = computed(() => {
  return formData.value.noticeCode || ''
})

/** 默认表单数据 */
function getDefaultFormData(): WmItemReceipt {
  return {}
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/itemreceipt/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getItemReceipt(Number(props.id))
}

/** 按到货通知预填新增表单 */
async function loadNoticePreset() {
  if (!routeNoticeId.value || formData.value.id) {
    return
  }
  const notice = await getArrivalNotice(routeNoticeId.value)
  handleNoticeConfirm(notice)
  if (!formData.value.name) {
    formData.value.name = notice.name || notice.code
  }
  if (!formData.value.receiptDate) {
    formData.value.receiptDate = notice.arrivalDate
  }
}

/** 打开入库日期选择 */
function openReceiptDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.receiptDate = true
}

/** 打开到货通知选择器 */
function openNoticePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  noticePickerRef.value?.open()
}

/** 确认选择到货通知 */
function handleNoticeConfirm(notice: WmArrivalNotice) {
  formData.value.noticeId = notice.id
  formData.value.noticeCode = notice.code
  formData.value.vendorId = notice.vendorId
  formData.value.purchaseOrderCode = notice.purchaseOrderCode || formData.value.purchaseOrderCode
}

/** 生成入库单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_ITEM_RECEIPT_CODE)
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
    if (formData.value.id) {
      await updateItemReceipt(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createItemReceipt(formData.value)
      toast.success('新增成功')
      formData.value.id = id
      formData.value.status = MesWmItemReceiptStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:itemreceipt:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交采购入库单 */
async function handleSubmitReceipt() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!formData.value.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该采购入库单？提交后将不能修改。',
    })
  } catch {
    return
  }

  submitLoading.value = true
  try {
    await updateItemReceipt(formData.value)
    await submitItemReceipt(formData.value.id)
    toast.success('提交成功')
    uni.$emit('mes:wm:itemreceipt:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 执行上架 */
async function handleStockReceipt() {
  if (!formData.value.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行上架？执行后采购入库单将进入待执行入库状态。',
    })
  } catch {
    return
  }

  stockLoading.value = true
  try {
    await stockItemReceipt(formData.value.id)
    toast.success('上架成功')
    uni.$emit('mes:wm:itemreceipt:reload')
    delay(handleBack)
  } finally {
    stockLoading.value = false
  }
}

/** 执行入库 */
async function handleFinishReceipt() {
  if (!formData.value.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行入库？执行后将更新库存台账。',
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishItemReceipt(formData.value.id)
    toast.success('入库成功')
    uni.$emit('mes:wm:itemreceipt:reload')
    delay(handleBack)
  } finally {
    finishLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  if (!props.id) {
    await loadNoticePreset()
    return
  }
  await getDetail()
})
</script>
