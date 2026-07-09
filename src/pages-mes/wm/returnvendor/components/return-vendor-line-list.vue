<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        退货物料
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
      loading-more-no-more-text="没有更多退货物料了"
      empty-view-text="暂无退货物料"
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
              {{ item.batchCode || '未选择批次' }}
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
            <text class="mr-8rpx shrink-0 text-[#999]">退货数量：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
          </view>
          <view class="flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
          </view>
          <view v-if="!readonly" class="mt-16rpx flex justify-end gap-16rpx">
            <wd-button size="small" type="warning" variant="plain" @click.stop="openUpdateForm(item)">
              编辑
            </wd-button>
            <wd-button size="small" type="danger" variant="plain" @click.stop="handleDelete(item)">
              删除
            </wd-button>
          </view>
          <view v-if="stockMode" class="mt-16rpx rounded-12rpx bg-[#f8fafc] p-16rpx">
            <view class="mb-12rpx flex items-center justify-between">
              <view class="text-26rpx text-[#333] font-medium">
                拣货明细
              </view>
              <wd-button size="small" type="primary" @click.stop="openCreateDetailForm(item)">
                添加拣货
              </wd-button>
            </view>
            <view v-if="isDetailLoading(item.id)" class="py-12rpx text-24rpx text-[#999]">
              加载中...
            </view>
            <view v-else-if="getDetailList(item.id).length === 0" class="py-12rpx text-24rpx text-[#999]">
              暂无拣货明细
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
                拣货数量：{{ detail.quantity ?? '-' }}
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

  <!-- 退货行表单弹窗 -->
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
              title="产品物料"
              title-width="220rpx"
              prop="itemId"
              is-link
              :value="selectedItemText"
              placeholder="请选择产品物料"
              @click="openItemPicker"
            />
            <wd-form-item title="退货数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" allow-null :min="0.01" :precision="2" />
            </wd-form-item>
            <wd-form-item
              title="批次号"
              title-width="220rpx"
              prop="batchId"
              :is-link="!!formData.itemId"
              :value="selectedBatchText"
              placeholder="请选择批次号"
              @click="openBatchPicker"
            />
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <!-- 物料选择弹窗 -->
  <ItemPicker ref="itemPickerRef" :multiple="false" @confirm="handleItemConfirm" />

  <!-- 拣货明细表单弹窗 -->
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
              :value="selectedStockText"
              placeholder="请选择库存记录"
              @click="openStockPicker"
            />
            <wd-form-item title="数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="detailFormData.quantity" allow-null :min="0.01" :max="quantityMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="仓库" title-width="220rpx" prop="warehouseId">
              <text>{{ selectedStock?.warehouseName || detailFormData.warehouseName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="库区" title-width="220rpx" prop="locationId">
              <text>{{ selectedStock?.locationName || detailFormData.locationName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="库位" title-width="220rpx" prop="areaId">
              <text>{{ selectedStock?.areaName || detailFormData.areaName || '-' }}</text>
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
  <MaterialStockPicker ref="stockPickerRef" :multiple="false" @confirm="handleStockConfirm" />

  <!-- 批次选择弹窗 -->
  <wd-popup
    v-model="batchPickerVisible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 78vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="batchPickerVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          选择批次
        </view>
        <wd-button size="small" type="primary" :disabled="!selectedBatch" @click="handleBatchConfirm">
          确定
        </wd-button>
      </view>
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="batchSearchCode" placeholder="批次号" clearable />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleBatchReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleBatchSearch">
            搜索
          </wd-button>
        </view>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation @scrolltolower="handleBatchLoadMore">
        <view class="p-24rpx">
          <view
            v-for="batch in batchList"
            :key="batch.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="selectedBatch?.id === batch.id ? 'ring-2 ring-[#1677ff]' : ''"
            @click="selectedBatch = batch"
          >
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ batch.code || '-' }}
              </view>
              <dict-tag v-if="batch.qualityStatus != null" :type="DICT_TYPE.MES_WM_QUALITY_STATUS" :value="batch.qualityStatus" />
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">物料：</text>{{ batch.itemCode || '-' }} {{ batch.itemName || '' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">供应商：</text>{{ batch.vendorName || '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">入库日期：</text>{{ formatDate(batch.receiptDate) || '-' }}
            </view>
          </view>
          <view v-if="batchList.length === 0 && !batchLoading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选批次" />
          </view>
          <view v-if="batchLoading" class="flex justify-center py-24rpx">
            <wd-loading />
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItem } from '@/api/mes/md/item'
import type { Batch } from '@/api/mes/wm/batch'
import type { WmMaterialStock } from '@/api/mes/wm/materialstock'
import type { WmReturnVendorDetail } from '@/api/mes/wm/returnvendor/detail'
import type { WmReturnVendorLine } from '@/api/mes/wm/returnvendor/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getBatchPage } from '@/api/mes/wm/batch'
import {
  createReturnVendorDetail,
  deleteReturnVendorDetail,
  getReturnVendorDetailListByLineId,
  updateReturnVendorDetail,
} from '@/api/mes/wm/returnvendor/detail'
import {
  createReturnVendorLine,
  deleteReturnVendorLine,
  getReturnVendorLinePage,
  updateReturnVendorLine,
} from '@/api/mes/wm/returnvendor/line'
import { getMaterialStock } from '@/api/mes/wm/materialstock'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ItemPicker from '../../../md/item/components/item-picker.vue'
import MaterialStockPicker from '../../materialstock/components/material-stock-picker.vue'

const props = defineProps<{
  returnId?: number
  vendorId?: number
  readonly?: boolean
  stockMode?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const list = ref<WmReturnVendorLine[]>([]) // 退货行列表
const pagingRef = ref<ZPagingRef<WmReturnVendorLine>>() // 分页组件引用
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<WmReturnVendorLine>(getDefaultFormData()) // 表单数据
const detailFormVisible = ref(false) // 拣货明细表单显示状态
const detailFormLoading = ref(false) // 拣货明细表单提交状态
const detailFormRef = ref<FormInstance>() // 拣货明细表单引用
const detailFormData = ref<WmReturnVendorDetail>(getDefaultDetailFormData()) // 拣货明细表单数据
const currentDetailLine = ref<WmReturnVendorLine>() // 当前拣货明细所属行
const itemPickerRef = ref<InstanceType<typeof ItemPicker>>() // 物料选择器引用
const batchPickerVisible = ref(false) // 批次选择器显示状态
const batchLoading = ref(false) // 批次加载状态
const batchList = ref<Batch[]>([]) // 批次列表
const selectedBatch = ref<Batch>() // 当前临时选择批次
const batchSearchCode = ref('') // 批次号搜索
const batchPageNo = ref(1) // 批次当前页
const batchTotal = ref(0) // 批次总数
const detailListMap = ref<Record<number, WmReturnVendorDetail[]>>({}) // 拣货明细列表
const detailLoadingMap = ref<Record<number, boolean>>({}) // 拣货明细加载状态
const stockPickerRef = ref<InstanceType<typeof MaterialStockPicker>>() // 库存选择器引用
const selectedStock = ref<WmMaterialStock>() // 当前选择库存记录
const quantityMax = ref<number>() // 当前库存数量上限
const formSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '退货数量不能为空' },
    { validator: value => Number(value) > 0 || '退货数量必须大于 0' },
  ],
})
const detailFormSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  materialStockId: [{ required: true, message: '请选择库存记录' }],
  quantity: [
    { required: true, message: '数量不能为空' },
    { validator: value => Number(value) > 0 || '数量必须大于 0' },
    { validator: value => quantityMax.value == null || Number(value) <= quantityMax.value || `数量不能大于库存 ${quantityMax.value}` },
  ],
})
const formTitle = computed(() => formData.value.id ? '修改供应商退货单行' : '添加供应商退货单行')
const detailFormTitle = computed(() => detailFormData.value.id ? '编辑拣货明细' : '添加拣货明细')
const selectedItemText = computed(() => {
  return formData.value.itemId ? `${formData.value.itemCode || '-'} ${formData.value.itemName || ''}`.trim() : ''
})
const selectedBatchText = computed(() => {
  return formData.value.batchCode || selectedBatch.value?.code || ''
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
const selectedStockText = computed(() => {
  if (selectedStock.value) {
    return `${selectedStock.value.batchCode || `库存 #${selectedStock.value.id}`} / ${selectedStock.value.warehouseName || '-'}`
  }
  return detailFormData.value.materialStockId
    ? `${detailFormData.value.batchCode || `库存 #${detailFormData.value.materialStockId}`} / ${detailFormData.value.warehouseName || '-'}`
    : ''
})

/** 默认表单数据 */
function getDefaultFormData(): WmReturnVendorLine {
  return {
    returnId: props.returnId,
  }
}

/** 默认拣货明细表单数据 */
function getDefaultDetailFormData(): WmReturnVendorDetail {
  return {
    returnId: props.returnId,
  }
}

/** 加载退货行列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.returnId) {
    detailListMap.value = {}
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getReturnVendorLinePage({
      pageNo,
      pageSize,
      returnId: props.returnId,
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

/** 获取拣货明细列表 */
function getDetailList(lineId?: number) {
  if (!lineId) {
    return []
  }
  return detailListMap.value[lineId] || []
}

/** 是否正在加载拣货明细 */
function isDetailLoading(lineId?: number) {
  if (!lineId) {
    return false
  }
  return !!detailLoadingMap.value[lineId]
}

/** 加载拣货明细 */
async function loadDetailList(lineId?: number) {
  if (!lineId) {
    return
  }
  detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: true }
  try {
    const data = await getReturnVendorDetailListByLineId(lineId)
    detailListMap.value = { ...detailListMap.value, [lineId]: data }
  } finally {
    detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: false }
  }
}

