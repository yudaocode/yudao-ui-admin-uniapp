<template>
  <view class="yd-page-container" :class="{ 'yd-page-container-paging': activeTab !== 'details' }">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="KPI 考核详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 头部摘要 -->
    <view v-if="plan.id" class="bg-white px-24rpx py-24rpx">
      <view class="mb-12rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1 truncate text-36rpx text-[#333] font-semibold">
          {{ plan.name || '-' }}
        </view>
        <dict-tag
          v-if="plan.status != null"
          :type="DICT_TYPE.HRM_PERFORMANCE_PLAN_STATUS"
          :value="plan.status"
        />
      </view>
      <view class="mb-8rpx flex items-center gap-12rpx text-26rpx text-[#666]">
        <text>计划编号：{{ plan.id }}</text>
        <dict-tag
          v-if="plan.stageType != null"
          :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
          :value="plan.stageType"
        />
      </view>
      <view class="text-26rpx text-[#666]">
        {{ formatHrmPerformancePlanCycle(plan) }} · {{ formatHrmDateRange(plan.startTime, plan.endTime) }}
      </view>
      <view class="mt-8rpx text-26rpx text-[#666]">
        参评 {{ plan.employeeCount || 0 }} / 完成 {{ plan.finishedCount || 0 }}
      </view>
    </view>

    <!-- 详情分类 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always">
        <wd-tab v-for="item in tabs" :key="item.key" :title="item.title" />
      </wd-tabs>
    </view>

    <!-- 详细资料 -->
    <scroll-view v-if="activeTab === 'details'" scroll-y class="min-h-0 flex-1 pb-160rpx">
      <wd-cell-group border title="考核设置">
        <wd-cell title="考核模板" :value="plan.assessmentTemplateName || '-'" />
        <wd-cell title="结果模板" :value="plan.resultTemplateName || '-'" />
        <wd-cell title="考核周期" :value="formatHrmPerformancePlanCycle(plan)" />
        <wd-cell title="结果等级" :value="resultLevelText" />
        <wd-cell title="开始日期" :value="formatHrmDate(plan.startTime)" />
        <wd-cell title="结束日期" :value="formatHrmDate(plan.endTime)" />
        <wd-cell title="计薪月份" :value="plan.paidForMonth || '-'" />
        <wd-cell
          v-if="plan.terminateTime"
          title="终止时间"
          :value="formatDateTime(plan.terminateTime) || '-'"
        />
        <wd-cell title="指标制定" :value="formatHrmPerformanceQuotaSettingType(plan.quotaSettingType)" />
        <wd-cell title="目标确认" :value="plan.targetConfirmation ? '需要' : '不需要'" />
        <wd-cell title="同步薪资" :value="plan.syncToSalary ? '是' : '否'" />
        <wd-cell title="结果审核" :value="plan.resultAudit ? '需要' : '不需要'" />
        <wd-cell title="结果确认" :value="plan.resultConfirmation ? '需要' : '不需要'" />
        <wd-cell title="申诉超期处理" :value="formatHrmPerformanceAppealTimeout(plan)" />
        <wd-cell title="考核说明" :value="plan.description || '-'" />
      </wd-cell-group>

      <wd-cell-group border title="评分流程">
        <view v-if="!(plan.reviewStages || []).length" class="px-24rpx py-24rpx text-28rpx text-[#999]">
          暂无评分阶段
        </view>
        <view
          v-for="(stage, index) in plan.reviewStages || []"
          :key="index"
          class="border-b border-[#f0f0f0] px-24rpx py-20rpx"
        >
          <view class="mb-8rpx text-28rpx text-[#333] font-semibold">
            {{ index + 1 }}. {{ stage.name || '-' }}
          </view>
          <view class="text-26rpx text-[#666]">
            评分人：{{ formatHrmPerformanceRaterType(stage.rater?.type) }}
            <text class="mx-8rpx text-[#ddd]">|</text>
            权重：{{ stage.weight || 0 }}%
          </view>
          <view class="mt-6rpx text-26rpx text-[#666]">
            评语必填：{{ stage.requiredSetting ? '是' : '否' }}
            <text class="mx-8rpx text-[#ddd]">|</text>
            允许驳回：{{ stage.rejectAuthority ? '是' : '否' }}
          </view>
        </view>
      </wd-cell-group>
    </scroll-view>

    <!-- 参评员工 -->
    <view v-else-if="activeTab === 'employees'" class="min-h-0 flex flex-1 flex-col">
      <SearchEmployeeForm
        :level-list="levelList"
        @search="handleEmployeeQuery"
        @reset="handleEmployeeReset"
      />
      <view v-if="stageCountList.length" class="flex flex-wrap gap-8rpx bg-white px-24rpx py-16rpx">
        <view
          v-for="item in stageCountList"
          :key="item.stageType"
          class="rounded-8rpx bg-[#f5f5f5] px-12rpx py-4rpx text-22rpx text-[#666]"
        >
          {{ getDictLabel(DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS, item.stageType) || '未知' }}（{{ item.count }}）
        </view>
      </view>
      <z-paging
        ref="employeePagingRef"
        v-model="employeeList"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="10"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无参评员工"
        @query="queryEmployeeList"
      >
        <view class="p-24rpx" :class="showEmployeeFooter ? 'pb-160rpx' : ''">
          <view
            v-for="item in employeeList"
            :key="item.id"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            @click="handleAssessmentDetail(item)"
          >
            <view
              v-if="isEditable"
              class="mb-12rpx"
              @click.stop="toggleEmployee(item)"
            >
              <wd-checkbox :model-value="isEmployeeSelected(item.employeeId)" />
            </view>
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.employeeName || '-' }}
              </view>
              <dict-tag
                v-if="item.stageType != null"
                :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
                :value="item.stageType"
              />
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">工号：</text>{{ item.jobNumber || '-' }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">部门：</text>{{ item.deptName || '-' }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">处理人：</text>{{ item.currentHandlerName || '-' }}
            </view>
            <view class="text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">分数：</text>{{ item.score ?? '-' }}
              <text class="mx-8rpx text-[#ddd]">|</text>
              <text class="mr-8rpx text-[#999]">等级：</text>{{ item.resultLevel || '-' }}
              <text class="mx-8rpx text-[#ddd]">|</text>
              <text class="mr-8rpx text-[#999]">系数：</text>{{ item.coefficient ?? '-' }}
            </view>
          </view>
        </view>
      </z-paging>
    </view>

    <!-- 操作日志 -->
    <OperateLogList
      v-else-if="activeTab === 'operateLog' && props.id"
      class="min-h-0 flex-1"
      :biz-id="Number(props.id)"
      :biz-type="HrmBizType.PERFORMANCE_PLAN"
    />

    <!-- 底部操作 -->
    <view v-if="showFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="activeTab === 'employees' && isEditable">
          <wd-button
            v-if="hasAccessByCodes(['hrm:performance:plan:update'])"
            class="flex-1"
            variant="plain"
            @click="addEmployeeFormRef?.open(Number(props.id))"
          >
            添加员工
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['hrm:performance:plan:update'])"
            class="flex-1"
            variant="plain"
            :disabled="!selectedEmployeeIds.length"
            @click="selectedEmployeeIds = []"
          >
            清空
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['hrm:performance:plan:update'])"
            class="flex-1"
            type="danger"
            :disabled="!selectedEmployeeIds.length"
            @click="handleRemoveEmployees"
          >
            移除({{ selectedEmployeeIds.length }})
          </wd-button>
        </template>
        <template v-else-if="activeTab === 'details'">
          <wd-button
            v-if="isEditable && hasAccessByCodes(['hrm:performance:plan:update'])"
            class="flex-1"
            variant="plain"
            @click="handleEdit"
          >
            编辑
          </wd-button>
          <wd-button
            v-else
            class="flex-1"
            variant="plain"
            @click="handleViewSettings"
          >
            查看设置
          </wd-button>
          <wd-button
            v-if="isEditable && hasAccessByCodes(['hrm:performance:plan:update'])"
            class="flex-1"
            type="primary"
            @click="handleAction('start')"
          >
            启动
          </wd-button>
          <wd-button
            v-else-if="plan.status === HrmPerformancePlanStatus.RUNNING && plan.scoringReady && hasAccessByCodes(['hrm:performance:plan:update'])"
            class="flex-1"
            type="primary"
            @click="handleAction('open')"
          >
            开启评分
          </wd-button>
          <wd-button
            v-if="showMoreActions && actionItems.length"
            class="flex-1"
            type="info"
            @click="actionVisible = true"
          >
            更多
          </wd-button>
        </template>
      </view>
    </view>

    <wd-action-sheet
      v-model="actionVisible"
      :actions="actionItems"
      @select="handleActionSelect"
    />
    <AddEmployeeForm ref="addEmployeeFormRef" @success="refreshAll" />
  </view>
