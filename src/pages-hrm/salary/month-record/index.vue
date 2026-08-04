<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="薪资管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 空状态 -->
    <view v-if="!pageLoading && !record.id" class="flex flex-1 flex-col items-center justify-center px-48rpx">
      <view class="mb-24rpx text-30rpx text-[#999]">
        暂无月度工资表
      </view>
      <wd-button
        v-if="hasAccessByCodes(['hrm:salary:month-record:create'])"
        type="primary"
        :loading="createLoading"
        @click="handleCreate"
      >
        初始化月度工资表
      </wd-button>
    </view>

    <template v-else-if="record.id">
      <!-- 汇总信息 -->
      <view class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-32rpx text-[#333] font-semibold">
              {{ record.title || '月度工资表' }}
            </view>
            <view class="mt-8rpx text-24rpx text-[#999]">
              计薪周期：{{ formatHrmDateRange(record.startTime, record.endTime) }}
            </view>
          </view>
          <dict-tag
            v-if="record.status != null"
            :type="DICT_TYPE.HRM_SALARY_MONTH_STATUS"
            :value="record.status"
          />
        </view>
        <view class="grid grid-cols-2 gap-16rpx">
          <view class="rounded-8rpx bg-[#f6ffed] px-16rpx py-16rpx">
            <view class="text-24rpx text-[#999]">
              计薪人数
            </view>
            <view class="mt-8rpx text-32rpx text-[#52c41a] font-semibold">
              {{ record.employeeCount ?? 0 }}
            </view>
          </view>
          <view class="rounded-8rpx bg-[#e6f4ff] px-16rpx py-16rpx">
            <view class="text-24rpx text-[#999]">
              实发工资
            </view>
            <view class="mt-8rpx text-32rpx text-[#1677ff] font-semibold">
              {{ formatHrmMoney(record.realPaySalary) }}
            </view>
          </view>
        </view>
        <view class="mt-16rpx text-26rpx text-[#666]">
          应发：{{ formatHrmMoney(record.expectedPaySalary) }}
          <text class="mx-8rpx text-[#ddd]">|</text>
          个税：{{ formatHrmMoney(record.personalTax) }}
        </view>
        <view class="mt-8rpx text-26rpx text-[#666]">
          个人社保：{{ formatHrmMoney(record.personalInsuranceAmount) }}
          <text class="mx-8rpx text-[#ddd]">|</text>
          个人公积金：{{ formatHrmMoney(record.personalProvidentFundAmount) }}
        </view>
        <view
          v-if="isArchived"
          class="mt-16rpx rounded-8rpx bg-[#e6f4ff] px-16rpx py-12rpx text-24rpx text-[#1677ff]"
        >
          当前工资表已归档，仅可查询。
        </view>
      </view>

      <!-- 核算准备提示 -->
      <ReadinessAlert ref="readinessAlertRef" :month-record-id="record.id" />

      <!-- 搜索组件 -->
      <view class="mt-16rpx">
        <SearchForm @search="handleQuery" @reset="handleReset" />
      </view>

      <!-- 员工异动 tab -->
      <view class="bg-white">
        <wd-tabs v-model="tabIndex" slidable="always" @change="handleTabChange">
          <wd-tab
            v-for="tab in employeeChangeTabs"
            :key="tab.type"
            :title="`${tab.label}(${employeeChangeCount[tab.type] || 0})`"
          />
        </wd-tabs>
      </view>

      <!-- 员工工资列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="10"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无计薪员工"
        @query="queryList"
      >
        <view class="p-24rpx" :class="showFooter ? 'pb-160rpx' : ''">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            @click="handleEmployeeDetail(item)"
          >
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.employeeName || '-' }}
              </view>
              <view class="shrink-0 text-28rpx text-[#1677ff] font-semibold">
                {{ formatHrmMoney(item.realPaySalary) }}
              </view>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">工号：</text>{{ item.jobNumber || '-' }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">部门：</text>{{ item.deptName || '-' }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">岗位：</text>{{ item.postName || '-' }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">计薪天数：</text>{{ formatHrmDays(item.needWorkDay) }}
              <text class="mx-8rpx text-[#ddd]">|</text>
              <text class="mr-8rpx text-[#999]">实际：</text>{{ formatHrmDays(item.actualWorkDay) }}
            </view>
            <view class="text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">应发：</text>{{ formatHrmMoney(item.expectedPaySalary) }}
              <text class="mx-8rpx text-[#ddd]">|</text>
              <text class="mr-8rpx text-[#999]">个税：</text>{{ formatHrmMoney(item.personalTax) }}
            </view>
          </view>
        </view>
      </z-paging>

      <!-- 底部快捷操作 -->
      <view v-if="showFooter" class="yd-detail-footer">
        <view class="yd-detail-footer-actions">
          <wd-button
            v-if="isWritable && hasAccessByCodes(['hrm:salary:month-record:update'])"
            class="flex-1"
            variant="plain"
            @click="handleBatchEdit"
          >
            在线编辑
          </wd-button>
          <wd-button
            v-if="isWritable && hasAccessByCodes(['hrm:salary:month-record:compute'])"
            class="flex-1"
            type="primary"
            @click="handleCompute"
          >
            核算工资
          </wd-button>
          <wd-button
            v-if="actionItems.length"
            class="flex-1"
            type="info"
            @click="actionVisible = true"
          >
            更多
          </wd-button>
        </view>
      </view>
    </template>

    <wd-action-sheet
      v-model="actionVisible"
      :actions="actionItems"
      @select="handleActionSelect"
    />
  </view>
</template>

<script lang="ts" setup>
import type { SalaryMonthRecord } from '@/api/hrm/salary/month-record'
import type { SalaryMonthEmployeeRecord } from '@/api/hrm/salary/month-record/employee'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createNextSalaryMonthRecord,
  deleteSalaryMonthRecord,
  getLastSalaryMonthRecord,
  getSalaryMonthRecord,
} from '@/api/hrm/salary/month-record'
import {
  getSalaryMonthEmployeeChangeCount,
  getSalaryMonthEmployeeRecordPage,
} from '@/api/hrm/salary/month-record/employee'
import { useAccess } from '@/hooks/useAccess'
import {
  HrmSalaryEmployeeChangeType,
  HrmSalaryMonthStatus,
} from '@/pages-hrm/utils/constants'
import {
  formatHrmDateRange,
  formatHrmDays,
  formatHrmMoney,
} from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import ReadinessAlert from './components/readiness-alert.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const pageLoading = ref(true) // 页面加载中
const createLoading = ref(false) // 创建中
const record = ref<SalaryMonthRecord>({}) // 当前工资表
const list = ref<SalaryMonthEmployeeRecord[]>([]) // 员工列表
const pagingRef = ref<any>() // 分页组件引用
const readinessAlertRef = ref<InstanceType<typeof ReadinessAlert>>() // 核算准备
const actionVisible = ref(false) // 操作菜单
const tabIndex = ref(0) // 异动 tab
const employeeChangeCount = ref<Record<number, number>>({}) // 异动分类数量
const queryParams = ref<Record<string, any>>({
  employeeName: undefined,
  jobNumber: undefined,
  deptId: undefined,
  employeeChangeType: HrmSalaryEmployeeChangeType.ALL,
}) // 查询参数

