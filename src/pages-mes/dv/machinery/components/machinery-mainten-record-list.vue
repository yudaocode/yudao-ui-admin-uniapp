<template>
  <view class="min-h-0 flex flex-1 flex-col bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        保养记录
      </view>
      <view class="text-24rpx text-[#999]">
        共 {{ total }} 条
      </view>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="5"
      :refresher-enabled="false"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无保养记录"
      @query="queryList"
    >
      <view class="px-24rpx py-8rpx pb-160rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
          @click="handleDetail(item)"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-28rpx text-[#333] font-medium">
                {{ item.planCode || `保养记录 #${item.id}` }}
              </view>
              <view class="mt-4rpx truncate text-26rpx text-[#666]">
                {{ item.planName || '-' }}
              </view>
            </view>
            <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_MAINTEN_RECORD_STATUS" :value="item.status" />
            <text v-else class="shrink-0 text-24rpx text-[#999]">-</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">保养时间：</text>
            <text class="min-w-0 flex-1 truncate">{{ formatDateTime(item.maintenTime) || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">保养人：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.nickname || '-' }}</text>
          </view>
          <view class="flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">频率：</text>
            <text class="min-w-0 flex-1 truncate">{{ formatCycle(item.planCycleCount, item.planCycleType) }}</text>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { DvMaintenRecord } from '@/api/mes/dv/maintenrecord'
import { nextTick, ref, watch } from 'vue'
import { getMaintenRecordPage } from '@/api/mes/dv/maintenrecord'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  machineryId?: number | string
}>()

const list = ref<DvMaintenRecord[]>([]) // 保养记录
const total = ref(0) // 总条数
const pagingRef = ref<ZPagingRef<DvMaintenRecord>>() // 分页组件引用

/** 格式化计划频率 */
function formatCycle(count?: number, type?: number) {
  if (count == null && type == null) {
    return '-'
  }
  const typeLabel = type != null ? getDictLabel(DICT_TYPE.MES_DV_CYCLE_TYPE, type) : ''
  return [count != null ? `${count}` : '', typeLabel].filter(Boolean).join(' / ') || '-'
}

/** 查询保养记录 */
async function queryList(currentPageNo: number, currentPageSize: number) {
  if (!props.machineryId) {
    total.value = 0
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getMaintenRecordPage({
      pageNo: currentPageNo,
      pageSize: currentPageSize,
      machineryId: Number(props.machineryId),
    })
    total.value = data.total
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 查看保养记录详情 */
function handleDetail(item: DvMaintenRecord) {
  if (!item.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/dv/maintenrecord/detail/index?id=${item.id}` })
}

/** 监听设备编号变化 */
watch(
  () => props.machineryId,
  async () => {
    total.value = 0
    list.value = []
    await nextTick()
    pagingRef.value?.reload()
  },
  { immediate: true },
)
</script>
