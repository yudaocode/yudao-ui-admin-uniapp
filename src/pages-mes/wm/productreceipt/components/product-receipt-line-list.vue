<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        入库物料
      </view>
      <wd-button v-if="!readonly" size="small" type="primary" @click="openCreateForm">
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
      loading-more-no-more-text="没有更多入库物料了"
      empty-view-text="暂无入库物料"
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
                {{ item.itemCode || `物料 #${item.itemId}` }}
              </view>
              <view class="mt-4rpx truncate text-26rpx text-[#666]">
                {{ item.itemName || '-' }}
              </view>
            </view>
            <view class="shrink-0 text-24rpx text-[#999]">
              {{ item.batchCode || '未带出批次' }}
            </view>
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
            <text class="mr-8rpx shrink-0 text-[#999]">入库数量：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">库存记录：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.materialStockId ? `#${item.materialStockId}` : '-' }}</text>
          </view>
          <view class="flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
          </view>
          <view v-if="item.itemId || !readonly" class="mt-16rpx flex justify-end gap-16rpx">
            <wd-button v-if="item.itemId" size="small" type="primary" variant="plain" @click.stop="handleBarcode(item)">
              条码
            </wd-button>
            <wd-button v-if="!readonly" size="small" type="warning" variant="plain" @click.stop="openUpdateForm(item)">
              编辑
            </wd-button>
            <wd-button v-if="!readonly" size="small" type="danger" variant="plain" @click.stop="handleDelete(item)">
              删除
            </wd-button>
          </view>
          <view class="mt-16rpx rounded-12rpx bg-[#f8fafc] p-16rpx">
            <view class="mb-12rpx flex items-center justify-between">
              <view class="text-26rpx text-[#333] font-medium">
                入库明细
              </view>
              <wd-button v-if="stockMode" size="small" type="primary" @click.stop="openCreateDetailForm(item)">
                添加上架
              </wd-button>
            </view>
            <view v-if="isDetailLoading(item.id)" class="py-12rpx text-24rpx text-[#999]">
              加载中...
            </view>
            <view v-else-if="getDetailList(item.id).length === 0" class="py-12rpx text-24rpx text-[#999]">
              暂无入库明细
            </view>
            <view
              v-for="detail in getDetailList(item.id)"
              v-else
              :key="detail.id"
              class="mb-12rpx rounded-8rpx bg-white p-16rpx last:mb-0"
            >
              <view class="mb-8rpx text-26rpx text-[#333]">
                {{ detail.warehouseName || '-' }} / {{ detail.locationName || '-' }} / {{ detail.areaName || '-' }}
              </view>
              <view class="mb-8rpx text-24rpx text-[#666]">
                上架数量：{{ detail.quantity ?? '-' }}
              </view>
              <view v-if="detail.remark" class="text-24rpx text-[#666]">
                备注：{{ detail.remark }}
              </view>
              <view v-if="stockMode" class="mt-12rpx flex justify-end gap-16rpx">
                <wd-button size="small" type="warning" variant="plain" @click.stop="openUpdateDetailForm(item, detail)">
                  编辑
                </wd-button>
                <wd-button size="small" type="danger" variant="plain" @click.stop="handleDeleteDetail(detail)">
                  删除
                </wd-button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>

  <!-- 入库物料表单弹窗 -->
  <wd-popup
    v-model="formVisible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 88vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="formVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ formTitle }}
        </view>
        <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item
              title="线边库存"
              title-width="220rpx"
              prop="materialStockId"
              is-link
              :value="selectedStockText"
              placeholder="请选择线边库存"
              @click="openStockPicker"
            />
            <wd-form-item title="物料" title-width="220rpx" prop="itemId">
              <text>{{ selectedItemText || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="入库数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" allow-null :min="0.01" :max="quantityMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
              <text>{{ formData.batchCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <!-- 库存选择弹窗 -->
  <MaterialStockPicker ref="stockPickerRef" :multiple="false" virtual-filter="only" @confirm="handleStockConfirm" />
  <!-- 条码详情弹窗 -->
  <BarcodeDetailPopup ref="barcodeDetailPopupRef" />

  <!-- 入库明细表单弹窗 -->
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
              <text>{{ detailSelectedItemText || '-' }}</text>
            </wd-form-item>
            <WarehouseFormPicker v-model="detailFormData.warehouseId" label="入库仓库" label-width="220rpx" prop="warehouseId" @change="handleWarehouseChange" />
            <WarehouseLocationFormPicker v-model="detailFormData.locationId" label="库区" label-width="220rpx" prop="locationId" :warehouse-id="detailFormData.warehouseId" @change="handleLocationChange" />
            <WarehouseAreaFormPicker v-model="detailFormData.areaId" label="库位" label-width="220rpx" prop="areaId" :location-id="detailFormData.locationId" />
            <wd-form-item title="上架数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="detailFormData.quantity" allow-null :min="0.01" :max="detailQuantityMax" :precision="2" />
            </wd-form-item>
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
import type { WmProductReceiptDetail } from '@/api/mes/wm/productreceipt/detail'
import type { WmProductReceiptLine } from '@/api/mes/wm/productreceipt/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getMaterialStock } from '@/api/mes/wm/materialstock'
import {
  createProductReceiptDetail,
  deleteProductReceiptDetail,
  getProductReceiptDetailListByLineId,
  updateProductReceiptDetail,
} from '@/api/mes/wm/productreceipt/detail'
import {
  createProductReceiptLine,
  deleteProductReceiptLine,
  getProductReceiptLinePage,
  updateProductReceiptLine,
} from '@/api/mes/wm/productreceipt/line'
import BarcodeDetailPopup from '@/pages-mes/wm/barcode/components/barcode-detail-popup.vue'
import { BarcodeBizTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import MaterialStockPicker from '../../materialstock/components/material-stock-picker.vue'
import WarehouseAreaFormPicker from '../../warehouse/area/components/warehouse-area-form-picker.vue'
import WarehouseFormPicker from '../../warehouse/components/warehouse-form-picker.vue'
import WarehouseLocationFormPicker from '../../warehouse/location/components/warehouse-location-form-picker.vue'

const props = defineProps<{
  receiptId?: number
  readonly?: boolean
  stockMode?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const list = ref<WmProductReceiptLine[]>([]) // 入库物料列表
const pagingRef = ref<ZPagingRef<WmProductReceiptLine>>() // 分页组件引用
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<WmProductReceiptLine>(getDefaultFormData()) // 表单数据
const selectedStock = ref<WmMaterialStock>() // 当前选择线边库存
const stockPickerRef = ref<InstanceType<typeof MaterialStockPicker>>() // 库存选择器引用
const barcodeDetailPopupRef = ref<InstanceType<typeof BarcodeDetailPopup>>() // 条码弹窗
const quantityMax = ref<number>() // 当前库存数量上限
const detailListMap = ref<Record<number, WmProductReceiptDetail[]>>({}) // 入库明细列表
const detailLoadingMap = ref<Record<number, boolean>>({}) // 入库明细加载状态
const detailFormVisible = ref(false) // 入库明细表单显示状态
const detailFormLoading = ref(false) // 入库明细表单提交状态
const detailFormRef = ref<FormInstance>() // 入库明细表单引用
const detailFormData = ref<WmProductReceiptDetail>(getDefaultDetailFormData()) // 入库明细表单数据
const currentDetailLine = ref<WmProductReceiptLine>() // 当前入库明细所属行
const detailQuantityMax = ref<number>() // 入库明细数量上限
const formTitle = computed(() => formData.value.id ? '编辑入库物料' : '添加入库物料')
const detailFormTitle = computed(() => detailFormData.value.id ? '编辑入库明细' : '添加入库明细')
const selectedStockText = computed(() => {
  if (selectedStock.value) {
    return `${selectedStock.value.batchCode || `库存 #${selectedStock.value.id}`} / ${selectedStock.value.itemCode || '-'}`
  }
  if (formData.value.materialStockId) {
    return `${formData.value.batchCode || `库存 #${formData.value.materialStockId}`} / ${formData.value.itemCode || '-'}`
  }
  return ''
})
const selectedItemText = computed(() => {
  if (formData.value.itemCode || formData.value.itemName) {
    return `${formData.value.itemCode || '-'} ${formData.value.itemName || ''}`.trim()
  }
  return formData.value.itemId ? `物料 #${formData.value.itemId}` : ''
})
const detailSelectedItemText = computed(() => {
  if (currentDetailLine.value) {
    return `${currentDetailLine.value.itemCode || '-'} ${currentDetailLine.value.itemName || ''}`.trim()
  }
  if (detailFormData.value.itemCode || detailFormData.value.itemName) {
    return `${detailFormData.value.itemCode || '-'} ${detailFormData.value.itemName || ''}`.trim()
  }
  if (!detailFormData.value.itemId) {
    return ''
  }
  return `物料 #${detailFormData.value.itemId}`
})
const formSchema = createFormSchema({
  materialStockId: [{ required: true, message: '线边库存不能为空' }],
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '入库数量不能为空' },
    { validator: value => Number(value) > 0 || '入库数量必须大于 0' },
    { validator: value => quantityMax.value == null || Number(value) <= quantityMax.value || `入库数量不能大于库存 ${quantityMax.value}` },
  ],
})
const detailFormSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  warehouseId: [{ required: true, message: '入库仓库不能为空' }],
  locationId: [{ required: true, message: '库区不能为空' }],
  areaId: [{ required: true, message: '库位不能为空' }],
  quantity: [
    { required: true, message: '上架数量不能为空' },
    { validator: value => Number(value) > 0 || '上架数量必须大于 0' },
    { validator: value => detailQuantityMax.value == null || Number(value) <= detailQuantityMax.value || `上架数量不能大于剩余数量 ${detailQuantityMax.value}` },
  ],
})

/** 默认表单数据 */
function getDefaultFormData(): WmProductReceiptLine {
  return {
    receiptId: props.receiptId,
  }
}

/** 默认入库明细表单数据 */
function getDefaultDetailFormData(): WmProductReceiptDetail {
  return {
    receiptId: props.receiptId,
  }
}

/** 查询入库物料列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.receiptId) {
    detailListMap.value = {}
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getProductReceiptLinePage({
      pageNo,
      pageSize,
      receiptId: props.receiptId,
    })
    if (pageNo === 1) {
      detailListMap.value = {}
    }
    await Promise.all(data.list.map(item => loadDetailList(item.id)))
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 获取入库明细列表 */
function getDetailList(lineId?: number) {
  if (!lineId) {
    return []
  }
  return detailListMap.value[lineId] || []
}

/** 计算剩余可上架数量 */
function getDetailRemainingQuantity(line?: WmProductReceiptLine, editingDetailId?: number) {
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

/** 是否正在加载入库明细 */
function isDetailLoading(lineId?: number) {
  if (!lineId) {
    return false
  }
  return !!detailLoadingMap.value[lineId]
}

/** 加载入库明细 */
async function loadDetailList(lineId?: number) {
  if (!lineId) {
    return
  }
  detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: true }
  try {
    const data = await getProductReceiptDetailListByLineId(lineId)
    detailListMap.value = { ...detailListMap.value, [lineId]: data }
  } finally {
    detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: false }
  }
}

/** 打开新增表单 */
function openCreateForm() {
  formData.value = getDefaultFormData()
  selectedStock.value = undefined
  quantityMax.value = undefined
  formVisible.value = true
}

/** 打开编辑表单 */
async function openUpdateForm(item: WmProductReceiptLine) {
  formData.value = {
    ...item,
  }
  selectedStock.value = item.materialStockId ? await getMaterialStock(item.materialStockId) : undefined
  quantityMax.value = selectedStock.value?.quantity
  formVisible.value = true
}

/** 打开线边库存选择 */
function openStockPicker() {
  selectedStock.value = undefined
  stockPickerRef.value?.open(formData.value.materialStockId ? [formData.value.materialStockId] : [])
}

/** 确认选择线边库存 */
function handleStockConfirm(rows: WmMaterialStock[]) {
  const stock = rows[0]
  if (!stock) {
    return
  }
  selectedStock.value = stock
  formData.value.materialStockId = stock.id
  formData.value.itemId = stock.itemId
  formData.value.itemCode = stock.itemCode
  formData.value.itemName = stock.itemName
  formData.value.specification = stock.specification
  formData.value.unitMeasureName = stock.unitMeasureName
  formData.value.quantity = stock.quantity
  formData.value.batchId = stock.batchId
  formData.value.batchCode = stock.batchCode
  quantityMax.value = stock.quantity
}

/** 提交入库物料 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.receiptId) {
    return
  }
  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateProductReceiptLine(formData.value)
      toast.success('修改成功')
    } else {
      await createProductReceiptLine(formData.value)
      toast.success('添加成功')
    }
    formVisible.value = false
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 删除入库物料 */
async function handleDelete(item: WmProductReceiptLine) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteProductReceiptLine(item.id)
  toast.success('删除成功')
  reload()
}

