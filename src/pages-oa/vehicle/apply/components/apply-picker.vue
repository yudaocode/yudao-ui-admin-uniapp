<template>
  <wd-popup v-model="visible" position="bottom" root-portal custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;">
    <view class="h-full flex flex-col">
      <view class="flex items-center justify-between px-24rpx py-20rpx">
        <text class="text-32rpx text-[#333] font-semibold">选择用车申请</text><wd-icon name="close" size="32rpx" color="#999" @click="visible = false" />
      </view>
      <view class="px-24rpx pb-12rpx">
        <wd-search v-model="keyword" placeholder="请输入车牌号搜索" hide-cancel @search="handleSearch" @clear="handleSearch" />
      </view>
      <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" empty-view-text="暂无待还车的用车申请" @query="queryList">
        <view class="p-24rpx">
          <view v-for="item in list" :key="item.id" class="mb-16rpx flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx" @click="handleSelect(item)">
            <view>
              <view class="text-30rpx text-[#333] font-semibold">
                {{ item.no || `用车申请 #${item.id}` }}
              </view><view class="mt-4rpx text-24rpx text-[#999]">
                {{ item.vehicleNo }} · {{ formatDateTime(item.startTime) || '-' }}
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
import type { VehicleApply } from '@/api/oa/vehicle/apply'
import { ref, watch } from 'vue'
import { getVehicleApplyPage } from '@/api/oa/vehicle/apply'
import { formatDateTime } from '@/utils/date'
import { OA_VEHICLE_RETURN_STATUS } from '../../../utils/constants'

const props = defineProps<{ selectedId?: number }>()
const emit = defineEmits<{ select: [item: VehicleApply] }>()
const visible = defineModel<boolean>({ default: false })
const list = ref<VehicleApply[]>([]) // 待还车的用车申请列表
const pagingRef = ref<any>() // 分页组件引用
const keyword = ref('') // 车牌号搜索关键词

watch(visible, (value) => {
  if (value)
    pagingRef.value?.reload()
})

/** 查询待还车的用车申请 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getVehicleApplyPage({ status: 2, returnStatus: OA_VEHICLE_RETURN_STATUS.PENDING_RETURN, vehicleNo: keyword.value || undefined, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索用车申请 */
function handleSearch() {
  pagingRef.value?.reload()
}

/** 选择用车申请 */
function handleSelect(item: VehicleApply) {
  emit('select', item)
  visible.value = false
}
</script>
