<template>
  <wd-popup v-model="visible" position="bottom" root-portal custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;">
    <view class="h-full flex flex-col">
      <view class="flex items-center justify-between px-24rpx py-20rpx">
        <text class="text-32rpx text-[#333] font-semibold">选择办公用品</text>
        <wd-icon name="close" size="32rpx" color="#999" @click="visible = false" />
      </view>
      <view class="px-24rpx pb-16rpx">
        <wd-search v-model="keyword" placeholder="搜索物品名称" hide-cancel @search="handleSearch" @clear="handleSearch" />
      </view>
      <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" empty-view-text="暂无可领用用品" @query="queryList">
        <view class="p-24rpx pt-0">
          <view v-for="item in list" :key="item.id" class="mb-16rpx flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx" @click="handleSelect(item)">
            <view class="min-w-0 flex-1">
              <view class="line-clamp-1 text-30rpx text-[#333] font-semibold">
                {{ item.name }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ item.model || '-' }} · 库存 {{ item.stockQuantity ?? 0 }}{{ item.unit || '' }}
              </view>
            </view>
            <wd-icon v-if="selectedIds.includes(item.id)" name="check" size="32rpx" color="#1677ff" />
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { SupplyItem } from '@/api/oa/supply/item'
import { ref, watch } from 'vue'
import { getSupplyItemSelectPage } from '@/api/oa/supply/item'

const props = defineProps<{ selectedIds: number[] }>()
const emit = defineEmits<{ select: [item: SupplyItem] }>()
const visible = defineModel<boolean>({ default: false })
const list = ref<SupplyItem[]>([]) // 可领用用品列表
const pagingRef = ref<any>() // 分页组件引用
const keyword = ref('') // 搜索关键词

watch(visible, (value) => {
  if (value)
    pagingRef.value?.reload()
})

/** 查询可领用用品 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getSupplyItemSelectPage({ name: keyword.value.trim() || undefined, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索用品 */
function handleSearch() {
  pagingRef.value?.reload()
}

/** 选择用品 */
function handleSelect(item: SupplyItem) {
  emit('select', item)
}
</script>