/** 查看物料条码 */
function handleBarcode(item: WmProductReceiptLine) {
  if (!item.itemId) {
    return
  }
  barcodeDetailPopupRef.value?.openByBusiness(
    item.itemId,
    BarcodeBizTypeEnum.ITEM,
    item.itemCode,
    item.itemName,
  )
}

/** 打开新增入库明细表单 */
function openCreateDetailForm(line: WmProductReceiptLine) {
  currentDetailLine.value = line
  detailQuantityMax.value = getDetailRemainingQuantity(line)
  detailFormData.value = {
    ...getDefaultDetailFormData(),
    lineId: line.id,
    itemId: line.itemId,
    quantity: detailQuantityMax.value,
    batchId: line.batchId,
  }
  detailFormVisible.value = true
}

/** 打开编辑入库明细表单 */
function openUpdateDetailForm(line: WmProductReceiptLine, detail: WmProductReceiptDetail) {
  currentDetailLine.value = line
  detailFormData.value = { ...detail }
  detailQuantityMax.value = getDetailRemainingQuantity(line, detail.id)
  detailFormVisible.value = true
}

/** 选择仓库 */
function handleWarehouseChange() {
  detailFormData.value.locationId = undefined
  detailFormData.value.areaId = undefined
}

/** 选择库区 */
function handleLocationChange() {
  detailFormData.value.areaId = undefined
}

/** 提交入库明细 */
async function handleSubmitDetail() {
  const { valid } = await detailFormRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.receiptId) {
    return
  }

  detailFormLoading.value = true
  try {
    if (detailFormData.value.id) {
      await updateProductReceiptDetail(detailFormData.value)
      toast.success('修改成功')
    } else {
      await createProductReceiptDetail(detailFormData.value)
      toast.success('添加成功')
    }
    detailFormVisible.value = false
    await loadDetailList(detailFormData.value.lineId)
    reload()
  } finally {
    detailFormLoading.value = false
  }
}

/** 删除入库明细 */
async function handleDeleteDetail(detail: WmProductReceiptDetail) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除入库明细「${detail.warehouseName || '-'} / ${detail.locationName || '-'} / ${detail.areaName || '-'}」吗？`,
    })
  } catch {
    return
  }
  await deleteProductReceiptDetail(detail.id)
  toast.success('删除成功')
  await loadDetailList(detail.lineId)
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:productreceipt:reload', reload)
})

/** 监听产品入库编号变化 */
watch(() => props.receiptId, reload)

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:productreceipt:reload', reload)
})
</script>
