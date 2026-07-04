<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="产品分类" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 产品分类列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无产品分类数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm" @click="handleDetail(item)">
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <view class="shrink-0">
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
          </view>
          <view class="mb-12rpx flex text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">分类编号：</text>{{ item.id }}
          </view>
          <view class="mb-12rpx flex text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">排序：</text>{{ item.sort }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">描述：</text>{{ item.description || '-' }}
          </view>
          <view class="text-24rpx text-[#999]">
            创建时间：{{ formatDateTime(item.createTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab v-if="hasAccessByCodes(['iot:product-category:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { ProductCategory } from '@/api/iot/product/category'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getProductCategoryPage } from '@/api/iot/product/category'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<ProductCategory[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询产品分类列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getProductCategoryPage({ ...queryParams.value, pageNo, pageSize })
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

/** 新增产品分类 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-iot/product/category/form/index' })
}

/** 查看详情 */
function handleDetail(item: ProductCategory) {
  uni.navigateTo({ url: `/pages-iot/product/category/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('iot:product-category:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('iot:product-category:reload', reload)
})
</script>
