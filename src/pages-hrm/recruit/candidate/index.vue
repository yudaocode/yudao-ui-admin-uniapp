<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="候选人"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    >
      <template #right>
        <view
          v-if="hasAccessByCodes(['hrm:recruit:candidate:delete'])"
          class="px-8rpx text-28rpx text-[#1677ff]"
          @click="cleanFormRef?.open()"
        >
          清理
        </view>
      </template>
    </wd-navbar>

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 候选人状态 tab -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" @change="handleTabChange">
        <wd-tab
          v-for="tab in statusTabs"
          :key="tab.value"
          :title="`${tab.label}(${tab.count})`"
        />
      </wd-tabs>
    </view>

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无候选人数据"
      @query="queryList"
    >
      <view class="p-24rpx" :class="showBatchBar ? 'pb-160rpx' : ''">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-start gap-16rpx">
            <view
              v-if="canSelect"
              class="mt-4rpx shrink-0"
              @click.stop="toggleSelect(item)"
            >
              <wd-checkbox :model-value="isSelected(item.id)" />
            </view>
            <view class="min-w-0 flex-1" @click.stop="handleDetail(item)">
              <view class="mb-12rpx flex items-start justify-between gap-16rpx">
                <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                  {{ item.name || '-' }}
                </view>
                <dict-tag
                  v-if="item.status != null"
                  :type="DICT_TYPE.HRM_RECRUIT_CANDIDATE_STATUS"
                  :value="item.status"
                />
              </view>
              <view
                v-if="item.status === HrmRecruitCandidateStatus.INTERVIEW && item.interviewResult && item.interviewResult !== HrmRecruitInterviewResult.UNFINISHED"
                class="mb-12rpx text-24rpx text-[#999]"
              >
                面试{{ getDictLabel(DICT_TYPE.HRM_RECRUIT_INTERVIEW_RESULT, item.interviewResult) }}
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">职位：</text>{{ item.postName || '-' }}
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">部门：</text>{{ item.deptName || '-' }}
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">手机：</text>{{ item.mobile || '-' }}
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">负责人：</text>{{ item.ownerEmployeeName || '-' }}
              </view>
              <view class="text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">渠道：</text>{{ item.channelName || '-' }}
              </view>
            </view>
          </view>
          <view
            v-if="getPrimaryAction(item)"
            class="mt-16rpx border-t border-[#f0f0f0] pt-16rpx"
            @click.stop="handlePrimaryAction(getPrimaryAction(item)!.command, item)"
          >
            <text class="text-28rpx text-[#1677ff]">
              {{ getPrimaryAction(item)!.label }}
            </text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 批量操作栏 -->
    <view v-if="showBatchBar" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" variant="plain" @click="selectedIds = []">
          已选 {{ selectedIds.length }}
        </wd-button>
        <wd-button
          class="flex-1"
          type="primary"
          :disabled="!selectedIds.length || !batchActions.length"
          @click="batchActionVisible = true"
        >
          批量操作
        </wd-button>
      </view>
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['hrm:recruit:candidate:create']) && !showBatchBar"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />

    <!-- 批量操作菜单 -->
    <wd-action-sheet
      v-model="batchActionVisible"
      :actions="batchActions"
      @select="handleBatchAction"
    />

    <!-- 批量表单 -->
    <StatusListForm ref="statusListFormRef" @success="handleBatchSuccess" />
    <PostListForm ref="postListFormRef" @success="handleBatchSuccess" />
    <ChannelListForm ref="channelListFormRef" @success="handleBatchSuccess" />
    <EliminateForm ref="eliminateFormRef" @success="handleBatchSuccess" />
    <InterviewForm ref="interviewFormRef" @success="handleBatchSuccess" />
    <InterviewResultForm ref="interviewResultFormRef" @success="reload" />
    <CleanForm ref="cleanFormRef" @success="reload" />
  </view>
</template>

