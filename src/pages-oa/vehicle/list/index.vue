<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="车辆信息"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 车辆列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无车辆数据"
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
            <text class="line-clamp-1 min-w-0 flex-1 text-32rpx text-[#333] font-semibold">{{ item.name || item.no }}</text>
            <dict-tag :type="DICT_TYPE.OA_VEHICLE_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">车牌号：</text>
            <text>{{ item.no }}</text>
            <text v-if="item.brandModel" class="ml-16rpx text-[#999]">{{ item.brandModel }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">车辆分类：</text>
            <dict-tag :type="DICT_TYPE.OA_VEHICLE_CATEGORY" :value="item.category" />
            <text v-if="item.seatCount != null" class="ml-16rpx text-[#999]">{{ item.seatCount }} 座</text>
          </view>
          <view class="flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">所属部门：</text>
            <text>{{ item.deptName || '-' }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['oa:vehicle:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Vehicle } from '@/api/oa/vehicle'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getVehiclePage } from '@/api/oa/vehicle'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<Vehicle[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询车辆列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getVehiclePage({
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

/** 新增车辆 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-oa/vehicle/list/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: Vehicle) {
  uni.navigateTo({
    url: `/pages-oa/vehicle/list/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:vehicle:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:vehicle:reload', reload)
})
</script>