</template>

<script lang="ts" setup>
import type { PerformanceAssessment, PerformanceStageCount } from '@/api/hrm/performance/assessment'
import type { PerformancePlan } from '@/api/hrm/performance/plan'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import {
  getPerformanceAssessmentPage,
  removePerformancePlanEmployees,
} from '@/api/hrm/performance/assessment'
import {
  archivePerformancePlan,
  deletePerformancePlan,
  getPerformancePlan,
  getPerformancePlanLevelCount,
  getPerformancePlanStageCount,
  openPerformancePlanScoring,
  startPerformancePlan,
  startPerformancePlanInterview,
  terminatePerformancePlan,
} from '@/api/hrm/performance/plan'
import { getDictLabel } from '@/hooks/useDict'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { HrmBizType, HrmPerformancePlanStatus } from '@/pages-hrm/utils/constants'
import {
  formatHrmDate,
  formatHrmDateRange,
  formatHrmPerformanceAppealTimeout,
  formatHrmPerformancePlanCycle,
  formatHrmPerformanceQuotaSettingType,
  formatHrmPerformanceRaterType,
} from '@/pages-hrm/utils/format'
import AddEmployeeForm from '../components/add-employee-form.vue'
import OperateLogList from '../components/operate-log-list.vue'
import SearchEmployeeForm from '../components/search-employee-form.vue'

