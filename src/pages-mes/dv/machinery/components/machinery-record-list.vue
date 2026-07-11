<template>
  <view class="mt-24rpx">
    <view class="px-24rpx pb-16rpx text-28rpx text-[#333] font-semibold">
      设备关联记录
    </view>

    <!-- 点检记录 -->
    <view class="mx-24rpx mb-20rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
      <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
        <view class="text-28rpx text-[#333] font-semibold">
          点检记录
        </view>
        <wd-tag type="primary" plain>
          最近 {{ checkRecords.length }} 条 / 共 {{ checkTotal }} 条
        </wd-tag>
      </view>
      <view v-if="checkLoading" class="flex justify-center py-24rpx">
        <wd-loading />
      </view>
      <view v-else-if="checkRecords.length === 0" class="px-24rpx py-32rpx">
        <wd-empty icon="content" tip="暂无点检记录" />
      </view>
      <view v-else>
        <view
          v-for="item in checkRecords"
          :key="item.id"
          class="border-b border-[#f5f5f5] px-24rpx py-20rpx last:border-b-0"
        >
          <view class="mb-10rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-medium">
              {{ item.planCode || '-' }} / {{ item.planName || '-' }}
            </view>
            <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_DV_CHECK_RECORD_STATUS" :value="item.status" />
          </view>
          <view class="text-24rpx text-[#666] space-y-6rpx">
            <view>点检时间：{{ formatDateTime(item.checkTime) || '-' }}</view>
            <view>点检人：{{ item.nickname || '-' }}</view>
            <view>频率：{{ formatCycle(item.planCycleCount, item.planCycleType) }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 保养记录 -->
    <view class="mx-24rpx mb-20rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
      <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
        <view class="text-28rpx text-[#333] font-semibold">
          保养记录
        </view>
        <wd-tag type="warning" plain>
          最近 {{ maintenRecords.length }} 条 / 共 {{ maintenTotal }} 条
        </wd-tag>
      </view>
      <view v-if="maintenLoading" class="flex justify-center py-24rpx">
        <wd-loading />
      </view>
      <view v-else-if="maintenRecords.length === 0" class="px-24rpx py-32rpx">
        <wd-empty icon="content" tip="暂无保养记录" />
      </view>
      <view v-else>
        <view
          v-for="item in maintenRecords"
          :key="item.id"
          class="border-b border-[#f5f5f5] px-24rpx py-20rpx last:border-b-0"
        >
          <view class="mb-10rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-medium">
              {{ item.planCode || '-' }} / {{ item.planName || '-' }}
            </view>
            <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_MAINTEN_RECORD_STATUS" :value="item.status" />
          </view>
          <view class="text-24rpx text-[#666] space-y-6rpx">
            <view>保养时间：{{ formatDateTime(item.maintenTime) || '-' }}</view>
            <view>保养人：{{ item.nickname || '-' }}</view>
            <view>频率：{{ formatCycle(item.planCycleCount, item.planCycleType) }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 维修记录 -->
    <view class="mx-24rpx mb-20rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
      <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
        <view class="text-28rpx text-[#333] font-semibold">
          维修记录
        </view>
        <wd-tag type="danger" plain>
          最近 {{ repairRecords.length }} 条 / 共 {{ repairTotal }} 条
        </wd-tag>
      </view>
      <view v-if="repairLoading" class="flex justify-center py-24rpx">
        <wd-loading />
      </view>
      <view v-else-if="repairRecords.length === 0" class="px-24rpx py-32rpx">
        <wd-empty icon="content" tip="暂无维修记录" />
      </view>
      <view v-else>
        <view
          v-for="item in repairRecords"
          :key="item.id"
          class="border-b border-[#f5f5f5] px-24rpx py-20rpx last:border-b-0"
        >
          <view class="mb-10rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-medium">
              {{ item.code || '-' }} / {{ item.name || '-' }}
            </view>
            <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_DV_REPAIR_STATUS" :value="item.status" />
          </view>
          <view class="text-24rpx text-[#666] space-y-6rpx">
            <view>报修日期：{{ formatDateTime(item.requireDate) || '-' }}</view>
            <view>维修完成：{{ formatDateTime(item.finishDate) || '-' }}</view>
            <view>维修人：{{ item.acceptedUserNickname || '-' }}</view>
            <view>
              维修结果：
              <dict-tag v-if="item.result != null" :type="DICT_TYPE.MES_DV_REPAIR_RESULT" :value="item.result" />
              <text v-else>-</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DvCheckRecord } from '@/api/mes/dv/checkrecord'
import type { DvMaintenRecord } from '@/api/mes/dv/maintenrecord'
import type { DvRepair } from '@/api/mes/dv/repair'
import { computed, onMounted, ref, watch } from 'vue'
import { getCheckRecordPage } from '@/api/mes/dv/checkrecord'
import { getMaintenRecordPage } from '@/api/mes/dv/maintenrecord'
import { getRepairPage } from '@/api/mes/dv/repair'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  machineryId?: number | string
}>()

