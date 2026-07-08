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
          <WorkOrderFormPicker v-model="formData.workOrderId" label="生产工单" label-width="200rpx" prop="workOrderId" placeholder="请选择生产工单" :disabled="isHeaderReadonly" @change="handleWorkOrderChange" />
          <wd-form-item title="产品物料" title-width="200rpx">
            <view class="text-28rpx text-[#333]">
              {{ selectedProductText || '-' }}
            </view>
          </wd-form-item>
          <wd-form-item title="规格型号" title-width="200rpx">
            <view class="text-28rpx text-[#333]">
              {{ formData.specification || '-' }}
            </view>
          </wd-form-item>
          <wd-form-item title="计量单位" title-width="200rpx">
            <view class="text-28rpx text-[#333]">
              {{ formData.unitMeasureName || '-' }}
            </view>
          </wd-form-item>
          <wd-form-item v-if="formData.id" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_PRODUCT_RECPT_STATUS" :value="formData.status" />
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

      <ProductReceiptLineList
        v-if="formData.id"
        :receipt-id="formData.id"
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
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import type { WmProductReceipt } from '@/api/mes/wm/productreceipt'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  checkProductReceiptQuantity,
  createProductReceipt,
  finishProductReceipt,
  getProductReceipt,
  stockProductReceipt,
  submitProductReceipt,
  updateProductReceipt,
} from '@/api/mes/wm/productreceipt'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmProductReceiptStatusEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ProductReceiptLineList from '../components/product-receipt-line-list.vue'
import WorkOrderFormPicker from '@/pages-mes/pro/workorder/components/workorder-form-picker.vue'

const props = defineProps<{
  id?: number | string
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
const routeMode = computed(() => String(props.mode || '')) // 路由模式
const getTitle = computed(() => {
  if (routeMode.value === 'stock') {
    return '执行上架'
  }
  if (routeMode.value === 'finish') {
    return '执行入库'
  }
  return props.id ? '编辑产品入库' : '新增产品入库'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const stockLoading = ref(false) // 上架状态
const finishLoading = ref(false) // 入库状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmProductReceipt>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '入库单编号不能为空' }],
  name: [{ required: true, message: '入库单名称不能为空' }],
  receiptDate: [{ required: true, message: '入库日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isEditable = computed(() => (
  ((!props.id && !formData.value.id) || formData.value.status === MesWmProductReceiptStatusEnum.PREPARE)
  && (!routeMode.value || routeMode.value === 'update')
))
const isStock = computed(() => routeMode.value === 'stock' && formData.value.status === MesWmProductReceiptStatusEnum.APPROVING)
const isFinish = computed(() => routeMode.value === 'finish' && formData.value.status === MesWmProductReceiptStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => Boolean(formData.value.id || props.id) && !isEditable.value)
const canSubmit = computed(() => (
  isEditable.value
  && formData.value.id
  && formData.value.status === MesWmProductReceiptStatusEnum.PREPARE
))
const selectedProductText = computed(() => {
  if (formData.value.itemCode || formData.value.itemName) {
    return `${formData.value.itemCode || '-'} / ${formData.value.itemName || '-'}`.trim()
  }
  return formData.value.itemId ? `物料 #${formData.value.itemId}` : ''
})

/** 默认表单数据 */
function getDefaultFormData(): WmProductReceipt {
  return {}
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/productreceipt/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getProductReceipt(Number(props.id))
}

/** 打开入库日期选择 */
function openReceiptDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.receiptDate = true
}

/** 确认选择工单 */
function handleWorkOrderChange(workOrder?: ProWorkOrder) {
  formData.value.workOrderId = workOrder?.id
  formData.value.workOrderCode = workOrder?.code
  formData.value.itemId = workOrder?.productId
  formData.value.itemCode = workOrder?.productCode
  formData.value.itemName = workOrder?.productName
  formData.value.specification = workOrder?.productSpecification
  formData.value.unitMeasureName = workOrder?.unitMeasureName
}

/** 生成入库单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.PRODUCTRECPT_CODE)
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
      await updateProductReceipt(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createProductReceipt(formData.value)
      toast.success('新增成功')
      formData.value.id = id
      formData.value.status = MesWmProductReceiptStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:productreceipt:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交产品入库单 */
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
      msg: '确认提交该产品入库单？提交后将不能修改。',
    })
  } catch {
    return
  }

  submitLoading.value = true
  try {
    await updateProductReceipt(formData.value)
    await submitProductReceipt(formData.value.id)
    toast.success('提交成功')
    uni.$emit('mes:wm:productreceipt:reload')
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
      msg: '确认执行上架？',
    })
  } catch {
    return
  }
  stockLoading.value = true
  try {
    const quantityMatch = await checkProductReceiptQuantity(formData.value.id)
    if (!quantityMatch) {
      await dialog.confirm({
        title: '提示',
        msg: '明细数量与行收货数量不一致，确认执行上架？',
      })
    }
    await stockProductReceipt(formData.value.id)
    toast.success('上架成功')
    uni.$emit('mes:wm:productreceipt:reload')
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
    await finishProductReceipt(formData.value.id)
    toast.success('入库成功')
    uni.$emit('mes:wm:productreceipt:reload')
    delay(handleBack)
  } finally {
    finishLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
