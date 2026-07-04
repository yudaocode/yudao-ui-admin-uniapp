<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="告警记录" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 告警记录列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无告警记录数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.configName || '告警记录' }}
            </view>
            <view class="shrink-0">
              <dict-tag :type="DICT_TYPE.IOT_ALERT_LEVEL" :value="item.configLevel" />
            </view>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">产品：</text>
            {{ productLabel(item) }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">设备：</text>
            {{ deviceLabel(item) }}
          </view>
          <view class="flex items-center justify-between">
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="item.processStatus" />
            <text class="text-24rpx text-[#999]">
              {{ formatDateTime(item.createTime) || '-' }}
            </text>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { AlertRecord } from '@/api/iot/alert/record'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getAlertRecordPage } from '@/api/iot/alert/record'
import { getSimpleDeviceList } from '@/api/iot/device/device'
import { getSimpleProductList } from '@/api/iot/product/product'
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
const list = ref<AlertRecord[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const productMap = ref<Record<string, string>>({}) // 产品 ID→名称
const deviceMap = ref<Record<string, string>>({}) // 设备 ID→名称

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 产品名称（记录仅返回 ID，本地解析） */
function productLabel(record: AlertRecord) {
  return record.productName || (record.productId != null ? productMap.value[String(record.productId)] || String(record.productId) : '-')
}

/** 设备名称（记录仅返回 ID，本地解析） */
function deviceLabel(record: AlertRecord) {
  return record.deviceName || (record.deviceId != null ? deviceMap.value[String(record.deviceId)] || String(record.deviceId) : '-')
}

/** 查询告警记录列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getAlertRecordPage({ ...queryParams.value, pageNo, pageSize })
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

/** 查看详情 */
function handleDetail(item: AlertRecord) {
  uni.navigateTo({ url: `/pages-iot/alert/record/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(async () => {
  uni.$on('iot:alert-record:reload', reload)
  const [products, devices] = await Promise.all([getSimpleProductList(), getSimpleDeviceList()])
  productMap.value = Object.fromEntries(products.map(item => [String(item.id), item.name || '']))
  deviceMap.value = Object.fromEntries(devices.map(item => [String(item.id), item.deviceName || '']))
})

/** 卸载 */
onUnload(() => {
  uni.$off('iot:alert-record:reload', reload)
})
</script>
