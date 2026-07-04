<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="产品管理" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 产品列表 -->
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无产品数据" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm" @click="handleDetail(item)">
          <view class="p-24rpx">
            <view class="mb-18rpx flex items-start gap-20rpx">
              <view class="h-88rpx w-88rpx flex shrink-0 items-center justify-center rounded-12rpx bg-[#f3f6fb]">
                <wd-img v-if="item.icon" :src="item.icon" width="88rpx" height="88rpx" radius="12rpx" mode="aspectFill" />
                <wd-icon v-else name="apps" size="44rpx" color="#4b77f3" />
              </view>
              <view class="min-w-0 flex-1">
                <view class="mb-8rpx flex items-center justify-between gap-16rpx">
                  <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                    {{ item.name }}
                  </view>
                  <dict-tag :type="DICT_TYPE.IOT_PRODUCT_STATUS" :value="item.status" />
                </view>
                <view class="truncate text-24rpx text-[#999]">
                  {{ item.productKey }}
                </view>
              </view>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">产品分类：</text>{{ item.categoryName || '-' }}
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">设备类型：</text>
              <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="item.deviceType" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">接入协议：</text>
              <dict-tag :type="DICT_TYPE.IOT_PROTOCOL_TYPE" :value="item.protocolType" />
            </view>
            <view class="text-right text-24rpx text-[#999]">
              {{ formatDateTime(item.createTime) || '-' }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab v-if="hasAccessByCodes(['iot:product:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/iot/product/product'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getProductPage } from '@/api/iot/product/product'
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
const list = ref<Product[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询产品列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getProductPage({ ...queryParams.value, pageNo, pageSize })
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

/** 新增产品 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-iot/product/product/form/index' })
}

/** 查看详情 */
function handleDetail(item: Product) {
  uni.navigateTo({ url: `/pages-iot/product/product/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('iot:product:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('iot:product:reload', reload)
})
</script>
