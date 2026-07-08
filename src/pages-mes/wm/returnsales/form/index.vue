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
          <wd-form-item title="退货单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入退货单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="退货单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入退货单名称" />
          </wd-form-item>
          <wd-form-item title="销售订单号" title-width="200rpx" prop="salesOrderCode">
            <wd-input v-model="formData.salesOrderCode" clearable :disabled="isHeaderReadonly" placeholder="请输入销售订单号" />
          </wd-form-item>
          <ClientFormPicker
            v-model="formData.clientId"
            label="客户"
            label-width="200rpx"
            prop="clientId"
            placeholder="请选择客户"
            :disabled="isHeaderReadonly"
            @change="handleClientChange"
          />
          <wd-form-item
            title="退货日期"
            title-width="200rpx"
            prop="returnDate"
            is-link
            placeholder="请选择退货日期"
            :value="formatDateTime(formData.returnDate)"
            @click="openReturnDatePicker"
          />
          <wd-datetime-picker
            v-model="formData.returnDate"
            v-model:visible="pickerVisible.returnDate"
            title="请选择退货日期"
            type="datetime"
          />
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_RETURN_SALES_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="退货原因" title-width="200rpx" prop="returnReason">
            <wd-textarea
              v-model="formData.returnReason"
              placeholder="请输入退货原因"
              :disabled="isHeaderReadonly"
              :maxlength="200"
              show-word-limit
              clearable
            />
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

      <ReturnSalesLineList
        v-if="currentId"
        :return-id="currentId"
        :client-id="formData.clientId"
        :sales-order-code="formData.salesOrderCode"
        :readonly="!isEditable"
        :stock-mode="isStock"
      />

      <view v-if="canQualityHint" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#ad6800] leading-40rpx">
        当前单据处于待检验状态，请前往【质量管理 - 退货检验（RQC）】中进行退货检验操作。
      </view>
      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#ad6800] leading-40rpx">
        执行退货会推动单据进入待上架状态；H5 验证仅到确认提示，不在真实数据上确认执行。
      </view>
      <view v-if="isStock" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#ad6800] leading-40rpx">
        执行上架会影响后续库存流程；H5 验证仅到确认提示，不在真实数据上确认执行。
      </view>
      <view v-if="isCancel" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff1f0] p-24rpx text-26rpx text-[#cf1322] leading-40rpx">
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
          :loading="submitLoading" @click="handleSubmitReturnSales"
        >
          提交
        </wd-button>
        <wd-button
          v-if="isFinish"
          class="flex-1"
          type="success"
          :loading="actionLoading" @click="handleFinishReturnSales"
        >
          执行退货
        </wd-button>
        <wd-button
          v-if="isStock"
          class="flex-1"
          type="success"
          :loading="actionLoading" @click="handleStockReturnSales"
        >
          执行上架
        </wd-button>
        <wd-button
          v-if="isCancel"
          class="flex-1"
          type="danger"
          :loading="actionLoading" @click="handleCancelReturnSales"
        >
          确认取消
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdClient } from '@/api/mes/md/client'
import type { WmReturnSales } from '@/api/mes/wm/returnsales'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  cancelReturnSales,
  checkReturnSalesQuantity,
  createReturnSales,
  finishReturnSales,
  getReturnSales,
  stockReturnSales,
  submitReturnSales,
  updateReturnSales,
} from '@/api/mes/wm/returnsales'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmReturnSalesStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ClientFormPicker from '../../../md/client/components/client-form-picker.vue'
import ReturnSalesLineList from '../components/return-sales-line-list.vue'

const props = defineProps<{
  id?: number | string
  mode?: 'finish' | 'stock' | 'cancel' | string
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
  if (currentMode.value === 'finish') {
    return '执行退货'
  }
  if (currentMode.value === 'stock') {
    return '执行上架'
  }
  if (currentMode.value === 'cancel') {
    return '取消销售退货'
  }
  return currentId.value ? '编辑销售退货' : '新增销售退货'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const actionLoading = ref(false) // 状态动作状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmReturnSales>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '退货单编号不能为空' }],
  name: [{ required: true, message: '退货单名称不能为空' }],
  clientId: [{ required: true, message: '客户不能为空' }],
  returnDate: [{ required: true, message: '退货日期不能为空' }],
  returnReason: [{ required: true, message: '退货原因不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<{ returnDate?: boolean }>({}) // 选择器显示状态
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmReturnSalesStatusEnum.APPROVING)
const isStock = computed(() => currentMode.value === 'stock' && formData.value.status === MesWmReturnSalesStatusEnum.APPROVED)
const isCancel = computed(() => currentMode.value === 'cancel' && (
  formData.value.status === MesWmReturnSalesStatusEnum.CONFIRMED
  || formData.value.status === MesWmReturnSalesStatusEnum.APPROVING
  || formData.value.status === MesWmReturnSalesStatusEnum.APPROVED
))
const canQualityHint = computed(() => formData.value.status === MesWmReturnSalesStatusEnum.CONFIRMED)
const isEditable = computed(() => {
  if (!currentId.value) {
    return true
  }
  return (!currentMode.value || currentMode.value === 'update')
    && formData.value.status === MesWmReturnSalesStatusEnum.PREPARE
})
const isHeaderReadonly = computed(() => Boolean(currentId.value) && !isEditable.value)
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmReturnSalesStatusEnum.PREPARE
))
/** 默认表单数据 */
function getDefaultFormData(): WmReturnSales {
  return {}
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/returnsales/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = await getReturnSales(currentId.value)
}

/** 打开退货日期选择 */
function openReturnDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.returnDate = true
}

/** 客户变更 */
function handleClientChange(client?: MdClient) {
  formData.value.clientId = client?.id
  formData.value.clientCode = client?.code
  formData.value.clientName = client?.name
  formData.value.clientNickname = client?.nickname
}

/** 生成退货单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_RETURN_SALES_CODE)
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
      await updateReturnSales(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createReturnSales(formData.value)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmReturnSalesStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:returnsales:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交销售退货单 */
async function handleSubmitReturnSales() {
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
      msg: '确认提交该销售退货单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateReturnSales(formData.value)
    await submitReturnSales(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:returnsales:reload')
    await getDetail()
  } finally {
    submitLoading.value = false
  }
}

/** 执行退货 */
async function handleFinishReturnSales() {
  if (!currentId.value) {
    return
  }
  actionLoading.value = true
  try {
    const quantityMatch = await checkReturnSalesQuantity(currentId.value)
    if (!quantityMatch) {
      try {
        await dialog.confirm({
          title: '提示',
          msg: '退货数量与明细数量不一致，确认执行退货？',
        })
      } catch {
        return
      }
    } else {
      try {
        await dialog.confirm({
          title: '提示',
          msg: '确认执行退货？执行后将进入待上架状态。',
        })
      } catch {
        return
      }
    }
    await finishReturnSales(currentId.value)
    toast.success('执行退货成功')
    uni.$emit('mes:wm:returnsales:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 执行上架 */
async function handleStockReturnSales() {
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
  actionLoading.value = true
  try {
    await stockReturnSales(currentId.value)
    toast.success('上架成功')
    uni.$emit('mes:wm:returnsales:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 取消销售退货单 */
async function handleCancelReturnSales() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该销售退货单？取消后不可恢复。',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await cancelReturnSales(currentId.value)
    toast.success('取消成功')
    uni.$emit('mes:wm:returnsales:reload')
    await getDetail()
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
