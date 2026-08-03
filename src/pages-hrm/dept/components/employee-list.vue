<template>
  <view class="min-h-0 flex flex-1 flex-col">
    <!-- 搜索组件 -->
    <EmployeeSearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 员工列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无员工数据"
      @query="queryList"
    >
      <view class="p-24rpx pb-160rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx truncate text-32rpx text-[#333] font-semibold">
            {{ item.name || '-' }}
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
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">聘用形式：</text>
            <dict-tag v-if="item.type != null" :type="DICT_TYPE.HRM_EMPLOYEE_TYPE" :value="item.type" />
            <text v-else>-</text>
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">入职时间：</text>{{ formatDateTime(item.entryTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { Employee } from '@/api/hrm/employee'
import { ref, watch } from 'vue'
import { getEmployeePage } from '@/api/hrm/employee'
import { HrmEmployeeStatusTab } from '@/pages-hrm/utils/constants'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import EmployeeSearchForm from './employee-search-form.vue'

const props = defineProps<{
  deptId: number
}>()

const list = ref<Employee[]>([]) // 员工列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 查询员工列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.deptId) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getEmployeePage({
      ...queryParams.value,
      pageNo,
      pageSize,
      deptId: props.deptId,
      statusCategory: HrmEmployeeStatusTab.ACTIVE,
    })
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

/** 查看员工详情 */
function handleDetail(item: Employee) {
  if (!item.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-hrm/employee/detail/index?id=${item.id}`,
  })
}

/** 部门切换后刷新列表 */
watch(() => props.deptId, () => {
  queryParams.value = {}
  reload()
})
</script>
