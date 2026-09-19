<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-form-picker
            v-model="formData.type"
            label="汇报类型"
            label-width="180rpx"
            prop="type"
            :dict-type="DICT_TYPE.OA_WORK_REPORT_TYPE"
            placeholder="请选择汇报类型"
            @confirm="handleTypeChange"
          />
          <wd-form-item title="汇报日期" title-width="180rpx" prop="periodDate">
            <view class="flex items-center justify-end gap-12rpx" @click="periodPickerVisible = true">
              <text class="text-28rpx" :class="periodDate === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ periodDate === '' ? '请选择汇报日期' : formatDate(periodDate) }}
              </text>
              <text v-if="periodDate !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="handlePeriodClear">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="开始日期" title-width="180rpx" prop="startTime">
            <view class="flex items-center justify-end" @click="startDateVisible = true">
              <text class="text-28rpx" :class="startTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ startTime === '' ? '请选择开始日期' : formatDate(startTime) }}
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="结束日期" title-width="180rpx" prop="endTime">
            <view class="flex items-center justify-end" @click="endDateVisible = true">
              <text class="text-28rpx" :class="endTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ endTime === '' ? '请选择结束日期' : formatDate(endTime) }}
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="汇报标题" title-width="180rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              :maxlength="255"
              placeholder="留空按周期自动生成"
            />
          </wd-form-item>
          <wd-form-item title="工作总结" title-width="180rpx" prop="summary">
            <wd-textarea
              v-model="formData.summary"
              clearable
              :maxlength="5000"
              show-word-limit
              placeholder="请输入工作总结"
            />
          </wd-form-item>
          <wd-form-item title="计划说明" title-width="180rpx" prop="plan">
            <wd-textarea
              v-model="formData.plan"
              clearable
              :maxlength="5000"
              show-word-limit
              placeholder="请输入工作计划补充说明"
            />
          </wd-form-item>
          <wd-form-item title="问题协调" title-width="180rpx" prop="problem">
            <wd-textarea
              v-model="formData.problem"
              clearable
              :maxlength="5000"
              show-word-limit
              placeholder="请输入问题与协调事项"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="180rpx" prop="remark">
            <wd-input
              v-model="formData.remark"
              clearable
              :maxlength="1000"
              placeholder="请输入备注"
            />
          </wd-form-item>
          <wd-form-item title="附件" title-width="180rpx" prop="fileUrls">
            <yd-upload-file v-model="formData.fileUrls" :limit="10" :file-size="20" directory="oa/workreport" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 已完成工作项 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-28rpx text-[#333] font-semibold">已完成工作</text>
          <text class="text-26rpx text-[#1677ff]" @click="addWorkItem">+ 添加</text>
        </view>
        <view
          v-for="(item, index) in formData.workItems"
          :key="index"
          class="mb-16rpx rounded-12rpx bg-[#f7f8fa] p-20rpx"
        >
          <view class="mb-12rpx flex items-center gap-12rpx">
            <wd-input
              v-model="item.content"
              class="flex-1"
              clearable
              :maxlength="1000"
              placeholder="请输入工作内容"
            />
            <wd-icon name="delete" size="32rpx" color="#f5222d" @click="removeWorkItem(index)" />
          </view>
          <view class="flex items-center gap-12rpx">
            <text class="shrink-0 text-26rpx text-[#999]">完成进度</text>
            <wd-input-number v-model="item.progress" :min="0" :max="100" :precision="0" />
            <text class="shrink-0 text-26rpx text-[#999]">%</text>
          </view>
        </view>
        <view v-if="!formData.workItems?.length" class="text-26rpx text-[#999]">
          暂无工作项，点击右上角添加
        </view>
      </view>

      <!-- 工作计划项 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-28rpx text-[#333] font-semibold">工作计划</text>
          <text class="text-26rpx text-[#1677ff]" @click="addPlanItem">+ 添加</text>
        </view>
        <view
          v-for="(item, index) in formData.planItems"
          :key="index"
          class="mb-16rpx flex items-center gap-12rpx rounded-12rpx bg-[#f7f8fa] p-20rpx"
        >
          <wd-input
            v-model="item.content"
            class="flex-1"
            clearable
            :maxlength="1000"
            placeholder="请输入计划内容"
          />
          <wd-icon name="delete" size="32rpx" color="#f5222d" @click="removePlanItem(index)" />
        </view>
        <view v-if="!formData.planItems?.length" class="text-26rpx text-[#999]">
          暂无计划项，点击右上角添加
        </view>
      </view>

      <wd-datetime-picker
        v-model="periodDate"
        v-model:visible="periodPickerVisible"
        type="date"
        title="汇报日期"
        @confirm="handlePeriodChange"
      />
      <wd-datetime-picker v-model="startTime" v-model:visible="startDateVisible" type="date" title="开始日期" />
      <wd-datetime-picker v-model="endTime" v-model:visible="endDateVisible" type="date" title="结束日期" />
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存草稿
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { WorkReport } from '@/api/oa/workreport'
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createWorkReport, getWorkReport, updateWorkReport } from '@/api/oa/workreport'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import { OA_WORK_REPORT_TYPE } from '../../utils/constants'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑汇报' : '新增汇报')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<WorkReport>>({
  id: undefined,
  type: OA_WORK_REPORT_TYPE.DAILY,
  title: '',
  summary: '',
  plan: '',
  problem: '',
  remark: '',
  workItems: [],
  planItems: [],
  fileUrls: [],
}) // 表单数据
const periodDate = ref<number | ''>(Date.now()) // 汇报日期选择器值，周期由类型和该日期推导
const startTime = ref<number | ''>('') // 开始日期选择器值，空字符串承接未选择
const endTime = ref<number | ''>('') // 结束日期选择器值，空字符串承接未选择
const periodPickerVisible = ref(false) // 汇报日期选择器显示状态
const startDateVisible = ref(false) // 开始日期选择器显示状态
const endDateVisible = ref(false) // 结束日期选择器显示状态
const formSchema = createFormSchema({
  type: [{ required: true, message: '汇报类型不能为空' }],
  title: [{ max: 255 }],
  summary: [{ max: 5000 }],
  plan: [{ max: 5000 }],
  problem: [{ max: 5000 }],
  remark: [{ max: 1000 }],
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/workreport/index')
}

/** 按类型和汇报日期推导周期：日报当天、周报周一至周日、月报整月 */
function applyPeriod(value: number) {
  const date = dayjs(value)
  const type = formData.value.type
  if (type === OA_WORK_REPORT_TYPE.WEEKLY) {
    const weekDay = date.day() === 0 ? 7 : date.day()
    const begin = date.subtract(weekDay - 1, 'day')
    startTime.value = begin.startOf('day').valueOf()
    endTime.value = begin.add(6, 'day').endOf('day').valueOf()
    return
  }
  if (type === OA_WORK_REPORT_TYPE.MONTHLY) {
    startTime.value = date.startOf('month').valueOf()
    endTime.value = date.endOf('month').valueOf()
    return
  }
  startTime.value = date.startOf('day').valueOf()
  endTime.value = date.endOf('day').valueOf()
}

/** 汇报日期变化 */
function handlePeriodChange() {
  if (periodDate.value !== '') {
    applyPeriod(periodDate.value)
  }
}

/** 清空汇报日期 */
function handlePeriodClear() {
  periodDate.value = ''
  startTime.value = ''
  endTime.value = ''
}

/** 汇报类型变化 */
function handleTypeChange() {
  if (periodDate.value !== '') {
    applyPeriod(periodDate.value)
  }
}

/** 加载汇报详情 */
async function getDetail() {
  if (!props.id) {
    // 新增默认覆盖当天
    applyPeriod(Date.now())
    return
  }
  const data = await getWorkReport(Number(props.id))
  formData.value = data
  periodDate.value = data.startTime ? dayjs(data.startTime).valueOf() : ''
  startTime.value = data.startTime ? dayjs(data.startTime).startOf('day').valueOf() : ''
  endTime.value = data.endTime ? dayjs(data.endTime).startOf('day').valueOf() : ''
}

/** 新增已完成工作项 */
function addWorkItem() {
  if ((formData.value.workItems?.length ?? 0) >= 100) { // 后端限制最多 100 项
    toast.warning('已完成工作项最多 100 项')
    return
  }
  formData.value.workItems = [...(formData.value.workItems ?? []), { content: '', progress: 0 }]
}

/** 删除已完成工作项 */
function removeWorkItem(index: number) {
  formData.value.workItems?.splice(index, 1)
}

/** 新增工作计划项 */
function addPlanItem() {
  if ((formData.value.planItems?.length ?? 0) >= 100) { // 后端限制最多 100 项
    toast.warning('工作计划项最多 100 项')
    return
  }
  formData.value.planItems = [...(formData.value.planItems ?? []), { content: '' }]
}

/** 删除工作计划项 */
function removePlanItem(index: number) {
  formData.value.planItems?.splice(index, 1)
}

/** 提交表单：保存草稿，提交由详情页操作 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (startTime.value === '' || endTime.value === '') {
    toast.warning('请选择汇报周期')
    return
  }
  if (Number(startTime.value) > Number(endTime.value)) {
    toast.warning('开始日期不能晚于结束日期')
    return
  }
  // 忽略尚未填写内容的空白行
  const workItems = (formData.value.workItems ?? []).filter(item => item.content?.trim())
  const planItems = (formData.value.planItems ?? []).filter(item => item.content?.trim())
  if (!formData.value.summary?.trim() && !formData.value.plan?.trim() && !workItems.length && !planItems.length) {
    toast.warning('请填写工作总结、计划说明或工作明细')
    return
  }

  formLoading.value = true
  try {
    // 统一日期边界；时间戳由后端 Jackson 反序列化为 LocalDateTime
    const data = {
      ...formData.value,
      startTime: dayjs(Number(startTime.value)).startOf('day').valueOf(),
      endTime: dayjs(Number(endTime.value)).endOf('day').valueOf(),
      workItems,
      planItems,
    } as unknown as WorkReport
    if (props.id) {
      await updateWorkReport(data)
    } else {
      await createWorkReport(data)
    }
    toast.success('保存成功')
    uni.$emit('oa:work-report:reload')
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
