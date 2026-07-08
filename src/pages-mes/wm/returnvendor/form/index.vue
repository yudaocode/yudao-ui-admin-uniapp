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
          <wd-form-item title="采购订单号" title-width="200rpx" prop="purchaseOrderCode">
            <wd-input v-model="formData.purchaseOrderCode" clearable :disabled="isHeaderReadonly" placeholder="请输入采购订单号" />
          </wd-form-item>
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
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_RETURN_VENDOR_STATUS" :value="formData.status" />
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
          <wd-form-item title="运单号" title-width="200rpx" prop="transportCode">
            <wd-input v-model="formData.transportCode" clearable :disabled="isHeaderReadonly" placeholder="请输入运单号" />
          </wd-form-item>
          <wd-form-item title="联系电话" title-width="200rpx" prop="transportTelephone">
            <wd-input v-model="formData.transportTelephone" clearable :disabled="isHeaderReadonly" placeholder="请输入联系电话" />
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
      <ReturnVendorLineList
        v-if="currentId"
        :return-id="currentId"
        :vendor-id="formData.vendorId"
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
          :loading="submitLoading" @click="handleSubmitReturnVendor"
        >
          提交
        </wd-button>
        <wd-button
          v-if="isStock"
          class="flex-1"
          type="success"
          :loading="stockLoading" @click="handleStockReturnVendor"
        >
          执行拣货
        </wd-button>
        <wd-button
          v-if="isFinish"
          class="flex-1"
          type="success"
          :loading="finishLoading" @click="handleFinishReturnVendor"
        >
          完成退货
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdVendor } from '@/api/mes/md/vendor'
import type { WmReturnVendor } from '@/api/mes/wm/returnvendor'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  checkReturnVendorQuantity,
  createReturnVendor,
  finishReturnVendor,
  getReturnVendor,
  stockReturnVendor,
  submitReturnVendor,
  updateReturnVendor,
} from '@/api/mes/wm/returnvendor'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmReturnVendorStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import VendorFormPicker from '../../../md/vendor/components/vendor-form-picker.vue'
import ReturnVendorLineList from '../components/return-vendor-line-list.vue'

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
    return '执行拣货'
  }
  if (currentMode.value === 'finish') {
    return '完成退货'
  }
  return currentId.value ? '编辑采购退货' : '新增采购退货'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const stockLoading = ref(false) // 拣货状态
const finishLoading = ref(false) // 退货状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmReturnVendor>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '退货单编号不能为空' }],
  name: [{ required: true, message: '退货单名称不能为空' }],
  vendorId: [{ required: true, message: '供应商不能为空' }],
  returnDate: [{ required: true, message: '退货日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isEditable = computed(() => {
  if (!currentId.value) {
    return true
  }
  return (!currentMode.value || currentMode.value === 'update')
    && formData.value.status === MesWmReturnVendorStatusEnum.PREPARE
})
const isStock = computed(() => currentMode.value === 'stock' && formData.value.status === MesWmReturnVendorStatusEnum.APPROVING)
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmReturnVendorStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => isStock.value || isFinish.value || (Boolean(currentId.value) && !isEditable.value))
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmReturnVendorStatusEnum.PREPARE
))
/** 默认表单数据 */
function getDefaultFormData(): WmReturnVendor {
  return {}
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/returnvendor/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = await getReturnVendor(currentId.value)
}

/** 打开退货日期选择 */
function openReturnDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.returnDate = true
}

/** 供应商变更 */
function handleVendorChange(vendor?: MdVendor) {
  formData.value.vendorId = vendor?.id
  formData.value.vendorCode = vendor?.code
  formData.value.vendorName = vendor?.name
  formData.value.vendorNickname = vendor?.nickname
}

/** 生成退货单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_RETURN_VENDOR_CODE)
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
      await updateReturnVendor(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createReturnVendor(formData.value)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmReturnVendorStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:returnvendor:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交供应商退货单 */
async function handleSubmitReturnVendor() {
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
      msg: '确认提交该退货单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateReturnVendor(formData.value)
    await submitReturnVendor(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:returnvendor:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 执行拣货 */
async function handleStockReturnVendor() {
  if (!currentId.value) {
    return
  }
  stockLoading.value = true
  try {
    const quantityMatch = await checkReturnVendorQuantity(currentId.value)
    if (!quantityMatch) {
      await dialog.confirm({
        title: '提示',
        msg: '退货数量与拣货数量不一致，确认执行拣货？',
      })
    } else {
      await dialog.confirm({
        title: '提示',
        msg: '确认执行拣货？执行后供应商退货单将进入待执行退货状态。',
      })
    }
    await stockReturnVendor(currentId.value)
    toast.success('拣货成功')
    uni.$emit('mes:wm:returnvendor:reload')
    delay(handleBack)
  } catch {
  } finally {
    stockLoading.value = false
  }
}

/** 完成退货 */
async function handleFinishReturnVendor() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认完成该退货单并执行退货？',
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishReturnVendor(currentId.value)
    toast.success('完成成功')
    uni.$emit('mes:wm:returnvendor:reload')
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
