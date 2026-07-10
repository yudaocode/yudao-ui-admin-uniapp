<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="检验单编号" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="检验单名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入检验单名称" clearable />
          </wd-form-item>
          <yd-form-picker v-model="formData.type" label="检验类型" label-width="220rpx" prop="type" :dict-type="DICT_TYPE.MES_IPQC_TYPE" placeholder="请选择检验类型" />

          <template v-if="isFromPendingTask">
            <wd-cell title="来源单据类型">
              <dict-tag v-if="formData.sourceDocType != null" :type="DICT_TYPE.MES_QC_SOURCE_DOC_TYPE" :value="formData.sourceDocType" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="来源单据编号" :value="formData.sourceDocCode || '-'" />
          </template>

          <WorkOrderFormPicker
            v-model="formData.workOrderId"
            label="生产工单"
            label-width="220rpx"
            prop="workOrderId"
            :placeholder="isFromPendingTask ? '由待检任务带入' : '请选择生产工单'"
            :disabled="isFromPendingTask"
            @change="handleWorkOrderChange"
          />
          <WorkstationFormPicker
            v-model="formData.workstationId"
            label="工位"
            label-width="220rpx"
            prop="workstationId"
            :placeholder="isFromPendingTask ? '由待检任务带入' : '请选择工位'"
            :disabled="isFromPendingTask"
            @change="handleWorkstationChange"
          />
          <TaskFormPicker
            v-model="formData.taskId"
            label="生产任务"
            label-width="220rpx"
            prop="taskId"
            :placeholder="isFromPendingTask ? '由待检任务带入' : formData.workOrderId ? '请选择生产任务' : '请先选择生产工单'"
            :work-order-id="formData.workOrderId"
            :workstation-id="formData.workstationId"
            :statuses="[MesProTaskStatusEnum.PREPARE]"
            :disabled="isFromPendingTask || !formData.workOrderId"
            @change="handleTaskChange"
          />
          <wd-cell title="工序" :value="formData.processName || '-'" />
          <wd-cell title="产品物料" :value="selectedItemText || '-'" />
          <wd-cell v-if="formData.itemSpecification || formData.unitName" title="规格单位" :value="`${formData.itemSpecification || '-'} / ${formData.unitName || '-'}`" />

          <wd-form-item title="检测数量" title-width="220rpx" prop="checkQuantity" center>
            <wd-input-number v-model="formData.checkQuantity" :min="0" :precision="2" :disabled="isFromPendingTask" />
          </wd-form-item>
          <wd-form-item title="合格数量" title-width="220rpx" prop="qualifiedQuantity" center>
            <wd-input-number v-model="formData.qualifiedQuantity" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="不合格数量" title-width="220rpx" prop="unqualifiedQuantity" center>
            <wd-input-number :model-value="formData.unqualifiedQuantity" :min="0" :precision="2" @update:model-value="handleUnqualifiedQuantityChange" />
          </wd-form-item>
          <template v-if="Number(formData.unqualifiedQuantity || 0) > 0">
            <wd-form-item title="工废数量" title-width="220rpx" prop="laborScrapQuantity" center>
              <wd-input-number v-model="formData.laborScrapQuantity" :min="0" :precision="2" />
            </wd-form-item>
            <wd-form-item title="料废数量" title-width="220rpx" prop="materialScrapQuantity" center>
              <wd-input-number v-model="formData.materialScrapQuantity" :min="0" :precision="2" />
            </wd-form-item>
            <wd-form-item title="其他废品" title-width="220rpx" prop="otherScrapQuantity" center>
              <wd-input-number v-model="formData.otherScrapQuantity" :min="0" :precision="2" />
            </wd-form-item>
          </template>
          <UserFormPicker v-model="formData.inspectorUserId" label="检测人员" label-width="220rpx" prop="inspectorUserId" placeholder="请选择检测人员" />
          <wd-form-item title="检测日期" title-width="220rpx" prop="inspectDate" is-link :value="formatDateTime(formData.inspectDate) || ''" placeholder="请选择检测日期" @click="dateVisible.inspectDate = true" />
          <wd-datetime-picker v-model="formData.inspectDate" v-model:visible="dateVisible.inspectDate" title="请选择检测日期" type="date" />
          <yd-form-picker v-model="formData.checkResult" label="检测结果" label-width="220rpx" prop="checkResult" :dict-type="DICT_TYPE.MES_QC_CHECK_RESULT" placeholder="请选择检测结果" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="300" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <template v-if="formData.id">
        <QcLineList :order-id="formData.id" :qc-type="MesQcTypeEnum.IPQC" :readonly="!isDraft" />
        <IndicatorResultList :qc-id="formData.id" :qc-type="MesQcTypeEnum.IPQC" :readonly="!isDraft" />
      </template>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view v-if="isDraft" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdWorkstation } from '@/api/mes/md/workstation'
