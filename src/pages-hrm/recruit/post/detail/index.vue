<template>
  <view class="yd-page-container" :class="{ 'yd-page-container-paging': activeTab === 'log' }">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="招聘职位详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 头部摘要 -->
    <view v-if="formData.id" class="bg-white px-24rpx py-24rpx">
      <view class="mb-16rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1 truncate text-36rpx text-[#333] font-semibold">
          {{ formData.postName || '-' }}
        </view>
        <dict-tag
          v-if="formData.status != null"
          :type="DICT_TYPE.HRM_RECRUIT_POST_STATUS"
          :value="formData.status"
        />
      </view>
      <view class="mb-8rpx text-26rpx text-[#999]">
        职位编号：{{ formData.id }}
      </view>
      <view class="text-26rpx text-[#666]">
        {{ formData.deptName || '-' }} · {{ formData.areaName || '-' }}
      </view>
      <view class="mt-8rpx text-26rpx text-[#666]">
        负责人：{{ formData.ownerEmployeeName || '-' }} · 进度：{{ formatRecruitPostProgress(formData) }}
      </view>
    </view>

    <!-- 详情分类 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 详细资料 -->
    <view v-if="activeTab === 'basic'" class="pb-160rpx">
      <wd-cell-group border title="基本信息">
        <wd-cell title="职位名称" :value="formData.postName || '-'" />
        <wd-cell title="用人部门" :value="formData.deptName || '-'" />
        <wd-cell title="工作性质">
          <dict-tag
            v-if="formData.jobNature != null"
            :type="DICT_TYPE.HRM_RECRUIT_JOB_NATURE"
            :value="formData.jobNature"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="工作城市" :value="formData.areaName || '-'" />
        <wd-cell title="招聘人数" :value="formData.recruitNum != null ? String(formData.recruitNum) : '-'" />
        <wd-cell title="已入职人数" :value="String(formData.hasEntryNum ?? 0)" />
        <wd-cell title="招聘进度" :value="formatRecruitPostProgress(formData)" />
        <wd-cell title="招聘原因" :value="formData.reason || '-'" />
        <wd-cell title="工作经验">
          <dict-tag
            v-if="formData.workTime != null"
            :type="DICT_TYPE.HRM_RECRUIT_WORK_TIME"
            :value="formData.workTime"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="学历要求">
          <dict-tag
            v-if="formData.educationRequire != null"
            :type="DICT_TYPE.HRM_RECRUIT_POST_EDUCATION"
            :value="formData.educationRequire"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="薪资范围" :value="formatRecruitPostSalary(formData)" />
        <wd-cell title="年龄要求" :value="formatRecruitPostAge(formData)" />
        <wd-cell title="最迟到岗时间" :value="formatDateTime(formData.latestEntryTime) || '-'" />
        <wd-cell title="紧急程度">
          <dict-tag
            v-if="formData.emergencyLevel != null"
            :type="DICT_TYPE.HRM_RECRUIT_EMERGENCY_LEVEL"
            :value="formData.emergencyLevel"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="招聘负责人" :value="formData.ownerEmployeeName || '-'" />
        <wd-cell title="职位类型" :value="formData.postTypeName || '-'" />
        <wd-cell title="面试官" :value="formData.interviewEmployeeNames?.join('、') || '-'" />
        <wd-cell title="状态">
          <dict-tag
            v-if="formData.status != null"
            :type="DICT_TYPE.HRM_RECRUIT_POST_STATUS"
            :value="formData.status"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell
          v-if="formData.status === HrmRecruitPostStatus.STOPPED"
          title="停止原因"
          :value="formData.stopReason || '-'"
        />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>
      <wd-cell-group border title="职位描述">
        <view class="whitespace-pre-wrap break-words px-24rpx py-24rpx text-28rpx text-[#333]">
          {{ formData.description || '-' }}
        </view>
      </wd-cell-group>
    </view>

    <!-- 操作日志 -->
    <OperateLogList
      v-else-if="activeTab === 'log' && props.id"
      class="min-h-0 flex-1"
      :biz-id="Number(props.id)"
      :biz-type="HrmBizType.RECRUIT_POST"
    />

    <!-- 底部操作 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['hrm:recruit:post:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['hrm:recruit:post:update']) && isRecruiting"
          class="flex-1"
          type="warning"
          plain
          @click="handleStop"
        >
          停止招聘
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['hrm:recruit:post:update']) && !isRecruiting"
          class="flex-1"
          type="success"
          :loading="statusLoading"
          @click="handleRestart"
        >
          重新招聘
        </wd-button>
      </view>
    </view>

    <!-- 停止招聘表单 -->
    <StatusForm ref="statusFormRef" @success="handleStatusSuccess" />
  </view>
</template>

<script lang="ts" setup>
import type { RecruitPost } from '@/api/hrm/recruit/post'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  getRecruitPost,
  updateRecruitPostStatus,
} from '@/api/hrm/recruit/post'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import {
  HrmBizType,
  HrmRecruitPostStatus,
} from '@/pages-hrm/utils/constants'
import {
  formatRecruitPostAge,
  formatRecruitPostProgress,
  formatRecruitPostSalary,
} from '@/pages-hrm/utils/format'
import OperateLogList from '../components/operate-log-list.vue'
import StatusForm from '../components/status-form.vue'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<RecruitPost>({
  postName: '',
}) // 详情数据
const tabIndex = ref(0) // 当前 tab 下标
const statusLoading = ref(false) // 重新招聘提交状态
const statusFormRef = ref<InstanceType<typeof StatusForm>>() // 停止招聘表单
const tabs = [ // tab 配置
  { key: 'basic', title: '详细资料' },
  { key: 'log', title: '操作日志' },
]

const activeTab = computed(() => tabs[tabIndex.value]?.key || 'basic')
const isRecruiting = computed(() => formData.value.status === HrmRecruitPostStatus.RECRUITING)
const hasFooter = computed(() => hasAccessByCodes(['hrm:recruit:post:update'])) // 底部操作区

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/recruit/post/index')
}

/** 加载招聘职位详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getRecruitPost(Number(props.id))
}

/** 编辑招聘职位 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-hrm/recruit/post/form/index?id=${props.id}`,
  })
}

/** 停止招聘 */
function handleStop() {
  if (!props.id) {
    return
  }
  statusFormRef.value?.open(Number(props.id), formData.value.postName)
}

/** 状态变更成功 */
async function handleStatusSuccess() {
  uni.$emit('hrm:recruit:post:reload')
  await getDetail()
}

/** 重新招聘 */
async function handleRestart() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认重新招聘「${formData.value.postName}」吗？`,
    })
  } catch {
    return
  }
  statusLoading.value = true
  try {
    await updateRecruitPostStatus({
      id: Number(props.id),
      status: HrmRecruitPostStatus.RECRUITING,
    })
    toast.success('重新招聘成功')
    await handleStatusSuccess()
  } finally {
    statusLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:recruit:post:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:recruit:post:reload', getDetail)
})
</script>
