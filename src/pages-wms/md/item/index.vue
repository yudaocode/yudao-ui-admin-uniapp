<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商品管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 商品列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无商品数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
              {{ item.name || '-' }}
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">商品编号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.code || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">分类：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.categoryName || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">品牌：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.brandName || '-' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">单位：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.unit || '-' }}</text>
            </view>
            <view v-if="item.skus?.length" class="mt-18rpx rounded-8rpx bg-[#f8fafc] p-16rpx">
              <view class="mb-12rpx flex items-center justify-between text-24rpx text-[#999]">
                <text>规格 {{ item.skus.length }} 个</text>
                <text>创建时间：{{ formatDateTime(item.createTime) || '-' }}</text>
              </view>
              <view
                v-for="sku in getPreviewSkus(item)"
                :key="sku.id || sku.code || sku.name"
                class="border-t border-[#eef2f7] py-12rpx first:border-t-0 first:pt-0 last:pb-0"
              >
                <view class="mb-8rpx flex items-center justify-between gap-12rpx text-26rpx">
                  <text class="min-w-0 flex-1 truncate text-[#333]">{{ sku.name || '默认规格' }}</text>
                  <text class="shrink-0 text-[#999]">{{ sku.code || '-' }}</text>
                </view>
                <view class="grid grid-cols-2 gap-y-6rpx text-22rpx text-[#999]">
                  <text>成本：{{ formatPrice(sku.costPrice) || '-' }}</text>
                  <text>销售：{{ formatPrice(sku.sellingPrice) || '-' }}</text>
                  <text>净重：{{ formatWeight(sku.netWeight) || '-' }}</text>
                  <text>毛重：{{ formatWeight(sku.grossWeight) || '-' }}</text>
                </view>
                <view v-if="formatDimensionText(sku.length, sku.width, sku.height)" class="mt-6rpx text-22rpx text-[#999]">
                  长宽高：{{ formatDimensionText(sku.length, sku.width, sku.height) }}
                </view>
              </view>
              <view v-if="item.skus.length > previewSkuLimit" class="mt-12rpx text-22rpx text-[#999]">
                还有 {{ item.skus.length - previewSkuLimit }} 个规格，进入详情查看
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['wms:item:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Item } from '@/api/wms/md/item'
import type { ItemSku } from '@/api/wms/md/item/sku'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getItemPage } from '@/api/wms/md/item'
import { useAccess } from '@/hooks/useAccess'
import { formatDimensionText, formatPrice, formatWeight } from '@/pages-wms/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const previewSkuLimit = 2 // 列表中预览的规格数量
const list = ref<Item[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询商品列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getItemPage({
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

/** 获取列表预览规格 */
function getPreviewSkus(item: Item): ItemSku[] {
  return (item.skus || []).slice(0, previewSkuLimit)
}

/** 新增商品 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-wms/md/item/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: Item) {
  uni.navigateTo({
    url: `/pages-wms/md/item/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('wms:item:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('wms:item:reload', reload)
})
</script>
