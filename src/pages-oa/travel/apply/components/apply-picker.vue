<template>
  <wd-popup v-model="visible" position="bottom" root-portal custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;">
    <view class="h-full flex flex-col">
      <view class="flex items-center justify-between px-24rpx py-20rpx">
        <text class="text-32rpx text-[#333] font-semibold">选择出差申请</text><wd-icon name="close" size="32rpx" color="#999" @click="visible = false" />
      </view>
      <view class="px-24rpx pb-12rpx">
        <wd-search v-model="keyword" placeholder="请输入单号 / 事由搜索" hide-cancel />
      </view>
      <scroll-view scroll-y class="min-h-0 flex-1">
        <view class="p-24rpx pt-0">
          <view v-if="filteredList.length === 0" class="py-64rpx text-center text-26rpx text-[#999]">
            暂无可关联的出差申请
          </view>
          <view v-for="item in filteredList" :key="item.id" class="mb-16rpx flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx" @click="handleSelect(item)">
            <view class="min-w-0 flex-1">
              <view class="line-clamp-1 text-30rpx text-[#333] font-semibold">
                {{ item.no }}
              </view><view class="line-clamp-1 mt-4rpx text-24rpx text-[#999]">
                {{ item.reason || '-' }} · {{ formatDate(item.startTime) }} 至 {{ formatDate(item.endTime) }}
              </view>
            </view>
            <wd-icon v-if="item.id === selectedId" name="check" size="32rpx" color="#1677ff" />
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { TravelApply } from '@/api/oa/travel/apply'
import { computed, ref, watch } from 'vue'
import { getApprovedTravelApplyList } from '@/api/oa/travel/apply'
import { formatDate } from '@/utils/date'

const props = defineProps<{ selectedId?: number }>()
const emit = defineEmits<{ select: [item: TravelApply] }>()
const visible = defineModel<boolean>({ default: false })
const list = ref<TravelApply[]>([]) // 可关联的已通过出差申请
const keyword = ref('') // 搜索关键词
const filteredList = computed(() => {
  const value = keyword.value.trim()
  return value ? list.value.filter(item => item.no?.includes(value) || item.reason?.includes(value)) : list.value
})

watch(visible, async (value) => {
  if (value)
    list.value = await getApprovedTravelApplyList()
})

/** 选择出差申请 */
function handleSelect(item: TravelApply) {
  emit('select', item)
  visible.value = false
}
</script>
