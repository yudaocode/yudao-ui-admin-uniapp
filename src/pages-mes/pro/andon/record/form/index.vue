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
        <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
          呼叫信息
        </view>
        <wd-cell-group border>
          <wd-form-item
            title="工作站"
            title-width="220rpx"
            prop="workstationId"
            :is-link="isCreateMode"
            :value="selectedWorkstationText"
            placeholder="请选择工作站"
            @click="openWorkstationPicker"
          />
          <UserFormPicker
            v-if="isCreateMode"
            v-model="formData.userId"
            label="发起人"
            label-width="220rpx"
            prop="userId"
            placeholder="请选择发起人"
          />
          <wd-cell v-else title="发起人" :value="formData.userNickname || '-'" />
          <WorkOrderFormPicker
            v-model="formData.workOrderId"
            label="生产工单"
            label-width="220rpx"
            prop="workOrderId"
            placeholder="请选择已确认工单（可选）"
            :disabled="!isCreateMode"
            clearable
          />
          <wd-form-item
            title="工序"
            title-width="220rpx"
            prop="processId"
            :is-link="isCreateMode"
            :value="selectedProcessText"
            placeholder="请选择工序（可选）"
            @click="openProcessPicker"
          />
          <wd-form-item
            v-if="isCreateMode"
            title="呼叫原因"
            title-width="220rpx"
            prop="configId"
            is-link
            :value="selectedConfigText"
            placeholder="请选择呼叫原因"
            @click="openConfigPicker"
          />
          <wd-cell v-else title="呼叫原因" :value="formData.reason || '-'" />
          <wd-cell title="级别">
            <dict-tag v-if="formData.level != null" :type="DICT_TYPE.MES_PRO_ANDON_LEVEL" :value="formData.level" />
            <text v-else>由呼叫原因自动带出</text>
          </wd-cell>
          <wd-cell v-if="formData.status != null" title="处置状态">
            <dict-tag :type="DICT_TYPE.MES_PRO_ANDON_STATUS" :value="formData.status" />
          </wd-cell>
        </wd-cell-group>

        <template v-if="isUpdateMode">
          <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
            处置信息
          </view>
          <wd-cell-group border>
            <wd-form-item title="处置时间" title-width="220rpx" prop="handleTime" is-link :value="formatDateTime(formData.handleTime) || ''" placeholder="请选择处置时间" @click="dateVisible.handleTime = true" />
            <wd-datetime-picker v-model="formData.handleTime" v-model:visible="dateVisible.handleTime" title="请选择处置时间" type="datetime" />
            <UserFormPicker
              v-model="formData.handlerUserId"
              label="处置人"
              label-width="220rpx"
              prop="handlerUserId"
              placeholder="请选择处置人"
            />
          </wd-cell-group>
        </template>

        <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
          备注
        </view>
        <wd-cell-group border>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="300"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="isCreateMode" class="flex-1" type="primary" :loading="formLoading" @click="handleCreate">
          确定
        </wd-button>
        <wd-button v-if="isUpdateMode" class="flex-1" type="primary" :loading="formLoading" @click="handleSave">
          保存
        </wd-button>
        <wd-button v-if="isUpdateMode" class="flex-1" type="success" :loading="formLoading" @click="handleFinish">
          已处置
        </wd-button>
      </view>
    </view>

    <WorkstationPicker ref="workstationPickerRef" @confirm="handleWorkstationConfirm" />
    <ProcessPicker ref="processPickerRef" @confirm="handleProcessConfirm" />
    <AndonConfigPicker ref="configPickerRef" @confirm="handleConfigConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdWorkstation } from '@/api/mes/md/workstation'
import type { ProAndonConfig } from '@/api/mes/pro/andon/config'
import type { ProAndonRecord } from '@/api/mes/pro/andon/record'
import type { ProProcess } from '@/api/mes/pro/process'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createAndonRecord, getAndonRecord, updateAndonRecord } from '@/api/mes/pro/andon/record'
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesProAndonStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import WorkOrderFormPicker from '@/pages-mes/pro/workorder/components/workorder-form-picker.vue'
import AndonConfigPicker from '../../config/components/andon-config-picker.vue'
import ProcessPicker from '@/pages-mes/pro/process/components/process-picker.vue'
import WorkstationPicker from '@/pages-mes/md/workstation/components/workstation-picker.vue'

type FormMode = 'create' | 'update'