const employeeChangeTabs = [ // 异动分类 tab
  { type: HrmSalaryEmployeeChangeType.ALL, label: '计薪人数' },
  { type: HrmSalaryEmployeeChangeType.ENTRY, label: '新入职' },
  { type: HrmSalaryEmployeeChangeType.LEAVE, label: '离职' },
  { type: HrmSalaryEmployeeChangeType.REGULAR, label: '转正' },
  { type: HrmSalaryEmployeeChangeType.TRANSFER, label: '调岗' },
]

const isArchived = computed(() => record.value.status === HrmSalaryMonthStatus.HISTORY) // 是否已归档
const isWritable = computed(() => !!record.value.id && !isArchived.value) // 是否可编辑
const actionItems = computed(() => { // 更多菜单：底部已展示的在线编辑/核算不再重复
  const items: Array<{ name: string, value: string, color?: string }> = []
  if (
    record.value.status === HrmSalaryMonthStatus.COMPUTED
    && hasAccessByCodes(['hrm:salary:slip:create'])
  ) {
    items.push({ name: '发送工资条', value: 'sendSlip' })
  }
  if (hasAccessByCodes(['hrm:salary:month-record:create'])) {
    items.push({ name: '创建下月工资表', value: 'createNext' })
  }
  if (isWritable.value && hasAccessByCodes(['hrm:salary:month-record:delete'])) {
    items.push({ name: '删除工资表', value: 'delete', color: '#f5222d' })
  }
  return items
})

