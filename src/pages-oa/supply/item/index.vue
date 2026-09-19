<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="办公用品"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 用品列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无办公用品"
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
            <text class="shrink-0 text-24rpx" :class="item.status === 0 ? 'text-[#07c160]' : 'text-[#ee0a24]'">
              {{ item.status === 0 ? '正常' : '停用' }}
            </text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">物品编码：</text>
            <text>{{ item.no || '-' }}</text>
            <text v-if="item.model" class="ml-16rpx text-[#999]">{{ item.model }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">类别：</text>
            <dict-tag :type="DICT_TYPE.OA_SUPPLY_CATEGORY" :value="item.category" />
            <dict-tag class="ml-16rpx" :type="DICT_TYPE.OA_SUPPLY_MANAGE_TYPE" :value="item.manageType" />
          </view>
          <view class="flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">库存：</text>
            <text :class="isLowStock(item) ? 'text-[#ee0a24]' : ''">
              {{ item.stockQuantity ?? 0 }}{{ item.unit || '' }}
            </text>
            <text v-if="isLowStock(item)" class="ml-8rpx text-24rpx text-[#ee0a24]">低于预警</text>
            <text class="ml-16rpx mr-8rpx text-[#999]">所属部门：</text>
            <text class="line-clamp-1 min-w-0 flex-1">{{ item.deptName || '-' }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['oa:supply-item:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { SupplyItem } from '@/api/oa/supply-item'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getSupplyItemPage } from '@/api/oa/supply-item'
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
const list = ref<SupplyItem[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 是否低于最低库存预警 */
function isLowStock(item: SupplyItem) {
  return (item.minStockQuantity ?? 0) > 0 && (item.stockQuantity ?? 0) < (item.minStockQuantity ?? 0)
}

/** 查询用品列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getSupplyItemPage({
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

/** 新增用品 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-oa/supply/item/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: SupplyItem) {
  uni.navigateTo({
    url: `/pages-oa/supply/item/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:supply-item:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:supply-item:reload', reload)
})
</script>