const props = defineProps<{
  id?: number | string
  tab?: string
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
const plan = ref<PerformancePlan>({ name: '' }) // 绩效计划
const employeeList = ref<PerformanceAssessment[]>([]) // 参评员工
const employeePagingRef = ref<any>() // 员工分页引用
const employeeQuery = ref<Record<string, any>>({}) // 员工查询参数
const levelList = ref<string[]>([]) // 结果等级列表
const stageCountList = ref<PerformanceStageCount[]>([]) // 阶段统计
const selectedEmployeeIds = ref<number[]>([]) // 选中的员工编号
const addEmployeeFormRef = ref<InstanceType<typeof AddEmployeeForm>>() // 添加员工表单
const actionVisible = ref(false) // 更多操作菜单
const tabs = computed(() => [ // tab 配置
  { key: 'details', title: '详细资料' },
  { key: 'employees', title: `参评员工（${plan.value.employeeCount || 0}）` },
  { key: 'operateLog', title: '操作日志' },
])
const tabIndex = ref(props.tab === 'employees' ? 1 : 0) // 当前 tab

const activeTab = computed(() => tabs.value[tabIndex.value]?.key || 'details')
const isEditable = computed(() => { // 未开始/草稿可编辑
  return plan.value.status === HrmPerformancePlanStatus.DRAFT
    || plan.value.status === HrmPerformancePlanStatus.NOT_STARTED
})
const showMoreActions = computed(() => {
  return isEditable.value
    || plan.value.status === HrmPerformancePlanStatus.RUNNING
    || plan.value.status === HrmPerformancePlanStatus.ARCHIVED
})
const showEmployeeFooter = computed(() => {
  return activeTab.value === 'employees' && isEditable.value
    && hasAccessByCodes(['hrm:performance:plan:update'])
})
const showFooter = computed(() => {
  if (activeTab.value === 'employees') {
    return showEmployeeFooter.value
  }
  if (activeTab.value !== 'details') {
    return false
  }
  return true // 详细资料始终展示底部主操作 / 更多
})
const resultLevelText = computed(() => {
  return plan.value.resultConfig?.levels
    ?.map(level => `${level.name}（${level.minScore}-${level.maxScore}，系数 ${level.coefficient}）`)
    .join('；') || '-'
})
const actionItems = computed(() => { // 更多操作
  const items: { name: string, key: string }[] = []
  if (plan.value.status === HrmPerformancePlanStatus.RUNNING && plan.value.interviewReady
    && hasAccessByCodes(['hrm:performance:plan:update'])) {
    items.push({ name: '发起面谈', key: 'interview' })
  }
  if (plan.value.status === HrmPerformancePlanStatus.RUNNING && plan.value.archiveReady
    && hasAccessByCodes(['hrm:performance:plan:update'])) {
    items.push({ name: '归档', key: 'archive' })
  }
  if (plan.value.status === HrmPerformancePlanStatus.RUNNING
    && hasAccessByCodes(['hrm:performance:plan:update'])) {
    items.push({ name: '终止', key: 'terminate' })
  }
  if (
    (isEditable.value || plan.value.status === HrmPerformancePlanStatus.ARCHIVED)
    && hasAccessByCodes(['hrm:performance:plan:delete'])
  ) {
    items.push({ name: '删除', key: 'delete' })
  }
  return items
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/performance/plan/index')
}

/** 加载计划详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  plan.value = await getPerformancePlan(Number(props.id))
}

/** 加载参评员工统计 */
async function loadEmployeeStatistics() {
  if (!props.id) {
    return
  }
  const [stageCounts, levelCounts] = await Promise.all([
    getPerformancePlanStageCount(Number(props.id)),
    getPerformancePlanLevelCount(Number(props.id)),
  ])
  stageCountList.value = stageCounts || []
  levelList.value = (levelCounts || [])
    .map(item => item.levelName)
    .filter((name): name is string => !!name)
}

/** 查询参评员工 */
async function queryEmployeeList(pageNo: number, pageSize: number) {
  if (!props.id) {
    employeePagingRef.value?.complete([])
    return
  }
  try {
    const data = await getPerformanceAssessmentPage({
      ...employeeQuery.value,
      planId: Number(props.id),
      pageNo,
      pageSize,
    })
    selectedEmployeeIds.value = []
    employeePagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    employeePagingRef.value?.complete(false)
  }
}

/** 刷新全部 */
async function refreshAll() {
  await Promise.all([getDetail(), loadEmployeeStatistics()])
  if (activeTab.value === 'employees') {
    employeePagingRef.value?.reload()
  }
}

/** 搜索参评员工 */
function handleEmployeeQuery(data?: Record<string, any>) {
  employeeQuery.value = { ...data }
  employeePagingRef.value?.reload()
}

/** 重置参评员工搜索 */
function handleEmployeeReset() {
  handleEmployeeQuery()
}

/** 是否选中员工 */
function isEmployeeSelected(employeeId?: number) {
  return !!employeeId && selectedEmployeeIds.value.includes(employeeId)
}

/** 切换员工选中 */
function toggleEmployee(item: PerformanceAssessment) {
  if (!item.employeeId) {
    return
  }
  if (isEmployeeSelected(item.employeeId)) {
    selectedEmployeeIds.value = selectedEmployeeIds.value.filter(id => id !== item.employeeId)
    return
  }
  selectedEmployeeIds.value = [...selectedEmployeeIds.value, item.employeeId]
}

/** 打开员工考核详情 */
function handleAssessmentDetail(item: PerformanceAssessment) {
  if (!item.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/performance/assessment/detail/index?id=${item.id}&planId=${props.id}`,
  })
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-hrm/performance/plan/form/index?id=${props.id}`,
  })
}

/** 查看考核设置 */
function handleViewSettings() {
  uni.navigateTo({
    url: `/pages-hrm/performance/plan/form/index?id=${props.id}&type=view`,
  })
}

/** 移除参评员工 */
async function handleRemoveEmployees() {
  if (!props.id || !selectedEmployeeIds.value.length) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认移除选中的 ${selectedEmployeeIds.value.length} 名参评员工？`,
    })
  } catch {
    return
  }
  await removePerformancePlanEmployees({
    planId: Number(props.id),
    employeeIds: selectedEmployeeIds.value,
  })
  toast.success('参评员工移除成功')
  await refreshAll()
}

/** 执行计划生命周期操作 */
async function handleAction(action: 'start' | 'open' | 'interview' | 'archive' | 'terminate') {
  if (!props.id) {
    return
  }
  const actionName = {
    start: '启动计划',
    open: '开启评分',
    interview: '发起绩效面谈',
    archive: '归档计划',
    terminate: '终止计划',
  }[action]
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认${actionName}？`,
    })
  } catch {
    return
  }
  if (action === 'start') {
    await startPerformancePlan(Number(props.id))
  } else if (action === 'open') {
    await openPerformancePlanScoring(Number(props.id))
  } else if (action === 'interview') {
    await startPerformancePlanInterview(Number(props.id))
  } else if (action === 'archive') {
    await archivePerformancePlan(Number(props.id))
  } else {
    await terminatePerformancePlan(Number(props.id))
  }
  toast.success('操作成功')
  uni.$emit('hrm-performance-plan-refresh')
  if (action === 'terminate') {
    handleBack()
    return
  }
  await refreshAll()
}

/** 删除绩效计划 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认删除该绩效计划？',
    })
  } catch {
    return
  }
  await deletePerformancePlan(Number(props.id))
  toast.success('删除成功')
  uni.$emit('hrm-performance-plan-refresh')
  handleBack()
}

/** 更多操作选择 */
function handleActionSelect({ item }: { item: { key: string } }) {
  if (item.key === 'delete') {
    handleDelete()
    return
  }
  handleAction(item.key as 'interview' | 'archive' | 'terminate')
}

/** 初始化 */
onShow(() => {
  refreshAll()
})
</script>
