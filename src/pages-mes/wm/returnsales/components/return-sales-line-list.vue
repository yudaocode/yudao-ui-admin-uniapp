<template>
  <view class="mt-24rpx bg-white">
    <!-- 顶部操作 -->
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        退货物料
      </view>
      <wd-button v-if="!readonly" size="small" type="primary" @click="openCreateForm">
        添加物料
      </wd-button>
    </view>
    <!-- 退货物料列表 -->
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
            <text class="min-w-0 flex-1 truncate">{{ item.itemSpecification || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">单位：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.itemUnit || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">退货数量：</text>
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
            <template v-else>
              <view
                v-for="detail in getDetailList(item.id)"
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
            </template>
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
      <!-- 顶部操作 -->
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
            <WarehouseFormPicker v-model="detailFormData.warehouseId" label="入库仓库" prop="warehouseId" @change="handleWarehouseChange" />
            <WarehouseLocationFormPicker v-model="detailFormData.locationId" prop="locationId" :warehouse-id="detailFormData.warehouseId" @change="handleLocationChange" />
            <WarehouseAreaFormPicker v-model="detailFormData.areaId" prop="areaId" :location-id="detailFormData.locationId" />
            <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
              <wd-input v-model="detailFormData.batchCode" placeholder="请输入批次号" clearable />
            </wd-form-item>
            <wd-form-item title="上架数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="detailFormData.quantity" allow-null :min="0.01" :precision="2" />
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="detailFormData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
  <!-- 物料选择弹窗 -->
  <ItemPicker ref="itemPickerRef" :multiple="false" @confirm="handleItemConfirm" />

  <!-- 批次选择弹窗 -->
  <wd-popup
    v-model="batchPickerVisible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 78vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 顶部操作 -->
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
      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="batchQueryParams.code" placeholder="批次号" clearable />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleBatchReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleBatchSearch">
            搜索
          </wd-button>
        </view>
      </view>
      <!-- 批次列表 -->
      <z-paging
        ref="batchPagingRef"
        v-model="batchList"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无可选批次"
        @query="queryBatchList"
      >
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
              <text class="text-[#999]">客户：</text>{{ batch.clientName || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">销售订单：</text>{{ batch.salesOrderCode || '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">入库日期：</text>{{ formatDate(batch.receiptDate) || '-' }}
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItem } from '@/api/mes/md/item'
import type { Batch } from '@/api/mes/wm/batch'
import type { WmReturnSalesDetail } from '@/api/mes/wm/returnsales/detail'
import type { WmReturnSalesLine } from '@/api/mes/wm/returnsales/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getBatchPage } from '@/api/mes/wm/batch'
import {
  createReturnSalesDetail,
  deleteReturnSalesDetail,
  getReturnSalesDetailListByLineId,
  updateReturnSalesDetail,
} from '@/api/mes/wm/returnsales/detail'
import {
  createReturnSalesLine,
  deleteReturnSalesLine,
  getReturnSalesLinePage,
  updateReturnSalesLine,
} from '@/api/mes/wm/returnsales/line'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ItemPicker from '../../../md/item/components/item-picker.vue'
import WarehouseAreaFormPicker from '../../warehouse/area/components/warehouse-area-form-picker.vue'
import WarehouseFormPicker from '../../warehouse/components/warehouse-form-picker.vue'
import WarehouseLocationFormPicker from '../../warehouse/location/components/warehouse-location-form-picker.vue'

const props = defineProps<{
  returnId?: number
  clientId?: number
  salesOrderCode?: string
  readonly?: boolean
  stockMode?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const list = ref<WmReturnSalesLine[]>([]) // 退货行列表
const pagingRef = ref<ZPagingRef<WmReturnSalesLine>>() // 分页组件引用
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<WmReturnSalesLine>(getDefaultFormData()) // 表单数据
const detailFormVisible = ref(false) // 上架明细表单显示状态
const detailFormLoading = ref(false) // 上架明细表单提交状态
const detailFormRef = ref<FormInstance>() // 上架明细表单引用
const detailFormData = ref<WmReturnSalesDetail>(getDefaultDetailFormData()) // 上架明细表单数据
const currentDetailLine = ref<WmReturnSalesLine>() // 当前上架明细所属行
const itemPickerRef = ref<InstanceType<typeof ItemPicker>>() // 物料选择器引用
const batchPickerVisible = ref(false) // 批次选择器显示状态
const batchList = ref<Batch[]>([]) // 批次列表
const batchPagingRef = ref<ZPagingRef<Batch>>() // 批次分页组件引用
const selectedBatch = ref<Batch>() // 当前临时选择批次
const batchQueryParams = ref<Record<string, any>>({ code: '' }) // 批次查询参数
const detailListMap = ref<Record<number, WmReturnSalesDetail[]>>({}) // 上架明细列表
const detailLoadingMap = ref<Record<number, boolean>>({}) // 上架明细加载状态
const formSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '退货数量不能为空' },
    { validator: value => Number(value) > 0 || '退货数量必须大于 0' },
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
  ],
})
const formTitle = computed(() => formData.value.id ? '修改销售退货单行' : '添加销售退货单行') // 表单标题
const detailFormTitle = computed(() => detailFormData.value.id ? '编辑上架明细' : '添加上架明细') // 上架明细表单标题
const selectedItemText = computed(() => { // 物料回显文本
  return formData.value.itemId ? `${formData.value.itemCode || '-'} ${formData.value.itemName || ''}`.trim() : ''
})
const detailSelectedItemText = computed(() => { // 上架物料回显文本
  if (currentDetailLine.value) {
    return `${currentDetailLine.value.itemCode || '-'} ${currentDetailLine.value.itemName || ''}`.trim()
  }
  if (detailFormData.value.itemCode || detailFormData.value.itemName) {
    return `${detailFormData.value.itemCode || '-'} ${detailFormData.value.itemName || ''}`.trim()
  }
  return detailFormData.value.itemId ? `物料 #${detailFormData.value.itemId}` : ''
})
const selectedBatchText = computed(() => { // 批次回显文本
  return formData.value.batchCode || selectedBatch.value?.code || ''
})
/** 默认表单数据 */
function getDefaultFormData(): WmReturnSalesLine {
  return {
    returnId: props.returnId,
    rqcCheckFlag: true,
  }
}

