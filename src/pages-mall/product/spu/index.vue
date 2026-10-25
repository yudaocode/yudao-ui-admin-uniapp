<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商品管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm :initial-category-id="categoryId" @search="handleQuery" @reset="handleReset" />

    <!-- 商品状态 tab -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" @change="handleTabChange">
        <wd-tab
          v-for="tab in SPU_TABS"
          :key="tab.value"
          :title="`${tab.label}(${tabCounts[tab.value] ?? 0})`"
        />
      </wd-tabs>
    </view>

    <!-- 分页列表 -->
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
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="flex items-start gap-20rpx">
            <view v-if="item.picUrl" class="shrink-0">
              <wd-img :src="item.picUrl" width="140rpx" height="140rpx" radius="8rpx" mode="aspectFill" />
            </view>
            <view class="min-w-0 flex-1">
              <view class="mb-12rpx flex items-start justify-between gap-16rpx">
                <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                  {{ item.name || '-' }}
                </view>
                <dict-tag v-if="item.status != null" :type="DICT_TYPE.PRODUCT_SPU_STATUS" :value="item.status" />
              </view>
              <view class="mb-12rpx text-34rpx text-[#fa8c16] font-semibold">
                {{ formatDisplayMoney(item.price) }}
              </view>
              <view class="flex items-center gap-24rpx text-26rpx text-[#666]">
                <text>库存：{{ item.stock ?? '-' }}</text>
                <text>销量：{{ item.salesCount ?? '-' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['product:spu:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { ProductSpu } from '@/api/mall/product/spu'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getProductSpuPage, getProductSpuTabsCount } from '@/api/mall/product/spu'
import { useAccess } from '@/hooks/useAccess'
import { formatDisplayMoney } from '@/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

const props = defineProps<{ categoryId?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const SPU_TABS = [ // 商品状态 tab（value 即后端 tabType；count 由 get-count 返回）
  { label: '出售中', value: 0 },
  { label: '仓库中', value: 1 },
  { label: '已售罄', value: 2 },
  { label: '警戒库存', value: 3 },
  { label: '回收站', value: 4 },
]

const { hasAccessByCodes } = useAccess()
const list = ref<ProductSpu[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const tabIndex = ref(0) // 当前 tab 下标
const tabCounts = ref<Record<number, number>>({}) // 各 tab 商品数量（key 为 tabType）
const queryParams = ref<Record<string, any>>({}) // 查询参数（搜索表单部分：name）
const categoryId = ref<number | undefined>(props.categoryId ? parseId(props.categoryId) : undefined) // 分类筛选（路由深链 + 搜索表单共用）
const tabType = computed(() => SPU_TABS[tabIndex.value].value) // 当前 tabType

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询商品列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getProductSpuPage({
      ...queryParams.value,
      tabType: tabType.value,
      categoryId: categoryId.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 加载各 tab 数量（带上当前筛选条件，与列表口径一致） */
async function loadTabCounts() {
  const res = await getProductSpuTabsCount({ ...queryParams.value, categoryId: categoryId.value })
  const counts: Record<number, number> = {}
  Object.keys(res || {}).forEach((key) => {
    counts[Number(key)] = Number(res[key]) || 0
  })
  tabCounts.value = counts
}

/** 搜索按钮操作 */
function handleQuery(data: Record<string, any> = {}) {
  // categoryId 单独维护（与路由深链共用），其余进 queryParams
  const { categoryId: cid, ...rest } = data
  categoryId.value = cid
  queryParams.value = { ...rest }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  reload()
}

/** 重新加载（同时刷新数量） */
function reload() {
  loadTabCounts()
  pagingRef.value?.reload()
}

/** 新增商品 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mall/product/spu/form/index' })
}

/** 查看详情 */
function handleDetail(item: ProductSpu) {
  uni.navigateTo({ url: `/pages-mall/product/spu/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  loadTabCounts()
  uni.$on('mall:product-spu:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:product-spu:reload', reload)
})
</script>
