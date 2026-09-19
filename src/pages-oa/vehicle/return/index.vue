<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="还车申请"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 还车申请列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无还车申请"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-center justify-between gap-12rpx">
            <text class="line-clamp-1 min-w-0 flex-1 text-32rpx text-[#333] font-semibold">{{ item.no || `还车申请 #${item.id}` }}</text>
            <text v-if="item.status === OA_APPLY_STATUS.NOT_START" class="shrink-0 text-24rpx text-[#999]">未提交</text>
            <dict-tag v-else :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">车牌号：</text>
            <text>{{ item.vehicleNo || '-' }}</text>
            <text v-if="item.applyNo" class="ml-16rpx text-[#999]">用车单：{{ item.applyNo }}</text>
          </view>
          <view class="flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">实际回车：</text>
            <text>{{ formatDateTime(item.actualReturnTime) || '-' }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['oa:vehicle-return:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { VehicleReturn } from '@/api/oa/vehicle/return'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getVehicleReturnPage } from '@/api/oa/vehicle/return'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { OA_APPLY_STATUS } from '../../utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<VehicleReturn[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询还车申请列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getVehicleReturnPage({
      ...queryParams.value,
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
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增还车申请 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-oa/vehicle/return/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: VehicleReturn) {
  uni.navigateTo({
    url: `/pages-oa/vehicle/return/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:vehicle-return:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:vehicle-return:reload', reload)
})
</script>