<script lang="ts" setup>
import type { RecruitCandidate } from '@/api/hrm/recruit/candidate'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  deleteRecruitCandidate,
  getRecruitCandidatePage,
  getRecruitCandidateStatusCount,
} from '@/api/hrm/recruit/candidate'
import { getRecruitInterview } from '@/api/hrm/recruit/interview'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { executeBatch } from '@/pages-hrm/utils/batch'
import {
  HrmRecruitCandidateStatus,
  HrmRecruitInterviewResult,
} from '@/pages-hrm/utils/constants'
import type { HrmRecruitCandidateStatusValue } from '@/pages-hrm/utils/constants'
import SearchForm from './components/search-form.vue'
import StatusListForm from './components/status-list-form.vue'
import PostListForm from './components/post-list-form.vue'
import ChannelListForm from './components/channel-list-form.vue'
import EliminateForm from './components/eliminate-form.vue'
import InterviewForm from './components/interview-form.vue'
import InterviewResultForm from './components/interview-result-form.vue'
import CleanForm from './components/clean-form.vue'

const props = defineProps<{
  status?: number | string | any
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
const list = ref<RecruitCandidate[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const tabIndex = ref(0) // 当前 tab 下标
const statusCounts = ref<Record<number, number>>({}) // 各状态数量
const selectedIds = ref<number[]>([]) // 选中的候选人编号
const batchActionVisible = ref(false) // 批量操作菜单
const statusListFormRef = ref<InstanceType<typeof StatusListForm>>() // 批量流转
const postListFormRef = ref<InstanceType<typeof PostListForm>>() // 批量改职位
const channelListFormRef = ref<InstanceType<typeof ChannelListForm>>() // 批量改渠道
const eliminateFormRef = ref<InstanceType<typeof EliminateForm>>() // 淘汰表单
const interviewFormRef = ref<InstanceType<typeof InterviewForm>>() // 面试表单
const interviewResultFormRef = ref<InstanceType<typeof InterviewResultForm>>() // 面试结果
const cleanFormRef = ref<InstanceType<typeof CleanForm>>() // 一键清理

const statusTabs = computed(() => { // 状态页签（含全部）
  const dictTabs = getIntDictOptions(DICT_TYPE.HRM_RECRUIT_CANDIDATE_STATUS).map(item => ({
    label: item.label,
    value: item.value,
    count: statusCounts.value[item.value] ?? 0,
  }))
  const allCount = dictTabs.reduce((sum, item) => sum + item.count, 0)
  return [{ label: '全部', value: 'all' as const, count: allCount }, ...dictTabs]
})

const activeStatusValue = computed<HrmRecruitCandidateStatusValue | undefined>(() => {
  const tab = statusTabs.value[tabIndex.value]
  return tab?.value === 'all' ? undefined : (Number(tab?.value) as HrmRecruitCandidateStatusValue)
})

const canSelect = computed(() => activeStatusValue.value !== undefined) // 非「全部」才可多选
const showBatchBar = computed(() => // 非全部且有批量权限时展示
  canSelect.value
  && (hasAccessByCodes(['hrm:recruit:candidate:update'])
    || hasAccessByCodes(['hrm:recruit:interview:create'])
    || hasAccessByCodes(['hrm:recruit:candidate:delete'])),
)

/** 当前状态是否在指定集合中 */
function isActiveStatusIn(statuses: number[]) {
  return activeStatusValue.value !== undefined && statuses.includes(activeStatusValue.value)
}

const canBatchUpdateStatus = computed(() =>
  isActiveStatusIn([
    HrmRecruitCandidateStatus.NEW,
    HrmRecruitCandidateStatus.PRIMARY_PASS,
    HrmRecruitCandidateStatus.INTERVIEW_PASS,
  ]),
)
const canBatchInterview = computed(() => canBatchUpdateStatus.value)
const canBatchUpdatePostOrChannel = computed(() => canBatchUpdateStatus.value)
const canBatchEliminate = computed(() =>
  isActiveStatusIn([
    HrmRecruitCandidateStatus.NEW,
    HrmRecruitCandidateStatus.PRIMARY_PASS,
    HrmRecruitCandidateStatus.INTERVIEW,
    HrmRecruitCandidateStatus.INTERVIEW_PASS,
    HrmRecruitCandidateStatus.OFFER_SENT,
    HrmRecruitCandidateStatus.PENDING_ENTRY,
  ]),
)
const candidateDeleteStatuses = [ // 可删除状态
  HrmRecruitCandidateStatus.NEW,
  HrmRecruitCandidateStatus.PRIMARY_PASS,
  HrmRecruitCandidateStatus.INTERVIEW,
  HrmRecruitCandidateStatus.INTERVIEW_PASS,
  HrmRecruitCandidateStatus.ELIMINATED,
]
const canBatchDelete = computed(() => isActiveStatusIn(candidateDeleteStatuses))

const batchActions = computed(() => {
  const actions: { name: string, value: string }[] = []
  if (canBatchUpdateStatus.value && hasAccessByCodes(['hrm:recruit:candidate:update'])) {
    actions.push({ name: '批量流转', value: 'status' })
  }
  if (canBatchInterview.value && hasAccessByCodes(['hrm:recruit:interview:create'])) {
    actions.push({ name: '批量面试', value: 'interview' })
  }
  if (canBatchUpdatePostOrChannel.value && hasAccessByCodes(['hrm:recruit:candidate:update'])) {
    actions.push({ name: '修改职位', value: 'post' })
    actions.push({ name: '修改渠道', value: 'channel' })
  }
  if (canBatchEliminate.value && hasAccessByCodes(['hrm:recruit:candidate:update'])) {
    actions.push({ name: '批量淘汰', value: 'eliminate' })
  }
  if (canBatchDelete.value && hasAccessByCodes(['hrm:recruit:candidate:delete'])) {
    actions.push({ name: '批量删除', value: 'delete' })
  }
  return actions
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 是否已选中 */
function isSelected(id?: number) {
  return id != null && selectedIds.value.includes(id)
}

/** 切换选中 */
function toggleSelect(item: RecruitCandidate) {
  if (item.id == null || !canSelect.value) {
    return
  }
  if (isSelected(item.id)) {
    selectedIds.value = selectedIds.value.filter(id => id !== item.id)
    return
  }
  selectedIds.value = [...selectedIds.value, item.id]
}

/** 查询候选人列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getRecruitCandidatePage({
      ...queryParams.value,
      status: activeStatusValue.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 加载状态统计 */
async function loadStatusCounts() {
  const rows = await getRecruitCandidateStatusCount({ ...queryParams.value })
  const counts: Record<number, number> = {}
  rows.forEach((item) => {
    counts[item.status] = item.count
  })
  statusCounts.value = counts
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  selectedIds.value = []
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  selectedIds.value = []
  reload()
}

/** 重新加载 */
function reload() {
  loadStatusCounts()
  pagingRef.value?.reload()
}

/** 新增候选人 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-hrm/recruit/candidate/form/index' })
}

/** 查看详情 */
function handleDetail(item: RecruitCandidate) {
  uni.navigateTo({ url: `/pages-hrm/recruit/candidate/detail/index?id=${item.id}` })
}

/** 获得主操作 */
function getPrimaryAction(candidate: RecruitCandidate) {
  if (
    hasAccessByCodes(['hrm:recruit:interview:update'])
    && candidate.status === HrmRecruitCandidateStatus.INTERVIEW
    && candidate.interviewId
    && candidate.interviewResult === HrmRecruitInterviewResult.CANCELED
  ) {
    return { command: 'interview-change', label: '重新安排' }
  }
  if (
    hasAccessByCodes(['hrm:recruit:interview:update'])
    && candidate.status === HrmRecruitCandidateStatus.INTERVIEW
    && candidate.interviewId
    && candidate.interviewResult !== HrmRecruitInterviewResult.CANCELED
  ) {
    return { command: 'interview-result', label: '登记结果' }
  }
  if (
    hasAccessByCodes(['hrm:employee:update'])
    && candidate.status === HrmRecruitCandidateStatus.PENDING_ENTRY
    && candidate.employeeId
  ) {
    return { command: 'confirm-entry', label: '确认入职' }
  }
  if (
    hasAccessByCodes(['hrm:recruit:candidate:update'])
    && (candidate.status === HrmRecruitCandidateStatus.INTERVIEW_PASS
      || candidate.status === HrmRecruitCandidateStatus.OFFER_SENT)
    && !candidate.employeeId
  ) {
    return { command: 'convert-employee', label: '转为员工' }
  }
  if (
    hasAccessByCodes(['hrm:recruit:interview:create'])
    && (candidate.status === HrmRecruitCandidateStatus.NEW
      || candidate.status === HrmRecruitCandidateStatus.PRIMARY_PASS
      || candidate.status === HrmRecruitCandidateStatus.INTERVIEW_PASS)
  ) {
    return { command: 'interview', label: '安排面试' }
  }
  return undefined
}

/** 主操作 */
async function handlePrimaryAction(command: string, candidate: RecruitCandidate) {
  if (command === 'interview-result') {
    await openInterviewResult(candidate)
    return
  }
  if (command === 'interview-change') {
    await openInterviewChange(candidate)
    return
  }
  if (command === 'confirm-entry' || command === 'convert-employee') {
    toast.show('员工档案表单尚未迁移，请使用 PC 端完成')
    return
  }
  if (command === 'interview' && candidate.id) {
    interviewFormRef.value?.open('create', candidate.id)
  }
}

/** 登记面试结果 */
async function openInterviewResult(candidate: RecruitCandidate) {
  if (!candidate.interviewId) {
    toast.warning('请先安排面试')
    return
  }
  const interview = await getRecruitInterview(candidate.interviewId)
  interviewResultFormRef.value?.open(interview)
}

/** 更改面试安排 */
async function openInterviewChange(candidate: RecruitCandidate) {
  if (!candidate.id || !candidate.interviewId) {
    return
  }
  const interview = await getRecruitInterview(candidate.interviewId)
  interviewFormRef.value?.open('update', candidate.id, interview)
}

/** 批量操作 */
async function handleBatchAction({ item }: { item: { value: string } }) {
  if (!selectedIds.value.length) {
    return
  }
  if (item.value === 'status' && activeStatusValue.value != null) {
    statusListFormRef.value?.open(selectedIds.value, activeStatusValue.value)
    return
  }
  if (item.value === 'interview') {
    interviewFormRef.value?.open('batch', selectedIds.value)
    return
  }
  if (item.value === 'post') {
    postListFormRef.value?.open(selectedIds.value)
    return
  }
  if (item.value === 'channel') {
    channelListFormRef.value?.open(selectedIds.value)
    return
  }
  if (item.value === 'eliminate') {
    eliminateFormRef.value?.open(selectedIds.value)
    return
  }
  if (item.value === 'delete') {
    try {
      await dialog.confirm({
        title: '提示',
        msg: `确认删除选中的 ${selectedIds.value.length} 位候选人吗？`,
      })
    } catch {
      return
    }
    const hasSuccess = await executeBatch(
      selectedIds.value.map(id => deleteRecruitCandidate(id)),
    )
    if (hasSuccess) {
      await handleBatchSuccess()
    }
  }
}

/** 批量操作成功 */
async function handleBatchSuccess() {
  selectedIds.value = []
  reload()
}

/** 初始化 */
onMounted(() => {
  if (props.status != null && props.status !== '') {
    const status = Number(props.status)
    const index = statusTabs.value.findIndex(item => item.value === status)
    if (index >= 0) {
      tabIndex.value = index
    }
  }
  loadStatusCounts()
  uni.$on('hrm:recruit:candidate:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:recruit:candidate:reload', reload)
})
</script>
