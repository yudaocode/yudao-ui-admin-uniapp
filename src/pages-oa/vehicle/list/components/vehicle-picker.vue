<template>
  <wd-popup v-model="visible" position="bottom" root-portal custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;">
    <view class="h-full flex flex-col">
      <view class="flex items-center justify-between px-24rpx py-20rpx">
        <text class="text-32rpx text-[#333] font-semibold">选择车辆</text><wd-icon name="close" size="32rpx" color="#999" @click="visible = false" />
      </view>
      <view class="px-24rpx pb-12rpx">
        <wd-search v-model="keyword" placeholder="请输入车牌号搜索" hide-cancel @search="handleSearch" @clear="handleSearch" />
      </view>
      <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" empty-view-text="暂无可申请车辆" @query="queryList">
        <view class="p-24rpx">
          <view v-for="item in list" :key="item.id" class="mb-16rpx flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx" @click="handleSelect(item)">
            <view>
              <view class="text-30rpx text-[#333] font-semibold">
                {{ item.no }}
              </view><view v-if="item.name" class="mt-4rpx text-24rpx text-[#999]">
                {{ item.name }}
              </view>
            </view>
            <wd-icon v-if="item.id === selectedId" name="check" size="32rpx" color="#1677ff" />
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { getAvailableVehiclePage } from '@/api/oa/vehicle/apply'

interface VehicleOption {
  id: number
  no: string
  name?: string
}
const props = defineProps<{ selectedId?: number }>()
const emit = defineEmits<{ select: [item: VehicleOption] }>()
const visible = defineModel<boolean>({ default: false })
const list = ref<VehicleOption[]>([]) // 可申请车辆列表
const pagingRef = ref<any>() // 分页组件引用
const keyword = ref('') // 车牌号搜索关键词

watch(visible, (value) => {
  if (value)
    pagingRef.value?.reload()
})

/** 查询可申请车辆 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getAvailableVehiclePage({ pageNo, pageSize, no: keyword.value || undefined })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索车辆 */
function handleSearch() {
  pagingRef.value?.reload()
}

/** 选择车辆 */
function handleSelect(item: VehicleOption) {
  emit('select', item)
  visible.value = false
}
</script>
