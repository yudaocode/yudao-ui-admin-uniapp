<template>
  <view class="yd-page-container" :class="{ 'yd-page-container-paging': isPagingTab }">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="候选人详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 头部摘要 -->
    <view v-if="formData.id" class="bg-white px-24rpx py-24rpx">
      <view class="mb-16rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1 truncate text-36rpx text-[#333] font-semibold">
          {{ formData.name || '-' }}
        </view>
        <dict-tag
          v-if="formData.status != null"
          :type="DICT_TYPE.HRM_RECRUIT_CANDIDATE_STATUS"
          :value="formData.status"
        />
      </view>
      <view class="mb-8rpx text-26rpx text-[#999]">
        编号：{{ formData.id }}
      </view>
      <view class="text-26rpx text-[#666]">
        {{ formData.postName || '-' }} · {{ formData.deptName || '-' }}
      </view>
      <view class="mt-8rpx text-26rpx text-[#666]">
        负责人：{{ formData.ownerEmployeeName || '-' }} · 渠道：{{ formData.channelName || '-' }}
      </view>
      <view v-if="formData.interviewTime" class="mt-8rpx text-26rpx text-[#666]">
        面试时间：{{ formatDateTime(formData.interviewTime) }}
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
      <wd-cell-group border title="候选人信息">
        <wd-cell title="姓名" :value="formData.name || '-'" />
        <wd-cell title="手机号码" :value="formData.mobile || '-'" />
        <wd-cell title="性别">
          <dict-tag v-if="formData.sex != null" :type="DICT_TYPE.SYSTEM_USER_SEX" :value="formData.sex" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="年龄" :value="formData.age != null ? String(formData.age) : '-'" />
        <wd-cell title="邮箱" :value="formData.email || '-'" />
        <wd-cell title="工作年限" :value="formData.workTime != null ? `${formData.workTime} 年` : '-'" />
        <wd-cell title="学历">
          <dict-tag
            v-if="formData.education != null"
            :type="DICT_TYPE.HRM_RECRUIT_CANDIDATE_EDUCATION"
            :value="formData.education"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="毕业院校" :value="formData.graduateSchool || '-'" />
        <wd-cell title="最近工作单位" :value="formData.latestWorkPlace || '-'" />
        <wd-cell title="备注" :value="formData.remark || '-'" />
      </wd-cell-group>
      <wd-cell-group border title="招聘信息">
        <wd-cell title="应聘职位" :value="formData.postName || '-'" />
        <wd-cell title="用人部门" :value="formData.deptName || '-'" />
        <wd-cell title="招聘负责人" :value="formData.ownerEmployeeName || '-'" />
        <wd-cell title="招聘渠道" :value="formData.channelName || '-'" />
        <wd-cell title="候选人状态">
          <dict-tag
            v-if="formData.status != null"
            :type="DICT_TYPE.HRM_RECRUIT_CANDIDATE_STATUS"
            :value="formData.status"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="面试轮次" :value="formData.stageNumber != null ? String(formData.stageNumber) : '-'" />
        <wd-cell title="状态更新时间" :value="formatDateTime(formData.statusUpdateTime) || '-'" />
        <wd-cell title="入职时间" :value="formatDateTime(formData.entryTime) || '-'" />
        <wd-cell title="淘汰原因" :value="formData.eliminate || '-'" />
        <wd-cell title="创建人" :value="formData.creatorName || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 材料附件 -->
    <view v-else-if="activeTab === 'materials'" class="p-24rpx pb-160rpx">
      <view v-if="!(formData.resumeUrls || []).length" class="py-80rpx text-center text-28rpx text-[#999]">
        暂无简历附件
      </view>
      <view
        v-for="(url, index) in formData.resumeUrls || []"
        :key="`${url}-${index}`"
        class="mb-24rpx flex items-center justify-between rounded-12rpx bg-white p-24rpx shadow-sm"
        @click="openAttachment(url)"
      >
        <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">
          {{ getFileNameFromUrl(url) || `简历附件 ${index + 1}` }}
        </text>
        <text class="ml-16rpx shrink-0 text-28rpx text-[#1677ff]">
          查看
        </text>
      </view>
    </view>

    <!-- 面试记录 -->
    <view v-else-if="activeTab === 'interviews'" class="p-24rpx pb-160rpx">
      <view v-if="!interviewList.length" class="py-80rpx text-center text-28rpx text-[#999]">
        暂无面试记录
      </view>
      <view
        v-for="item in interviewList"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-12rpx flex items-center justify-between gap-16rpx">
          <text class="text-30rpx text-[#333] font-semibold">
            第 {{ item.stageNumber ?? '-' }} 轮
          </text>
          <dict-tag
            v-if="item.result != null"
            :type="DICT_TYPE.HRM_RECRUIT_INTERVIEW_RESULT"
            :value="item.result"
          />
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          方式：
          <dict-tag
            v-if="item.type != null"
            :type="DICT_TYPE.HRM_RECRUIT_INTERVIEW_TYPE"
            :value="item.type"
          />
          <text v-else>-</text>
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          主面试官：{{ item.interviewEmployeeName || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          其他面试官：{{ item.otherInterviewEmployeeNames?.join('、') || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          时间：{{ formatDateTime(item.interviewTime) || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          地址：{{ item.address || '-' }}
        </view>
        <view v-if="item.evaluate" class="mb-8rpx text-26rpx text-[#666]">
          评价：{{ item.evaluate }}
        </view>
        <view v-if="item.cancelReason" class="mb-8rpx text-26rpx text-[#666]">
          取消原因：{{ item.cancelReason }}
        </view>
        <view v-if="item.remark" class="text-26rpx text-[#666]">
          备注：{{ item.remark }}
        </view>
      </view>
    </view>

    <!-- 操作日志 -->
    <OperateLogList
      v-else-if="activeTab === 'log' && props.id"
      class="min-h-0 flex-1"
      :biz-id="Number(props.id)"
      :biz-type="HrmBizType.RECRUIT_CANDIDATE"
    />

    <!-- 底部操作 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['hrm:recruit:candidate:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="canDelete"
          class="flex-1"
          type="danger"
          :loading="deleting"
          @click="handleDelete"
        >
          删除
        </wd-button>
        <wd-button
          v-if="moreActions.length"
          class="flex-1"
          type="info"
          @click="moreActionVisible = true"
        >
          更多
        </wd-button>
      </view>
    </view>

    <!-- 业务操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />

    <!-- 业务表单 -->
    <EliminateForm ref="eliminateFormRef" @success="handleActionSuccess" />
    <InterviewForm ref="interviewFormRef" @success="handleActionSuccess" />
    <InterviewResultForm ref="interviewResultFormRef" @success="handleActionSuccess" />
  </view>
</template>

<script lang="ts" setup>
import type { RecruitCandidate } from '@/api/hrm/recruit/candidate'
import type { RecruitInterview } from '@/api/hrm/recruit/interview'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import {
  deleteRecruitCandidate,
  getRecruitCandidate,
  updateRecruitCandidateStatus,
} from '@/api/hrm/recruit/candidate'
import {
  getRecruitInterview,
  getRecruitInterviewListByCandidate,
} from '@/api/hrm/recruit/interview'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { getFileNameFromUrl, openAttachment } from '@/utils/download'
import {
  HrmBizType,
  HrmRecruitCandidateStatus,
  HrmRecruitInterviewResult,
} from '@/pages-hrm/utils/constants'
import EliminateForm from '../components/eliminate-form.vue'
import InterviewForm from '../components/interview-form.vue'
import InterviewResultForm from '../components/interview-result-form.vue'
import OperateLogList from '../components/operate-log-list.vue'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabs = [ // tab 配置
  { key: 'basic', title: '详细资料' },
  { key: 'materials', title: '材料附件' },
  { key: 'interviews', title: '面试记录' },
  { key: 'log', title: '操作日志' },
]

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<RecruitCandidate>({
  name: '',
  mobile: '',
  resumeUrls: [],
}) // 详情数据
const interviewList = ref<RecruitInterview[]>([]) // 面试记录
const tabIndex = ref(0) // 当前详情分类下标
const deleting = ref(false) // 删除状态
const moreActionVisible = ref(false) // 更多操作菜单
const eliminateFormRef = ref<InstanceType<typeof EliminateForm>>() // 淘汰表单
const interviewFormRef = ref<InstanceType<typeof InterviewForm>>() // 面试表单
const interviewResultFormRef = ref<InstanceType<typeof InterviewResultForm>>() // 面试结果

const activeTab = computed(() => tabs[tabIndex.value].key)
const isPagingTab = computed(() => activeTab.value === 'log')
const candidateDeleteStatuses: number[] = [ // 可删除状态
  HrmRecruitCandidateStatus.NEW,
  HrmRecruitCandidateStatus.PRIMARY_PASS,
  HrmRecruitCandidateStatus.INTERVIEW,
  HrmRecruitCandidateStatus.INTERVIEW_PASS,
  HrmRecruitCandidateStatus.ELIMINATED,
]
const canDelete = computed(() =>
  hasAccessByCodes(['hrm:recruit:candidate:delete'])
  && !formData.value.employeeId
  && formData.value.status != null
  && candidateDeleteStatuses.includes(formData.value.status),
)

const moreActions = computed(() => {
  const candidate = formData.value
  if (!candidate?.id) {
    return []
  }
  const actions: { name: string, value: string }[] = []
  if (
    hasAccessByCodes(['hrm:recruit:interview:update'])
    && candidate.status === HrmRecruitCandidateStatus.INTERVIEW
    && candidate.interviewId
    && candidate.interviewResult === HrmRecruitInterviewResult.CANCELED
  ) {
    actions.push({ name: '重新安排', value: 'interview-change' })
  }
  if (
    hasAccessByCodes(['hrm:recruit:interview:update'])
    && candidate.status === HrmRecruitCandidateStatus.INTERVIEW
    && candidate.interviewId
    && candidate.interviewResult !== HrmRecruitInterviewResult.CANCELED
  ) {
    actions.push({ name: '登记结果', value: 'interview-result' })
    actions.push({ name: '更改面试安排', value: 'interview-change' })
    actions.push({ name: '取消面试', value: 'interview-cancel' })
  }
  if (
    hasAccessByCodes(['hrm:recruit:interview:create'])
    && (candidate.status === HrmRecruitCandidateStatus.NEW
      || candidate.status === HrmRecruitCandidateStatus.PRIMARY_PASS
      || candidate.status === HrmRecruitCandidateStatus.INTERVIEW_PASS)
  ) {
    actions.push({ name: '安排面试', value: 'interview' })
  }
  if (
    hasAccessByCodes(['hrm:recruit:interview:create'])
    && candidate.status === HrmRecruitCandidateStatus.INTERVIEW_PASS
  ) {
    actions.push({ name: '安排复试', value: 'reinterview' })
  }
  if (hasAccessByCodes(['hrm:recruit:candidate:update'])) {
    if (candidate.status === HrmRecruitCandidateStatus.NEW) {
      actions.push({ name: '初选通过', value: 'primary-pass' })
    }
    if (candidate.status === HrmRecruitCandidateStatus.INTERVIEW_PASS) {
      actions.push({ name: '发 Offer', value: 'offer' })
    }
    if (candidate.status === HrmRecruitCandidateStatus.ELIMINATED) {
      actions.push({ name: '恢复为新候选人', value: 'restore' })
    }
    if (
      candidate.status !== HrmRecruitCandidateStatus.ELIMINATED
      && candidate.status !== HrmRecruitCandidateStatus.JOINED
    ) {
      actions.push({ name: '淘汰', value: 'eliminate' })
    }
    if (
      (candidate.status === HrmRecruitCandidateStatus.INTERVIEW_PASS
        || candidate.status === HrmRecruitCandidateStatus.OFFER_SENT)
      && !candidate.employeeId
    ) {
      actions.push({ name: '转为员工', value: 'convert-employee' })
    }
  }
  if (
    hasAccessByCodes(['hrm:employee:update'])
    && candidate.status === HrmRecruitCandidateStatus.PENDING_ENTRY
    && candidate.employeeId
  ) {
    actions.push({ name: '确认入职', value: 'confirm-entry' })
  }
  return actions
})

const hasFooter = computed(() =>
  activeTab.value === 'basic'
  && (hasAccessByCodes(['hrm:recruit:candidate:update'])
    || canDelete.value
    || moreActions.value.length > 0),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/recruit/candidate/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getRecruitCandidate(Number(props.id))
  await Promise.all([getInterviewList()])
}

/** 加载面试记录 */
async function getInterviewList() {
  if (!props.id) {
    return
  }
  interviewList.value = await getRecruitInterviewListByCandidate(Number(props.id))
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-hrm/recruit/candidate/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定删除该候选人吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteRecruitCandidate(Number(props.id))
    toast.success('删除成功')
    uni.$emit('hrm:recruit:candidate:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 更多操作 */
async function handleMoreAction({ item }: { item: { value: string } }) {
  const candidate = formData.value
  if (item.value === 'interview' && candidate.id) {
    interviewFormRef.value?.open('create', candidate.id)
    return
  }
  if (item.value === 'reinterview' && candidate.id) {
    interviewFormRef.value?.open('create', candidate.id, undefined, '安排复试')
    return
  }
  if (item.value === 'interview-result') {
    if (!candidate.interviewId) {
      toast.warning('请先安排面试')
      return
    }
    const interview = await getRecruitInterview(candidate.interviewId)
    interviewResultFormRef.value?.open(interview)
    return
  }
  if (item.value === 'interview-change') {
    if (!candidate.id || !candidate.interviewId) {
      return
    }
    const interview = await getRecruitInterview(candidate.interviewId)
    interviewFormRef.value?.open('update', candidate.id, interview)
    return
  }
  if (item.value === 'interview-cancel') {
    if (!candidate.interviewId) {
      return
    }
    const interview = await getRecruitInterview(candidate.interviewId)
    interviewResultFormRef.value?.open(interview, HrmRecruitInterviewResult.CANCELED)
    return
  }
  if (item.value === 'primary-pass') {
    await handleStatus(HrmRecruitCandidateStatus.PRIMARY_PASS)
    return
  }
  if (item.value === 'offer') {
    await handleStatus(HrmRecruitCandidateStatus.OFFER_SENT)
    return
  }
  if (item.value === 'restore') {
    await handleStatus(HrmRecruitCandidateStatus.NEW)
    return
  }
  if (item.value === 'eliminate' && candidate.id) {
    eliminateFormRef.value?.open(candidate.id, candidate.name)
    return
  }
  if (item.value === 'convert-employee' || item.value === 'confirm-entry') {
    toast.show('员工档案表单尚未迁移，请使用 PC 端完成')
  }
}

/** 修改候选人状态 */
async function handleStatus(status: number) {
  if (!formData.value.id) {
    return
  }
  await updateRecruitCandidateStatus({ id: formData.value.id, status })
  toast.success('更新成功')
  await handleActionSuccess()
}

/** 业务操作成功 */
async function handleActionSuccess() {
  uni.$emit('hrm:recruit:candidate:reload')
  await getDetail()
}

/** 初始化 / 返回刷新 */
onShow(() => {
  getDetail()
})
</script>