const props = withDefaults(defineProps<{
  id?: number | string
  mode?: FormMode
}>(), {
  id: undefined,
  mode: 'create',
})

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
const formRef = ref<FormInstance>() // 表单组件引用
const dateVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const routeMode = computed(() => props.mode || 'create')
const formData = ref<ProAndonRecord>(getDefaultFormData()) // 表单数据
const selectedWorkstation = ref<MdWorkstation>() // 已选工作站
const selectedProcess = ref<ProProcess>() // 已选工序
const selectedConfig = ref<ProAndonConfig>() // 已选安灯配置
const workstationPickerRef = ref<InstanceType<typeof WorkstationPicker>>() // 工作站选择器
const processPickerRef = ref<InstanceType<typeof ProcessPicker>>() // 工序选择器
const configPickerRef = ref<InstanceType<typeof AndonConfigPicker>>() // 安灯配置选择器
const isCreateMode = computed(() => routeMode.value === 'create' || !props.id)
const isUpdateMode = computed(() => routeMode.value === 'update' && !!props.id)
const getTitle = computed(() => isCreateMode.value ? '新增安灯呼叫' : '处置安灯呼叫')
const selectedWorkstationText = computed(() => {
  if (selectedWorkstation.value) {
    return `${selectedWorkstation.value.code || '-'} / ${selectedWorkstation.value.name || '-'}`
  }
  return formData.value.workstationId
    ? `${formData.value.workstationCode || '-'} / ${formData.value.workstationName || '-'}`
    : ''
})
const selectedProcessText = computed(() => {
  if (selectedProcess.value) {
    return `${selectedProcess.value.code || '-'} / ${selectedProcess.value.name || '-'}`
  }
  return formData.value.processName || ''
})
const selectedConfigText = computed(() => selectedConfig.value?.reason || formData.value.reason || '')
const formSchema = createFormSchema(() => ({
  workstationId: [{ required: isCreateMode.value, message: '工作站不能为空' }],
  userId: [{ required: isCreateMode.value, message: '发起人不能为空' }],
  configId: [{ required: isCreateMode.value, message: '呼叫原因不能为空' }],
}))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/andon/record/index')
}

/** 默认表单数据 */
function getDefaultFormData(): ProAndonRecord {
  return {
    userId: userStore.userInfo?.userId,
  }
}

/** 打开工作站选择器 */
function openWorkstationPicker() {
  if (!isCreateMode.value) {
    return
  }
  workstationPickerRef.value?.open(formData.value.workstationId)
}

/** 打开工序选择器 */
function openProcessPicker() {
  if (!isCreateMode.value) {
    return
  }
  processPickerRef.value?.open(formData.value.processId)
}

/** 打开安灯配置选择器 */
function openConfigPicker() {
  if (!isCreateMode.value) {
    return
  }
  configPickerRef.value?.open(formData.value.configId)
}

/** 选择工作站 */
function handleWorkstationConfirm(item: MdWorkstation) {
  selectedWorkstation.value = item
  formData.value.workstationId = item.id
}

/** 选择工序 */
function handleProcessConfirm(item: ProProcess) {
  selectedProcess.value = item
  formData.value.processId = item.id
}

/** 选择呼叫原因 */
function handleConfigConfirm(item: ProAndonConfig) {
  selectedConfig.value = item
  formData.value.configId = item.id
  formData.value.reason = item.reason
  formData.value.level = item.level
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || isCreateMode.value) {
    return
  }
  formData.value = await getAndonRecord(Number(props.id))
}

/** 新增呼叫 */
async function handleCreate() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data: ProAndonRecord = {
      configId: formData.value.configId!,
      workstationId: formData.value.workstationId!,
      userId: formData.value.userId!,
      workOrderId: formData.value.workOrderId,
      processId: formData.value.processId,
      remark: formData.value.remark || undefined,
    }
    await createAndonRecord(data)
    toast.success('新增成功')
    uni.$emit('mes:pro:andon:record:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 保存处置信息 */
async function handleSave() {
  if (!formData.value.id) {
    return
  }
  formLoading.value = true
  try {
    const data = { ...formData.value, status: MesProAndonStatusEnum.ACTIVE }
    await updateAndonRecord(data)
    toast.success('保存成功')
    uni.$emit('mes:pro:andon:record:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 标记已处置 */
async function handleFinish() {
  if (!formData.value.id) {
    return
  }
  if (!formData.value.handleTime) {
    toast.warning('标记已处置时，处置时间不能为空')
    return
  }
  if (!formData.value.handlerUserId) {
    toast.warning('标记已处置时，处置人不能为空')
    return
  }
  try {
    await dialog.confirm({ title: '处置确认', msg: '确定要将该安灯呼叫标记为已处置吗？' })
  } catch {
    return
  }

  formLoading.value = true
  try {
    const data = { ...formData.value, status: MesProAndonStatusEnum.HANDLED }
    await updateAndonRecord(data)
    toast.success('处置成功')
    uni.$emit('mes:pro:andon:record:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
