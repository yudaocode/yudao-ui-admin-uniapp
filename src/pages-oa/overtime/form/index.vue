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
          <wd-form-item title="标题" title-width="180rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              :maxlength="255"
              placeholder="请输入标题"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.urgency"
            label="紧急程度"
            label-width="180rpx"
            prop="urgency"
            :dict-type="DICT_TYPE.OA_APPLY_URGENCY"
            placeholder="请选择紧急程度"
          />
          <yd-form-picker
            v-model="formData.type"
            label="加班类型"
            label-width="180rpx"
            prop="type"
            :dict-type="DICT_TYPE.OA_OVERTIME_TYPE"
            placeholder="请选择加班类型"
          />
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
          <wd-form-item v-if="dayCount > 0" title="天数" title-width="180rpx">
            <text class="text-28rpx text-[#333]">{{ dayCount }} 天</text>
          </wd-form-item>
          <wd-form-item title="申请原因" title-width="180rpx" prop="reason">
            <wd-textarea
              v-model="formData.reason"
              clearable
              :maxlength="5000"
              show-word-limit
              placeholder="请输入申请原因"
            />
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
        保存草稿
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { OvertimeApply } from '@/api/oa/overtime'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createOvertimeApply, getOvertimeApply, updateOvertimeApply } from '@/api/oa/overtime'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

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
const getTitle = computed(() => props.id ? '编辑加班申请' : '新增加班申请')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<OvertimeApply>>({
  id: undefined,
  title: '',
  urgency: undefined,
  type: undefined,
  reason: '',
}) // 表单数据
const startTime = ref<number | ''>('') // 开始时间选择器值，空字符串承接未选择
const endTime = ref<number | ''>('') // 结束时间选择器值，空字符串承接未选择
const startTimeVisible = ref(false) // 开始时间选择器显示状态
const endTimeVisible = ref(false) // 结束时间选择器显示状态
const formSchema = createFormSchema({ // 表单校验规则
  title: [{ required: true, message: '标题不能为空' }, { max: 255 }],
  urgency: [{ required: true, message: '紧急程度不能为空' }],
  type: [{ required: true, message: '加班类型不能为空' }],
  reason: [{ required: true, message: '申请原因不能为空' }, { max: 5000 }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const dayCount = computed(() => { // 加班天数预览，保留一位小数，公式对齐 PC 端
  if (startTime.value === '' || endTime.value === '' || endTime.value <= startTime.value) {
    return 0
  }
  return Math.round((endTime.value - startTime.value) / (24 * 60 * 60 * 100)) / 10
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/overtime/index')
}

/** 加载加班申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getOvertimeApply(Number(props.id))
  formData.value = data
  startTime.value = data.startTime ? toTimestamp(data.startTime) : ''
  endTime.value = data.endTime ? toTimestamp(data.endTime) : ''
}

/** 提交表单：保存为草稿，提交审批在详情页操作 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (startTime.value === '' || endTime.value === '') {
    toast.warning('请选择开始时间和结束时间')
    return
  }
  if (Number(startTime.value) > Number(endTime.value)) {
    toast.warning('开始时间不能晚于结束时间')
    return
  }

  formLoading.value = true
  try {
    // 时间戳由后端 Jackson 反序列化为 LocalDateTime
    const data = {
      ...formData.value,
      startTime: startTime.value,
      endTime: endTime.value,
    } as unknown as OvertimeApply
    if (props.id) {
      await updateOvertimeApply(data)
      toast.success('修改成功')
    } else {
      await createOvertimeApply(data)
      toast.success('保存成功')
    }
    uni.$emit('oa:overtime:reload')
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
