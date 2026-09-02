<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="迭代名称" title-width="220rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入迭代名称"
              :maxlength="100"
            />
          </wd-form-item>
          <wd-form-item title="开始时间" title-width="220rpx" prop="startTime">
            <view class="flex items-center justify-end gap-12rpx" @click="startTimeVisible = true">
              <text class="text-28rpx" :class="startTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ startTime === '' ? '请选择开始时间' : formatDateTime(startTime) }}
              </text>
              <text v-if="startTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="startTime = ''">
                清空
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="结束时间" title-width="220rpx" prop="endTime">
            <view class="flex items-center justify-end gap-12rpx" @click="endTimeVisible = true">
              <text class="text-28rpx" :class="endTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ endTime === '' ? '请选择结束时间' : formatDateTime(endTime) }}
              </text>
              <text v-if="endTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="endTime = ''">
                清空
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="迭代目标" title-width="220rpx" prop="target">
            <wd-input
              v-model="formData.target"
              clearable
              placeholder="请输入迭代目标"
              :maxlength="255"
            />
          </wd-form-item>
          <ProjectMemberFormPicker
            v-model="formData.ownerUserId"
            :project-id="Number(props.projectId)"
            label="负责人"
            prop="ownerUserId"
            clearable
          />
          <wd-form-item title="迭代描述" title-width="220rpx" prop="description">
            <wd-textarea
              v-model="formData.description"
              placeholder="请输入迭代描述"
              :maxlength="2000"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="startTime" v-model:visible="startTimeVisible" type="datetime" title="开始时间" />
      <wd-datetime-picker v-model="endTime" v-model:visible="endTimeVisible" type="datetime" title="结束时间" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Iteration } from '@/api/pms/pm/iteration'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createIteration, getIteration, updateIteration } from '@/api/pms/pm/iteration'
import ProjectMemberFormPicker from '@/pages-pms/pm/project/components/project-member-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
  projectId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑迭代' : '新建迭代')
const formLoading = ref(false) // 表单提交状态
const startTime = ref<number | ''>('') // 开始时间选择器值，空字符串承接未选择
const endTime = ref<number | ''>('') // 结束时间选择器值，空字符串承接未选择
const startTimeVisible = ref(false) // 开始时间选择器显示状态
const endTimeVisible = ref(false) // 结束时间选择器显示状态
const formData = ref<Iteration>({ // 表单数据
  id: undefined,
  projectId: Number(props.projectId),
  name: '',
})
const formSchema = createFormSchema({
  name: [{ required: true, message: '迭代名称不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const iteration = await getIteration(Number(props.id))
  formData.value = iteration
  // 后端返回日期字符串，转毫秒时间戳供 picker 回显
  startTime.value = iteration.startTime ? toTimestamp(iteration.startTime) : ''
  endTime.value = iteration.endTime ? toTimestamp(iteration.endTime) : ''
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  // 迭代周期校验：开始时间必须早于结束时间
  if (startTime.value && endTime.value && Number(startTime.value) >= Number(endTime.value)) {
    toast.warning('迭代开始时间必须早于结束时间')
    return
  }

  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      startTime: startTime.value || undefined,
      endTime: endTime.value || undefined,
    }
    if (props.id) {
      await updateIteration(data)
      toast.success('更新成功')
    } else {
      await createIteration(data)
      toast.success('创建成功')
    }
    uni.$emit('pms:pm:iteration:reload')
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
