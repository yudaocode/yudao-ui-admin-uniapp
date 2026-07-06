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
          <wd-form-item title="报工单号" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable :disabled="headerReadonly">
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :disabled="headerReadonly" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <yd-form-picker v-model="formData.type" label="报工类型" label-width="220rpx" prop="type" :disabled="headerReadonly" :dict-type="DICT_TYPE.MES_PRO_FEEDBACK_TYPE" placeholder="请选择报工类型" />
          <WorkOrderFormPicker
            v-model="formData.workOrderId"
            label="生产工单"
            label-width="220rpx"
            prop="workOrderId"
            placeholder="请选择已确认工单"
            :disabled="headerReadonly"
            @change="handleWorkOrderChange"
          />
          <WorkstationFormPicker v-model="formData.workstationId" label="工作站" label-width="220rpx" prop="workstationId" :disabled="headerReadonly" @change="handleWorkstationChange" />
          <TaskFormPicker
            v-model="formData.taskId"
            label="生产任务"
            label-width="220rpx"
            prop="taskId"
            :work-order-id="formData.workOrderId"
            :workstation-id="formData.workstationId"
            :statuses="[MesProTaskStatusEnum.PREPARE]"
            :disabled="headerReadonly || !formData.workOrderId"
            :placeholder="taskPlaceholder"
            @change="handleTaskChange"
          />
          <wd-cell title="产品编码" :value="formData.itemCode || '-'" />
          <wd-cell title="产品名称" :value="formData.itemName || '-'" />
          <wd-cell title="规格/单位" :value="productSpecText" />
          <wd-cell v-if="formData.status != null" title="单据状态">
            <dict-tag :type="DICT_TYPE.MES_PRO_FEEDBACK_STATUS" :value="formData.status" />
          </wd-cell>
        </wd-cell-group>

        <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
          报工数量
        </view>
        <wd-cell-group border>
          <template v-if="checkFlag">
            <wd-form-item title="报工数量" title-width="220rpx" prop="feedbackQuantity" center>
              <wd-input-number v-model="formData.feedbackQuantity" :min="0" :precision="2" :disabled="quantityReadonly" />
            </wd-form-item>
            <wd-cell title="待检数量" :value="`${formData.feedbackQuantity || 0}`" />
          </template>
          <template v-else>
            <wd-form-item title="报工数量" title-width="220rpx" prop="feedbackQuantity" center>
              <wd-input-number v-model="formData.feedbackQuantity" :min="0" :precision="2" disabled />
            </wd-form-item>
            <wd-form-item title="合格品数量" title-width="220rpx" prop="qualifiedQuantity" center>
              <wd-input-number v-model="formData.qualifiedQuantity" :min="0" :precision="2" :disabled="quantityReadonly" @change="handleQuantityChanged" />
            </wd-form-item>
            <wd-form-item title="不良品数量" title-width="220rpx" prop="unqualifiedQuantity" center>
              <wd-input-number v-model="formData.unqualifiedQuantity" :min="0" :precision="2" :disabled="quantityReadonly" @change="handleQuantityChanged" />
            </wd-form-item>
            <template v-if="Number(formData.unqualifiedQuantity || 0) > 0">
              <wd-form-item title="工废数量" title-width="220rpx" prop="laborScrapQuantity" center>
                <wd-input-number v-model="formData.laborScrapQuantity" :min="0" :precision="2" :disabled="quantityReadonly" @change="handleScrapChanged" />
              </wd-form-item>
              <wd-form-item title="料废数量" title-width="220rpx" prop="materialScrapQuantity" center>
                <wd-input-number v-model="formData.materialScrapQuantity" :min="0" :precision="2" :disabled="quantityReadonly" @change="handleScrapChanged" />
              </wd-form-item>
              <wd-form-item title="其他废品" title-width="220rpx" prop="otherScrapQuantity" center>
                <wd-input-number v-model="formData.otherScrapQuantity" :min="0" :precision="2" :disabled="quantityReadonly" @change="handleScrapChanged" />
              </wd-form-item>
            </template>
          </template>
        </wd-cell-group>

        <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
          人员与备注
        </view>
        <wd-cell-group border>
          <UserPicker v-model="formData.feedbackUserId" label="报工人" label-width="220rpx" prop="feedbackUserId" type="radio" placeholder="请选择报工人" :disabled="headerReadonly" />
          <wd-form-item title="报工时间" title-width="220rpx" prop="feedbackTime" :is-link="!headerReadonly" :value="formatDateTime(formData.feedbackTime) || ''" placeholder="请选择报工时间" @click="openFeedbackTimePicker" />
          <wd-datetime-picker v-model="formData.feedbackTime" v-model:visible="dateVisible.feedbackTime" title="请选择报工时间" type="datetime" />
          <UserPicker v-model="formData.approveUserId" label="审核人" label-width="220rpx" prop="approveUserId" type="radio" placeholder="请选择审核人" :disabled="headerReadonly" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="300" show-word-limit clearable :disabled="!isEditable" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <ItemConsumeList v-if="showTraceLists" :feedback-id="formData.id" />
      <ProductProduceList v-if="showTraceLists" :feedback-id="formData.id" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="isEditable" class="flex-1" type="primary" :loading="formLoading" @click="submitForm">
          保存
        </wd-button>
        <wd-button v-if="canSubmit" class="flex-1" type="warning" :loading="formLoading" @click="handleSubmit">
          提交
        </wd-button>
        <wd-button v-if="isApproveMode" class="flex-1" type="success" :loading="formLoading" @click="handleApprove">
          通过
        </wd-button>
        <wd-button v-if="isApproveMode" class="flex-1" type="danger" :loading="formLoading" @click="handleReject">
          不通过
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdWorkstation } from '@/api/mes/md/workstation'
import type { ProFeedback } from '@/api/mes/pro/feedback'
import {
  approveFeedback,
  createFeedback,
  getFeedback,
  rejectFeedback,
  submitFeedback,
  updateFeedback,
} from '@/api/mes/pro/feedback'
import type { ProTask } from '@/api/mes/pro/task'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getRouteProcessByRouteAndProcess } from '@/api/mes/pro/route/process'
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesProFeedbackStatusEnum, MesProTaskStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import WorkstationFormPicker from '@/pages-mes/md/workstation/components/workstation-form-picker.vue'
import TaskFormPicker from '@/pages-mes/pro/task/components/task-form-picker.vue'
import WorkOrderFormPicker from '@/pages-mes/pro/workorder/components/workorder-form-picker.vue'
import ItemConsumeList from '../components/item-consume-list.vue'
import ProductProduceList from '../components/product-produce-list.vue'

