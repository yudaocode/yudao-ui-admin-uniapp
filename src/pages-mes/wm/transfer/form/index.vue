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
          <wd-form-item title="转移单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入转移单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="转移单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入转移单名称" />
          </wd-form-item>
          <yd-form-picker v-model="formData.type" label="转移单类型" label-width="200rpx" prop="type" :disabled="isHeaderReadonly" :dict-type="DICT_TYPE.MES_WM_TRANSFER_TYPE" placeholder="请选择转移单类型" />
          <wd-form-item
            title="转移日期"
            title-width="200rpx"
            prop="transferDate"
            :is-link="!isHeaderReadonly"
            placeholder="请选择转移日期"
            :value="formatDateTime(formData.transferDate)"
            @click="openTransferDatePicker"
          />
          <wd-datetime-picker
            v-model="formData.transferDate"
            v-model:visible="pickerVisible.transferDate"
            title="请选择转移日期"
            type="date"
          />
          <wd-form-item v-if="isOuterType" title="是否配送" title-width="200rpx" prop="deliveryFlag" center>
            <wd-switch v-model="formData.deliveryFlag" :disabled="isHeaderReadonly" />
          </wd-form-item>
          <wd-form-item v-if="isOuterType && currentId" title="是否确认" title-width="200rpx" center>
            <wd-switch v-model="formData.confirmFlag" disabled />
          </wd-form-item>
          <wd-form-item v-if="showDeliveryFields" title="收货人" title-width="200rpx" prop="recipientName">
            <wd-input v-model="formData.recipientName" clearable :disabled="isHeaderReadonly" placeholder="请输入收货人" />
          </wd-form-item>
          <wd-form-item v-if="showDeliveryFields" title="联系电话" title-width="200rpx" prop="recipientTelephone">
            <wd-input v-model="formData.recipientTelephone" clearable :disabled="isHeaderReadonly" placeholder="请输入联系电话" />
          </wd-form-item>
          <wd-form-item v-if="showDeliveryFields" title="目的地" title-width="200rpx" prop="destinationAddress">
            <wd-input v-model="formData.destinationAddress" clearable :disabled="isHeaderReadonly" placeholder="请输入目的地" />
          </wd-form-item>
          <wd-form-item v-if="showDeliveryFields" title="承运商" title-width="200rpx" prop="carrier">
            <wd-input v-model="formData.carrier" clearable :disabled="isHeaderReadonly" placeholder="请输入承运商" />
          </wd-form-item>
          <wd-form-item v-if="showDeliveryFields" title="运输单号" title-width="200rpx" prop="shippingNumber">
            <wd-input v-model="formData.shippingNumber" clearable :disabled="isHeaderReadonly" placeholder="请输入运输单号" />
          </wd-form-item>
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_TRANSFER_STATUS" :value="formData.status" />
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

      <transfer-line-list
        v-if="currentId"
        :transfer-id="currentId"
        :readonly="!isEditable && !isStock"
        :stock-mode="isStock"
      />
      <view v-else class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
          调拨物料
        </view>
        <view class="text-26rpx text-[#8c8c8c] leading-40rpx">
          请先保存转移单主表，保存后可继续维护调拨物料和上架明细。
        </view>
      </view>

      <view v-if="isConfirm" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        到货确认后将进入待上架状态；H5 验证仅打开确认框并取消，不确认真实状态流转。
      </view>
      <view v-if="isStock" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#d46b08] leading-42rpx">
        执行上架前需维护完整上架明细；H5 验证仅打开确认框并取消，不确认真实上架。
      </view>
      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        执行转移会更新库存台账；H5 验证仅打开确认框并取消，不确认真实转移。
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
          :loading="submitLoading" @click="handleSubmitTransfer"
        >
          提交
        </wd-button>
        <wd-button
          v-if="isConfirm"
          class="flex-1"
          type="success"
          :loading="actionLoading" @click="handleConfirmTransfer"
        >
          到货确认
        </wd-button>
        <wd-button
          v-if="isStock"
          class="flex-1"
          type="success"
          :loading="actionLoading" @click="handleStockTransfer"
        >
          执行上架
        </wd-button>
        <wd-button
          v-if="isFinish"
          class="flex-1"
          type="success"
          :loading="actionLoading" @click="handleFinishTransfer"
        >
          执行转移
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { WmTransfer } from '@/api/mes/wm/transfer'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  confirmTransfer,
  createTransfer,
  finishTransfer,
  getTransfer,
  stockTransfer,
  submitTransfer,
  updateTransfer,
} from '@/api/mes/wm/transfer'
import TransferLineList from '@/pages-mes/wm/transfer/components/transfer-line-list.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmTransferStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | string
  mode?: 'confirm' | 'stock' | 'finish' | string
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
  if (currentMode.value === 'confirm') {
    return '到货确认'
  }
  if (currentMode.value === 'stock') {
    return '执行上架'
  }
  if (currentMode.value === 'finish') {
    return '执行转移'
  }
  return currentId.value ? '编辑库存调拨' : '新增库存调拨'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const actionLoading = ref(false) // 状态动作状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmTransfer>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '转移单编号不能为空' }],
  name: [{ required: true, message: '转移单名称不能为空' }],
  type: [{ required: true, message: '转移单类型不能为空' }],
  deliveryFlag: [{ required: true, message: '是否配送不能为空' }],
  transferDate: [{ required: true, message: '转移日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const isEditable = computed(() => (
  ((!routeId.value && !currentId.value) || formData.value.status === MesWmTransferStatusEnum.PREPARE)
  && (!currentMode.value || currentMode.value === 'update')
))
const isConfirm = computed(() => currentMode.value === 'confirm' && formData.value.status === MesWmTransferStatusEnum.UNCONFIRMED)
const isStock = computed(() => currentMode.value === 'stock' && formData.value.status === MesWmTransferStatusEnum.APPROVING)
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmTransferStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => Boolean(currentId.value) && !isEditable.value)
const isOuterType = computed(() => Number(formData.value.type) === 2)
const showDeliveryFields = computed(() => isOuterType.value && !!formData.value.deliveryFlag)
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmTransferStatusEnum.PREPARE
))

