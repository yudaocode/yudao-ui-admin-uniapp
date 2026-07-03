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
          商品选择
        </view>
        <wd-button size="small" type="primary" :disabled="selectedCount === 0" @click="handleConfirm">
          确定{{ selectedCount ? `(${selectedCount})` : '' }}
        </wd-button>
      </view>

      <view class="bg-white px-24rpx pb-20rpx">
        <view class="grid grid-cols-2 gap-16rpx">
          <wd-input v-model="queryParams.itemName" placeholder="商品名称" clearable />
          <wd-input v-model="queryParams.itemCode" placeholder="商品编号" clearable />
          <wd-input v-model="queryParams.name" placeholder="规格名称" clearable />
          <wd-input v-model="queryParams.code" placeholder="规格编号" clearable />
        </view>
        <wd-input v-model="queryParams.barCode" class="mt-16rpx" placeholder="条码" clearable />
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
        empty-view-text="暂无商品 SKU"
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
                    {{ item.itemName || '-' }}
                  </view>
                  <view class="mt-4rpx truncate text-26rpx text-[#666]">
                    {{ item.name || '-' }}
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
                <text class="min-w-0 flex-1 truncate">{{ item.code || '-' }}</text>
              </view>
              <view class="mb-8rpx flex text-26rpx text-[#666]">
                <text class="mr-8rpx shrink-0 text-[#999]">条码：</text>
                <text class="min-w-0 flex-1 truncate">{{ item.barCode || '-' }}</text>
              </view>
              <view class="flex text-26rpx text-[#666]">
                <text class="mr-8rpx shrink-0 text-[#999]">品牌：</text>
                <text class="min-w-0 flex-1 truncate">{{ item.brandName || '-' }}</text>
              </view>
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ItemSku } from '@/api/wms/md/item/sku'
import { computed, nextTick, ref } from 'vue'
import { getItemSkuPage } from '@/api/wms/md/item/sku'

const emit = defineEmits<{
  change: [list: ItemSku[]]
}>()

const visible = ref(false) // 选择器显示状态
const list = ref<ItemSku[]>([]) // 当前页 SKU 列表
const selectedMap = ref<Map<number, ItemSku>>(new Map()) // 跨页已选 SKU
const disabledSkuIds = ref<Set<number>>(new Set()) // 已在业务明细中使用的 SKU
const multiple = ref(true) // 是否多选
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref({
  itemName: undefined as string | undefined,
  itemCode: undefined as string | undefined,
  name: undefined as string | undefined,
  code: undefined as string | undefined,
  barCode: undefined as string | undefined,
}) // 查询参数

const selectedCount = computed(() => selectedMap.value.size)

/** 打开选择器 */
async function open(selectedIds: number[] = [], options?: { multiple?: boolean }) {
  disabledSkuIds.value = new Set(selectedIds)
  multiple.value = options?.multiple ?? true
  selectedMap.value = new Map()
  handleResetQuery()
  visible.value = true
  await nextTick()
  reload()
}

/** 查询 SKU 列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getItemSkuPage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
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
    name: undefined,
    code: undefined,
    barCode: undefined,
  }
}

/** 重置搜索 */
function handleReset() {
  handleResetQuery()
  reload()
}

/** 是否已禁用 */
function isDisabled(item: ItemSku) {
  return !!item.id && disabledSkuIds.value.has(item.id)
}

/** 是否已选择 */
function isSelected(item: ItemSku) {
  return !!item.id && selectedMap.value.has(item.id)
}

/** 选择标签文案 */
function getSelectTagText(item: ItemSku) {
  if (isDisabled(item)) {
    return '已添加'
  }
  return isSelected(item) ? '已选' : '选择'
}

/** 选择标签样式 */
function getSelectTagClass(item: ItemSku) {
  if (isDisabled(item)) {
    return 'bg-[#f5f5f5] text-[#bbb]'
  }
  return isSelected(item) ? 'bg-[#e6f4ff] text-[#1677ff]' : 'bg-[#f5f5f5] text-[#999]'
}

/** 切换选择 */
function toggleSelected(item: ItemSku) {
  if (!item.id || isDisabled(item)) {
    return
  }
  const next = new Map(selectedMap.value)
  if (next.has(item.id)) {
    next.delete(item.id)
  } else if (multiple.value) {
    next.set(item.id, item)
  } else {
    next.clear()
    next.set(item.id, item)
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