type FormMode = 'approve' | 'create' | 'submit' | 'update'

const props = defineProps<{
  id?: number | string
  mode?: FormMode
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const userStore = useUserStore()
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formRef = ref<FormInstance>() // 表单组件引用
const dateVisible = reactive({ feedbackTime: false }) // 日期选择器显示状态
const routeMode = computed<FormMode>(() => props.mode || (props.id ? 'update' : 'create'))
const formMode = ref<FormMode>(routeMode.value)
const checkFlag = ref(true) // 是否需要质检
const originalFormData = ref('') // 原始表单数据快照
const formData = ref<ProFeedback>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '报工单号不能为空' }],
  type: [{ required: true, message: '报工类型不能为空' }],
  workOrderId: [{ required: true, message: '生产工单不能为空' }],
  taskId: [{ required: true, message: '生产任务不能为空' }],
  workstationId: [{ required: true, message: '工作站不能为空' }],
  feedbackQuantity: [
    { required: true, message: '报工数量不能为空' },
    {
      validator: () => {
        if (Number(formData.value.feedbackQuantity || 0) > 0) {
          return true
        }
        return '报工数量必须大于 0'
      },
    },
  ],
  feedbackUserId: [{ required: true, message: '报工人不能为空' }],
  feedbackTime: [{ required: true, message: '报工时间不能为空' }],
  approveUserId: [{ required: true, message: '审核人不能为空' }],
})
const getTitle = computed(() => {
  const titles: Record<FormMode, string> = {
    create: '新增生产报工',
    update: '编辑生产报工',
    submit: '提交生产报工',
    approve: '审批生产报工',
  }
  return titles[formMode.value]
})
const isEditable = computed(() =>
  formMode.value === 'create'
  || (['submit', 'update'].includes(formMode.value) && formData.value.status === MesProFeedbackStatusEnum.PREPARE),
)
const isApproveMode = computed(() => formMode.value === 'approve')
const headerReadonly = computed(() => !isEditable.value || formMode.value === 'submit')
const quantityReadonly = computed(() => !isEditable.value)
const canSubmit = computed(() => isEditable.value && formData.value.status === MesProFeedbackStatusEnum.PREPARE)
const showTraceLists = computed(() =>
  !!formData.value.id
  && formData.value.status !== MesProFeedbackStatusEnum.PREPARE
  && formData.value.status !== MesProFeedbackStatusEnum.APPROVING,
)
const taskPlaceholder = computed(() => formData.value.workOrderId ? '请选择生产任务' : '请先选择生产工单')
const productSpecText = computed(() => `${formData.value.itemSpecification || '-'} / ${formData.value.unitMeasureName || '-'}`)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/feedback/index')
}

