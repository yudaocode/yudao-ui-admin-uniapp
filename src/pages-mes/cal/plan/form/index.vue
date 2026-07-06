<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="计划编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="计划名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入计划名称" clearable />
          </wd-form-item>
          <yd-form-picker v-model="formData.calendarType" label="班组类型" label-width="220rpx" prop="calendarType" :dict-type="DICT_TYPE.MES_CAL_CALENDAR_TYPE" placeholder="请选择班组类型" />
          <wd-form-item title="开始日期" title-width="220rpx" prop="startDate" is-link :value="formData.startDate || ''" placeholder="请选择开始日期" @click="dateVisible.startDate = true" />
          <wd-datetime-picker v-model="formData.startDate" v-model:visible="dateVisible.startDate" title="请选择开始日期" type="date" />
          <wd-form-item title="结束日期" title-width="220rpx" prop="endDate" is-link :value="formData.endDate || ''" placeholder="请选择结束日期" @click="dateVisible.endDate = true" />
          <wd-datetime-picker v-model="formData.endDate" v-model:visible="dateVisible.endDate" title="请选择结束日期" type="date" />
          <yd-form-picker v-model="formData.shiftType" label="轮班方式" label-width="220rpx" prop="shiftType" :dict-type="DICT_TYPE.MES_CAL_SHIFT_TYPE" placeholder="请选择轮班方式" />
          <yd-form-picker v-if="showShiftMethod" v-model="formData.shiftMethod" label="倒班方式" label-width="220rpx" prop="shiftMethod" :dict-type="DICT_TYPE.MES_CAL_SHIFT_METHOD" placeholder="请选择倒班方式" />
          <wd-form-item v-if="formData.shiftMethod === MesCalShiftMethodEnum.DAY" title="倒班天数" title-width="220rpx" prop="shiftCount" center>
            <wd-input-number v-model="formData.shiftCount" allow-null :min="1" :precision="0" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <view v-if="props.id" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#8a5a00]">
        新增排班计划会自动生成默认班次。确认计划前，请检查班次和班组数量；确认后不可再编辑。
      </view>
      <PlanShiftList v-if="props.id" :plan-id="Number(props.id)" :editable="isPrepare" />
      <PlanTeamList v-if="props.id" :plan-id="Number(props.id)" :editable="isPrepare" />
      <view v-else class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#8a5a00]">
        保存排班计划后，可继续维护班次和班组。
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="props.id && isPrepare" class="flex-1" type="warning" :loading="confirmLoading" @click="handleConfirm">
          确认计划
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { CalPlan } from '@/api/mes/cal/plan'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { computed, onMounted, reactive, ref } from 'vue'
import { confirmPlan, createPlan, getPlan, updatePlan } from '@/api/mes/cal/plan'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesCalPlanStatusEnum, MesCalShiftMethodEnum, MesCalShiftTypeEnum } from '@/utils/constants'
import { formatDate, formatDateOnly, formatDateStartTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import PlanShiftList from '../components/plan-shift-list.vue'
import PlanTeamList from '../components/plan-team-list.vue'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const getTitle = computed(() => props.id ? '编辑排班计划' : '新增排班计划')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const confirmLoading = ref(false) // 确认状态
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<CalPlan>(getDefaultFormData()) // 表单数据
const dateVisible = reactive({
  startDate: false,
  endDate: false,
}) // 日期弹层
const formSchema = createFormSchema({
  code: [{ required: true, message: '计划编码不能为空' }],
  name: [{ required: true, message: '计划名称不能为空' }],
  calendarType: [{ required: true, message: '班组类型不能为空' }],
  startDate: [{ required: true, message: '开始日期不能为空' }],
  endDate: [{ required: true, message: '结束日期不能为空' }],
  shiftType: [{ required: true, message: '轮班方式不能为空' }],
})
const isPrepare = computed(() => formData.value.status === MesCalPlanStatusEnum.PREPARE)
const showShiftMethod = computed(() => !!formData.value.shiftType && formData.value.shiftType !== MesCalShiftTypeEnum.SINGLE)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/cal/plan/index')
}

/** 日期转接口日期时间 */
function toDateTime(day?: number | string | Date) {
  return formatDateStartTime(day)
}

/** 日期转表单日期 */
function toFormDate(day?: string | Date) {
  return formatDateOnly(day)
}

/** 默认表单数据 */
function getDefaultFormData(): CalPlan {
  return {
    code: '',
    name: '',
    calendarType: undefined,
    startDate: formatDate(Date.now()),
    endDate: formatDate(dayjs().add(6, 'day')),
    shiftType: undefined,
    shiftMethod: undefined,
    shiftCount: undefined,
    status: MesCalPlanStatusEnum.PREPARE,
    remark: '',
  }
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    formData.value = getDefaultFormData()
    return
  }
  const detail = await getPlan(Number(props.id))
  formData.value = {
    ...detail,
    startDate: toFormDate(detail.startDate),
    endDate: toFormDate(detail.endDate),
  }
}

/** 生成排班计划编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.CAL_PLAN_CODE)
    toast.success('生成成功')
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
    const shiftMethod = showShiftMethod.value ? formData.value.shiftMethod : undefined
    const data: CalPlan = {
      ...formData.value,
      startDate: toDateTime(formData.value.startDate),
      endDate: toDateTime(formData.value.endDate),
      shiftMethod,
      shiftCount: shiftMethod === MesCalShiftMethodEnum.DAY ? formData.value.shiftCount : undefined,
    }
    if (props.id) {
      await updatePlan(data)
      toast.success('修改成功')
    } else {
      await createPlan(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:cal:plan:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 确认计划 */
async function handleConfirm() {
  if (!props.id) {
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  try {
    await dialog.confirm({
      title: '确认计划',
      msg: '确认前会先保存当前计划，确认后将生成班组排班记录且不可再修改。确定继续吗？',
    })
  } catch {
    return
  }
  confirmLoading.value = true
  try {
    const shiftMethod = showShiftMethod.value ? formData.value.shiftMethod : undefined
    await updatePlan({
      ...formData.value,
      startDate: toDateTime(formData.value.startDate),
      endDate: toDateTime(formData.value.endDate),
      shiftMethod,
      shiftCount: shiftMethod === MesCalShiftMethodEnum.DAY ? formData.value.shiftCount : undefined,
    })
    await confirmPlan(Number(props.id))
    toast.success('确认成功')
    uni.$emit('mes:cal:plan:reload')
    delay(handleBack)
  } finally {
    confirmLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
