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
          库存选择
        </view>
        <wd-button size="small" type="primary" :disabled="selectedCount === 0" @click="handleConfirm">
          确定{{ selectedCount ? `(${selectedCount})` : '' }}
        </wd-button>
      </view>

      <view class="bg-white px-24rpx pb-20rpx">
        <view class="grid grid-cols-2 gap-16rpx">
          <wd-input v-model="queryParams.itemName" placeholder="商品名称" clearable />
          <wd-input v-model="queryParams.itemCode" placeholder="商品编号" clearable />
          <wd-input v-model="queryParams.skuName" placeholder="规格名称" clearable />
          <wd-input v-model="queryParams.skuCode" placeholder="规格编号" clearable />
        </view>
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
        empty-view-text="暂无库存"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.pickerKey"
            class="mb-20rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
            @click="toggleSelected(item)"
          >
            <view class="p-24rpx">
              <view class="mb-12rpx flex items-start justify-between gap-16rpx">
                <view class="min-w-0 flex-1">
                  <view class="truncate text-28rpx text-[#333] font-medium">
                    {{ item.itemName || '-' }}
                  </view>
                  <view class="mt-4rpx truncate text-26rpx text-[#666]">
                    {{ item.skuName || '-' }}
                  </view>
                </view>
                <view
                  class="shrink-0 rounded-999rpx px-16rpx py-6rpx text-24rpx"
                  :class="getSelectTagClass(item)"
                >
                  {{ getSelectTagText(item) }}
                </view>
              </view>
              <view class="mb-8rpx flex text-26rpx text-[#666]">
                <text class="mr-8rpx shrink-0 text-[#999]">商品编号：</text>
                <text class="min-w-0 flex-1 truncate">{{ item.itemCode || '-' }}</text>
              </view>
              <view class="mb-8rpx flex text-26rpx text-[#666]">
                <text class="mr-8rpx shrink-0 text-[#999]">规格编号：</text>
                <text class="min-w-0 flex-1 truncate">{{ item.skuCode || '-' }}</text>
              </view>
              <view class="mb-8rpx flex text-26rpx text-[#666]">
                <text class="mr-8rpx shrink-0 text-[#999]">仓库：</text>
                <text class="min-w-0 flex-1 truncate">{{ item.warehouseName || '-' }}</text>
              </view>
              <view class="flex text-26rpx text-[#666]">
                <text class="mr-8rpx shrink-0 text-[#999]">可用库存：</text>
                <text class="min-w-0 flex-1 truncate">{{ item.availableQuantity ?? 0 }} {{ item.unit || '' }}</text>
              </view>
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Inventory } from '@/api/wms/inventory'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, ref } from 'vue'
import { getInventoryPage } from '@/api/wms/inventory'

export interface InventoryPickerRow extends Inventory {
  availableQuantity?: number
  pickerKey: string
}

const props = defineProps<{
  warehouseId?: number
}>()

const emit = defineEmits<{
  change: [list: InventoryPickerRow[]]
}>()

const toast = useToast()
const visible = ref(false) // 选择器显示状态
const list = ref<InventoryPickerRow[]>([]) // 当前页库存列表
const selectedMap = ref<Map<string, InventoryPickerRow>>(new Map()) // 跨页已选库存
const disabledInventoryKeys = ref<Set<string>>(new Set()) // 已在业务明细中使用的库存
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref({
  itemName: undefined as string | undefined,
  itemCode: undefined as string | undefined,
  skuName: undefined as string | undefined,
  skuCode: undefined as string | undefined,
}) // 查询参数

const selectedCount = computed(() => selectedMap.value.size)

/** 获得业务库存标识 */
function getInventoryKey(row: Pick<Inventory, 'skuId' | 'warehouseId'>) {
  return row.skuId && row.warehouseId ? `${row.skuId}-${row.warehouseId}` : ''
}

/** 打开选择器 */
async function open(selectedInventoryKeys: string[] = []) {
  if (!props.warehouseId) {
    toast.error('请先选择仓库')
    return
  }
  disabledInventoryKeys.value = new Set(selectedInventoryKeys)
  selectedMap.value = new Map()
  handleResetQuery()
  visible.value = true
  await nextTick()
  reload()
}

/** 查询库存列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getInventoryPage({
      ...queryParams.value,
      pageNo,
      pageSize,
      type: 'warehouse',
      warehouseId: props.warehouseId,
      onlyPositiveQuantity: true,
    })
    const rows = data.list.map((item) => {
      const pickerKey = getInventoryKey(item) || `inventory-${item.id}`
      return {
        ...item,
        availableQuantity: item.quantity,
        pickerKey,
      }
    })
    pagingRef.value?.completeByTotal(rows, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 重置查询参数 */
function handleResetQuery() {
  queryParams.value = {
    itemName: undefined,
    itemCode: undefined,
    skuName: undefined,
    skuCode: undefined,
  }
}

/** 重置搜索 */
function handleReset() {
  handleResetQuery()
  reload()
}

/** 是否已禁用 */
function isDisabled(item: InventoryPickerRow) {
  const key = getInventoryKey(item)
  return !!key && disabledInventoryKeys.value.has(key)
}

/** 是否已选择 */
function isSelected(item: InventoryPickerRow) {
  return selectedMap.value.has(item.pickerKey)
}

/** 选择标签文案 */
function getSelectTagText(item: InventoryPickerRow) {
  if (isDisabled(item)) {
    return '已添加'
  }
  return isSelected(item) ? '已选' : '选择'
}

/** 选择标签样式 */
function getSelectTagClass(item: InventoryPickerRow) {
  if (isDisabled(item)) {
    return 'bg-[#f5f5f5] text-[#bbb]'
  }
  return isSelected(item) ? 'bg-[#e6f4ff] text-[#1677ff]' : 'bg-[#f5f5f5] text-[#999]'
}

/** 切换选择 */
function toggleSelected(item: InventoryPickerRow) {
  if (isDisabled(item)) {
    return
  }
  const next = new Map(selectedMap.value)
  if (next.has(item.pickerKey)) {
    next.delete(item.pickerKey)
  } else {
    next.set(item.pickerKey, item)
  }
  selectedMap.value = next
}

/** 取消选择 */
function handleCancel() {
  visible.value = false
}

/** 确认选择 */
function handleConfirm() {
  emit('change', Array.from(selectedMap.value.values()))
  visible.value = false
}

defineExpose({ open })
</script>
