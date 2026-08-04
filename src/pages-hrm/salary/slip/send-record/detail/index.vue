<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="navbarTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 发放概览 -->
    <view class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-12rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
          {{ formatHrmYearMonth(record.year, record.month) }}
        </view>
        <view class="shrink-0 text-26rpx text-[#999]">
          已查看 {{ record.readCount ?? 0 }}
        </view>
      </view>
      <view class="grid grid-cols-2 gap-16rpx">
        <view class="rounded-8rpx bg-[#f6ffed] px-16rpx py-16rpx">
          <view class="text-24rpx text-[#999]">
            工资表总人数
          </view>
          <view class="mt-8rpx text-30rpx text-[#52c41a] font-semibold">
            {{ record.employeeCount ?? 0 }}
          </view>
        </view>
        <view class="rounded-8rpx bg-[#e6f4ff] px-16rpx py-16rpx">
          <view class="text-24rpx text-[#999]">
            发放人数
          </view>
          <view class="mt-8rpx text-30rpx text-[#1677ff] font-semibold">
            {{ record.sendEmployeeCount ?? 0 }}
          </view>
        </view>
      </view>
      <view class="mt-16rpx text-26rpx text-[#666]">
        创建人：{{ record.creatorName || '-' }}
      </view>
      <view class="mt-8rpx text-26rpx text-[#666]">
        发放时间：{{ formatDateTime(record.createTime) || '-' }}
      </view>
    </view>

    <!-- 搜索组件 -->
    <view class="mt-16rpx">
      <SearchSlipForm @search="handleQuery" @reset="handleReset" />
    </view>

    <!-- 工资条列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无工资条"
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
            <view class="min-w-0 flex-1" @click.stop="handleSlipDetail(item)">
              <view class="mb-12rpx flex items-start justify-between gap-16rpx">
                <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                  {{ item.employeeName || '-' }}
                </view>
                <dict-tag
                  v-if="item.readStatus != null"
                  :type="DICT_TYPE.HRM_SALARY_SLIP_READ_STATUS"
                  :value="item.readStatus"
                />
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
                <text class="mr-8rpx text-[#999]">手机号：</text>{{ item.mobile || '-' }}
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">实发工资：</text>{{ formatHrmMoney(item.realPaySalary) }}
              </view>
              <view v-if="item.remark" class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">备注：</text>
                <text class="line-clamp-1">{{ item.remark }}</text>
              </view>
              <view class="text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">创建时间：</text>{{ formatDateTime(item.createTime) || '-' }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 批量操作栏 / 删除 -->
    <view v-if="showFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="showBatchBar">
          <wd-button class="flex-1" variant="plain" @click="selectedIds = []">
            已选 {{ selectedIds.length }}
          </wd-button>
          <wd-button
            class="flex-1"
            type="primary"
            :disabled="!selectedIds.length"
            @click="batchActionVisible = true"
          >
            批量操作
          </wd-button>
        </template>
        <wd-button
          v-if="hasAccessByCodes(['hrm:salary:slip:delete'])"
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
      :actions="batchActions"
      @select="handleBatchAction"
    />
  </view>
</template>

<script lang="ts" setup>
import type { SalarySlip } from '@/api/hrm/salary/slip'
import type { SalarySlipSendRecord } from '@/api/hrm/salary/slip/send-record'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getSalarySlipPage, updateSalarySlipRemark } from '@/api/hrm/salary/slip'
import {
  deleteSalarySlipSendRecord,
  getSalarySlipSendRecord,
} from '@/api/hrm/salary/slip/send-record'
import { useAccess } from '@/hooks/useAccess'
import { executeBatch } from '@/pages-hrm/utils/batch'
import { formatHrmMoney, formatHrmYearMonth } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchSlipForm from '../components/search-slip-form.vue'

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
const record = ref<SalarySlipSendRecord>({}) // 发放记录
const list = ref<SalarySlip[]>([]) // 工资条列表
const pagingRef = ref<any>() // 分页组件引用
const selectedIds = ref<number[]>([]) // 已选工资条编号
const batchActionVisible = ref(false) // 批量操作菜单
const deleting = ref(false) // 删除中
const queryParams = ref<Record<string, any>>({
  search: undefined,
  deptId: undefined,
  readStatus: undefined,
  remark: undefined,
}) // 查询参数

const navbarTitle = computed(() => { // 导航标题
  const monthText = formatHrmYearMonth(record.value.year, record.value.month)
  return monthText === '-' ? '发放详情' : `${monthText} 发放详情`
})
const showBatchBar = computed(() => // 有更新权限时可批量
  hasAccessByCodes(['hrm:salary:slip:update']),
)
const showFooter = computed(() => // 底部操作区
  showBatchBar.value || hasAccessByCodes(['hrm:salary:slip:delete']),
)
const batchActions = [ // 批量操作项
  { name: '编辑备注', value: 'editRemark' },
  { name: '清除备注', value: 'clearRemark' },
]

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/salary/slip/send-record/index')
}

/** 是否已选中 */
function isSelected(id?: number) {
  return id != null && selectedIds.value.includes(id)
}

/** 切换选中 */
function toggleSelect(item: SalarySlip) {
  if (!item.id || !showBatchBar.value) {
    return
  }
  if (isSelected(item.id)) {
    selectedIds.value = selectedIds.value.filter(id => id !== item.id)
    return
  }
  selectedIds.value = [...selectedIds.value, item.id]
}

/** 加载发放记录 */
async function getDetail() {
  if (!props.id) {
    return
  }
  record.value = await getSalarySlipSendRecord(Number(props.id))
  reload()
}

/** 删除发放记录 */
async function handleDelete() {
  if (!props.id || !hasAccessByCodes(['hrm:salary:slip:delete'])) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '删除后，本次发放的工资条将同时删除，是否继续？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteSalarySlipSendRecord(Number(props.id))
    toast.success('删除成功')
    navigateBackPlus('/pages-hrm/salary/slip/send-record/index')
  } finally {
    deleting.value = false
  }
}

/** 查询工资条列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!record.value.id) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getSalarySlipPage({
      pageNo,
      pageSize,
      sendRecordId: record.value.id,
      ...queryParams.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
    selectedIds.value = []
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = {
    search: data?.search,
    deptId: data?.deptId,
    readStatus: data?.readStatus,
    remark: data?.remark,
  }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看工资条明细 */
function handleSlipDetail(item: SalarySlip) {
  if (!item.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/salary/slip/send-record/slip/detail/index?id=${item.id}`,
  })
}

/** 批量操作 */
async function handleBatchAction({ item }: { item: { value: string } }) {
  if (item.value === 'editRemark') {
    await handleBatchRemark(false)
    return
  }
  if (item.value === 'clearRemark') {
    await handleBatchRemark(true)
  }
}

/** 批量修改备注 */
async function handleBatchRemark(clear: boolean) {
  if (!selectedIds.value.length) {
    return
  }
  let remark = ''
  try {
    if (clear) {
      await dialog.confirm({
        title: '提示',
        msg: '确认清除所选工资条的备注？',
      })
    } else {
      const result = await dialog.prompt({
        title: '编辑备注',
        msg: '请输入备注',
        inputProps: { maxlength: 500, placeholder: '请输入备注' },
      })
      remark = String(result.value || '')
      if (remark.length > 500) {
        toast.warning('备注不能超过 500 个字符')
        return
      }
    }
  } catch {
    return
  }
  const hasSuccess = await executeBatch(
    selectedIds.value.map(id => updateSalarySlipRemark({ id, remark })),
  )
  if (hasSuccess) {
    reload()
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
