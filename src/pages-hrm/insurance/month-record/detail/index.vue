<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="monthRecord.title || '月度社保详情'"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 汇总信息 -->
    <view class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="grid grid-cols-2 mb-16rpx gap-16rpx">
        <view class="rounded-8rpx bg-[#f6ffed] px-16rpx py-16rpx" @click="handleStatusChange(HrmInsuranceEmployeeStatus.NORMAL)">
          <view class="text-24rpx text-[#999]">
            参保人数
          </view>
          <view class="mt-8rpx text-32rpx text-[#52c41a] font-semibold">
            {{ monthRecord.insuredEmployeeCount ?? 0 }}
          </view>
        </view>
        <view class="rounded-8rpx bg-[#fff7e6] px-16rpx py-16rpx" @click="handleStatusChange(HrmInsuranceEmployeeStatus.STOPPED)">
          <view class="text-24rpx text-[#999]">
            停保人数
          </view>
          <view class="mt-8rpx text-32rpx text-[#fa8c16] font-semibold">
            {{ monthRecord.stoppedEmployeeCount ?? 0 }}
          </view>
        </view>
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        个人社保：{{ formatHrmMoney(monthRecord.personalInsuranceAmount) }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        公司社保：{{ formatHrmMoney(monthRecord.corporateInsuranceAmount) }}
      </view>
      <view class="mb-8rpx text-26rpx text-[#666]">
        个人公积金：{{ formatHrmMoney(monthRecord.personalProvidentFundAmount) }}
      </view>
      <view class="text-26rpx text-[#666]">
        公司公积金：{{ formatHrmMoney(monthRecord.corporateProvidentFundAmount) }}
      </view>
      <view
        v-if="monthRecord.id && !editable"
        class="mt-16rpx rounded-8rpx bg-[#e6f4ff] px-16rpx py-12rpx text-24rpx text-[#1677ff]"
      >
        当前社保表已归档，仅可查询。
      </view>
    </view>

    <!-- 搜索组件 -->
    <view class="mt-16rpx">
      <SearchEmployeeForm @search="handleQuery" @reset="handleReset" />
    </view>

    <!-- 参保状态 tab -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" @change="handleTabChange">
        <wd-tab
          v-for="tab in statusTabs"
          :key="tab.value"
          :title="`${tab.label}(${tab.count})`"
        />
      </wd-tabs>
    </view>

    <!-- 员工参保列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无参保员工"
      @query="queryList"
    >
      <view class="p-24rpx" :class="showFooter ? 'pb-160rpx' : ''">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-start gap-16rpx">
            <view
              v-if="showBatchBar"
              class="mt-4rpx shrink-0"
              @click.stop="toggleSelect(item)"
            >
              <wd-checkbox :model-value="isSelected(item.id)" />
            </view>
            <view class="min-w-0 flex-1" @click.stop="handleEmployeeDetail(item)">
              <view class="mb-12rpx flex items-start justify-between gap-16rpx">
                <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                  {{ item.employeeName || '-' }}
                </view>
                <dict-tag
                  v-if="item.status != null"
                  :type="DICT_TYPE.HRM_INSURANCE_EMP_STATUS"
                  :value="item.status"
                />
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">工号：</text>{{ item.jobNumber || '-' }}
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">部门：</text>{{ item.deptName || '-' }}
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">入职：</text>{{ formatHrmDate(item.entryTime) }}
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">城市：</text>{{ item.areaName || '-' }}
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">方案：</text>{{ item.schemeName || '-' }}
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">个人社保：</text>{{ formatHrmMoney(item.personalInsuranceAmount) }}
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">公司社保：</text>{{ formatHrmMoney(item.corporateInsuranceAmount) }}
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">个人公积金：</text>{{ formatHrmMoney(item.personalProvidentFundAmount) }}
              </view>
              <view class="text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">公司公积金：</text>{{ formatHrmMoney(item.corporateProvidentFundAmount) }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 批量操作栏 / 添加参保员工 / 删除 -->
    <view v-if="showFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="showBatchBar">
          <wd-button class="flex-1" variant="plain" @click="handleAddEmployee">
            添加
          </wd-button>
          <wd-button
            class="flex-1"
            variant="plain"
            :disabled="!selectedIds.length"
            @click="selectedIds = []"
          >
            清空
          </wd-button>
          <wd-button
            class="flex-1"
            type="primary"
            :disabled="!selectedIds.length"
            @click="batchActionVisible = true"
          >
            批量操作({{ selectedIds.length }})
          </wd-button>
        </template>
        <wd-button
          v-if="canDelete"
          class="flex-1"
          type="danger"
          :loading="deleting"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>

    <wd-action-sheet
      v-model="batchActionVisible"
      :title="`已选 ${selectedIds.length}`"
      :actions="batchActions"
      cancel-text="取消"
      @select="handleBatchAction"
    />
    <AddEmployeeForm ref="addEmployeeFormRef" @success="refreshData" />
    <BatchEmployeeForm ref="batchFormRef" @success="handleBatchSuccess" />
  </view>
</template>

<script lang="ts" setup>
import type { InsuranceMonthRecord } from '@/api/hrm/insurance/month-record'
import type { InsuranceMonthEmployeeRecord } from '@/api/hrm/insurance/month-record/employee'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  deleteInsuranceMonthRecord,
  getInsuranceMonthRecord,
  getLastInsuranceMonthRecord,
} from '@/api/hrm/insurance/month-record'
import {
  getInsuranceMonthEmployeeRecordPage,
  stopInsuranceMonthEmployeeRecordList,
} from '@/api/hrm/insurance/month-record/employee'
import { useAccess } from '@/hooks/useAccess'
import {
  HrmInsuranceEmployeeStatus,
  HrmInsuranceMonthStatus,
} from '@/pages-hrm/utils/constants'
import { formatHrmDate, formatHrmMoney } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import AddEmployeeForm from '../components/add-employee-form.vue'
import BatchEmployeeForm from '../components/batch-employee-form.vue'
import SearchEmployeeForm from '../components/search-employee-form.vue'

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
const monthRecord = ref<InsuranceMonthRecord>({}) // 月度社保表
const latestRecordId = ref<number>() // 最近月度社保表编号
const list = ref<InsuranceMonthEmployeeRecord[]>([]) // 员工列表
const pagingRef = ref<any>() // 分页组件引用
const tabIndex = ref(0) // 当前 tab
const selectedIds = ref<number[]>([]) // 选中的员工月度社保编号
const batchActionVisible = ref(false) // 批量操作菜单
const deleting = ref(false) // 删除中
const queryParams = ref<Record<string, any>>({}) // 查询参数
const addEmployeeFormRef = ref<InstanceType<typeof AddEmployeeForm>>() // 添加参保
const batchFormRef = ref<InstanceType<typeof BatchEmployeeForm>>() // 批量调整

const editable = computed(() => monthRecord.value.status === HrmInsuranceMonthStatus.UNARCHIVED)
const canDelete = computed(() => { // 仅最近未归档月表可删
  return !!props.id
    && Number(props.id) === latestRecordId.value
    && editable.value
    && hasAccessByCodes(['hrm:insurance:month-record:delete'])
})
const statusTabs = computed(() => [ // 参保状态页签
  {
    label: '正常参保',
    value: HrmInsuranceEmployeeStatus.NORMAL,
    count: monthRecord.value.insuredEmployeeCount ?? 0,
  },
  {
    label: '停止参保',
    value: HrmInsuranceEmployeeStatus.STOPPED,
    count: monthRecord.value.stoppedEmployeeCount ?? 0,
  },
])
const activeStatus = computed(() => statusTabs.value[tabIndex.value]?.value ?? HrmInsuranceEmployeeStatus.NORMAL)
const showBatchBar = computed(() => // 未归档且有更新权限时可批量
  editable.value && hasAccessByCodes(['hrm:insurance:month-record:update']),
)
const showFooter = computed(() => showBatchBar.value || canDelete.value) // 底部操作区
const batchActions = computed(() => {
  const actions = [
    { name: '调整参保方案', value: 'adjust' },
  ]
  if (activeStatus.value === HrmInsuranceEmployeeStatus.NORMAL) {
    actions.push({ name: '停止参保', value: 'stop' })
  }
  return actions
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/insurance/month-record/index')
}

/** 是否已选 */
function isSelected(id?: number) {
  return id != null && selectedIds.value.includes(id)
}

/** 切换选中 */
function toggleSelect(item: InsuranceMonthEmployeeRecord) {
  if (item.id == null || !showBatchBar.value) {
    return
  }
  if (isSelected(item.id)) {
    selectedIds.value = selectedIds.value.filter(id => id !== item.id)
    return
  }
  selectedIds.value = [...selectedIds.value, item.id]
}

/** 加载月度社保表 */
async function getMonthRecord() {
  if (!props.id) {
    return
  }
  const [detail, latest] = await Promise.all([
    getInsuranceMonthRecord(Number(props.id)),
    getLastInsuranceMonthRecord(),
  ])
  monthRecord.value = detail
  latestRecordId.value = latest?.id
}

/** 删除最新月度社保表 */
async function handleDelete() {
  if (!props.id || !canDelete.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除“${monthRecord.value.title || '当前社保表'}”吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteInsuranceMonthRecord(Number(props.id))
    toast.success('删除成功')
    uni.$emit('hrm:insurance:month-record:reload')
    navigateBackPlus('/pages-hrm/insurance/month-record/index')
  } finally {
    deleting.value = false
  }
}

/** 查询员工月度社保列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.id) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getInsuranceMonthEmployeeRecordPage({
      ...queryParams.value,
      monthRecordId: Number(props.id),
      status: activeStatus.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
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

/** 点击汇总切换状态 */
function handleStatusChange(status: number) {
  const index = statusTabs.value.findIndex(tab => tab.value === status)
  if (index < 0) {
    return
  }
  tabIndex.value = index
  selectedIds.value = []
  reload()
}

/** 重新加载员工列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 刷新月度社保数据 */
async function refreshData() {
  selectedIds.value = []
  await getMonthRecord()
  reload()
}

/** 查看员工参保详情 */
function handleEmployeeDetail(item: InsuranceMonthEmployeeRecord) {
  if (!item.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/insurance/month-record/employee/detail/index?id=${item.id}&editable=${editable.value ? 1 : 0}`,
  })
}

/** 添加参保人员 */
function handleAddEmployee() {
  if (!props.id) {
    return
  }
  addEmployeeFormRef.value?.open(Number(props.id))
}

/** 批量操作 */
async function handleBatchAction({ item }: { item: { value: string } }) {
  if (!selectedIds.value.length) {
    return
  }
  if (item.value === 'adjust') {
    batchFormRef.value?.open(selectedIds.value)
    return
  }
  if (item.value === 'stop') {
    try {
      await dialog.confirm({
        title: '提示',
        msg: `确认停止选中的 ${selectedIds.value.length} 名员工参保吗？`,
      })
    } catch {
      return
    }
    await stopInsuranceMonthEmployeeRecordList({ ids: selectedIds.value })
    toast.success('停止参保成功')
    await refreshData()
  }
}

/** 批量调整成功 */
function handleBatchSuccess() {
  refreshData()
}

/** 初始化 */
onMounted(async () => {
  await getMonthRecord()
  uni.$on('hrm:insurance:month-employee:reload', refreshData)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:insurance:month-employee:reload', refreshData)
})
</script>