/** 打开新增表单 */
function openCreateForm() {
  formData.value = getDefaultFormData()
  selectedBatch.value = undefined
  formVisible.value = true
}

/** 打开编辑表单 */
function openUpdateForm(item: WmReturnVendorLine) {
  formData.value = { ...item }
  selectedBatch.value = undefined
  formVisible.value = true
}

/** 打开物料选择器 */
function openItemPicker() {
  itemPickerRef.value?.open()
}

/** 确认选择物料 */
function handleItemConfirm(items: MdItem[]) {
  const item = items[0]
  if (!item) {
    return
  }
  formData.value.itemId = item.id
  formData.value.itemCode = item.code
  formData.value.itemName = item.name
  formData.value.specification = item.specification
  formData.value.unitMeasureName = item.unitMeasureName
  formData.value.batchId = undefined
  formData.value.batchCode = undefined
  selectedBatch.value = undefined
}

/** 打开批次选择器 */
function openBatchPicker() {
  if (!formData.value.itemId) {
    toast.warning('请先选择产品物料')
    return
  }
  batchPickerVisible.value = true
  selectedBatch.value = undefined
  batchSearchCode.value = ''
  batchPageNo.value = 1
  batchList.value = []
  batchTotal.value = 0
  loadBatchList()
}

/** 搜索批次 */
function handleBatchSearch() {
  batchPageNo.value = 1
  loadBatchList()
}