/** 默认表单数据 */
function getDefaultFormData(): ProFeedback {
  return {
    feedbackTime: Date.now(),
    feedbackQuantity: 0,
    qualifiedQuantity: 0,
    unqualifiedQuantity: 0,
    uncheckQuantity: 0,
    laborScrapQuantity: 0,
    materialScrapQuantity: 0,
    otherScrapQuantity: 0,
    feedbackUserId: userStore.userInfo.userId,
  }
}

/** 打开报工时间选择器 */
function openFeedbackTimePicker() {
  if (headerReadonly.value) {
    return
  }
  dateVisible.feedbackTime = true
}

/** 生成报工单号 */
async function handleGenerateCode() {
  if (headerReadonly.value || codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.PRO_FEEDBACK_CODE)
    toast.success('生成成功')
  } finally {
    codeLoading.value = false
  }
}

/** 工单变更：清空任务和产品关联 */
function handleWorkOrderChange() {
  formData.value.workstationId = undefined
  formData.value.taskId = undefined
  formData.value.routeId = undefined
  formData.value.processId = undefined
  formData.value.itemId = undefined
  formData.value.itemCode = undefined
  formData.value.itemName = undefined
  formData.value.itemSpecification = undefined
  formData.value.unitMeasureName = undefined
  checkFlag.value = true
}

/** 工作站变更：清空任务，重新按工作站筛选 */
function handleWorkstationChange(item?: MdWorkstation) {
  formData.value.workstationId = item?.id
  formData.value.taskId = undefined
  formData.value.routeId = undefined
  formData.value.processId = undefined
  formData.value.itemId = undefined
  formData.value.itemCode = undefined
  formData.value.itemName = undefined
  formData.value.itemSpecification = undefined
  formData.value.unitMeasureName = undefined
  checkFlag.value = true
}

/** 任务变更：自动填充关联字段 */
async function handleTaskChange(task?: ProTask) {
  if (!task) {
    formData.value.taskId = undefined
    formData.value.routeId = undefined
    formData.value.processId = undefined
    formData.value.itemId = undefined
    formData.value.itemCode = undefined
    formData.value.itemName = undefined
    formData.value.itemSpecification = undefined
    formData.value.unitMeasureName = undefined
    checkFlag.value = true
    return
  }
  formData.value.taskId = task.id
  formData.value.routeId = task.routeId
  formData.value.processId = task.processId
  formData.value.workstationId = task.workstationId
  formData.value.itemId = task.itemId
  formData.value.itemCode = task.itemCode
  formData.value.itemName = task.itemName
  formData.value.unitMeasureName = task.unitMeasureName
  formData.value.itemSpecification = task.itemSpecification
  await loadCheckFlag(task.routeId, task.processId)
}

/** 加载工序质检标识 */
async function loadCheckFlag(routeId?: number, processId?: number) {
  if (!routeId || !processId) {
    checkFlag.value = true
    return
  }
  try {
    const routeProcess = await getRouteProcessByRouteAndProcess(routeId, processId)
    checkFlag.value = routeProcess?.checkFlag ?? false
  } catch {
    checkFlag.value = true
  }
}

