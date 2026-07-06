<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 头部 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="handleCancel">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          到货通知单行
        </view>
        <wd-button size="small" type="primary" :disabled="!selectedLine" @click="handleConfirm">
          确定{{ selectedLine ? '(1)' : '' }}
        </wd-button>
      </view>

      <!-- 列表 -->
      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation @scrolltolower="handleLoadMore">
        <view class="p-24rpx">
          <view
            v-for="item in lineList"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="selectedLine?.id === item.id ? 'ring-2 ring-[#1677ff]' : ''"
            @click="selectedLine = item"
          >
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-30rpx text-[#333] font-semibold">
                  {{ item.itemCode || `物料 #${item.itemId}` }}
                </view>
                <view class="mt-4rpx truncate text-26rpx text-[#666]">
                  {{ item.itemName || '-' }}
                </view>
              </view>
              <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(item.iqcCheckFlag)" />
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">规格：</text>{{ item.specification || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">单位：</text>{{ item.unitMeasureName || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">到货数量：</text>{{ item.arrivalQuantity ?? '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">合格数量：</text>{{ item.qualifiedQuantity ?? '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">检验单号：</text>{{ item.iqcCode || '-' }}
            </view>
          </view>
          <view v-if="lineList.length === 0 && !loading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选到货通知单行" />
          </view>
          <view v-if="loading" class="flex justify-center py-24rpx">
            <wd-loading />
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { WmArrivalNoticeLine } from '@/api/mes/wm/arrivalnotice/line'
import { ref } from 'vue'
import { getArrivalNoticeLinePage } from '@/api/mes/wm/arrivalnotice/line'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  noticeId?: number
}>()

const emit = defineEmits<{
  confirm: [line: WmArrivalNoticeLine]
}>()

const visible = ref(false) // 弹层显示状态
const loading = ref(false) // 加载状态
const lineList = ref<WmArrivalNoticeLine[]>([]) // 到货通知单行列表
const selectedLine = ref<WmArrivalNoticeLine>() // 当前选中行
const pageNo = ref(1) // 当前页码
const total = ref(0) // 总条数

/** 加载更多 */
async function handleLoadMore() {
  if (loading.value || lineList.value.length >= total.value) {
    return
  }
  pageNo.value++
  await loadLines(true)
}

/** 加载到货通知单行 */
async function loadLines(append = false) {
  if (loading.value || !props.noticeId) {
    return
  }
  loading.value = true
  try {
    const data = await getArrivalNoticeLinePage({
      pageNo: pageNo.value,
      pageSize: 20,
      noticeId: props.noticeId,
    })
    if (append) {
      lineList.value.push(...data.list)
    } else {
      lineList.value = data.list
    }
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 打开选择器 */
function open() {
  visible.value = true
  selectedLine.value = undefined
  lineList.value = []
  total.value = 0
  pageNo.value = 1
  loadLines()
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  selectedLine.value = undefined
}

/** 确认选择 */
function handleConfirm() {
  if (!selectedLine.value) {
    return
  }
  emit('confirm', selectedLine.value)
  visible.value = false
}

defineExpose({ open })
</script>