import type { ProTask } from '@/api/mes/pro/task'
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import type { QcIpqc } from '@/api/mes/qc/ipqc'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import TaskFormPicker from '@/pages-mes/pro/task/components/task-form-picker.vue'
import WorkOrderFormPicker from '@/pages-mes/pro/workorder/components/workorder-form-picker.vue'
import WorkstationFormPicker from '@/pages-mes/md/workstation/components/workstation-form-picker.vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createIpqc, getIpqc, updateIpqc } from '@/api/mes/qc/ipqc'
import { decodeUrlText, delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesProTaskStatusEnum, MesQcStatusEnum, MesQcTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { toFiniteNumber } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'
import IndicatorResultList from '../../indicatorresult/components/indicator-result-list.vue'
import QcLineList from '../../components/qc-line-list.vue'

const props = defineProps<{
  id?: number | string
  sourceDocType?: number | string
  sourceDocId?: number | string
  sourceLineId?: number | string
  sourceDocCode?: string
  itemId?: number | string
  itemCode?: string
  itemName?: string
  itemSpecification?: string
  unitName?: string
  quantity?: number | string
  recordTime?: string
  workOrderId?: number | string
  workOrderCode?: string
  workOrderName?: string
  workstationId?: number | string
  workstationCode?: string
  workstationName?: string
  processId?: number | string
  processName?: string
  taskId?: number | string
  taskCode?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑过程检验单（IPQC）' : '新增过程检验单（IPQC）')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const dateVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const formData = ref<QcIpqc>({
  code: '',
  name: '',
  checkQuantity: 0,
  qualifiedQuantity: 0,
  unqualifiedQuantity: 0,
  laborScrapQuantity: 0,
  materialScrapQuantity: 0,
  otherScrapQuantity: 0,
}) // 表单数据
const isDraft = computed(() => !props.id || formData.value.status === MesQcStatusEnum.DRAFT)
const isFromPendingTask = computed(() => !props.id && formData.value.sourceDocId != null)
const selectedItemText = computed(() => {
  if (!formData.value.itemId) {
    return ''
  }
  return `${formData.value.itemCode || '-'} / ${formData.value.itemName || '-'}`
})
const formSchema = createFormSchema({
  code: [{ required: true, message: '检验单编号不能为空' }],
  name: [{ required: true, message: '检验单名称不能为空' }],
  type: [{ required: true, message: '检验类型不能为空' }],
  workOrderId: [{ required: true, message: '生产工单不能为空' }],
  workstationId: [{ required: true, message: '工位不能为空' }],
  checkQuantity: [
    { required: true, message: '检测数量不能为空' },
    { validator: value => Number(value) >= 0 || '检测数量不能小于 0' },
    { validator: () => validateQuantitySum() },
  ],
  qualifiedQuantity: [
    { required: true, message: '合格数量不能为空' },
    { validator: value => Number(value) >= 0 || '合格数量不能小于 0' },
    { validator: () => validateQuantitySum() },
  ],
  unqualifiedQuantity: [
    { required: true, message: '不合格数量不能为空' },
    { validator: value => Number(value) >= 0 || '不合格数量不能小于 0' },
    { validator: () => validateQuantitySum() },
    { validator: () => validateScrapSum() },
  ],
  laborScrapQuantity: [
    { required: true, message: '工废数量不能为空' },
    { validator: value => Number(value) >= 0 || '工废数量不能小于 0' },
    { validator: () => validateScrapSum() },
  ],
  materialScrapQuantity: [
    { required: true, message: '料废数量不能为空' },
    { validator: value => Number(value) >= 0 || '料废数量不能小于 0' },
    { validator: () => validateScrapSum() },
  ],
  otherScrapQuantity: [
    { required: true, message: '其他废品数量不能为空' },
    { validator: value => Number(value) >= 0 || '其他废品数量不能小于 0' },
    { validator: () => validateScrapSum() },
  ],
  inspectorUserId: [{ required: true, message: '检测人员不能为空' }],
  inspectDate: [{ required: true, message: '检测日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 校验数量合计 */
function validateQuantitySum() {
  const checkQuantity = Number(formData.value.checkQuantity || 0)
  const qualifiedQuantity = Number(formData.value.qualifiedQuantity || 0)
  const unqualifiedQuantity = Number(formData.value.unqualifiedQuantity || 0)
  return checkQuantity === qualifiedQuantity + unqualifiedQuantity || '检测数量必须等于合格数量与不合格数量之和'
}

/** 校验废品合计 */
function validateScrapSum() {
  const unqualifiedQuantity = Number(formData.value.unqualifiedQuantity || 0)
  const scrapSum = Number(formData.value.laborScrapQuantity || 0)
    + Number(formData.value.materialScrapQuantity || 0)
    + Number(formData.value.otherScrapQuantity || 0)
  return scrapSum <= unqualifiedQuantity || '废品数量合计不能超过不合格数量'
}

/** 不合格数量变更 */
function handleUnqualifiedQuantityChange(value: number) {
  formData.value.unqualifiedQuantity = value
  if (!Number(value || 0)) {
    formData.value.laborScrapQuantity = 0
    formData.value.materialScrapQuantity = 0
    formData.value.otherScrapQuantity = 0
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/ipqc/index')
}

/** 生成检验单编号 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.QC_IPQC_CODE)
    toast.success('生成成功')
  } finally {
    codeLoading.value = false
  }
}

/** 工单变更 */
function handleWorkOrderChange(workOrder?: ProWorkOrder) {
  if (!workOrder) {
    return
  }
  formData.value.workOrderId = workOrder.id
  formData.value.workOrderCode = workOrder.code || ''
  formData.value.workOrderName = workOrder.name || ''
  formData.value.itemId = workOrder.productId
  formData.value.itemCode = workOrder.productCode || ''
  formData.value.itemName = workOrder.productName || ''
  formData.value.itemSpecification = workOrder.productSpecification || ''
  formData.value.unitName = workOrder.unitMeasureName || ''
  formData.value.taskId = undefined
  formData.value.taskCode = ''
}

/** 工位变更 */
function handleWorkstationChange(workstation?: MdWorkstation) {
  formData.value.workstationId = workstation?.id
  formData.value.workstationCode = workstation?.code || ''
  formData.value.workstationName = workstation?.name || ''
  formData.value.processId = workstation?.processId
  formData.value.processName = workstation?.processName || ''
  formData.value.taskId = undefined
  formData.value.taskCode = ''
}

/** 生产任务变更 */
function handleTaskChange(task?: ProTask) {
  if (!task) {
    formData.value.taskId = undefined
    formData.value.taskCode = ''
    return
  }
  formData.value.taskId = task.id
  formData.value.taskCode = task.code || ''
  formData.value.workOrderId = task.workOrderId
  formData.value.workOrderCode = task.workOrderCode || formData.value.workOrderCode
  formData.value.workOrderName = task.workOrderName || formData.value.workOrderName
  formData.value.workstationId = task.workstationId
  formData.value.workstationCode = task.workstationCode || formData.value.workstationCode
  formData.value.workstationName = task.workstationName || formData.value.workstationName
  formData.value.processId = task.processId
  formData.value.processName = task.processName || ''
  formData.value.itemId = task.itemId
  formData.value.itemCode = task.itemCode || ''
  formData.value.itemName = task.itemName || ''
  formData.value.itemSpecification = task.itemSpecification || ''
  formData.value.unitName = task.unitMeasureName || ''
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getIpqc(Number(props.id))
}

/** 是否有待检任务参数 */
function hasPendingInspectPreset() {
  return [
    toFiniteNumber(props.sourceDocType),
    toFiniteNumber(props.sourceDocId),
    toFiniteNumber(props.sourceLineId),
  ].every(value => value != null)
}

/** 应用待检任务预填 */
function applyPendingInspectPreset() {
  if (props.id || !hasPendingInspectPreset()) {
    return
  }
  const sourceDocCode = decodeUrlText(props.sourceDocCode)
  formData.value.name = sourceDocCode ? `${sourceDocCode} 过程检验单` : formData.value.name
  formData.value.sourceDocType = toFiniteNumber(props.sourceDocType)
  formData.value.sourceDocId = toFiniteNumber(props.sourceDocId)
  formData.value.sourceLineId = toFiniteNumber(props.sourceLineId)
  formData.value.sourceDocCode = sourceDocCode
  formData.value.itemId = toFiniteNumber(props.itemId)
  formData.value.itemCode = decodeUrlText(props.itemCode)
  formData.value.itemName = decodeUrlText(props.itemName)
  formData.value.itemSpecification = decodeUrlText(props.itemSpecification)
  formData.value.unitName = decodeUrlText(props.unitName)
  formData.value.workOrderId = toFiniteNumber(props.workOrderId)
  formData.value.workOrderCode = decodeUrlText(props.workOrderCode)
  formData.value.workOrderName = decodeUrlText(props.workOrderName)
  formData.value.workstationId = toFiniteNumber(props.workstationId)
  formData.value.workstationCode = decodeUrlText(props.workstationCode)
  formData.value.workstationName = decodeUrlText(props.workstationName)
  formData.value.processId = toFiniteNumber(props.processId)
  formData.value.processName = decodeUrlText(props.processName)
  formData.value.taskId = toFiniteNumber(props.taskId)
  formData.value.taskCode = decodeUrlText(props.taskCode)
  formData.value.checkQuantity = toFiniteNumber(props.quantity) ?? 0
  formData.value.inspectDate = toFiniteNumber(props.recordTime) ?? decodeUrlText(props.recordTime)
}

/** 提交表单 */
async function handleSubmit() {
  if (!isDraft.value) {
    toast.warning('已完成检验单不能修改')
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateIpqc(formData.value)
      toast.success('修改成功')
    } else {
      await createIpqc(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:qc:ipqc:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  applyPendingInspectPreset()
  await getDetail()
})
</script>