/** 默认表单数据 */
function getDefaultFormData(): WmTransfer {
  return {
    deliveryFlag: false,
    confirmFlag: false,
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/transfer/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = await getTransfer(currentId.value)
}

/** 打开转移日期选择 */
function openTransferDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.transferDate = true
}

/** 生成转移单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.TRANSFER_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 清理配送互斥字段 */
function normalizeDeliveryFields() {
  formData.value.deliveryFlag = isOuterType.value ? !!formData.value.deliveryFlag : false
  if (formData.value.deliveryFlag) {
    return
  }
  formData.value.recipientName = undefined
  formData.value.recipientTelephone = undefined
  formData.value.destinationAddress = undefined
  formData.value.carrier = undefined
  formData.value.shippingNumber = undefined
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    normalizeDeliveryFields()
    if (currentId.value) {
      await updateTransfer(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createTransfer(formData.value)
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmTransferStatusEnum.PREPARE
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:transfer:reload')
    await getDetail()
  } finally {
    formLoading.value = false
  }
}

/** 提交转移单 */
async function handleSubmitTransfer() {
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
      msg: '确认提交该转移单？提交前请确认已维护调拨物料，提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    normalizeDeliveryFields()
    await updateTransfer(formData.value)
    await submitTransfer(currentId.value)
    toast.success('提交成功')
    await getDetail()
    uni.$emit('mes:wm:transfer:reload')
  } finally {
    submitLoading.value = false
  }
}

/** 到货确认 */
async function handleConfirmTransfer() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认到货后，将进入待上架状态，是否继续？',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await confirmTransfer(currentId.value)
    toast.success('确认成功')
    await getDetail()
    uni.$emit('mes:wm:transfer:reload')
  } finally {
    actionLoading.value = false
  }
}

/** 执行上架 */
async function handleStockTransfer() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行上架？请先确认已维护完整上架明细。',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await stockTransfer(currentId.value)
    toast.success('上架成功')
    await getDetail()
    uni.$emit('mes:wm:transfer:reload')
  } finally {
    actionLoading.value = false
  }
}

/** 执行转移 */
async function handleFinishTransfer() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行调拨？执行后将更新库存台账。',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await finishTransfer(currentId.value)
    toast.success('执行成功')
    await getDetail()
    uni.$emit('mes:wm:transfer:reload')
  } finally {
    actionLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  currentId.value = routeId.value
  currentMode.value = routeMode.value
  await getDetail()
})
</script>