/** 重置批次搜索 */
function handleBatchReset() {
  batchSearchCode.value = ''
  batchPageNo.value = 1
  loadBatchList()
}

/** 批次加载更多 */
async function handleBatchLoadMore() {
  if (batchLoading.value || batchList.value.length >= batchTotal.value) {
    return
  }
  batchPageNo.value++
  await loadBatchList(true)
}

/** 加载批次列表 */
async function loadBatchList(append = false) {
  if (!formData.value.itemId || batchLoading.value) {
    return
  }
  batchLoading.value = true
  try {
    const data = await getBatchPage({
      pageNo: batchPageNo.value,
      pageSize: 20,
      code: batchSearchCode.value || undefined,
      itemId: formData.value.itemId,
      vendorId: props.vendorId,
    })
    if (append) {
      batchList.value.push(...data.list)
    } else {
      batchList.value = data.list
    }
    batchTotal.value = data.total
  } finally {
    batchLoading.value = false
  }
}

/** 确认选择批次 */
function handleBatchConfirm() {
  if (!selectedBatch.value) {
    return
  }
  formData.value.batchId = selectedBatch.value.id
  formData.value.batchCode = selectedBatch.value.code
  batchPickerVisible.value = false
}

/** 删除退货行 */
async function handleDelete(item: WmReturnVendorLine) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteReturnVendorLine(item.id)
  toast.success('删除成功')
  reload()
}

