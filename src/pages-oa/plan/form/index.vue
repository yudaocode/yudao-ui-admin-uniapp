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
            label="计划类型"
            label-width="180rpx"
            prop="type"
            :dict-type="DICT_TYPE.OA_PLAN_TYPE"
            placeholder="请选择计划类型"
          />
          <yd-form-picker
            v-model="formData.status"
            label="计划状态"
            label-width="180rpx"
            prop="status"
            :dict-type="DICT_TYPE.OA_PLAN_STATUS"
            placeholder="请选择计划状态"
          />
          <wd-form-item title="标题" title-width="180rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              :maxlength="50"
              placeholder="请输入标题"
            />
          </wd-form-item>
          <wd-form-item title="标签" title-width="180rpx" prop="label">
            <wd-input
              v-model="formData.label"
              clearable
              :maxlength="255"
              placeholder="请输入标签"
            />
          </wd-form-item>
          <wd-form-item title="开始时间" title-width="180rpx" prop="startTime">
            <view class="flex items-center justify-end gap-12rpx" @click="startTimeVisible = true">
              <text class="text-28rpx" :class="startTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ startTime === '' ? '请选择开始时间' : formatDateTime(startTime) }}
              </text>
              <text v-if="startTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="startTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="结束时间" title-width="180rpx" prop="endTime">
            <view class="flex items-center justify-end gap-12rpx" @click="endTimeVisible = true">
              <text class="text-28rpx" :class="endTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ endTime === '' ? '请选择结束时间' : formatDateTime(endTime) }}
              </text>
              <text v-if="endTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="endTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="计划内容" title-width="180rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              clearable
              :maxlength="1000"
              show-word-limit
              placeholder="请输入计划内容，不少于 20 个字符"
            />
          </wd-form-item>
          <wd-form-item title="计划总结" title-width="180rpx" prop="summary">
            <wd-textarea
              v-model="formData.summary"
              clearable
              :maxlength="1000"
              show-word-limit
              placeholder="请输入计划总结，不少于 20 个字符"
            />
          </wd-form-item>
          <wd-form-item v-if="formData.comment" title="计划点评" title-width="180rpx">
            <view class="whitespace-pre-wrap py-12rpx text-right text-28rpx text-[#666]">
              {{ formData.comment }}
            </view>
          </wd-form-item>
          <wd-form-item title="附件" title-width="180rpx" prop="fileUrls">
            <yd-upload-file v-model="formData.fileUrls" :limit="1" directory="oa/plan" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="startTime" v-model:visible="startTimeVisible" type="datetime" title="开始时间" />
      <wd-datetime-picker v-model="endTime" v-model:visible="endTimeVisible" type="datetime" title="结束时间" />
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Plan } from '@/api/oa/plan'
import { computed, onMounted, ref, watch } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createPlan, getPlan, updatePlan } from '@/api/oa/plan'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import { OA_PLAN_STATUS, OA_PLAN_TYPE } from '../../utils/constants'

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
const getTitle = computed(() => props.id ? '编辑计划' : '新增计划')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<Plan>>({
  id: undefined,
  type: OA_PLAN_TYPE.DAY,
  status: OA_PLAN_STATUS.UNFINISHED,
  title: '',
  label: '',
  content: '',
  summary: '',
  fileUrls: [],
}) // 表单数据
const startTime = ref<number | ''>('') // 开始时间选择器值，空字符串承接未选择
const endTime = ref<number | ''>('') // 结束时间选择器值，空字符串承接未选择
const startTimeVisible = ref(false) // 开始时间选择器显示状态
const endTimeVisible = ref(false) // 结束时间选择器显示状态
const formSchema = createFormSchema({
  type: [{ required: true, message: '计划类型不能为空' }],
  status: [{ required: true, message: '计划状态不能为空' }],
  title: [{ required: true, message: '标题不能为空' }, { max: 50 }],
  label: [{ max: 255 }],
  content: [{ required: true, message: '计划内容不能为空' }, { min: 20, message: '计划内容不能少于 20 个字符' }],
  summary: [{ min: 20, message: '计划总结不能少于 20 个字符' }],
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单组件引用
let syncingPeriod = false // 编辑加载数据期间不触发计划周期初始化

/** 按日、周、月计划初始化周期，用户仍可手动调整起止时间 */
function initPlanPeriod(type?: number) {
  const begin = new Date()
  begin.setSeconds(0, 0)
  const end = new Date(begin)
  if (type === OA_PLAN_TYPE.WEEK) {
    end.setDate(end.getDate() + 7)
  } else if (type === OA_PLAN_TYPE.MONTH) {
    end.setMonth(end.getMonth() + 1)
  } else {
    end.setDate(end.getDate() + 1)
  }
  startTime.value = begin.getTime()
  endTime.value = end.getTime()
}

/** 切换计划类型时，按日、周、月初始化计划周期 */
watch(() => formData.value.type, (type) => {
  if (!syncingPeriod) {
    initPlanPeriod(type)
  }
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/plan/index')
}

/** 加载计划详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  syncingPeriod = true
  try {
    const data = await getPlan(Number(props.id))
    formData.value = data
    startTime.value = data.startTime ? toTimestamp(data.startTime) : ''
    endTime.value = data.endTime ? toTimestamp(data.endTime) : ''
  } finally {
    syncingPeriod = false
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (startTime.value === '' || endTime.value === '') {
    toast.warning('请选择开始时间和结束时间')
    return
  }
  if (Number(startTime.value) >= Number(endTime.value)) {
    toast.warning('开始时间必须早于结束时间')
    return
  }

  formLoading.value = true
  try {
    // 时间戳由后端 Jackson 反序列化为 LocalDateTime；附件组件 limit=1 时回传字符串，提交前归一化为数组
    const fileUrls = formData.value.fileUrls as unknown as string | string[] | undefined
    const data = {
      ...formData.value,
      startTime: startTime.value,
      endTime: endTime.value,
      fileUrls: Array.isArray(fileUrls) ? fileUrls : (fileUrls ? [fileUrls] : []),
    } as unknown as Plan
    if (props.id) {
      await updatePlan(data)
      toast.success('修改成功')
    } else {
      await createPlan(data)
      toast.success('新增成功')
    }
    uni.$emit('oa:plan:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  if (!props.id) {
    // 新增时，按默认计划类型初始化周期
    initPlanPeriod(formData.value.type)
  }
})
</script>
