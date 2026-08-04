<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="navbarTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 员工摘要 -->
    <view class="bg-white px-24rpx py-24rpx">
      <view class="mb-12rpx text-36rpx text-[#333] font-semibold">
        {{ employee.employeeName || '-' }}的绩效档案
      </view>
      <view class="mb-8rpx text-28rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">部门：</text>{{ employee.deptName || '-' }}
      </view>
      <view class="mb-8rpx text-28rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">职位：</text>{{ employee.postName || '-' }}
      </view>
      <view class="mb-8rpx text-28rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">工号：</text>{{ employee.jobNumber || '-' }}
      </view>
      <view class="flex items-center text-28rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">聘用形式：</text>
        <dict-tag
          v-if="employee.employeeType != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
          :value="employee.employeeType"
        />
        <text v-else>-</text>
      </view>
    </view>

    <!-- 搜索组件 -->
    <SearchEmployeeForm @search="handleQuery" @reset="handleReset" />

    <!-- 考核记录列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无归档考核"
      @query="queryList"
    >
      <view class="p-24rpx" :class="canSelect ? 'pb-160rpx' : ''">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="flex items-start gap-16rpx">
            <view
              v-if="canSelect"
              class="mt-4rpx shrink-0"
              @click.stop="toggleSelect(item.id)"
            >
              <wd-checkbox :model-value="isSelected(item.id)" />
            </view>
            <view class="min-w-0 flex-1" @click.stop="handleAssessmentDetail(item)">
              <view class="mb-12rpx flex items-start justify-between gap-16rpx">
                <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                  {{ item.name || '-' }}
                </view>
                <wd-tag type="primary" plain>
                  已归档
                </wd-tag>
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">周期类型：</text>{{ formatHrmPerformanceCycleType(item.cycleType) }}
              </view>
              <view class="mb-12rpx text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">考核周期：</text>{{ item.cycle || '-' }}
              </view>
              <view class="text-28rpx text-[#666]">
                <text class="mr-8rpx text-[#999]">评分：</text>{{ item.score ?? '-' }}
                <text class="mx-8rpx text-[#ddd]">|</text>
                <text class="mr-8rpx text-[#999]">结果：</text>{{ item.resultLevel || '-' }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 批量删除 -->
    <view v-if="canSelect" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
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
          type="danger"
          :disabled="!selectedIds.length"
          @click="handleDelete(selectedIds)"
        >
          批量删除({{ selectedIds.length }})
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type {
  PerformanceArchiveEmployee,
  PerformanceAssessment,
} from '@/api/hrm/performance/assessment'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  deletePerformanceArchiveRecords,
  getPerformanceAssessmentArchivePage,
} from '@/api/hrm/performance/assessment'
import { useAccess } from '@/hooks/useAccess'
import { formatHrmPerformanceCycleType } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchEmployeeForm from '../components/search-employee-form.vue'

const props = defineProps<{
  employeeId?: number | string
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
const list = ref<PerformanceAssessment[]>([]) // 归档考核列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const selectedIds = ref<number[]>([]) // 选中的考核编号
const canSelect = computed(() => hasAccessByCodes(['hrm:performance:archive:delete'])) // 可批量删除
const employee = ref<PerformanceArchiveEmployee>({
  employeeId: Number(props.employeeId) || 0,
  employeeName: '',
  assessmentCount: 0,
}) // 员工摘要
const navbarTitle = computed(() => { // 导航标题
  return employee.value.employeeName ? `${employee.value.employeeName}的绩效档案` : '员工绩效档案'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/performance/assessment/index')
}

/** 是否已选中 */
function isSelected(id?: number) {
  return id != null && selectedIds.value.includes(id)
}

/** 切换选中 */
function toggleSelect(id?: number) {
  if (id == null) {
    return
  }
  if (isSelected(id)) {
    selectedIds.value = selectedIds.value.filter(item => item !== id)
    return
  }
  selectedIds.value = [...selectedIds.value, id]
}

/** 同步员工摘要 */
function syncEmployee(rows: PerformanceAssessment[], count: number) {
  const assessment = rows[0]
  if (!assessment) {
    employee.value.assessmentCount = count
    return
  }
  employee.value = {
    ...employee.value,
    employeeName: assessment.employeeName || '',
    jobNumber: assessment.jobNumber,
    deptName: assessment.deptName,
    postName: assessment.postName,
    employeeType: assessment.employeeType,
    assessmentCount: count,
  }
}

/** 查询员工归档考核 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.employeeId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getPerformanceAssessmentArchivePage({
      ...queryParams.value,
      employeeId: Number(props.employeeId),
      pageNo,
      pageSize,
    })
    selectedIds.value = []
    syncEmployee(data.list, data.total)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 打开单次考核详情 */
function handleAssessmentDetail(item: PerformanceAssessment) {
  if (!item.id || !props.employeeId) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/performance/assessment/detail/index?id=${item.id}&employeeId=${props.employeeId}&archived=true`,
  })
}

/** 删除考核记录 */
async function handleDelete(ids: number[]) {
  const validIds = ids.filter(id => id != null)
  if (!validIds.length) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除选中的 ${validIds.length} 条归档考核？`,
    })
  } catch {
    return
  }
  await deletePerformanceArchiveRecords(validIds)
  toast.success('删除成功')
  selectedIds.value = []
  uni.$emit('hrm-performance-archive-refresh')
  try {
    const data = await getPerformanceAssessmentArchivePage({
      ...queryParams.value,
      employeeId: Number(props.employeeId),
      pageNo: 1,
      pageSize: 1,
    })
    if (!data.total) {
      handleBack()
      return
    }
  } catch {
    // 查询失败时仍刷新当前列表
  }
  reload()
}

/** 列表刷新 */
function handleRefresh() {
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm-performance-archive-refresh', handleRefresh)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm-performance-archive-refresh', handleRefresh)
})
</script>
