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
          <wd-form-item title="维修单编码" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入维修单编码"
              />
              <wd-button v-if="isEditable" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="维修单名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              :disabled="isHeaderReadonly"
              placeholder="请输入维修单名称"
            />
          </wd-form-item>
          <wd-form-item
            title="设备"
            title-width="200rpx"
            prop="machineryId"
            :is-link="!isHeaderReadonly"
            :value="selectedMachineryText"
            placeholder="请选择设备"
            @click="openMachineryPicker"
          />
          <wd-form-item
            title="报修日期"
            title-width="200rpx"
            prop="requireDate"
            is-link
            placeholder="请选择报修日期"
            :value="formatDateTime(formData.requireDate)"
            @click="openDatePicker('requireDate')"
          />
          <wd-datetime-picker
            v-model="formData.requireDate"
            v-model:visible="pickerVisible.requireDate"
            title="请选择报修日期"
            type="datetime"
          />
          <wd-form-item
            v-if="showFinishFields"
            title="维修完成日期"
            title-width="200rpx"
            prop="finishDate"
            is-link
            placeholder="请选择维修完成日期"
            :value="formatDateTime(formData.finishDate)"
            @click="openDatePicker('finishDate')"
          />
          <wd-datetime-picker
            v-model="formData.finishDate"
            v-model:visible="pickerVisible.finishDate"
            title="请选择维修完成日期"
            type="datetime"
          />
          <wd-form-item
            v-if="showConfirmFields"
            title="维修人"
            title-width="200rpx"
            prop="acceptedUserId"
            :value="acceptedUserName || '-'"
          />
          <wd-form-item v-if="showDetailFields" title="维修结果" title-width="200rpx" prop="result">
            <dict-tag v-if="formData.result != null" :type="DICT_TYPE.MES_DV_REPAIR_RESULT" :value="formData.result" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item
            v-if="showDetailFields"
            title="验收日期"
            title-width="200rpx"
            prop="confirmDate"
            :value="formatDateTime(formData.confirmDate) || '-'"
          />
          <wd-form-item
            v-if="showDetailFields"
            title="验收人"
            title-width="200rpx"
            prop="confirmUserId"
            :value="confirmUserName || '-'"
          />
          <wd-form-item v-if="props.id" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_DV_REPAIR_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
              :disabled="isHeaderReadonly"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <RepairLineList v-if="props.id" :repair-id="Number(props.id)" :readonly="isHeaderReadonly" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="isEditable"
          class="flex-1"
          type="primary"
          :loading="formLoading"
          @click="handleSubmit"
        >
          保存
        </wd-button>
        <wd-button
          v-if="canSubmit"
          class="flex-1"
          type="success"
          :loading="submitLoading"
          @click="handleSubmitRepair"
        >
          提交
        </wd-button>
        <wd-button
          v-if="isConfirm"
          class="flex-1"
          type="success"
          :loading="confirmLoading"
          @click="handleConfirmRepair"
        >
          完成维修
        </wd-button>
        <wd-button
          v-if="isFinish"
          class="flex-1"
          type="success"
          :loading="finishLoading"
          @click="handleFinishRepair(MesDvRepairResultEnum.PASS)"
        >
          验收通过
        </wd-button>
        <wd-button
          v-if="isFinish"
          class="flex-1"
          type="warning"
          :loading="finishLoading"
          @click="handleFinishRepair(MesDvRepairResultEnum.FAIL)"
        >
          不通过
        </wd-button>
      </view>
    </view>
    <MachineryPicker ref="machineryPickerRef" @confirm="handleMachineryConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DvMachinery } from '@/api/mes/dv/machinery'
import type { DvRepair } from '@/api/mes/dv/repair'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { confirmRepair, createRepair, finishRepair, getRepair, submitRepair, updateRepair } from '@/api/mes/dv/repair'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesDvRepairResultEnum, MesDvRepairStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import MachineryPicker from '../../machinery/components/machinery-picker.vue'
import RepairLineList from '../components/repair-line-list.vue'

type RepairFormMode = 'create' | 'update' | 'confirm' | 'finish'

