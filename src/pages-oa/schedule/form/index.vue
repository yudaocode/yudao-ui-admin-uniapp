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
            label="日程类型"
            label-width="180rpx"
            prop="type"
            :dict-type="DICT_TYPE.OA_SCHEDULE_TYPE"
            placeholder="请选择日程类型"
          />
          <yd-form-picker
            v-model="formData.priority"
            label="优先级"
            label-width="180rpx"
            prop="priority"
            :dict-type="DICT_TYPE.OA_PRIORITY"
            placeholder="请选择优先级"
          />
          <wd-form-item title="日程标题" title-width="180rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              :maxlength="100"
              placeholder="请输入日程标题"
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
          <UserFormPicker
            v-model="formData.participantUserIds"
            label="参与人"
            label-width="180rpx"
            prop="participantUserIds"
            type="checkbox"
            placeholder="请选择参与人"
          />
          <wd-form-item title="日程提醒" title-width="180rpx" prop="remind" center>
            <wd-switch v-model="formData.remind" />
          </wd-form-item>
          <wd-form-item title="日程描述" title-width="180rpx" prop="description">
            <wd-textarea
              v-model="formData.description"
              clearable
              :maxlength="1000"
              show-word-limit
              placeholder="请输入日程描述"
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
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Schedule } from '@/api/oa/schedule'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createSchedule, getSchedule, updateSchedule } from '@/api/oa/schedule'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import { OA_PRIORITY, OA_SCHEDULE_TYPE } from '../../utils/constants'

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
const getTitle = computed(() => props.id ? '编辑日程' : '新增日程')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<Schedule>>({
  id: undefined,
  type: OA_SCHEDULE_TYPE.REMINDER,
  priority: OA_PRIORITY.NORMAL,
  title: '',
  description: '',
  remind: true,
  participantUserIds: [],
}) // 表单数据
const startTime = ref<number | ''>('') // 开始时间选择器值，空字符串承接未选择
const endTime = ref<number | ''>('') // 结束时间选择器值，空字符串承接未选择
const startTimeVisible = ref(false) // 开始时间选择器显示状态
const endTimeVisible = ref(false) // 结束时间选择器显示状态
const formSchema = createFormSchema({
  type: [{ required: true, message: '日程类型不能为空' }],
  priority: [{ required: true, message: '优先级不能为空' }],
  title: [{ required: true, message: '日程标题不能为空' }],
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/schedule/index')
}

/** 加载日程详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getSchedule(Number(props.id))
  formData.value = data
  startTime.value = data.startTime ? toTimestamp(data.startTime) : ''
  endTime.value = data.endTime ? toTimestamp(data.endTime) : ''
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
    // 时间戳由后端 Jackson 反序列化为 LocalDateTime
    const data = {
      ...formData.value,
      startTime: startTime.value,
      endTime: endTime.value,
    } as unknown as Schedule
    if (props.id) {
      await updateSchedule(data)
      toast.success('修改成功')
    } else {
      await createSchedule(data)
      toast.success('新增成功')
    }
    uni.$emit('oa:schedule:reload')
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