/** 合格/不良变更 */
function handleQuantityChanged() {
  formData.value.feedbackQuantity = Number(formData.value.qualifiedQuantity || 0) + Number(formData.value.unqualifiedQuantity || 0)
}

/** 废品明细变更 */
function handleScrapChanged() {
  formData.value.unqualifiedQuantity = Number(formData.value.laborScrapQuantity || 0)
    + Number(formData.value.materialScrapQuantity || 0)
    + Number(formData.value.otherScrapQuantity || 0)
  handleQuantityChanged()
}

/** 对齐数量字段 */
function alignQuantity(data: ProFeedback) {
  if (checkFlag.value) {
    data.uncheckQuantity = data.feedbackQuantity
    data.qualifiedQuantity = 0
    data.unqualifiedQuantity = 0
    data.laborScrapQuantity = 0
    data.materialScrapQuantity = 0
    data.otherScrapQuantity = 0
  } else {
    data.feedbackQuantity = Number(data.qualifiedQuantity || 0) + Number(data.unqualifiedQuantity || 0)
    data.uncheckQuantity = 0
  }
}

/** 获取保存参数 */
function getSubmitData(): ProFeedback {
  const data = { ...formData.value }
  alignQuantity(data)
  return data
}

/** 提交表单（create/update 模式） */
async function submitForm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = getSubmitData()
    if (formData.value.id) {
      await updateFeedback(data)
      toast.success('修改成功')
    } else {
      const id = await createFeedback(data)
      toast.success('新增成功')
      formData.value.id = id
      formData.value.status = MesProFeedbackStatusEnum.PREPARE
      formMode.value = 'update'
    }
    originalFormData.value = JSON.stringify(getSubmitData())
    uni.$emit('mes:pro:feedback:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交操作：表单修改过则先保存，再提交 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  try {
    await dialog.confirm({ title: '提交报工单', msg: '确认提交该报工单？提交后将不能修改。' })
  } catch {
    return
  }

  formLoading.value = true
  try {
    const data = getSubmitData()
    if (!formData.value.id) {
      formData.value.id = await createFeedback(data)
      formData.value.status = MesProFeedbackStatusEnum.PREPARE
      originalFormData.value = JSON.stringify(getSubmitData())
    } else if (JSON.stringify(data) !== originalFormData.value) {
      await updateFeedback(data)
      originalFormData.value = JSON.stringify(data)
    }
    if (formData.value.id) {
      await submitFeedback(formData.value.id)
    }
    toast.success('报工单已提交')
    uni.$emit('mes:pro:feedback:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 审批通过 */
async function handleApprove() {
  if (!formData.value.id) {
    return
  }
  try {
    await dialog.confirm({ title: '审批通过', msg: '确认通过该报工单？' })
  } catch {
    return
  }

  formLoading.value = true
  try {
    const finished = await approveFeedback(formData.value.id)
    toast.success(finished ? '报工单已审批完成' : '报工成功，请等待质量检验完成')
    uni.$emit('mes:pro:feedback:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 审批不通过 */
async function handleReject() {
  if (!formData.value.id) {
    return
  }
  try {
    await dialog.confirm({ title: '审批不通过', msg: '确认驳回该报工单？' })
  } catch {
    return
  }

  formLoading.value = true
  try {
    await rejectFeedback(formData.value.id)
    toast.success('报工单已驳回')
    uni.$emit('mes:pro:feedback:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const detail = await getFeedback(Number(props.id))
  formData.value = detail
  await loadCheckFlag(detail.routeId, detail.processId)
  originalFormData.value = JSON.stringify(getSubmitData())
}

/** 初始化新增默认值 */
function initCreate() {
  formData.value = getDefaultFormData()
  checkFlag.value = true
  originalFormData.value = JSON.stringify(getSubmitData())
}

/** 初始化 */
onMounted(() => {
  formMode.value = routeMode.value
  if (props.id) {
    getDetail()
  } else {
    initCreate()
  }
})
</script>