const showFooter = computed(() => { // 是否展示底部操作
  return !!record.value.id && (
    (isWritable.value && (
      hasAccessByCodes(['hrm:salary:month-record:update'])
      || hasAccessByCodes(['hrm:salary:month-record:compute'])
    ))
    || actionItems.value.length > 0
  )
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询员工工资列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!record.value.id) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getSalaryMonthEmployeeRecordPage({
      pageNo,
      pageSize,
      monthRecordId: record.value.id,
      ...queryParams.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 查询员工异动分类数量 */
async function getEmployeeChangeCount() {
  if (!record.value.id) {
    employeeChangeCount.value = {}
    return
  }
  employeeChangeCount.value = await getSalaryMonthEmployeeChangeCount({
    monthRecordId: record.value.id,
    employeeName: queryParams.value.employeeName,
    jobNumber: queryParams.value.jobNumber,
    deptId: queryParams.value.deptId,
  })
}

/** 刷新工资表与列表 */
async function refreshData() {
  if (!record.value.id) {
    return
  }
  record.value = await getSalaryMonthRecord(record.value.id)
  await Promise.all([
    getEmployeeChangeCount(),
    readinessAlertRef.value?.refresh(),
  ])
  reload()
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = {
    ...queryParams.value,
    employeeName: data?.employeeName,
    jobNumber: data?.jobNumber,
    deptId: data?.deptId,
  }
  Promise.all([getEmployeeChangeCount()]).then(() => reload())
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 切换异动分类 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  queryParams.value.employeeChangeType = employeeChangeTabs[index]?.type
    ?? HrmSalaryEmployeeChangeType.ALL
  reload()
}

/** 查看员工工资明细 */
function handleEmployeeDetail(item: SalaryMonthEmployeeRecord) {
  if (!item.monthRecordId || !item.employeeId) {
    return
  }
  const query = [
    `monthRecordId=${item.monthRecordId}`,
    `employeeId=${item.employeeId}`,
    isWritable.value ? 'writable=1' : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({
    url: `/pages-hrm/salary/month-record/employee/detail/index?${query}`,
  })
}

/** 在线编辑 */
function handleBatchEdit() {
  if (!record.value.id) {
    return
  }
  const query = [
    `monthRecordId=${record.value.id}`,
    queryParams.value.employeeChangeType != null
      ? `employeeChangeType=${queryParams.value.employeeChangeType}`
      : '',
    queryParams.value.employeeName
      ? `employeeName=${encodeURIComponent(queryParams.value.employeeName)}`
      : '',
    queryParams.value.jobNumber
      ? `jobNumber=${encodeURIComponent(queryParams.value.jobNumber)}`
      : '',
    queryParams.value.deptId != null ? `deptId=${queryParams.value.deptId}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({
    url: `/pages-hrm/salary/month-record/batch/index?${query}`,
  })
}

/** 核算工资（移动端不支持，引导 PC） */
function handleCompute() {
  dialog.alert({
    title: '提示',
    msg: '请在 PC 端管理后台完成工资核算',
  })
}

/** 初始化月度工资表 */
async function handleCreate() {
  createLoading.value = true
  try {
    await createNextSalaryMonthRecord()
    toast.success('新建成功')
    await init()
  } finally {
    createLoading.value = false
  }
}

/** 创建下月工资表 */
async function handleCreateNext() {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '新建下月工资表后，当前工资表将归入历史工资且不可修改。请确认要新建下月工资表吗？',
    })
  } catch {
    return
  }
  createLoading.value = true
  try {
    await createNextSalaryMonthRecord()
    toast.success('新建成功')
    await init()
  } finally {
    createLoading.value = false
  }
}

/** 删除工资表 */
async function handleDelete() {
  if (!record.value.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '删除当前工资表后，上月工资表将恢复为当前工资表且支持修改。请确认要删除当前工资表吗？',
    })
  } catch {
    return
  }
  await deleteSalaryMonthRecord(record.value.id)
  toast.success('删除成功')
  await init()
}

/** 操作菜单选择 */
function handleActionSelect({ item }: { item: { value: string } }) {
  if (item.value === 'batchEdit') {
    handleBatchEdit()
    return
  }
  if (item.value === 'compute') {
    handleCompute()
    return
  }
  if (item.value === 'sendSlip' && record.value.id) {
    uni.navigateTo({
      url: `/pages-hrm/salary/slip/send-record/form/index?monthRecordId=${record.value.id}`,
    })
    return
  }
  if (item.value === 'createNext') {
    handleCreateNext()
    return
  }
  if (item.value === 'delete') {
    handleDelete()
  }
}

/** 初始化 */
async function init() {
  pageLoading.value = true
  try {
    record.value = (await getLastSalaryMonthRecord()) || {}
    tabIndex.value = 0
    queryParams.value.employeeChangeType = HrmSalaryEmployeeChangeType.ALL
    if (!record.value.id) {
      list.value = []
      employeeChangeCount.value = {}
      return
    }
    await Promise.all([
      getEmployeeChangeCount(),
      readinessAlertRef.value?.refresh(),
    ])
    reload()
  } finally {
    pageLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:salary:month-record:reload', refreshData)
  init()
})

/** 返回后刷新 */
onShow(() => {
  if (record.value.id) {
    refreshData()
  }
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:salary:month-record:reload', refreshData)
})
</script>
