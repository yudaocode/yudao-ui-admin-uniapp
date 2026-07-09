<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        退料物料
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
      loading-more-no-more-text="没有更多退料物料了"
      empty-view-text="暂无退料物料"
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
              {{ item.unitMeasureName || '-' }}
            </view>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">批次号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">退料数量：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
          </view>
          <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">需要质检：</text>
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(item.rqcCheckFlag))" />
          </view>
          <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">质量状态：</text>
            <dict-tag v-if="item.qualityStatus != null" :type="DICT_TYPE.MES_WM_QUALITY_STATUS" :value="item.qualityStatus" />
            <text v-else>-</text>
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
          <view v-if="stockMode" class="mt-16rpx rounded-12rpx bg-[#f8fafc] p-16rpx">
            <view class="mb-12rpx flex items-center justify-between">
              <view class="text-26rpx text-[#333] font-medium">
                上架明细
              </view>
              <wd-button size="small" type="primary" @click.stop="openCreateDetailForm(item)">
                添加上架
              </wd-button>
            </view>
            <view v-if="isDetailLoading(item.id)" class="py-12rpx text-24rpx text-[#999]">
              加载中...
            </view>
            <view v-else-if="getDetailList(item.id).length === 0" class="py-12rpx text-24rpx text-[#999]">
              暂无上架明细
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
                批次号：{{ detail.batchCode || '-' }}
              </view>
              <view class="mb-8rpx text-24rpx text-[#666]">
                上架数量：{{ detail.quantity ?? '-' }}
              </view>
              <view v-if="detail.remark" class="text-24rpx text-[#666]">
                备注：{{ detail.remark }}
              </view>
              <view class="mt-12rpx flex justify-end gap-16rpx">
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

  <!-- 退料物料表单弹窗 -->
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
              title="库存记录"
              title-width="220rpx"
              prop="materialStockId"
              is-link
              :value="lineStockText"
              placeholder="请选择库存记录"
              @click="openLineStockPicker"
            />
            <wd-form-item title="物料" title-width="220rpx" prop="itemId">
              <text>{{ selectedLineItemText || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="退料数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" allow-null :min="0.01" :max="lineQuantityMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
              <text>{{ formData.batchCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="需要质检" title-width="220rpx" prop="rqcCheckFlag">
              <wd-switch v-model="formData.rqcCheckFlag" />
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

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
              <text>{{ detailSelectedItemText || '-' }}</text>
            </wd-form-item>
            <wd-form-item
              title="库存记录"
              title-width="220rpx"
              prop="materialStockId"
              is-link
              :value="detailStockText"
              placeholder="请选择库存记录"
              @click="openDetailStockPicker"
            />
            <wd-form-item title="上架数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="detailFormData.quantity" allow-null :min="0.01" :max="detailQuantityMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="仓库" title-width="220rpx" prop="warehouseId">
              <text>{{ selectedDetailStock?.warehouseName || detailFormData.warehouseName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="库区" title-width="220rpx" prop="locationId">
              <text>{{ selectedDetailStock?.locationName || detailFormData.locationName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="库位" title-width="220rpx" prop="areaId">
              <text>{{ selectedDetailStock?.areaName || detailFormData.areaName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
              <text>{{ detailFormData.batchCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="detailFormData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
  <!-- 库存选择弹窗 -->
  <MaterialStockPicker ref="stockPickerRef" :multiple="false" virtual-filter="only" positive-only @confirm="handleStockConfirm" />
  <!-- 条码详情弹窗 -->
  <BarcodeDetailPopup ref="barcodeDetailPopupRef" />
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { WmMaterialStock } from '@/api/mes/wm/materialstock'
import type { WmReturnIssueDetail } from '@/api/mes/wm/returnissue/detail'
import type { WmReturnIssueLine } from '@/api/mes/wm/returnissue/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createReturnIssueDetail,
  deleteReturnIssueDetail,
  getReturnIssueDetailListByLineId,
  updateReturnIssueDetail,
} from '@/api/mes/wm/returnissue/detail'
import {
  createReturnIssueLine,
  deleteReturnIssueLine,
  getReturnIssueLinePage,
  updateReturnIssueLine,
} from '@/api/mes/wm/returnissue/line'
import { getMaterialStock } from '@/api/mes/wm/materialstock'
import BarcodeDetailPopup from '@/pages-mes/wm/barcode/components/barcode-detail-popup.vue'
import { BarcodeBizTypeEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import MaterialStockPicker from '../../materialstock/components/material-stock-picker.vue'

const props = defineProps<{
  issueId?: number
  readonly?: boolean
  stockMode?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const list = ref<WmReturnIssueLine[]>([]) // 退料物料列表
const pagingRef = ref<ZPagingRef<WmReturnIssueLine>>() // 分页组件引用
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<WmReturnIssueLine>(getDefaultFormData()) // 表单数据
const selectedLineStock = ref<WmMaterialStock>() // 行表单库存记录
const lineQuantityMax = ref<number>() // 行表单数量上限
const detailFormVisible = ref(false) // 上架明细表单显示状态
const detailFormLoading = ref(false) // 上架明细提交状态
const detailFormRef = ref<FormInstance>() // 上架明细表单引用
const detailFormData = ref<WmReturnIssueDetail>(getDefaultDetailFormData()) // 上架明细数据
const currentDetailLine = ref<WmReturnIssueLine>() // 当前上架明细所属行
const detailListMap = ref<Record<number, WmReturnIssueDetail[]>>({}) // 上架明细列表
const detailLoadingMap = ref<Record<number, boolean>>({}) // 上架明细加载状态
const stockPickerTarget = ref<'line' | 'detail'>('line') // 当前库存选择目标
const stockPickerRef = ref<InstanceType<typeof MaterialStockPicker>>() // 库存选择器引用
const barcodeDetailPopupRef = ref<InstanceType<typeof BarcodeDetailPopup>>() // 条码弹窗
const selectedDetailStock = ref<WmMaterialStock>() // 上架明细库存记录
const detailQuantityMax = ref<number>() // 上架明细数量上限
const formTitle = computed(() => formData.value.id ? '编辑退料物料' : '添加退料物料')
const detailFormTitle = computed(() => detailFormData.value.id ? '编辑上架明细' : '添加上架明细')
const selectedLineItemText = computed(() => {
  if (selectedLineStock.value) {
    return `${selectedLineStock.value.itemCode || '-'} ${selectedLineStock.value.itemName || ''}`.trim()
  }
  if (formData.value.itemId) {
    return `${formData.value.itemCode || `物料 #${formData.value.itemId}`} ${formData.value.itemName || ''}`.trim()
  }
  return ''
})
const lineStockText = computed(() => {
  if (selectedLineStock.value) {
    return `${selectedLineStock.value.batchCode || `库存 #${selectedLineStock.value.id}`} / ${selectedLineStock.value.warehouseName || '-'}`
  }
  return formData.value.materialStockId ? `${formData.value.batchCode || `库存 #${formData.value.materialStockId}`}` : ''
})
const detailSelectedItemText = computed(() => {
  if (currentDetailLine.value) {
    return `${currentDetailLine.value.itemCode || '-'} ${currentDetailLine.value.itemName || ''}`.trim()
  }
  if (detailFormData.value.itemCode || detailFormData.value.itemName) {
    return `${detailFormData.value.itemCode || '-'} ${detailFormData.value.itemName || ''}`.trim()
  }
  return detailFormData.value.itemId ? `物料 #${detailFormData.value.itemId}` : ''
})
const detailStockText = computed(() => {
  if (selectedDetailStock.value) {
    return `${selectedDetailStock.value.batchCode || `库存 #${selectedDetailStock.value.id}`} / ${selectedDetailStock.value.warehouseName || '-'}`
  }
  return detailFormData.value.materialStockId
    ? `${detailFormData.value.batchCode || `库存 #${detailFormData.value.materialStockId}`} / ${detailFormData.value.warehouseName || '-'}`
    : ''
})
const formSchema = createFormSchema({
  materialStockId: [{ required: true, message: '请选择库存记录' }],
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '退料数量不能为空' },
    { validator: value => Number(value) > 0 || '退料数量必须大于 0' },
    { validator: value => lineQuantityMax.value == null || Number(value) <= lineQuantityMax.value || `退料数量不能大于库存 ${lineQuantityMax.value}` },
  ],
  rqcCheckFlag: [{ required: true, message: '需要质检不能为空' }],
})
const detailFormSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  materialStockId: [{ required: true, message: '请选择库存记录' }],
  quantity: [
    { required: true, message: '上架数量不能为空' },
    { validator: value => Number(value) > 0 || '上架数量必须大于 0' },
    { validator: value => detailQuantityMax.value == null || Number(value) <= detailQuantityMax.value || `上架数量不能大于库存 ${detailQuantityMax.value}` },
  ],
  warehouseId: [{ required: true, message: '仓库不能为空' }],
  locationId: [{ required: true, message: '库区不能为空' }],
  areaId: [{ required: true, message: '库位不能为空' }],
})

/** 默认退料物料表单 */
function getDefaultFormData(): WmReturnIssueLine {
  return {
    issueId: props.issueId,
    rqcCheckFlag: false,
  }
}

/** 默认上架明细表单 */
function getDefaultDetailFormData(): WmReturnIssueDetail {
  return {
    issueId: props.issueId,
  }
}

/** 查询退料物料列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.issueId) {
    detailListMap.value = {}
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getReturnIssueLinePage({
      pageNo,
      pageSize,
      issueId: props.issueId,
    })
    if (pageNo === 1) {
      detailListMap.value = {}
    }
    if (props.stockMode) {
      await Promise.all(data.list.map(item => loadDetailList(item.id)))
    } else {
      detailListMap.value = {}
    }
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 获取上架明细列表 */
function getDetailList(lineId?: number) {
  if (!lineId) {
    return []
  }
  return detailListMap.value[lineId] || []
}

/** 是否加载上架明细 */
function isDetailLoading(lineId?: number) {
  if (!lineId) {
    return false
  }
  return !!detailLoadingMap.value[lineId]
}

/** 加载上架明细 */
async function loadDetailList(lineId?: number) {
  if (!lineId) {
    return
  }
  detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: true }
  try {
    const data = await getReturnIssueDetailListByLineId(lineId)
    detailListMap.value = { ...detailListMap.value, [lineId]: data }
  } finally {
    detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: false }
  }
}

/** 打开新增退料物料 */
function openCreateForm() {
  formData.value = getDefaultFormData()
  selectedLineStock.value = undefined
  lineQuantityMax.value = undefined
  formVisible.value = true
}

/** 打开编辑退料物料 */
async function openUpdateForm(item: WmReturnIssueLine) {
  formData.value = {
    ...item,
    rqcCheckFlag: item.rqcCheckFlag ?? false,
  }
  selectedLineStock.value = undefined
  lineQuantityMax.value = undefined
  if (item.materialStockId) {
    selectedLineStock.value = await getMaterialStock(item.materialStockId)
    lineQuantityMax.value = Number(selectedLineStock.value.quantity || 0) + Number(item.quantity || 0)
  }
  formVisible.value = true
}

/** 打开行库存选择器 */
function openLineStockPicker() {
  openStockPicker('line')
}

/** 打开明细库存选择器 */
function openDetailStockPicker() {
  if (!detailFormData.value.itemId) {
    toast.warning('请先选择退料物料')
    return
  }
  openStockPicker('detail')
}

/** 打开库存选择器 */
function openStockPicker(target: 'line' | 'detail') {
  stockPickerTarget.value = target
  const selectedId = target === 'line' ? formData.value.materialStockId : detailFormData.value.materialStockId
  stockPickerRef.value?.open(
    selectedId ? [selectedId] : [],
    target === 'detail' ? { itemId: detailFormData.value.itemId } : {},
  )
}

/** 确认选择库存记录 */
function handleStockConfirm(rows: WmMaterialStock[]) {
  const stock = rows[0]
  if (!stock) {
    return
  }
  if (stockPickerTarget.value === 'line') {
    applyLineStock(stock)
  } else {
    applyDetailStock(stock)
  }
}

/** 回填退料物料库存 */
function applyLineStock(stock: WmMaterialStock) {
  selectedLineStock.value = stock
  formData.value.materialStockId = stock.id
  formData.value.itemId = stock.itemId
  formData.value.itemCode = stock.itemCode
  formData.value.itemName = stock.itemName
  formData.value.specification = stock.specification
  formData.value.unitMeasureName = stock.unitMeasureName
  formData.value.quantity = stock.quantity
  formData.value.batchId = stock.batchId
  formData.value.batchCode = stock.batchCode
  lineQuantityMax.value = stock.quantity
}

/** 回填上架明细库存 */
function applyDetailStock(stock: WmMaterialStock) {
  selectedDetailStock.value = stock
  detailFormData.value.materialStockId = stock.id
  detailFormData.value.itemId = stock.itemId
  detailFormData.value.itemCode = stock.itemCode
  detailFormData.value.itemName = stock.itemName
  detailFormData.value.specification = stock.specification
  detailFormData.value.unitMeasureName = stock.unitMeasureName
  detailFormData.value.quantity = stock.quantity
  detailFormData.value.batchId = stock.batchId
  detailFormData.value.batchCode = stock.batchCode
  detailFormData.value.warehouseId = stock.warehouseId
  detailFormData.value.warehouseName = stock.warehouseName
  detailFormData.value.locationId = stock.locationId
  detailFormData.value.locationName = stock.locationName
  detailFormData.value.areaId = stock.areaId
  detailFormData.value.areaName = stock.areaName
  detailQuantityMax.value = stock.quantity
}

/** 提交退料物料 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.issueId) {
    return
  }
  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateReturnIssueLine(formData.value)
      toast.success('修改成功')
    } else {
      await createReturnIssueLine(formData.value)
      toast.success('添加成功')
    }
    formVisible.value = false
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 删除退料物料 */
async function handleDelete(item: WmReturnIssueLine) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteReturnIssueLine(item.id)
  toast.success('删除成功')
  reload()
}

/** 查看物料条码 */
function handleBarcode(item: WmReturnIssueLine) {
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

/** 打开新增上架明细 */
function openCreateDetailForm(item: WmReturnIssueLine) {
  currentDetailLine.value = item
  detailFormData.value = {
    ...getDefaultDetailFormData(),
    lineId: item.id,
    itemId: item.itemId,
    quantity: item.quantity,
  }
  selectedDetailStock.value = undefined
  detailQuantityMax.value = undefined
  detailFormVisible.value = true
}

/** 打开编辑上架明细 */
async function openUpdateDetailForm(item: WmReturnIssueLine, detail: WmReturnIssueDetail) {
  currentDetailLine.value = item
  detailFormData.value = { ...detail }
  selectedDetailStock.value = undefined
  detailQuantityMax.value = undefined
  if (detail.materialStockId) {
    selectedDetailStock.value = await getMaterialStock(detail.materialStockId)
    detailQuantityMax.value = Number(selectedDetailStock.value.quantity || 0) + Number(detail.quantity || 0)
  }
  detailFormVisible.value = true
}

/** 删除上架明细 */
async function handleDeleteDetail(detail: WmReturnIssueDetail) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除批次「${detail.batchCode || detail.id}」的上架明细吗？`,
    })
  } catch {
    return
  }
  await deleteReturnIssueDetail(detail.id)
  toast.success('删除成功')
  await loadDetailList(detail.lineId)
  reload()
}

/** 提交上架明细 */
async function handleSubmitDetail() {
  const { valid } = await detailFormRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.issueId || !detailFormData.value.lineId) {
    return
  }
  detailFormLoading.value = true
  try {
    if (detailFormData.value.id) {
      await updateReturnIssueDetail(detailFormData.value)
      toast.success('修改成功')
    } else {
      await createReturnIssueDetail(detailFormData.value)
      toast.success('新增成功')
    }
    detailFormVisible.value = false
    await loadDetailList(detailFormData.value.lineId)
    reload()
  } finally {
    detailFormLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:returnissue:reload', reload)
})

/** 监听退料出库和库存模式变化 */
watch(
  () => [props.issueId, props.stockMode],
  reload,
)

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:returnissue:reload', reload)
})
</script>
