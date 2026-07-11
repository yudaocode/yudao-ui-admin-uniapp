<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 82vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 顶部操作 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="handleCancel">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          选择库存物资
        </view>
        <wd-button size="small" type="primary" :disabled="selectedList.length === 0" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.batchCode" placeholder="批次号" clearable />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 物料库存列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="10"
        :refresher-enabled="true"
        :inside-more="!props.positiveOnly"
        :hide-empty-view="canLoadNextPage"
        :loading-more-default-as-loading="true"
        :show-default-loading-more-text="!canLoadNextPage"
        :to-bottom-loading-more-enabled="!canLoadNextPage"
        empty-view-text="暂无库存物资"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
            @click="toggleSelected(item)"
          >
            <view class="p-24rpx">
              <view class="mb-12rpx flex items-start justify-between gap-16rpx">
                <view class="min-w-0 flex-1">
                  <view class="truncate text-28rpx text-[#333] font-medium">
                    {{ item.itemCode || '-' }}
                  </view>
                  <view class="mt-4rpx truncate text-26rpx text-[#666]">
                    {{ item.itemName || '-' }}
                  </view>
                </view>
                <view
                  class="shrink-0 rounded-999rpx px-16rpx py-6rpx text-24rpx"
                  :class="isSelected(item) ? 'bg-[#e6f4ff] text-[#1677ff]' : 'bg-[#f5f5f5] text-[#999]'"
                >
                  {{ isSelected(item) ? '已选' : '选择' }}
                </view>
              </view>
              <view class="mb-8rpx flex text-26rpx text-[#666]">
                <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
                <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
              </view>
              <view class="mb-8rpx flex text-26rpx text-[#666]">
                <text class="mr-8rpx shrink-0 text-[#999]">批次号：</text>
                <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
              </view>
              <view class="mb-8rpx flex text-26rpx text-[#666]">
                <text class="mr-8rpx shrink-0 text-[#999]">在库数量：</text>
                <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }} {{ item.unitMeasureName || '' }}</text>
              </view>
              <view class="flex text-26rpx text-[#666]">
                <text class="mr-8rpx shrink-0 text-[#999]">库存位置：</text>
                <text class="min-w-0 flex-1 truncate">{{ getStockPlaceText(item) }}</text>
              </view>
            </view>
          </view>
          <view v-if="canLoadNextPage" class="py-32rpx text-center">
            <wd-button size="small" variant="plain" @click="handleLoadNextPage">
              加载下一页
            </wd-button>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { WmMaterialStock } from '@/api/mes/wm/materialstock'
import { ref } from 'vue'
import { getMaterialStockPage } from '@/api/mes/wm/materialstock'

const props = withDefaults(defineProps<{
  multiple?: boolean
  itemId?: number
  batchId?: number
  warehouseId?: number
  locationId?: number
  areaId?: number
  vendorId?: number
  virtualFilter?: 'exclude' | 'only' | 'all'
  positiveOnly?: boolean
}>(), {
  multiple: true,
  virtualFilter: 'all',
  positiveOnly: false,
})

const emit = defineEmits<{
  confirm: [rows: WmMaterialStock[]]
}>()

const visible = ref(false) // 弹窗显示状态
const list = ref<WmMaterialStock[]>([]) // 库存列表
const selectedList = ref<WmMaterialStock[]>([]) // 已选库存
const presetSelectedIds = ref<number[]>([]) // 打开时预选库存编号
const pagingRef = ref<ZPagingRef<WmMaterialStock>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const openFilters = ref<Record<string, any>>({}) // 本次打开透传过滤条件
const canLoadNextPage = ref(false) // 当前过滤模式仍有后续页

/** 打开选择器 */
function open(selectedIds: number[] = [], filters: Record<string, any> = {}) {
  visible.value = true
  presetSelectedIds.value = selectedIds
  openFilters.value = filters
  selectedList.value = []
  queryParams.value = createDefaultQueryParams(filters)
  reload()
}

/** 查询库存列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (pageNo === 1) {
    canLoadNextPage.value = false
  }
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
      frozen: false,
    }
    const data = await getMaterialStockPage(params)
    const rows = props.positiveOnly
      ? data.list.filter(item => Number(item.quantity) > 0)
      : data.list
    const noMore = pageNo * pageSize >= data.total
    canLoadNextPage.value = props.positiveOnly && !noMore
    applyPresetSelected(rows)
    if (props.positiveOnly) {
      pagingRef.value?.completeByNoMore(rows, noMore)
    } else {
      pagingRef.value?.completeByTotal(rows, data.total)
    }
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  canLoadNextPage.value = false
  pagingRef.value?.reload()
}

/** 加载下一个后端分页 */
function handleLoadNextPage() {
  pagingRef.value?.doLoadMore()
}

/** 搜索按钮操作 */
function handleQuery() {
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = createDefaultQueryParams(openFilters.value)
  reload()
}

/** 库存位置展示 */
function getStockPlaceText(item: WmMaterialStock) {
  return [
    item.warehouseName,
    item.locationName,
    item.areaName,
  ].filter(Boolean).join(' / ') || '-'
}

/** 是否已选择 */
function isSelected(item: WmMaterialStock) {
  return selectedList.value.some(selected => selected.id === item.id)
}

/** 切换选择 */
function toggleSelected(item: WmMaterialStock) {
  if (isSelected(item)) {
    selectedList.value = selectedList.value.filter(selected => selected.id !== item.id)
    return
  }
  if (!props.multiple) {
    selectedList.value = [item]
    return
  }
  selectedList.value = [...selectedList.value, item]
}

/** 取消选择 */
function handleCancel() {
  visible.value = false
}

/** 确认选择 */
function handleConfirm() {
  emit('confirm', selectedList.value)
  visible.value = false
}

/** 回显预选库存 */
function applyPresetSelected(rows: WmMaterialStock[]) {
  if (presetSelectedIds.value.length === 0) {
    return
  }
  const hits = rows.filter(item => presetSelectedIds.value.includes(item.id))
  presetSelectedIds.value = presetSelectedIds.value.filter(id => !hits.some(item => item.id === id))
  if (!props.multiple) {
    if (selectedList.value.length === 0 && hits[0]) {
      selectedList.value = [hits[0]]
    }
    return
  }
  const selectedIds = new Set(selectedList.value.map(item => item.id))
  selectedList.value = [
    ...selectedList.value,
    ...hits.filter(item => !selectedIds.has(item.id)),
  ]
}

/** 默认查询参数 */
function createDefaultQueryParams(filters: Record<string, any> = {}) {
  return {
    itemId: props.itemId,
    batchId: props.batchId,
    warehouseId: props.warehouseId,
    locationId: props.locationId,
    areaId: props.areaId,
    vendorId: props.vendorId,
    virtualFilter: props.virtualFilter === 'all' ? undefined : props.virtualFilter,
    ...filters,
  }
}

defineExpose({
  open,
})
</script>
