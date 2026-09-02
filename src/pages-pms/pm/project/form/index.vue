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
          <wd-form-item v-if="!props.id" title="项目类型" title-width="220rpx" prop="type">
            <wd-radio-group v-model="formData.type" type="button">
              <wd-radio :value="PmsProjectType.GENERAL">
                通用项目
              </wd-radio>
              <wd-radio :value="PmsProjectType.AGILE">
                敏捷开发项目
              </wd-radio>
            </wd-radio-group>
            <view class="mt-12rpx text-24rpx text-[#999]">
              {{ projectTypeTip }}
            </view>
          </wd-form-item>
          <wd-form-item title="项目名称" title-width="220rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入项目名称"
              :maxlength="31"
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
          <wd-form-item title="截止时间" title-width="220rpx" prop="endTime">
            <view class="flex items-center justify-end gap-12rpx" @click="endTimeVisible = true">
              <text class="text-28rpx" :class="endTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ endTime === '' ? '请选择截止时间' : formatDateTime(endTime) }}
              </text>
              <text v-if="endTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="endTime = ''">
                清空
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="项目描述" title-width="220rpx" prop="description">
            <wd-textarea
              v-model="formData.description"
              placeholder="请输入项目描述"
              :maxlength="500"
              show-word-limit
            />
          </wd-form-item>
          <wd-form-item title="可见范围" title-width="220rpx" prop="openStatus">
            <wd-radio-group v-model="formData.openStatus" type="button">
              <wd-radio :value="false">
                私有
              </wd-radio>
              <wd-radio :value="true">
                公开
              </wd-radio>
            </wd-radio-group>
            <view class="mt-12rpx text-24rpx text-[#999]">
              {{ formData.openStatus ? '公开：所有人可查看，只有项目成员可以编辑' : '私有：只有项目成员可以查看' }}
            </view>
          </wd-form-item>
          <UserFormPicker
            v-if="!props.id && !formData.openStatus"
            v-model="formData.memberUserIds"
            type="checkbox"
            label="项目成员"
            label-width="220rpx"
            prop="memberUserIds"
            placeholder="请选择项目成员；创建人会自动加入"
          />
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="startTime" v-model:visible="startTimeVisible" type="datetime" title="开始时间" />
      <wd-datetime-picker v-model="endTime" v-model:visible="endTimeVisible" type="datetime" title="截止时间" />
    </view>

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
import type { Project } from '@/api/pms/pm/project'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createProject, getProject, updateProject } from '@/api/pms/pm/project'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { PmsProjectLevel, PmsProjectType } from '@/pages-pms/pm/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑项目' : '新建项目')
const formLoading = ref(false) // 表单提交状态
const startTime = ref<number | ''>('') // 开始时间选择器值，空字符串承接未选择
const endTime = ref<number | ''>('') // 截止时间选择器值，空字符串承接未选择
const startTimeVisible = ref(false) // 开始时间选择器显示状态
const endTimeVisible = ref(false) // 截止时间选择器显示状态
const formData = ref<Partial<Project>>({ // 表单数据
  id: undefined,
  name: '',
  type: PmsProjectType.GENERAL,
  level: PmsProjectLevel.NORMAL,
  description: '',
  openStatus: false,
  icon: 'ep:folder', // 移动端不提供图标选择，默认文件夹图标
  memberUserIds: [],
})
const formSchema = createFormSchema({
  type: [{ required: true, message: '请选择项目类型' }],
  name: [{ required: true, message: '请输入项目名称' }],
  openStatus: [{ required: true, message: '请选择项目可见范围' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

const projectTypeTip = computed(() =>
  formData.value.type === PmsProjectType.AGILE
    ? '适合敏捷研发协作，提供需求、迭代、任务、缺陷和甘特图。'
    : '适合日常任务协作，提供项目概况、任务和甘特图。',
) // 当前项目类型说明

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-pms/pm/project/list/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const project = await getProject(Number(props.id))
  formData.value = project
  // 后端返回日期字符串，转毫秒时间戳供 picker 回显（Number('YYYY-MM-DD HH:mm:ss') 为 NaN）
  startTime.value = project.startTime ? toTimestamp(project.startTime) : ''
  endTime.value = project.endTime ? toTimestamp(project.endTime) : ''
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  // 项目时间范围校验：开始时间必须早于截止时间
  if (startTime.value && endTime.value && Number(startTime.value) >= Number(endTime.value)) {
    toast.warning('开始时间必须早于截止时间')
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
      await updateProject(data)
      toast.success('修改成功')
    } else {
      await createProject(data)
      toast.success('新增成功')
    }
    uni.$emit('pms:pm:project:reload')
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
