<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar title="库位" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <view v-if="currentLocation" class="bg-[#e6f4ff] px-24rpx py-16rpx text-26rpx text-[#0958d9]">
      当前仓库/库区：{{ currentLocation.warehouseName || '-' }} / {{ currentLocation.name || `#${currentLocation.id}` }}
    </view>
    <SearchForm @search="handleQuery" @reset="handleReset" />
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无库位数据" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm" @click="handleDetail(item)">
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>编码：{{ item.code || '-' }}</view>
              <view>仓库：{{ item.warehouseName || '-' }} / 库区：{{ item.locationName || '-' }}</view>
              <view>面积：{{ item.area ?? '-' }} ㎡ | 载重：{{ item.maxLoad ?? '-' }}kg</view>
              <view>位置：{{ item.positionX ?? '-' }}, {{ item.positionY ?? '-' }}, {{ item.positionZ ?? '-' }}</view>
              <view v-if="item.frozen" class="text-[#f56c6c]">
                已冻结
              </view>
            </view>
            <view class="mt-16rpx flex flex-wrap justify-end gap-16rpx">
              <wd-button
                v-if="hasAccessByCodes(['mes:wm-barcode:query'])"
                size="small"
                type="primary"
                variant="plain"
                @click.stop="handleBarcode(item)"
              >
                条码
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
    <wd-fab v-if="hasAccessByCodes(['mes:wm-warehouse:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
    <BarcodeDetailPopup ref="barcodeDetailPopupRef" />
  </view>
</template>

<script lang="ts" setup>
import type { WmWarehouseArea } from '@/api/mes/wm/warehouse/area'
import type { WmWarehouseLocation } from '@/api/mes/wm/warehouse/location'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getWarehouseAreaPage } from '@/api/mes/wm/warehouse/area'
import { getWarehouseLocation } from '@/api/mes/wm/warehouse/location'
import { useAccess } from '@/hooks/useAccess'
import BarcodeDetailPopup from '@/pages-mes/wm/barcode/components/barcode-detail-popup.vue'
import { navigateBackPlus } from '@/utils'
import { BarcodeBizTypeEnum, DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

const props = defineProps<{
  locationId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<WmWarehouseArea[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmWarehouseArea>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const currentLocation = ref<WmWarehouseLocation>() // 当前库区上下文
const routeLocationId = computed(() => props.locationId ? Number(props.locationId) : undefined) // 路由库区编号
const barcodeDetailPopupRef = ref<InstanceType<typeof BarcodeDetailPopup>>() // 条码弹窗

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getWarehouseAreaPage({
      ...queryParams.value,
      locationId: queryParams.value.locationId ?? routeLocationId.value,
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
  handleQuery({ locationId: currentLocation.value?.id ?? routeLocationId.value })
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增 */
function handleAdd() {
  const warehouseId = currentLocation.value?.warehouseId
  const locationId = currentLocation.value?.id ?? routeLocationId.value
  const query = [
    warehouseId ? `warehouseId=${warehouseId}` : '',
    locationId ? `locationId=${locationId}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-mes/wm/warehouse/area/form/index${query ? `?${query}` : ''}` })
}

/** 查看详情 */
function handleDetail(item: WmWarehouseArea) {
  uni.navigateTo({ url: `/pages-mes/wm/warehouse/area/detail/index?id=${item.id}` })
}

/** 查看条码 */
function handleBarcode(item: WmWarehouseArea) {
  barcodeDetailPopupRef.value?.openByBusiness(
    item.id,
    BarcodeBizTypeEnum.AREA,
    item.code,
    item.name,
  )
}

/** 加载库区上下文 */
async function loadLocationContext() {
  if (!routeLocationId.value) {
    return
  }
  queryParams.value = {
    ...queryParams.value,
    locationId: routeLocationId.value,
  }
  try {
    currentLocation.value = await getWarehouseLocation(routeLocationId.value)
  } catch {}
}

/** 初始化 */
onMounted(async () => {
  await loadLocationContext()
  uni.$on('mes:wm:warehouse-area:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:warehouse-area:reload', reload)
})
</script>
