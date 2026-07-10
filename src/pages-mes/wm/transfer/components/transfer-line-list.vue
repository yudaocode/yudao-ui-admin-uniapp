<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        调拨物料
      </view>
      <view class="flex items-center gap-16rpx">
        <view v-if="!readonly && stockMode" class="text-24rpx text-[#999]">
          上架模式
        </view>
        <wd-button v-if="!readonly && !stockMode" size="small" type="primary" @click="openCreateLineForm">
          添加物料
        </wd-button>
      </view>
    </view>
    <view v-if="loading" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      暂无调拨物料
    </view>
    <view v-else class="px-24rpx py-8rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
      >
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333] font-medium">
              {{ item.itemCode || `物料 #${item.itemId}` }}
            </view>
            <view class="mt-4rpx truncate text-26rpx text-[#666]">
              {{ item.itemName || '-' }}
            </view>
          </view>
          <view class="shrink-0 text-24rpx text-[#999]">
            {{ item.unitMeasureName || '-' }}
          </view>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">转移数量：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">批次号：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">移出位置：</text>
          <text class="min-w-0 flex-1 truncate">
            {{ item.fromWarehouseName || '-' }} / {{ item.fromLocationName || '-' }} / {{ item.fromAreaName || '-' }}
          </text>
        </view>
        <view class="mb-16rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
        </view>
        <view v-if="!readonly && !stockMode" class="mb-16rpx flex justify-end gap-16rpx">
          <wd-button size="small" type="warning" variant="plain" @click.stop="openUpdateLineForm(item)">
            编辑
          </wd-button>
          <wd-button size="small" type="danger" variant="plain" @click.stop="handleDeleteLine(item)">
            删除
          </wd-button>
        </view>

        <view class="rounded-10rpx bg-[#fafafa] px-20rpx py-16rpx">
          <view class="mb-12rpx flex items-center justify-between">
            <view class="text-26rpx text-[#333] font-medium">
              上架明细
            </view>
            <view class="flex items-center gap-12rpx">
              <view class="text-24rpx text-[#999]">
                合计 {{ getDetailQuantityTotal(item.id) }} / {{ item.quantity ?? '-' }}
              </view>
              <wd-button v-if="stockMode" size="small" type="primary" @click.stop="openCreateDetailForm(item)">
                添加上架
              </wd-button>
            </view>
          </view>
          <view v-if="getDetailList(item.id).length === 0" class="py-12rpx text-24rpx text-[#999]">
            暂无上架明细
          </view>
          <view
            v-for="detail in getDetailList(item.id)"
            :key="detail.id"
            class="border-t border-t-[#eee] py-12rpx first:border-t-0"
          >
            <view class="mb-8rpx text-26rpx text-[#666]">
              <text class="text-[#999]">移入位置：</text>
              {{ detail.toWarehouseName || '-' }} / {{ detail.toLocationName || '-' }} / {{ detail.toAreaName || '-' }}
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              <text class="text-[#999]">上架数量：</text>{{ detail.quantity ?? '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">备注：</text>{{ detail.remark || '-' }}
            </view>
            <view v-if="stockMode" class="mt-12rpx flex justify-end gap-16rpx">
              <wd-button size="small" type="warning" variant="plain" @click.stop="openUpdateDetailForm(item, detail)">
                编辑
              </wd-button>
              <wd-button size="small" type="danger" variant="plain" @click.stop="handleDeleteDetail(item, detail)">
                删除
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>

  <!-- 调拨物料表单弹窗 -->
  <wd-popup
    v-model="lineFormVisible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 88vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="lineFormVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ lineFormTitle }}
        </view>
        <wd-button size="small" type="primary" :loading="lineFormLoading" @click="handleSubmitLine">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="lineFormRef" :model="lineFormData" :schema="lineFormSchema">
          <wd-cell-group border>
            <wd-form-item
              title="库存物资"
              title-width="220rpx"
              prop="materialStockId"
              is-link
              :value="selectedStockText"
              placeholder="请选择库存物资"
              @click="openStockPicker"
            />
            <wd-form-item title="转移数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="lineFormData.quantity" allow-null :min="0.01" :max="lineQuantityInputMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="物料编码" title-width="220rpx" prop="itemId">
              <text>{{ lineFormData.itemCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="物料名称" title-width="220rpx">
              <text>{{ lineFormData.itemName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx">
              <text>{{ lineFormData.batchCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="移出仓库" title-width="220rpx" prop="fromWarehouseId">
              <text>{{ lineFormData.fromWarehouseName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="移出库区" title-width="220rpx" prop="fromLocationId">
              <text>{{ lineFormData.fromLocationName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="移出库位" title-width="220rpx" prop="fromAreaId">
              <text>{{ lineFormData.fromAreaName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="可用库存" title-width="220rpx">
              <text>{{ lineQuantityMax ?? '-' }}</text>
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="lineFormData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <!-- 库存选择弹窗 -->
  <MaterialStockPicker ref="stockPickerRef" :multiple="false" virtual-filter="exclude" @confirm="handleStockConfirm" />

  <!-- 上架明细表单弹窗 -->
  <wd-popup
    v-model="detailFormVisible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 78vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="detailFormVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ detailFormTitle }}
        </view>
        <wd-button size="small" type="primary" :loading="detailFormLoading" @click="handleSubmitDetail">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="detailFormRef" :model="detailFormData" :schema="detailFormSchema">
          <wd-cell-group border>
            <wd-form-item title="物料" title-width="220rpx" prop="itemId">
              <text>{{ detailItemText || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="上架数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="detailFormData.quantity" allow-null :min="0.01" :max="detailQuantityInputMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="剩余可上架" title-width="220rpx">
              <text>{{ detailQuantityMax ?? '-' }}</text>
            </wd-form-item>
            <WarehouseFormPicker v-model="detailFormData.toWarehouseId" label="移入仓库" prop="toWarehouseId" :disabled="!props.stockMode" @change="handleWarehouseChange" />
            <WarehouseLocationFormPicker v-model="detailFormData.toLocationId" label="移入库区" prop="toLocationId" :warehouse-id="detailFormData.toWarehouseId" :disabled="!props.stockMode" @change="handleLocationChange" />
            <WarehouseAreaFormPicker v-model="detailFormData.toAreaId" label="移入库位" prop="toAreaId" :location-id="detailFormData.toLocationId" :disabled="!props.stockMode" />
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="detailFormData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { WmMaterialStock } from '@/api/mes/wm/materialstock'
import type { WmTransferDetail } from '@/api/mes/wm/transfer/detail'
import type { WmTransferLine } from '@/api/mes/wm/transfer/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getMaterialStock } from '@/api/mes/wm/materialstock'
import {
  createTransferDetail,
  deleteTransferDetail,
  getTransferDetailListByLineId,
  updateTransferDetail,
} from '@/api/mes/wm/transfer/detail'
import {
  createTransferLine,
  deleteTransferLine,
  getTransferLineList,
  updateTransferLine,
} from '@/api/mes/wm/transfer/line'
import { createFormSchema } from '@/utils/wot'
import MaterialStockPicker from '../../materialstock/components/material-stock-picker.vue'
import WarehouseAreaFormPicker from '../../warehouse/area/components/warehouse-area-form-picker.vue'
import WarehouseFormPicker from '../../warehouse/components/warehouse-form-picker.vue'
import WarehouseLocationFormPicker from '../../warehouse/location/components/warehouse-location-form-picker.vue'

const props = defineProps<{
  transferId?: number
  readonly?: boolean
  stockMode?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<WmTransferLine[]>([]) // 调拨物料列表
const detailMap = ref<Record<number, WmTransferDetail[]>>({}) // 上架明细映射
const lineFormVisible = ref(false) // 调拨物料表单显示
const lineFormLoading = ref(false) // 调拨物料提交状态
const lineFormRef = ref<FormInstance>() // 调拨物料表单引用
const lineFormData = ref<WmTransferLine>(getDefaultLineFormData()) // 调拨物料表单数据
const stockPickerRef = ref<InstanceType<typeof MaterialStockPicker>>() // 库存选择器引用
const selectedStock = ref<WmMaterialStock>() // 当前选择库存
const lineQuantityMax = ref<number>() // 当前可用库存
const detailFormVisible = ref(false) // 上架明细表单显示
const detailFormLoading = ref(false) // 上架明细提交状态
const detailFormRef = ref<FormInstance>() // 上架明细表单引用
const currentLine = ref<WmTransferLine>() // 当前上架行
const detailFormData = ref<WmTransferDetail>(getDefaultDetailFormData()) // 上架明细表单数据
const lineQuantityInputMax = computed(() => lineQuantityMax.value ?? 999999999)
const detailQuantityMax = computed(() => getDetailRemainingQuantity(currentLine.value, detailFormData.value.id))
const detailQuantityInputMax = computed(() => detailQuantityMax.value ?? 999999999)
const lineFormTitle = computed(() => lineFormData.value.id ? '编辑调拨物料' : '添加调拨物料')
const detailFormTitle = computed(() => detailFormData.value.id ? '编辑上架明细' : '添加上架明细')
const selectedStockText = computed(() => {
  if (selectedStock.value) {
    return `${selectedStock.value.batchCode || `库存 #${selectedStock.value.id}`} / ${selectedStock.value.itemCode || '-'}`
  }
  if (lineFormData.value.materialStockId) {
    return `${lineFormData.value.batchCode || `库存 #${lineFormData.value.materialStockId}`} / ${lineFormData.value.itemCode || '-'}`
  }
  return ''
})
const detailItemText = computed(() => {
  if (currentLine.value) {
    return `${currentLine.value.itemCode || '-'} ${currentLine.value.itemName || ''}`.trim()
  }
  return detailFormData.value.itemId ? `物料 #${detailFormData.value.itemId}` : ''
})
const lineFormSchema = createFormSchema({
  materialStockId: [{ required: true, message: '库存物资不能为空' }],
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '转移数量不能为空' },
    { validator: value => Number(value) > 0 || '转移数量必须大于 0' },
    { validator: value => lineQuantityMax.value == null || Number(value) <= lineQuantityMax.value || `转移数量不能大于库存 ${lineQuantityMax.value}` },
  ],
  fromWarehouseId: [{ required: true, message: '移出仓库不能为空' }],
  fromLocationId: [{ required: true, message: '移出库区不能为空' }],
  fromAreaId: [{ required: true, message: '移出库位不能为空' }],
})
const detailFormSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '上架数量不能为空' },
    { validator: value => Number(value) > 0 || '上架数量必须大于 0' },
    { validator: value => detailQuantityMax.value == null || Number(value) <= detailQuantityMax.value || `上架数量不能大于剩余数量 ${detailQuantityMax.value}` },
  ],
  toWarehouseId: [{ required: true, message: '移入仓库不能为空' }],
  toLocationId: [{ required: true, message: '移入库区不能为空' }],
  toAreaId: [{ required: true, message: '移入库位不能为空' }],
})

/** 默认调拨物料表单数据 */
function getDefaultLineFormData(): WmTransferLine {
  return {
    transferId: props.transferId,
  }
}

/** 默认上架明细表单数据 */
function getDefaultDetailFormData(): WmTransferDetail {
  return {
    lineId: currentLine.value?.id,
    transferId: props.transferId,
    itemId: currentLine.value?.itemId,
    batchId: currentLine.value?.batchId,
  }
}

/** 查询调拨物料列表 */
async function getList() {
  if (!props.transferId) {
    list.value = []
    detailMap.value = {}
    return
  }
  loading.value = true
  try {
    const lineList = await getTransferLineList(props.transferId)
    list.value = lineList
    const entries = await Promise.all(lineList
      .filter(line => line.id)
      .map(async (line): Promise<[number, WmTransferDetail[]]> => {
        const lineId = Number(line.id)
        const details = await getTransferDetailListByLineId(lineId)
        return [lineId, details]
      }))
    detailMap.value = Object.fromEntries(entries)
  } finally {
    loading.value = false
  }
}

/** 刷新列表 */
async function reload() {
  await getList()
}

/** 查询当前行上架明细 */
function getDetailList(lineId?: number) {
  if (!lineId) {
    return []
  }
  return detailMap.value[lineId] || []
}

/** 获取上架合计 */
function getDetailQuantityTotal(lineId?: number) {
  return getDetailList(lineId).reduce((total, item) => total + Number(item.quantity || 0), 0)
}

/** 计算剩余可上架数量 */
function getDetailRemainingQuantity(line?: WmTransferLine, editingDetailId?: number) {
  if (!line) {
    return undefined
  }
  const usedQuantity = getDetailList(line.id).reduce((total, item) => {
    if (editingDetailId && item.id === editingDetailId) {
      return total
    }
    return total + Number(item.quantity || 0)
  }, 0)
  return Math.max(Number(line.quantity || 0) - usedQuantity, 0)
}

/** 打开新增调拨物料 */
function openCreateLineForm() {
  if (props.readonly || props.stockMode) {
    return
  }
  lineFormData.value = getDefaultLineFormData()
  selectedStock.value = undefined
  lineQuantityMax.value = undefined
  lineFormVisible.value = true
}

/** 打开编辑调拨物料 */
async function openUpdateLineForm(item: WmTransferLine) {
  if (props.readonly || props.stockMode) {
    return
  }
  lineFormData.value = {
    ...item,
  }
  selectedStock.value = undefined
  lineQuantityMax.value = undefined
  if (item.materialStockId) {
    const stock = await getMaterialStock(item.materialStockId)
    lineQuantityMax.value = stock.quantity
  }
  lineFormVisible.value = true
}

/** 打开库存选择器 */
function openStockPicker() {
  if (props.readonly || props.stockMode) {
    return
  }
  selectedStock.value = undefined
  stockPickerRef.value?.open(lineFormData.value.materialStockId ? [lineFormData.value.materialStockId] : [])
}

/** 确认库存选择 */
function handleStockConfirm(rows: WmMaterialStock[]) {
  const stock = rows[0]
  if (!stock) {
    return
  }
  selectedStock.value = stock
  lineFormData.value.materialStockId = stock.id
  lineFormData.value.itemId = stock.itemId
  lineFormData.value.itemCode = stock.itemCode
  lineFormData.value.itemName = stock.itemName
  lineFormData.value.specification = stock.specification
  lineFormData.value.unitMeasureName = stock.unitMeasureName
  lineFormData.value.batchId = stock.batchId
  lineFormData.value.batchCode = stock.batchCode
  lineFormData.value.fromWarehouseId = stock.warehouseId
  lineFormData.value.fromWarehouseName = stock.warehouseName
  lineFormData.value.fromLocationId = stock.locationId
  lineFormData.value.fromLocationName = stock.locationName
  lineFormData.value.fromAreaId = stock.areaId
  lineFormData.value.fromAreaName = stock.areaName
  lineQuantityMax.value = stock.quantity
  if (!lineFormData.value.quantity || lineFormData.value.quantity > stock.quantity) {
    lineFormData.value.quantity = stock.quantity
  }
}

/** 提交调拨物料 */
async function handleSubmitLine() {
  if (props.readonly || props.stockMode) {
    return
  }
  const { valid } = await lineFormRef.value.validate()
  if (!valid) {
    return
  }
  lineFormLoading.value = true
  try {
    if (lineFormData.value.id) {
      await updateTransferLine(lineFormData.value)
      toast.success('修改成功')
    } else {
      await createTransferLine(lineFormData.value)
      toast.success('添加成功')
    }
    lineFormVisible.value = false
    reload()
  } finally {
    lineFormLoading.value = false
  }
}

/** 删除调拨物料 */
async function handleDeleteLine(item: WmTransferLine) {
  if (props.readonly || props.stockMode) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteTransferLine(item.id)
  toast.success('删除成功')
  reload()
}

/** 打开新增上架明细 */
function openCreateDetailForm(line: WmTransferLine) {
  if (!props.stockMode) {
    return
  }
  currentLine.value = line
  detailFormData.value = getDefaultDetailFormData()
  detailFormVisible.value = true
}

/** 打开编辑上架明细 */
function openUpdateDetailForm(line: WmTransferLine, detail: WmTransferDetail) {
  if (!props.stockMode) {
    return
  }
  currentLine.value = line
  detailFormData.value = {
    ...detail,
  }
  detailFormVisible.value = true
}

/** 选择仓库 */
function handleWarehouseChange() {
  detailFormData.value.toLocationId = undefined
  detailFormData.value.toAreaId = undefined
}

/** 选择库区 */
function handleLocationChange() {
  detailFormData.value.toAreaId = undefined
}

/** 提交上架明细 */
async function handleSubmitDetail() {
  if (!props.stockMode) {
    return
  }
  const { valid } = await detailFormRef.value.validate()
  if (!valid) {
    return
  }
  detailFormLoading.value = true
  try {
    if (detailFormData.value.id) {
      await updateTransferDetail(detailFormData.value)
      toast.success('修改成功')
    } else {
      await createTransferDetail(detailFormData.value)
      toast.success('添加成功')
    }
    detailFormVisible.value = false
    reload()
  } finally {
    detailFormLoading.value = false
  }
}

/** 删除上架明细 */
async function handleDeleteDetail(line: WmTransferLine, detail: WmTransferDetail) {
  if (!props.stockMode) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${line.itemCode || line.itemName || detail.id}」的上架明细吗？`,
    })
  } catch {
    return
  }
  await deleteTransferDetail(detail.id)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:transfer:reload', reload)
})

/** 监听调拨单编号变化 */
watch(
  () => props.transferId,
  reload,
  { immediate: true },
)

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:transfer:reload', reload)
})
</script>
