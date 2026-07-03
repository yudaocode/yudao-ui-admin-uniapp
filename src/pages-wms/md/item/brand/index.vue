<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商品品牌"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 品牌列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无商品品牌数据"
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
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">品牌编号：</text>
              <text>{{ item.code || '-' }}</text>
            </view>
            <view class="mt-12rpx flex items-center text-24rpx text-[#999]">
              <text>创建时间：{{ formatDateTime(item.createTime) || '-' }}</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['wms:item-brand:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ItemBrand } from '@/api/wms/md/item/brand'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getItemBrandPage } from '@/api/wms/md/item/brand'
import { useAccess } from '@/hooks/useAccess'
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
const list = ref<ItemBrand[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询商品品牌列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getItemBrandPage({
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

/** 新增商品品牌 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-wms/md/item/brand/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: ItemBrand) {
  uni.navigateTo({
    url: `/pages-wms/md/item/brand/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('wms:item-brand:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('wms:item-brand:reload', reload)
})
</script>