/** 打开新增拣货明细表单 */
function openCreateDetailForm(item: WmReturnVendorLine) {
  currentDetailLine.value = item
  detailFormData.value = {
    ...getDefaultDetailFormData(),
    lineId: item.id,
    itemId: item.itemId,
    quantity: item.quantity,
  }
  selectedStock.value = undefined
  quantityMax.value = undefined
  detailFormVisible.value = true
}

/** 打开编辑拣货明细表单 */
async function openUpdateDetailForm(item: WmReturnVendorLine, detail: WmReturnVendorDetail) {
  currentDetailLine.value = item
  detailFormData.value = { ...detail }
  selectedStock.value = undefined
  quantityMax.value = undefined
  if (detail.materialStockId) {
    selectedStock.value = await getMaterialStock(detail.materialStockId)
    quantityMax.value = Number(selectedStock.value.quantity || 0) + Number(detail.quantity || 0)
  }
  detailFormVisible.value = true
}

/** 打开库存记录选择器 */
function openStockPicker() {
  if (!detailFormData.value.itemId) {
    toast.warning('请先选择退货物料')
    return
  }
  selectedStock.value = undefined
  stockPickerRef.value?.open(
    detailFormData.value.materialStockId ? [detailFormData.value.materialStockId] : [],
    { itemId: detailFormData.value.itemId, vendorId: props.vendorId },
  )
}

/** 确认选择库存记录 */
function handleStockConfirm(rows: WmMaterialStock[]) {
  const stock = rows[0]
  if (!stock) {
    return
  }
  selectedStock.value = stock
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
  quantityMax.value = stock.quantity
}

/** 删除拣货明细 */
async function handleDeleteDetail(detail: WmReturnVendorDetail) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除批次「${detail.batchCode || detail.id}」的拣货明细吗？`,
    })
  } catch {
    return
  }
  await deleteReturnVendorDetail(detail.id)
  toast.success('删除成功')
  await loadDetailList(detail.lineId)
  reload()
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.returnId) {
    return
  }
  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateReturnVendorLine(formData.value)
      toast.success('修改成功')
    } else {
      await createReturnVendorLine(formData.value)
      toast.success('新增成功')
    }
    formVisible.value = false
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 提交拣货明细表单 */
async function handleSubmitDetail() {
  const { valid } = await detailFormRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.returnId || !detailFormData.value.lineId) {
    return
  }
  detailFormLoading.value = true
  try {
    if (detailFormData.value.id) {
      await updateReturnVendorDetail(detailFormData.value)
      toast.success('修改成功')
    } else {
      await createReturnVendorDetail(detailFormData.value)
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
  uni.$on('mes:wm:returnvendor:reload', reload)
})

/** 监听采购退货编号变化 */
watch(
  () => [props.returnId, props.stockMode],
  reload,
)

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:returnvendor:reload', reload)
})
</script>
