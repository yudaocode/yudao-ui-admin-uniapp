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
          <wd-form-item title="任务编码" title-width="220rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入任务编码"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="任务名称" title-width="220rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              :disabled="isHeaderReadonly"
              placeholder="请输入任务名称"
            />
          </wd-form-item>
          <PlanFormPicker
            v-model="formData.planId"
            prop="planId"
            :disabled="isHeaderReadonly"
            @change="handlePlanChange"
          />
          <wd-form-item title="盘点类型" title-width="220rpx" prop="type">
            <dict-tag v-if="formData.type != null" :type="DICT_TYPE.MES_WM_STOCK_TAKING_TYPE" :value="formData.type" />
            <text v-else class="text-[#999]">选择方案后自动带出</text>
          </wd-form-item>
          <wd-form-item
            title="盘点日期"
            title-width="220rpx"
            prop="takingDate"
            :is-link="!isHeaderReadonly"
            placeholder="请选择盘点日期"
            :value="formatDateTime(formData.takingDate) || ''"
            @click="openDatePicker('takingDate')"
          />
          <wd-datetime-picker
            v-model="formData.takingDate"
            v-model:visible="pickerVisible.takingDate"
            title="请选择盘点日期"
            type="date"
          />
          <wd-form-item title="动态开始时间" title-width="220rpx">
            <text>{{ formatDateTime(formData.startTime) || '-' }}</text>
          </wd-form-item>
          <wd-form-item title="动态结束时间" title-width="220rpx">
            <text>{{ formatDateTime(formData.endTime) || '-' }}</text>
          </wd-form-item>
          <UserPicker
            v-model="formData.userId"
            label="盘点人"
            label-width="220rpx"
            prop="userId"
            type="radio"
            placeholder="请选择盘点人"
            :disabled="isHeaderReadonly"
            @confirm="handleUserConfirm"
          />
          <wd-form-item title="是否盲盘" title-width="220rpx" prop="blindFlag" center>
            <wd-switch v-model="formData.blindFlag" :disabled="isHeaderReadonly" />
          </wd-form-item>
          <wd-form-item title="冻结库存" title-width="220rpx" prop="frozen" center>
            <wd-switch v-model="formData.frozen" :disabled="isHeaderReadonly" />
          </wd-form-item>
          <wd-form-item v-if="currentId" title="单据状态" title-width="220rpx">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_STOCK_TAKING_TASK_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
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

      <view v-if="currentId" class="px-24rpx">
        <TaskLineMaintain :task-id="currentId" :editable="canMaintainLines" />
        <TaskResultMaintain :task-id="currentId" :editable="canExecuteTask" />
      </view>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view v-if="!isHeaderReadonly" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
    <view v-else-if="canExecuteTask" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block :loading="formLoading" @click="handleExecute">
          执行盘点
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { User } from '@/api/system/user'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { StockTakingTask } from '@/api/mes/wm/stocktaking/task'
import type { StockTakingPlan } from '@/api/mes/wm/stocktaking/plan'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createStockTaking, finishStockTaking, getStockTaking, updateStockTaking } from '@/api/mes/wm/stocktaking/task'
import UserPicker from '@/components/system-select/user-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import {
  DICT_TYPE,
  MesAutoCodeRuleCode,
  MesWmStockTakingTaskStatusEnum,
} from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import { useAccess } from '@/hooks/useAccess'
import PlanFormPicker from '../../plan/components/plan-form-picker.vue'
import TaskLineMaintain from '../components/task-line-maintain.vue'
import TaskResultMaintain from '../components/task-result-maintain.vue'

const props = defineProps<{
  id?: number | string
  mode?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const { hasAccessByCodes } = useAccess()
const routeId = computed(() => props.id ? Number(props.id) : undefined) // 路由编号
const routeMode = computed(() => String(props.mode || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentMode = ref('') // 当前页面模式
const isExecuteMode = computed(() => currentMode.value === 'execute')
const getTitle = computed(() => {
  if (isExecuteMode.value) {
    return '执行盘点'
  }
  return currentId.value ? '编辑盘点任务' : '新增盘点任务'
})
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<StockTakingTask>(getDefaultFormData()) // 表单数据
const canExecuteTask = computed(() => { // 审批中任务可执行盘点
  return isExecuteMode.value
    && formData.value.status === MesWmStockTakingTaskStatusEnum.APPROVING
    && hasAccessByCodes(['mes:wm-stock-taking-task:update'])
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const canMaintainLines = computed(() => {
  return currentId.value !== undefined
    && !isExecuteMode.value
    && formData.value.status === MesWmStockTakingTaskStatusEnum.PREPARE
})
const isHeaderReadonly = computed(() => {
  if (isExecuteMode.value) {
    return true
  }
  return currentId.value !== undefined && formData.value.status !== MesWmStockTakingTaskStatusEnum.PREPARE
})
const formSchema = createFormSchema({
  code: [{ required: true, message: '任务编码不能为空' }],
  name: [{ required: true, message: '任务名称不能为空' }],
  planId: [{ required: true, message: '盘点方案不能为空' }],
  type: [{ required: true, message: '盘点类型不能为空' }],
  takingDate: [{ required: true, message: '盘点日期不能为空' }],
  userId: [{ required: true, message: '盘点人不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData(): StockTakingTask {
  return {
    blindFlag: false,
    frozen: false,
    status: MesWmStockTakingTaskStatusEnum.PREPARE,
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/stocktaking/task/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data: StockTakingTask = await getStockTaking(currentId.value)
  formData.value = {
    ...data,
    blindFlag: Boolean(data.blindFlag),
    frozen: Boolean(data.frozen),
  }
}

/** 打开日期选择器 */
function openDatePicker(key: string) {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value[key] = true
}

/** 选择盘点方案 */
function handlePlanChange(plan?: StockTakingPlan) {
  if (!plan) {
    return
  }
  formData.value.planId = plan.id
  formData.value.planCode = plan.code
  formData.value.planName = plan.name
  formData.value.type = plan.type
  formData.value.startTime = plan.startTime
  formData.value.endTime = plan.endTime
  formData.value.blindFlag = Boolean(plan.blindFlag)
  formData.value.frozen = Boolean(plan.frozen)
  if (!formData.value.name) {
    formData.value.name = plan.name
  }
}

/** 确认盘点人 */
function handleUserConfirm(users: User[]) {
  formData.value.userNickname = users[0]?.nickname
}

/** 生成任务编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_STOCK_TAKING_CODE)
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
      await updateStockTaking(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createStockTaking(formData.value)
      currentId.value = id
      formData.value.id = id
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:stocktaking:task:reload')
    await getDetail()
  } finally {
    formLoading.value = false
  }
}

/** 执行盘点 */
async function handleExecute() {
  if (!currentId.value || !canExecuteTask.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行盘点操作？',
      confirmButtonText: '执行',
    })
  } catch {
    return
  }
  formLoading.value = true
  try {
    await finishStockTaking(currentId.value)
    toast.success('执行盘点成功')
    uni.$emit('mes:wm:stocktaking:task:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  currentId.value = routeId.value
  currentMode.value = routeMode.value
  await getDetail()
})
</script>