const props = defineProps<{
  id?: number | string
  mode?: RepairFormMode
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const formMode = ref<RepairFormMode>('create') // 当前表单模式
const formData = ref<DvRepair>(getDefaultFormData()) // 表单数据
const getTitle = computed(() => {
  const titles: Record<RepairFormMode, string> = {
    create: '新增维修工单',
    update: '编辑维修工单',
    confirm: '完成维修',
    finish: '验收维修工单',
  }
  return titles[formMode.value]
})
const isEditable = computed(() => formMode.value === 'create' || formMode.value === 'update')
const isConfirm = computed(() => formMode.value === 'confirm')
const isFinish = computed(() => formMode.value === 'finish')
const isHeaderReadonly = computed(() => isConfirm.value || isFinish.value)
const showFinishFields = computed(() => isConfirm.value || isFinish.value || (formData.value.status != null && formData.value.status >= MesDvRepairStatusEnum.CONFIRMED))
const showConfirmFields = computed(() => isConfirm.value || isFinish.value || (formData.value.status != null && formData.value.status >= MesDvRepairStatusEnum.APPROVING))
const showDetailFields = computed(() => isFinish.value || (formData.value.status != null && formData.value.status >= MesDvRepairStatusEnum.FINISHED))
const canSubmit = computed(() => props.id && formData.value.status === MesDvRepairStatusEnum.PREPARE && isEditable.value)
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const confirmLoading = ref(false) // 完成维修状态
const finishLoading = ref(false) // 验收状态
const codeLoading = ref(false) // 编码生成状态
const formSchema = createFormSchema({
  code: [{ required: true, message: '维修单编码不能为空' }],
  name: [{ required: true, message: '维修单名称不能为空' }],
  machineryId: [{ required: true, message: '设备不能为空' }],
  requireDate: [{ required: true, message: '报修日期不能为空' }],
  finishDate: [{ required: () => isConfirm.value, message: '维修完成日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const machineryPickerRef = ref<InstanceType<typeof MachineryPicker>>() // 设备选择器引用
const acceptedUserName = ref('') // 维修人名称
const confirmUserName = ref('') // 验收人名称
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const selectedMachineryText = computed(() => {
  return formData.value.machineryId
    ? `${formData.value.machineryCode || '-'} ${formData.value.machineryName || ''}`.trim()
    : ''
})

/** 默认表单数据 */
function getDefaultFormData(): DvRepair {
  return {
    code: '',
    name: '',
    machineryId: undefined,
    requireDate: '',
    finishDate: '',
    confirmDate: '',
    result: undefined,
    acceptedUserId: undefined,
    confirmUserId: undefined,
    status: undefined,
    remark: '',
  }
}

/** 刷新当前路由参数 */
function refreshRouteState() {
  const routeModeValue = props.mode
  if (routeModeValue === 'confirm' || routeModeValue === 'finish') {
    formMode.value = routeModeValue
    return
  }
  formMode.value = props.id ? 'update' : 'create'
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/repair/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getRepair(Number(props.id))
  formData.value = data
  acceptedUserName.value = data.acceptedUserNickname || ''
  confirmUserName.value = data.confirmUserNickname || ''
}

/** 初始化页面数据 */
async function initPage() {
  const oldId = formData.value.id
  refreshRouteState()
  if (!props.id) {
    formData.value = getDefaultFormData()
    acceptedUserName.value = ''
    confirmUserName.value = ''
    return
  }
  if (oldId !== Number(props.id) || !formData.value.id) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开日期选择 */
function openDatePicker(key: 'requireDate' | 'finishDate') {
  if ((key === 'requireDate' && isHeaderReadonly.value) || (key === 'finishDate' && !isConfirm.value)) {
    return
  }
  pickerVisible.value[key] = true
}

/** 打开设备选择器 */
function openMachineryPicker() {
  if (isHeaderReadonly.value) {
    return
  }
  machineryPickerRef.value?.open()
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

/** 生成维修单编码 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.DV_REPAIR_CODE)
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
    if (props.id) {
      await updateRepair(formData.value)
      toast.success('修改成功')
    } else {
      await createRepair(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:dv:repair:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 提交维修工单 */
async function handleSubmitRepair() {
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
      msg: '确认提交该维修工单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateRepair(formData.value)
    await submitRepair(Number(props.id))
    toast.success('提交成功')
    uni.$emit('mes:dv:repair:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 确认维修完成 */
async function handleConfirmRepair() {
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
      msg: '确认完成维修？完成后将进入待验收状态。',
    })
  } catch {
    return
  }
  confirmLoading.value = true
  try {
    await confirmRepair({
      id: Number(props.id),
      finishDate: formData.value.finishDate,
    })
    toast.success('操作成功')
    uni.$emit('mes:dv:repair:reload')
    delay(handleBack)
  } finally {
    confirmLoading.value = false
  }
}

/** 完成验收 */
async function handleFinishRepair(result: number) {
  if (!props.id || finishLoading.value) {
    return
  }
  const label = result === MesDvRepairResultEnum.PASS ? '通过' : '不通过'
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认验收${label}该维修工单？`,
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishRepair(Number(props.id), result)
    toast.success(`验收${label}`)
    uni.$emit('mes:dv:repair:reload')
    delay(handleBack)
  } finally {
    finishLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})
</script>
