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
          <WorkOrderFormPicker
            v-model="formData.workOrderId"
            label="外协工单"
            label-width="200rpx"
            prop="workOrderId"
            placeholder="请选择外协工单"
            title="选择外协工单"
            empty-tip="暂无已确认外协工单"
            :type="MesProWorkOrderTypeEnum.OUTSOURCE"
            :disabled="isHeaderReadonly"
            @change="handleWorkOrderChange"
          />
          <VendorFormPicker
            v-model="formData.vendorId"
            label="供应商"
            label-width="200rpx"
            prop="vendorId"
            placeholder="请选择供应商"
            :disabled="isHeaderReadonly"
            @change="handleVendorChange"
          />
          <wd-form-item
            title="入库日期"
            title-width="200rpx"
            prop="receiptDate"
            :is-link="!isHeaderReadonly"
            placeholder="请选择入库日期"
            :value="formatDateTime(formData.receiptDate)"
            @click="openReceiptDatePicker"
          />
          <wd-datetime-picker
            v-model="formData.receiptDate"
            v-model:visible="pickerVisible.receiptDate"
            title="请选择入库日期"
            type="datetime"
          />
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_OUTSOURCE_RECEIPT_STATUS" :value="formData.status" />
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

      <OutsourceReceiptLineList
        v-if="currentId"
        :receipt-id="currentId"
        :readonly="isHeaderReadonly"
        :stock-mode="isStock"
      />
      <view v-if="isStock" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        请核对入库物料和上架明细数量后再执行上架；当前只验证确认框，不确认真实上架。
      </view>
      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        完成入库将更新库存台账，H5 验证时只打开确认框并取消。
      </view>
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
          :loading="submitLoading" @click="handleSubmitIssue"
        >
          提交
        </wd-button>
        <wd-button
          v-if="isStock"
          class="flex-1"
          type="success"
          :loading="stockLoading" @click="handleStockIssue"
        >
          执行上架
        </wd-button>
        <wd-button
          v-if="isFinish"
          class="flex-1"
          type="success"
          :loading="finishLoading" @click="handleFinishIssue"
        >
          完成入库
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdVendor } from '@/api/mes/md/vendor'
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import type { WmOutsourceReceipt } from '@/api/mes/wm/outsourcereceipt'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  createOutsourceReceipt,
  finishOutsourceReceipt,
  getOutsourceReceipt,
  stockOutsourceReceipt,
  submitOutsourceReceipt,
  updateOutsourceReceipt,
} from '@/api/mes/wm/outsourcereceipt'
import { delay, navigateBackPlus } from '@/utils'
import {
  DICT_TYPE,
  MesAutoCodeRuleCode,
  MesProWorkOrderTypeEnum,
  MesWmOutsourceReceiptStatusEnum,
} from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import VendorFormPicker from '../../../md/vendor/components/vendor-form-picker.vue'
import WorkOrderFormPicker from '@/pages-mes/pro/workorder/components/workorder-form-picker.vue'
import OutsourceReceiptLineList from '../components/outsource-receipt-line-list.vue'

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
const routeId = computed(() => props.id ? Number(props.id) : undefined) // 路由编号
const routeMode = computed(() => String(props.mode || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'stock') {
    return '执行上架'
  }
  if (currentMode.value === 'finish') {
    return '完成外协入库'
  }
  return currentId.value ? '编辑外协入库' : '新增外协入库'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const stockLoading = ref(false) // 上架状态
const finishLoading = ref(false) // 入库状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmOutsourceReceipt>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '入库单编号不能为空' }],
  name: [{ required: true, message: '入库单名称不能为空' }],
  workOrderId: [{ required: true, message: '外协工单不能为空' }],
  vendorId: [{ required: true, message: '供应商不能为空' }],
  receiptDate: [{ required: true, message: '入库日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isEditable = computed(() => (
  ((!routeId.value && !currentId.value) || formData.value.status === MesWmOutsourceReceiptStatusEnum.PREPARE)
  && (!currentMode.value || currentMode.value === 'update')
))
const isStock = computed(() => currentMode.value === 'stock' && formData.value.status === MesWmOutsourceReceiptStatusEnum.APPROVING)
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmOutsourceReceiptStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => Boolean(currentId.value) && !isEditable.value)
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmOutsourceReceiptStatusEnum.PREPARE
))
/** 默认表单数据 */
function getDefaultFormData(): WmOutsourceReceipt {
  return {}
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/outsourcereceipt/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = await getOutsourceReceipt(currentId.value)
}

/** 打开入库日期选择 */
function openReceiptDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.receiptDate = true
}

/** 工单变更 */
function handleWorkOrderChange(workOrder?: ProWorkOrder) {
  formData.value.workOrderId = workOrder?.id
  formData.value.workOrderCode = workOrder?.code
  formData.value.vendorId = workOrder?.vendorId
  formData.value.vendorName = workOrder?.vendorName
}

/** 供应商变更 */
function handleVendorChange(vendor?: MdVendor) {
  formData.value.vendorId = vendor?.id
  formData.value.vendorName = vendor?.name
}

/** 生成入库单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_OUTSOURCE_RECEIPT_CODE)
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
      await updateOutsourceReceipt(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createOutsourceReceipt(formData.value)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmOutsourceReceiptStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:outsourcereceipt:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交外协入库单 */
async function handleSubmitIssue() {
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
      msg: '确认提交该外协入库单？提交前请确认已维护入库物料，提交后将不能修改。',
    })
  } catch {
    return
  }

  submitLoading.value = true
  try {
    await updateOutsourceReceipt(formData.value)
    await submitOutsourceReceipt(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:outsourcereceipt:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 执行上架 */
async function handleStockIssue() {
  if (!currentId.value) {
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
    await stockOutsourceReceipt(currentId.value)
    toast.success('上架成功')
    uni.$emit('mes:wm:outsourcereceipt:reload')
    delay(handleBack)
  } finally {
    stockLoading.value = false
  }
}

/** 完成外协入库 */
async function handleFinishIssue() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认完成入库？完成后将更新库存台账。',
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishOutsourceReceipt(currentId.value)
    toast.success('入库成功')
    uni.$emit('mes:wm:outsourcereceipt:reload')
    delay(handleBack)
  } finally {
    finishLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  currentId.value = routeId.value
  currentMode.value = routeMode.value
  await getDetail()
})
</script>
