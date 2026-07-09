<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar title="库区" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <view v-if="currentWarehouse" class="bg-[#e6f4ff] px-24rpx py-16rpx text-26rpx text-[#0958d9]">
      当前仓库：{{ currentWarehouse.name || `#${currentWarehouse.id}` }}
    </view>
    <SearchForm @search="handleQuery" @reset="handleReset" />
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无库区数据" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm" @click="handleDetail(item)">
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <view v-if="item.frozen" class="text-24rpx text-[#f56c6c]">
                已冻结
              </view>
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>编码：{{ item.code || '-' }}</view>
              <view>所属仓库：{{ item.warehouseName || '-' }}</view>
              <view>面积：{{ item.area ?? '-' }} ㎡</view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
            </view>
            <view class="mt-16rpx flex flex-wrap justify-end gap-16rpx">
              <wd-button
                v-if="hasAccessByCodes(['mes:wm-warehouse:query'])"
                size="small"
                type="primary"
                variant="plain"
                @click.stop="handleArea(item)"
              >
                库位
              </wd-button>
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

    <!-- 条码详情弹窗 -->
    <BarcodeDetailPopup ref="barcodeDetailPopupRef" />
  </view>
</template>

<script lang="ts" setup>
import type { WmWarehouseLocation } from '@/api/mes/wm/warehouse/location'
import type { WmWarehouse } from '@/api/mes/wm/warehouse'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getWarehouseLocationPage } from '@/api/mes/wm/warehouse/location'
import { getWarehouse } from '@/api/mes/wm/warehouse'
import { useAccess } from '@/hooks/useAccess'
import BarcodeDetailPopup from '@/pages-mes/wm/barcode/components/barcode-detail-popup.vue'
import { navigateBackPlus } from '@/utils'
import { BarcodeBizTypeEnum } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

const props = defineProps<{
  warehouseId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<WmWarehouseLocation[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmWarehouseLocation>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const currentWarehouse = ref<WmWarehouse>() // 当前仓库上下文
const routeWarehouseId = computed(() => props.warehouseId ? Number(props.warehouseId) : undefined) // 路由仓库编号
const barcodeDetailPopupRef = ref<InstanceType<typeof BarcodeDetailPopup>>() // 条码弹窗

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getWarehouseLocationPage({
      ...queryParams.value,
      warehouseId: queryParams.value.warehouseId ?? routeWarehouseId.value,
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
  handleQuery({ warehouseId: currentWarehouse.value?.id ?? routeWarehouseId.value })
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增 */
function handleAdd() {
  const warehouseId = currentWarehouse.value?.id ?? routeWarehouseId.value
  const query = warehouseId ? `?warehouseId=${warehouseId}` : ''
  uni.navigateTo({ url: `/pages-mes/wm/warehouse/location/form/index${query}` })
}

/** 查看详情 */
function handleDetail(item: WmWarehouseLocation) {
  uni.navigateTo({ url: `/pages-mes/wm/warehouse/location/detail/index?id=${item.id}` })
}

/** 查看库位 */
function handleArea(item: WmWarehouseLocation) {
  uni.navigateTo({ url: `/pages-mes/wm/warehouse/area/index?locationId=${item.id}` })
}

/** 查看条码 */
function handleBarcode(item: WmWarehouseLocation) {
  barcodeDetailPopupRef.value?.openByBusiness(
    item.id,
    BarcodeBizTypeEnum.LOCATION,
    item.code,
    item.name,
  )
}

/** 加载仓库上下文 */
async function loadWarehouseContext() {
  if (!routeWarehouseId.value) {
    return
  }
  queryParams.value = {
    ...queryParams.value,
    warehouseId: routeWarehouseId.value,
  }
  try {
    currentWarehouse.value = await getWarehouse(routeWarehouseId.value)
  } catch {}
}

/** 初始化 */
onMounted(async () => {
  await loadWarehouseContext()
  uni.$on('mes:wm:warehouse-location:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:warehouse-location:reload', reload)
})
</script>