const currentMachineryId = computed(() => Number(props.machineryId || 0))
const checkLoading = ref(false) // 点检记录加载状态
const maintenLoading = ref(false) // 保养记录加载状态
const repairLoading = ref(false) // 维修记录加载状态
const checkRecords = ref<DvCheckRecord[]>([]) // 点检记录
const checkTotal = ref(0) // 点检记录总数
const maintenRecords = ref<DvMaintenRecord[]>([]) // 保养记录
const maintenTotal = ref(0) // 保养记录总数
const repairRecords = ref<DvRepair[]>([]) // 维修记录
const repairTotal = ref(0) // 维修记录总数

/** 格式化计划频率 */
function formatCycle(count?: number, type?: number) {
  if (count == null && type == null) {
    return '-'
  }
  const typeLabel = type != null ? getDictLabel(DICT_TYPE.MES_DV_CYCLE_TYPE, type) : ''
  return [count != null ? `${count}` : '', typeLabel].filter(Boolean).join(' / ') || '-'
}

/** 加载点检记录 */
async function loadCheckRecords() {
  if (!currentMachineryId.value) {
    checkRecords.value = []
    checkTotal.value = 0
    return
  }
  checkLoading.value = true
  try {
    const data = await getCheckRecordPage({
      pageNo: 1,
      pageSize: 5,
      machineryId: currentMachineryId.value,
    })
    checkRecords.value = data.list
    checkTotal.value = data.total
  } finally {
    checkLoading.value = false
  }
}

/** 加载保养记录 */
async function loadMaintenRecords() {
  if (!currentMachineryId.value) {
    maintenRecords.value = []
    maintenTotal.value = 0
    return
  }
  maintenLoading.value = true
  try {
    const data = await getMaintenRecordPage({
      pageNo: 1,
      pageSize: 5,
      machineryId: currentMachineryId.value,
    })
    maintenRecords.value = data.list
    maintenTotal.value = data.total
  } finally {
    maintenLoading.value = false
  }
}

/** 加载维修记录 */
async function loadRepairRecords() {
  if (!currentMachineryId.value) {
    repairRecords.value = []
    repairTotal.value = 0
    return
  }
  repairLoading.value = true
  try {
    const data = await getRepairPage({
      pageNo: 1,
      pageSize: 5,
      machineryId: currentMachineryId.value,
    })
    repairRecords.value = data.list
    repairTotal.value = data.total
  } finally {
    repairLoading.value = false
  }
}

/** 加载全部记录 */
async function loadRecords() {
  await Promise.all([
    loadCheckRecords(),
    loadMaintenRecords(),
    loadRepairRecords(),
  ])
}

/** 监听设备编号变化 */
watch(
  currentMachineryId,
  () => {
    loadRecords()
  },
)

/** 初始化 */
onMounted(() => {
  loadRecords()
})
</script>
