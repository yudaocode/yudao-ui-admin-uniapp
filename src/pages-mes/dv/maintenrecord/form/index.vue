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
          <wd-form-item
            title="设备"
            title-width="200rpx"
            prop="machineryId"
            is-link
            :value="selectedMachineryText"
            placeholder="请选择设备"
            @click="openMachineryPicker"
          />
          <wd-form-item
            title="保养计划"
            title-width="200rpx"
            prop="planId"
            is-link
            :value="selectedPlanText"
            placeholder="请选择保养计划"
            @click="openPlanPicker"
          />
          <UserFormPicker
            v-model="formData.userId"
            label="保养人"
            label-width="200rpx"
            prop="userId"
            placeholder="请选择保养人"
          />
          <wd-form-item
            title="保养时间"
            title-width="200rpx"
            prop="maintenTime"
            is-link
            placeholder="请选择保养时间"
            :value="formatDateTime(formData.maintenTime)"
            @click="pickerVisible.maintenTime = true"
          />
          <wd-datetime-picker
            v-model="formData.maintenTime"
            v-model:visible="pickerVisible.maintenTime"
            title="请选择保养时间"
            type="datetime"
          />
          <wd-form-item v-if="props.id" title="状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_MAINTEN_RECORD_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <MaintenRecordLineList v-if="props.id" :record-id="Number(props.id)" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
        <wd-button
          v-if="canSubmit"
          class="flex-1"
          type="success"
          :loading="submitLoading"
          @click="handleSubmitRecord"
        >
          提交
        </wd-button>
      </view>
    </view>
    <MachineryPicker ref="machineryPickerRef" @confirm="handleMachineryConfirm" />
    <CheckPlanPicker
      ref="planPickerRef"
      title="选择保养计划"
      :type="MesDvSubjectTypeEnum.MAINTENANCE"
      @confirm="handlePlanConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DvCheckPlan } from '@/api/mes/dv/checkplan'
import type { DvMachinery } from '@/api/mes/dv/machinery'
import type { DvMaintenRecord } from '@/api/mes/dv/maintenrecord'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createMaintenRecord, getMaintenRecord, submitMaintenRecord, updateMaintenRecord } from '@/api/mes/dv/maintenrecord'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesDvMaintenRecordStatusEnum, MesDvSubjectTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import CheckPlanPicker from '../../checkplan/components/check-plan-picker.vue'
import MachineryPicker from '../../machinery/components/machinery-picker.vue'
import MaintenRecordLineList from '../components/mainten-record-line-list.vue'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const getTitle = computed(() => props.id ? '编辑保养记录' : '新增保养记录')
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const formData = ref<DvMaintenRecord>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  machineryId: [{ required: true, message: '设备不能为空' }],
  planId: [{ required: true, message: '保养计划不能为空' }],
  userId: [{ required: true, message: '保养人不能为空' }],
  maintenTime: [{ required: true, message: '保养时间不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const machineryPickerRef = ref<InstanceType<typeof MachineryPicker>>() // 设备选择器引用
const planPickerRef = ref<InstanceType<typeof CheckPlanPicker>>() // 计划选择器引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const canSubmit = computed(() => (
  props.id
  && formData.value.status === MesDvMaintenRecordStatusEnum.PREPARE
))
const selectedMachineryText = computed(() => {
  return formData.value.machineryId
    ? `${formData.value.machineryCode || '-'} ${formData.value.machineryName || ''}`.trim()
    : ''
})
const selectedPlanText = computed(() => {
  return formData.value.planId
    ? `${formData.value.planCode || '-'} ${formData.value.planName || ''}`.trim()
    : ''
})

/** 默认表单数据 */
function getDefaultFormData(): DvMaintenRecord {
  return {
    planId: undefined,
    machineryId: undefined,
    maintenTime: '',
    userId: undefined,
    status: undefined,
    remark: '',
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/maintenrecord/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMaintenRecord(Number(props.id))
}

/** 初始化页面数据 */
async function initPage() {
  if (!props.id) {
    formData.value = getDefaultFormData()
    return
  }
  if (!formData.value.id || formData.value.id !== Number(props.id)) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开设备选择器 */
function openMachineryPicker() {
  machineryPickerRef.value?.open()
}

/** 打开计划选择器 */
function openPlanPicker() {
  planPickerRef.value?.open()
}

/** 确认选择设备 */
function handleMachineryConfirm(item: DvMachinery) {
  formData.value = {
    ...formData.value,
    machineryId: item.id,
    machineryCode: item.code,
    machineryName: item.name,
    machineryBrand: item.brand,
    machinerySpecification: item.specification,
  }
}

/** 确认选择计划 */
function handlePlanConfirm(item: DvCheckPlan) {
  formData.value = {
    ...formData.value,
    planId: item.id,
    planCode: item.code,
    planName: item.name,
    planCycleCount: item.cycleCount,
    planCycleType: item.cycleType,
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
    const data = {
      ...formData.value,
      status: undefined,
    }
    if (props.id) {
      await updateMaintenRecord(data)
      toast.success('修改成功')
    } else {
      await createMaintenRecord(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:dv:maintenrecord:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 提交保养记录 */
async function handleSubmitRecord() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该保养记录？提交后将不能修改。',
    })
  } catch {
    return
  }

  submitLoading.value = true
  try {
    const data = {
      ...formData.value,
      status: undefined,
    }
    await updateMaintenRecord(data)
    await submitMaintenRecord(Number(props.id))
    toast.success('提交成功')
    uni.$emit('mes:dv:maintenrecord:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})
</script>
