<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="设备管理" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm :default-product-id="props.productId" @search="handleQuery" @reset="handleReset" />

    <!-- 设备列表 -->
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无设备数据" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm" @click="handleDetail(item)">
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ item.deviceName }}
              </view>
              <view class="mt-8rpx truncate text-24rpx text-[#999]">
                {{ item.nickname || '未设置备注' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.IOT_DEVICE_STATE" :value="item.state" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">所属产品：</text>{{ productLabel(item) }}
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">设备类型：</text><dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="item.deviceType" />
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">固件版本：</text>{{ item.firmwareVersion || '-' }}
          </view>
          <view class="text-24rpx text-[#999]">
            创建时间：{{ formatDateTime(item.createTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab v-if="hasAccessByCodes(['iot:device:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { Device } from '@/api/iot/device/device'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getDevicePage } from '@/api/iot/device/device'
import { getSimpleProductList } from '@/api/iot/product/product'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

const props = defineProps<{ productId?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<Device[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ productId: props.productId ? Number(props.productId) : undefined }) // 查询参数
const productMap = ref<Record<string, string>>({}) // 产品 ID→名称

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询设备列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getDevicePage({ ...queryParams.value, pageNo, pageSize })
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

/** 新增设备 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-iot/device/device/form/index' })
}

/** 产品名称（列表接口不返回 productName，本地解析） */
function productLabel(item: Device) {
  return item.productId != null ? productMap.value[String(item.productId)] || String(item.productId) : '-'
}

/** 查看详情 */
function handleDetail(item: Device) {
  uni.navigateTo({ url: `/pages-iot/device/device/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(async () => {
  uni.$on('iot:device:reload', reload)
  const products = await getSimpleProductList()
  productMap.value = Object.fromEntries(products.map(item => [String(item.id), item.name || '']))
})

/** 卸载 */
onUnload(() => {
  uni.$off('iot:device:reload', reload)
})
</script>
