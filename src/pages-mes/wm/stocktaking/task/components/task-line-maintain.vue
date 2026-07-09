<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        盘点清单
      </view>
      <wd-button v-if="editable" size="small" type="primary" @click="openStockPicker">
        添加物料
      </wd-button>
    </view>
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      height="640rpx"
      :default-page-size="10"
      :refresher-enabled="false"
      :inside-more="true"
      :to-bottom-loading-more-enabled="false"
      loading-more-default-text="点击加载更多"
      loading-more-no-more-text="没有更多盘点清单了"
      empty-view-text="暂无盘点清单"
      @query="queryList"
    >
      <view class="px-24rpx py-8rpx">
        <view
          v-for="item in list"
          :key="item.id || item.itemId"
          class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-28rpx text-[#333] font-medium">
                {{ item.itemCode || '-' }}
              </view>
              <view class="mt-4rpx truncate text-26rpx text-[#666]">
                {{ item.itemName || '-' }}
              </view>
            </view>
            <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_STOCK_TAKING_LINE_STATUS" :value="item.status" />
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">单位：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.unitMeasureName || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">批次：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">在库数量：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
          </view>
          <view class="flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">库存位置：</text>
            <text class="min-w-0 flex-1 truncate">
              {{ item.warehouseName || '-' }} / {{ item.locationName || '-' }} / {{ item.areaName || '-' }}
            </text>
          </view>
          <view v-if="editable" class="mt-16rpx flex justify-end gap-16rpx">
            <wd-button size="small" type="danger" variant="plain" @click.stop="handleDeleteLine(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
  <!-- 库存选择弹窗 -->
  <MaterialStockPicker ref="stockPickerRef" @confirm="handleStockConfirm" />
</template>

<script lang="ts" setup>
import type { WmMaterialStock } from '@/api/mes/wm/materialstock'
import type { StockTakingTaskLine } from '@/api/mes/wm/stocktaking/task/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createStockTakingTaskLine,
  deleteStockTakingTaskLine,
  getStockTakingTaskLinePage,
} from '@/api/mes/wm/stocktaking/task/line'
import { DICT_TYPE } from '@/utils/constants'
import MaterialStockPicker from '@/pages-mes/wm/materialstock/components/material-stock-picker.vue'

const props = defineProps<{
  editable?: boolean
  taskId?: number
}>()

const dialog = useDialog()
const toast = useToast()
const list = ref<StockTakingTaskLine[]>([]) // 清单数据
const pagingRef = ref<ZPagingRef<StockTakingTaskLine>>() // 分页组件引用
const submitting = ref(false) // 提交状态
const stockPickerRef = ref<InstanceType<typeof MaterialStockPicker>>() // 库存选择器

/** 加载盘点清单 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.taskId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getStockTakingTaskLinePage({
      pageNo,
      pageSize,
      taskId: props.taskId,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 打开库存选择 */
function openStockPicker() {
  if (!props.taskId) {
    return
  }
  stockPickerRef.value?.open()
}

/** 确认库存选择 */
async function handleStockConfirm(rows: WmMaterialStock[]) {
  if (submitting.value || !props.taskId || rows.length === 0) {
    return
  }
  submitting.value = true
  try {
    for (const stock of rows) {
      await createStockTakingTaskLine({
        taskId: props.taskId,
        materialStockId: stock.id,
        itemId: stock.itemId,
        batchId: stock.batchId,
        quantity: stock.quantity,
        warehouseId: stock.warehouseId,
        locationId: stock.locationId,
        areaId: stock.areaId,
      })
    }
    toast.success(`成功添加 ${rows.length} 条盘点清单`)
    reload()
  } finally {
    submitting.value = false
  }
}

/** 删除盘点行 */
async function handleDeleteLine(item: StockTakingTaskLine) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除确认',
      msg: `确定要删除盘点清单「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteStockTakingTaskLine(item.id)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:stocktaking:task:reload', reload)
})

/** 监听任务编号变化 */
watch(() => props.taskId, reload)

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:stocktaking:task:reload', reload)
})
</script>
