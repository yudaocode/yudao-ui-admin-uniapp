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
          <wd-form-item title="试用期心得" title-width="180rpx" prop="experience">
            <wd-textarea
              v-model="formData.experience"
              clearable
              :maxlength="255"
              show-word-limit
              placeholder="请输入试用期心得"
            />
          </wd-form-item>
          <wd-form-item title="岗位职责理解" title-width="180rpx" prop="understanding">
            <wd-textarea
              v-model="formData.understanding"
              clearable
              :maxlength="255"
              show-word-limit
              placeholder="请输入岗位职责理解"
            />
          </wd-form-item>
          <wd-form-item title="试用期成长" title-width="180rpx" prop="growth">
            <wd-textarea
              v-model="formData.growth"
              clearable
              :maxlength="255"
              show-word-limit
              placeholder="请输入试用期成长"
            />
          </wd-form-item>
          <wd-form-item title="目前不足" title-width="180rpx" prop="deficiency">
            <wd-textarea
              v-model="formData.deficiency"
              clearable
              :maxlength="255"
              show-word-limit
              placeholder="请输入目前不足"
            />
          </wd-form-item>
          <wd-form-item title="工作改进" title-width="180rpx" prop="improvement">
            <wd-textarea
              v-model="formData.improvement"
              clearable
              :maxlength="255"
              show-word-limit
              placeholder="请输入工作改进"
            />
          </wd-form-item>
          <wd-form-item title="产品意见建议" title-width="180rpx" prop="suggestion">
            <wd-textarea
              v-model="formData.suggestion"
              clearable
              :maxlength="255"
              show-word-limit
              placeholder="请输入产品意见建议"
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
import type { RegularApply } from '@/api/oa/regular'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createRegularApply, getRegularApply, updateRegularApply } from '@/api/oa/regular'
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
const getTitle = computed(() => props.id ? '编辑转正申请' : '新增转正申请')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<RegularApply>>({
  id: undefined,
  title: '',
  urgency: undefined,
  experience: '',
  understanding: '',
  growth: '',
  deficiency: '',
  improvement: '',
  suggestion: '',
}) // 表单数据
const startTime = ref<number | ''>('') // 开始时间选择器值，空字符串承接未选择
const endTime = ref<number | ''>('') // 结束时间选择器值，空字符串承接未选择
const startTimeVisible = ref(false) // 开始时间选择器显示状态
const endTimeVisible = ref(false) // 结束时间选择器显示状态
const formSchema = createFormSchema({ // 表单校验规则
  title: [{ required: true, message: '标题不能为空' }, { max: 255 }],
  urgency: [{ required: true, message: '紧急程度不能为空' }],
  experience: [{ required: true, message: '试用期心得不能为空' }, { max: 255 }],
  understanding: [{ required: true, message: '岗位职责理解不能为空' }, { max: 255 }],
  growth: [{ required: true, message: '试用期成长不能为空' }, { max: 255 }],
  deficiency: [{ required: true, message: '目前不足不能为空' }, { max: 255 }],
  improvement: [{ required: true, message: '工作改进不能为空' }, { max: 255 }],
  suggestion: [{ required: true, message: '产品意见建议不能为空' }, { max: 255 }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const dayCount = computed(() => // 试用天数预览，公式对齐 PC 端按毫秒向上取整
  startTime.value !== '' && endTime.value !== '' && endTime.value > startTime.value
    ? Math.ceil((endTime.value - startTime.value) / 86400000)
    : 0)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/regular/index')
}

/** 加载转正申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getRegularApply(Number(props.id))
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
    } as unknown as RegularApply
    if (props.id) {
      await updateRegularApply(data)
      toast.success('修改成功')
    } else {
      await createRegularApply(data)
      toast.success('保存成功')
    }
    uni.$emit('oa:regular:reload')
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
