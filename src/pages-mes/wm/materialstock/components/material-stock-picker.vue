<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 82vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
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

      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.batchCode" placeholder="批次号" clearable />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="reload">
            搜索
          </wd-button>
        </view>
      </view>

      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="10"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
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
  try {
    const data = await getMaterialStockPage({
      ...queryParams.value,
      pageNo,
      pageSize,
      frozen: false,
    })
    const rows = props.positiveOnly ? data.list.filter(item => Number(item.quantity) > 0) : data.list
    applyPresetSelected(rows)
    pagingRef.value?.completeByTotal(rows, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 重置搜索 */
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
  if (presetSelectedIds.value.length === 0 || selectedList.value.length > 0) {
    return
  }
  selectedList.value = rows.filter(item => presetSelectedIds.value.includes(item.id))
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