/** 默认上架明细表单数据 */
function getDefaultDetailFormData(): WmReturnSalesDetail {
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
    const data = await getReturnSalesLinePage({
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

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 获取单行上架明细 */
function getDetailList(lineId?: number) {
  if (!lineId) {
    return []
  }
  return detailListMap.value[lineId] || []
}

/** 判断单行上架明细是否加载中 */
function isDetailLoading(lineId?: number) {
  if (!lineId) {
    return false
  }
  return !!detailLoadingMap.value[lineId]
}

/** 加载单行上架明细 */
async function loadDetailList(lineId?: number) {
  if (!lineId) {
    return
  }
  detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: true }
  try {
    const data = await getReturnSalesDetailListByLineId(lineId)
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
function openUpdateForm(item: WmReturnSalesLine) {
  formData.value = {
    ...item,
    rqcCheckFlag: item.rqcCheckFlag ?? true,
  }
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
  formData.value.itemSpecification = item.specification
  formData.value.itemUnit = item.unitMeasureName
  formData.value.batchId = undefined
  formData.value.batchCode = undefined
  selectedBatch.value = undefined
}

/** 打开批次选择器 */
async function openBatchPicker() {
  if (!formData.value.itemId) {
    toast.warning('请先选择产品物料')
    return
  }
  batchPickerVisible.value = true
  selectedBatch.value = undefined
  batchQueryParams.value = { code: '' }
  await nextTick()
  reloadBatchList()
}

/** 搜索批次 */
function handleBatchSearch() {
  reloadBatchList()
}

/** 重置批次搜索 */
function handleBatchReset() {
  batchQueryParams.value = { code: '' }
  reloadBatchList()
}

/** 刷新批次列表 */
function reloadBatchList() {
  batchPagingRef.value?.reload()
}

/** 查询批次列表 */
async function queryBatchList(pageNo: number, pageSize: number) {
  if (!formData.value.itemId) {
    batchPagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getBatchPage({
      pageNo,
      pageSize,
      code: batchQueryParams.value.code || undefined,
      itemId: formData.value.itemId,
      clientId: props.clientId,
      salesOrderCode: props.salesOrderCode || undefined,
    })
    batchPagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    batchPagingRef.value?.complete(false)
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
async function handleDelete(item: WmReturnSalesLine) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteReturnSalesLine(item.id)
  toast.success('删除成功')
  reload()
}

/** 打开新增上架明细表单 */
function openCreateDetailForm(item: WmReturnSalesLine) {
  currentDetailLine.value = item
  detailFormData.value = {
    ...getDefaultDetailFormData(),
    lineId: item.id,
    itemId: item.itemId,
    quantity: item.quantity,
    batchId: item.batchId,
    batchCode: item.batchCode,
  }
  detailFormVisible.value = true
}

/** 打开编辑上架明细表单 */
function openUpdateDetailForm(item: WmReturnSalesLine, detail: WmReturnSalesDetail) {
  currentDetailLine.value = item
  detailFormData.value = { ...detail }
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

/** 删除上架明细 */
async function handleDeleteDetail(detail: WmReturnSalesDetail) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除上架明细「${detail.warehouseName || '-'} / ${detail.locationName || '-'} / ${detail.areaName || '-'}」吗？`,
    })
  } catch {
    return
  }
  await deleteReturnSalesDetail(detail.id)
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
      await updateReturnSalesLine(formData.value)
      toast.success('修改成功')
    } else {
      await createReturnSalesLine(formData.value)
      toast.success('新增成功')
    }
    formVisible.value = false
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 提交上架明细 */
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
      await updateReturnSalesDetail(detailFormData.value)
      toast.success('修改成功')
    } else {
      await createReturnSalesDetail(detailFormData.value)
      toast.success('添加成功')
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
  uni.$on('mes:wm:returnsales:reload', reload)
})

/** 监听销售退货编号变化 */
watch(
  () => props.returnId,
  () => {
    formVisible.value = false
    detailFormVisible.value = false
    batchPickerVisible.value = false
    reload()
  },
)

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:returnsales:reload', reload)
})
</script>
