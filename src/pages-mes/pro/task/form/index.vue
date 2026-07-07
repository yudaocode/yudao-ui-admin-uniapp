<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell v-if="taskDetail?.code" title="任务编码" :value="taskDetail.code" />
          <wd-cell v-if="taskDetail?.name" title="任务名称" :value="taskDetail.name" />
          <wd-cell v-if="taskDetail?.workOrderCode" title="工单" :value="`${taskDetail.workOrderCode} / ${taskDetail.workOrderName || '-'}`" />
          <wd-cell v-if="taskDetail?.processName" title="工序" :value="taskDetail.processName" />
          <wd-form-item title="工作站" title-width="220rpx" prop="workstationId" is-link :value="selectedWorkstationText" placeholder="请选择工作站" @click="openWorkstationPicker" />
          <wd-form-item title="排产数量" title-width="220rpx" prop="quantity" center>
            <wd-input-number v-model="formData.quantity" :min="0.01" :precision="2" :disabled="readonly" />
          </wd-form-item>
          <wd-form-item title="开始时间" title-width="220rpx" prop="startTime" :is-link="!readonly" :value="formatDateTime(formData.startTime) || ''" placeholder="请选择开始时间" @click="openStartTimePicker" />
          <wd-datetime-picker v-model="formData.startTime" v-model:visible="dateVisible.startTime" title="请选择开始时间" type="datetime" />
          <wd-form-item title="生产时长" title-width="220rpx" prop="duration" center>
            <wd-input-number v-model="formData.duration" :min="1" :precision="0" :disabled="readonly" />
          </wd-form-item>
          <wd-cell title="预计完成" :value="formatDateTime(formData.endTime) || '-'" />
          <wd-form-item title="甘特颜色" title-width="220rpx" prop="colorCode">
            <wd-input v-model="formData.colorCode" placeholder="#00AEF3" clearable :disabled="readonly" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="300" show-word-limit clearable :disabled="readonly" />
          </wd-form-item>
          <wd-cell v-if="taskDetail?.status != null" title="任务状态">
            <dict-tag :type="DICT_TYPE.MES_PRO_TASK_STATUS" :value="taskDetail.status" />
          </wd-cell>
          <wd-cell v-if="taskDetail?.producedQuantity != null" title="已生产数量" :value="taskDetail.producedQuantity" />
          <wd-cell v-if="taskDetail?.qualifyQuantity != null" title="合格品数量" :value="taskDetail.qualifyQuantity" />
          <wd-cell v-if="taskDetail?.unqualifyQuantity != null" title="不良品数量" :value="taskDetail.unqualifyQuantity" />
        </wd-cell-group>
      </wd-form>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view v-if="!readonly" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
    <WorkstationPicker ref="workstationPickerRef" @confirm="handleWorkstationConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdWorkstation } from '@/api/mes/md/workstation'
import type { ProTask } from '@/api/mes/pro/task'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getWorkstation } from '@/api/mes/md/workstation'
import { createTask, getTask, updateTask } from '@/api/mes/pro/task'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import WorkstationPicker from '@/pages-mes/md/workstation/components/workstation-picker.vue'

const props = defineProps<{
  id?: number | string
  workOrderId?: number | string
  routeId?: number | string
  processId?: number | string
  itemId?: number | string
  colorCode?: string
  readonly?: boolean | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formRef = ref<FormInstance>() // 表单组件引用
const workstationPickerRef = ref<InstanceType<typeof WorkstationPicker>>() // 工作站选择器
const formLoading = ref(false) // 表单提交状态
const taskDetail = ref<ProTask>() // 编辑详情
const selectedWorkstation = ref<MdWorkstation>() // 当前工作站
const dateVisible = reactive({ startTime: false }) // 日期选择器显示状态
const readonly = computed(() => String(props.readonly) === 'true')
const getTitle = computed(() => readonly.value ? '生产任务详情' : props.id ? '编辑生产任务' : '新增生产任务')
const formData = ref<ProTask>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  workstationId: [{ required: true, message: '工作站不能为空' }],
  quantity: [{ required: true, message: '排产数量不能为空' }],
  startTime: [{ required: true, message: '开始时间不能为空' }],
  duration: [{ required: true, message: '生产时长不能为空' }],
})
const selectedWorkstationText = computed(() => {
  if (selectedWorkstation.value) {
    return `${selectedWorkstation.value.code} / ${selectedWorkstation.value.name}`
  }
  return formData.value.workstationId ? String(formData.value.workstationId) : ''
})

/** 默认表单数据 */
function getDefaultFormData(): ProTask {
  return {
    quantity: 1,
    startTime: '',
    duration: 1,
    colorCode: '#00AEF3',
  }
}

/** 创建态路由参数回填 */
function getCreateFormData(): ProTask {
  return {
    ...getDefaultFormData(),
    workOrderId: props.workOrderId ? Number(props.workOrderId) : undefined,
    routeId: props.routeId ? Number(props.routeId) : undefined,
    processId: props.processId ? Number(props.processId) : undefined,
    itemId: props.itemId ? Number(props.itemId) : undefined,
    colorCode: String(props.colorCode || '#00AEF3'),
  }
}

/** 返回上一页 */
function handleBack() {
  const workOrderId = taskDetail.value?.workOrderId || formData.value.workOrderId
  navigateBackPlus(workOrderId ? `/pages-mes/pro/task/detail/index?id=${workOrderId}&mode=schedule` : '/pages-mes/pro/task/index')
}

/** 计算结束时间 */
function calculateEndTime() {
  if (!formData.value.startTime || !formData.value.duration) {
    formData.value.endTime = ''
    return
  }
  const start = dayjs(toTimestamp(formData.value.startTime))
  if (!start.isValid()) {
    formData.value.endTime = ''
    return
  }
  formData.value.endTime = start.add(Number(formData.value.duration) * 8, 'hour').valueOf()
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    calculateEndTime()
    return
  }
  const detail = await getTask(Number(props.id))
  taskDetail.value = detail
  formData.value = {
    ...detail,
    colorCode: detail.colorCode || '#00AEF3',
  }
  if (detail.workstationId) {
    selectedWorkstation.value = await getWorkstation(detail.workstationId)
  }
  calculateEndTime()
}

/** 打开工作站选择器 */
function openWorkstationPicker() {
  if (readonly.value) {
    return
  }
  workstationPickerRef.value?.open(formData.value.workstationId)
}

/** 选择工作站 */
function handleWorkstationConfirm(item: MdWorkstation) {
  selectedWorkstation.value = item
  formData.value.workstationId = item.id
}

/** 打开开始时间选择器 */
function openStartTimePicker() {
  if (readonly.value) {
    return
  }
  if (!formData.value.startTime) {
    formData.value.startTime = Date.now()
  }
  dateVisible.startTime = true
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!formData.value.workOrderId || !formData.value.routeId || !formData.value.processId || !formData.value.itemId) {
    toast.warning('排产上下文不能为空，请从工单排产页进入')
    return
  }

  formLoading.value = true
  try {
    formData.value.colorCode = formData.value.colorCode || '#00AEF3'
    if (formData.value.id) {
      await updateTask(formData.value)
      toast.success('修改成功')
    } else {
      await createTask(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:pro:task:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 监听开始时间变化 */
watch(() => formData.value.startTime, calculateEndTime)

/** 监听计划时长变化 */
watch(() => formData.value.duration, calculateEndTime)

/** 初始化 */
onMounted(async () => {
  if (!props.id) {
    formData.value = getCreateFormData()
    calculateEndTime()
    return
  }
  await getDetail()
})
</script>
