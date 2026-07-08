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
          <wd-form-item title="领料单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入领料单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="领料单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入领料单名称" />
          </wd-form-item>
          <wd-form-item
            title="需求时间"
            title-width="200rpx"
            prop="requiredTime"
            :is-link="!isHeaderReadonly"
            placeholder="请选择需求时间"
            :value="formatDateTime(formData.requiredTime)"
            @click="openRequiredTimePicker"
          />
          <wd-datetime-picker
            v-model="formData.requiredTime"
            v-model:visible="pickerVisible.requiredTime"
            title="请选择需求时间"
            type="datetime"
          />
          <WorkOrderFormPicker
            v-model="formData.workOrderId"
            label="生产工单"
            label-width="200rpx"
            prop="workOrderId"
            placeholder="请选择生产工单"
            :disabled="isHeaderReadonly"
            @change="handleWorkOrderChange"
          />
          <WorkstationFormPicker
            v-model="formData.workstationId"
            label="工作站"
            label-width="200rpx"
            prop="workstationId"
            placeholder="请选择工作站"
            :disabled="isHeaderReadonly"
            @change="handleWorkstationChange"
          />
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_PRODUCT_ISSUE_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="客户编号" title-width="200rpx">
            <view class="text-28rpx text-[#333]">
              {{ formData.clientCode || '-' }}
            </view>
          </wd-form-item>
          <wd-form-item title="客户名称" title-width="200rpx">
            <view class="text-28rpx text-[#333]">
              {{ formData.clientName || '-' }}
            </view>
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

      <ProductIssueLineList
        v-if="currentId"
        :issue-id="currentId"
        :readonly="!isEditable"
        :stock-mode="isStock"
      />

      <view v-if="isStock" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        请核对领料物料和拣货明细数量后再执行拣货；当前只验证确认框，不确认真实拣货。
      </view>
      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        完成领料将执行出库并更新库存台账，H5 验证时只打开确认框并取消。
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
          完成
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import type { MdWorkstation } from '@/api/mes/md/workstation'
import type { WmProductIssue } from '@/api/mes/wm/productissue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  checkProductIssueQuantity,
  createProductIssue,
  finishProductIssue,
  getProductIssue,
  stockProductIssue,
  submitProductIssue,
  updateProductIssue,
} from '@/api/mes/wm/productissue'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmProductIssueStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import WorkstationFormPicker from '@/pages-mes/md/workstation/components/workstation-form-picker.vue'
import WorkOrderFormPicker from '@/pages-mes/pro/workorder/components/workorder-form-picker.vue'
import ProductIssueLineList from '../components/product-issue-line-list.vue'

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
    return '完成领料出库'
  }
  return currentId.value ? '编辑生产领料' : '新增生产领料'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const stockLoading = ref(false) // 拣货状态
const finishLoading = ref(false) // 完成状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmProductIssue>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '领料单编号不能为空' }],
  name: [{ required: true, message: '领料单名称不能为空' }],
  workOrderId: [{ required: true, message: '生产工单不能为空' }],
  requiredTime: [{ required: true, message: '需求时间不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isEditable = computed(() => (
  ((!routeId.value && !currentId.value) || formData.value.status === MesWmProductIssueStatusEnum.PREPARE)
  && (!currentMode.value || currentMode.value === 'update')
))
const isStock = computed(() => currentMode.value === 'stock' && formData.value.status === MesWmProductIssueStatusEnum.APPROVING)
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmProductIssueStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => Boolean(currentId.value) && !isEditable.value)
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmProductIssueStatusEnum.PREPARE
))
/** 默认表单数据 */
function getDefaultFormData(): WmProductIssue {
  return {}
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/productissue/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = await getProductIssue(currentId.value)
}

/** 打开需求时间选择 */
function openRequiredTimePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.requiredTime = true
}

/** 工单变更 */
function handleWorkOrderChange(workOrder?: ProWorkOrder) {
  formData.value.workOrderId = workOrder?.id
  formData.value.workOrderCode = workOrder?.code
  formData.value.clientCode = workOrder?.clientCode
  formData.value.clientName = workOrder?.clientName
}

/** 工作站变更 */
function handleWorkstationChange(workstation?: MdWorkstation) {
  formData.value.workstationId = workstation?.id
  formData.value.workstationCode = workstation?.code
  formData.value.workstationName = workstation?.name
}

/** 生成领料单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_PRODUCT_ISSUE_CODE)
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
      await updateProductIssue(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createProductIssue(formData.value)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmProductIssueStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:productissue:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交生产领料单 */
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
      msg: '确认提交该领料出库单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateProductIssue(formData.value)
    await submitProductIssue(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:productissue:reload')
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
    const quantityMatch = await checkProductIssueQuantity(currentId.value)
    if (!quantityMatch) {
      await dialog.confirm({
        title: '提示',
        msg: '领料数量与拣货数量不一致，确认执行拣货？',
      })
    }
    await stockProductIssue(currentId.value)
    toast.success('拣货成功')
    uni.$emit('mes:wm:productissue:reload')
    delay(handleBack)
  } finally {
    stockLoading.value = false
  }
}

/** 完成领料出库 */
async function handleFinishIssue() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认完成该领料单并执行出库吗？',
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishProductIssue(currentId.value)
    toast.success('完成成功')
    uni.$emit('mes:wm:productissue:reload')
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
