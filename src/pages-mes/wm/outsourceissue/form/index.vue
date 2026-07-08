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
          <wd-form-item title="发料单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入发料单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="发料单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入发料单名称" />
          </wd-form-item>
          <wd-form-item
            title="发料日期"
            title-width="200rpx"
            prop="issueDate"
            :is-link="!isHeaderReadonly"
            placeholder="请选择发料日期"
            :value="formatDateTime(formData.issueDate)"
            @click="openIssueDatePicker"
          />
          <wd-datetime-picker
            v-model="formData.issueDate"
            v-model:visible="pickerVisible.issueDate"
            title="请选择发料日期"
            type="datetime"
          />
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
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_OUTSOURCE_ISSUE_STATUS" :value="formData.status" />
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

      <OutsourceIssueLineList
        v-if="currentId"
        :issue-id="currentId"
        :readonly="isHeaderReadonly"
        :stock-mode="isStock"
      />
      <view v-if="isStock" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        请核对发料物料和拣货明细数量后再执行拣货；当前只验证确认框，不确认真实拣货。
      </view>
      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        执行领出将扣减库存并生成库存记录，H5 验证时只打开确认框并取消。
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
          执行拣货
        </wd-button>
        <wd-button
          v-if="isFinish"
          class="flex-1"
          type="success"
          :loading="finishLoading" @click="handleFinishIssue"
        >
          执行领出
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdVendor } from '@/api/mes/md/vendor'
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import type { WmOutsourceIssue } from '@/api/mes/wm/outsourceissue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  checkOutsourceIssueQuantity,
  createOutsourceIssue,
  finishOutsourceIssue,
  getOutsourceIssue,
  stockOutsourceIssue,
  submitOutsourceIssue,
  updateOutsourceIssue,
} from '@/api/mes/wm/outsourceissue'
import { delay, navigateBackPlus } from '@/utils'
import {
  DICT_TYPE,
  MesAutoCodeRuleCode,
  MesProWorkOrderTypeEnum,
  MesWmOutsourceIssueStatusEnum,
} from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import OutsourceIssueLineList from '../components/outsource-issue-line-list.vue'
import VendorFormPicker from '../../../md/vendor/components/vendor-form-picker.vue'
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
const routeId = computed(() => props.id ? Number(props.id) : undefined) // 路由编号
const routeMode = computed(() => String(props.mode || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'stock') {
    return '执行拣货'
  }
  if (currentMode.value === 'finish') {
    return '执行外协领出'
  }
  return currentId.value ? '编辑外协发料' : '新增外协发料'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const stockLoading = ref(false) // 拣货状态
const finishLoading = ref(false) // 领出状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmOutsourceIssue>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '发料单编号不能为空' }],
  name: [{ required: true, message: '发料单名称不能为空' }],
  workOrderId: [{ required: true, message: '外协工单不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isEditable = computed(() => (
  ((!routeId.value && !currentId.value) || formData.value.status === MesWmOutsourceIssueStatusEnum.PREPARE)
  && (!currentMode.value || currentMode.value === 'update')
))
const isStock = computed(() => currentMode.value === 'stock' && formData.value.status === MesWmOutsourceIssueStatusEnum.APPROVING)
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmOutsourceIssueStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => Boolean(currentId.value) && !isEditable.value)
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmOutsourceIssueStatusEnum.PREPARE
))
/** 默认表单数据 */
function getDefaultFormData(): WmOutsourceIssue {
  return {}
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/outsourceissue/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = await getOutsourceIssue(currentId.value)
}

/** 打开发料日期选择 */
function openIssueDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.issueDate = true
}

/** 工单变更 */
function handleWorkOrderChange(workOrder?: ProWorkOrder) {
  formData.value.workOrderId = workOrder?.id
  formData.value.workOrderCode = workOrder?.code
  formData.value.workOrderName = workOrder?.name
  formData.value.vendorId = workOrder?.vendorId
  formData.value.vendorCode = workOrder?.vendorCode
  formData.value.vendorName = workOrder?.vendorName
}

/** 供应商变更 */
function handleVendorChange(vendor?: MdVendor) {
  formData.value.vendorId = vendor?.id
  formData.value.vendorCode = vendor?.code
  formData.value.vendorName = vendor?.name
}

/** 生成发料单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_OUTSOURCE_ISSUE_CODE)
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
      await updateOutsourceIssue(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createOutsourceIssue(formData.value)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmOutsourceIssueStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:outsourceissue:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交外协发料单 */
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
      msg: '确认提交该外协发料单？提交前请确认已维护发料物料，提交后将不能修改。',
    })
  } catch {
    return
  }

  submitLoading.value = true
  try {
    await updateOutsourceIssue(formData.value)
    await submitOutsourceIssue(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:outsourceissue:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 执行拣货 */
async function handleStockIssue() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行拣货？',
    })
  } catch {
    return
  }

  stockLoading.value = true
  try {
    const quantityMatch = await checkOutsourceIssueQuantity(currentId.value)
    if (!quantityMatch) {
      await dialog.confirm({
        title: '提示',
        msg: '发料数量与拣货数量不一致，确认执行拣货？',
      })
    }
    await stockOutsourceIssue(currentId.value)
    toast.success('拣货成功')
    uni.$emit('mes:wm:outsourceissue:reload')
    delay(handleBack)
  } finally {
    stockLoading.value = false
  }
}

/** 执行外协领出 */
async function handleFinishIssue() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行领出？执行后将扣减库存，且无法撤销。',
    })
  } catch {
    return
  }

  finishLoading.value = true
  try {
    await finishOutsourceIssue(currentId.value)
    toast.success('领出成功')
    uni.$emit('mes:wm:outsourceissue:reload')
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
