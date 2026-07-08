<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        出库物料
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
      loading-more-no-more-text="没有更多出库物料了"
      empty-view-text="暂无出库物料"
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
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(item.oqcCheckFlag))" />
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
            <text class="mr-8rpx shrink-0 text-[#999]">出库数量：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">已拣货数量：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.pickedQuantity ?? '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">批次号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
          </view>
          <view class="flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
          </view>
          <view v-if="!readonly" class="mt-16rpx flex justify-end gap-16rpx">
            <wd-button size="small" type="warning" variant="plain" @click="openUpdateForm(item)">
              编辑
            </wd-button>
            <wd-button size="small" type="danger" variant="plain" @click="handleDelete(item)">
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

  <!-- 出库物料表单弹窗 -->
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
              v-if="hasNotice"
              title="发货通知行"
              title-width="220rpx"
              prop="noticeLineId"
              is-link
              :value="selectedNoticeLineText"
              placeholder="请选择发货通知单行"
              @click="openNoticeLinePicker"
            />
            <wd-form-item
              title="物料"
              title-width="220rpx"
              prop="itemId"
              :is-link="!formData.noticeLineId"
              :value="selectedItemText"
              placeholder="请选择物料"
              @click="openItemPicker"
            />
            <wd-form-item title="出库数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" allow-null :min="0.01" :precision="2" />
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
              <wd-input v-model="formData.batchCode" clearable placeholder="请输入批次号" />
            </wd-form-item>
            <wd-cell title="是否检验" center>
              <view class="flex justify-end">
                <wd-switch v-model="formData.oqcCheckFlag" />
              </view>
            </wd-cell>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <ItemPicker ref="itemPickerRef" :multiple="false" @confirm="handleItemConfirm" />
  <SalesNoticeLinePicker
    ref="noticeLinePickerRef"
    :notice-id="noticeId"
    @confirm="handleNoticeLineConfirm"
  />

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
            <wd-form-item title="拣货数量" title-width="220rpx" prop="quantity" center>
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

  <MaterialStockPicker ref="stockPickerRef" :multiple="false" @confirm="handleStockConfirm" />
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItem } from '@/api/mes/md/item'
import type { WmMaterialStock } from '@/api/mes/wm/materialstock'
import type { WmProductSalesDetail } from '@/api/mes/wm/productsales/detail'
import type { WmProductSalesLine } from '@/api/mes/wm/productsales/line'
import type { WmSalesNoticeLine } from '@/api/mes/wm/salesnotice/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createProductSalesDetail,
  deleteProductSalesDetail,
  getProductSalesDetailListByLineId,
  updateProductSalesDetail,
} from '@/api/mes/wm/productsales/detail'
import {
  createProductSalesLine,
  deleteProductSalesLine,
  getProductSalesLinePage,
  updateProductSalesLine,
} from '@/api/mes/wm/productsales/line'
import { getMaterialStock } from '@/api/mes/wm/materialstock'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import ItemPicker from '../../../md/item/components/item-picker.vue'
import MaterialStockPicker from '../../materialstock/components/material-stock-picker.vue'
import SalesNoticeLinePicker from '../../salesnotice/components/sales-notice-line-picker.vue'

const props = defineProps<{
  salesId?: number
  noticeId?: number
  readonly?: boolean
  stockMode?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const list = ref<WmProductSalesLine[]>([]) // 出库物料列表
const pagingRef = ref<ZPagingRef<WmProductSalesLine>>() // 分页组件引用
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<WmProductSalesLine>(getDefaultFormData()) // 表单数据
const detailFormVisible = ref(false) // 拣货明细表单显示状态
const detailFormLoading = ref(false) // 拣货明细表单提交状态
const detailFormRef = ref<FormInstance>() // 拣货明细表单引用
const detailFormData = ref<WmProductSalesDetail>(getDefaultDetailFormData()) // 拣货明细表单数据
const currentDetailLine = ref<WmProductSalesLine>() // 当前拣货明细所属行
const itemPickerRef = ref<InstanceType<typeof ItemPicker>>() // 物料选择器引用
const noticeLinePickerRef = ref<InstanceType<typeof SalesNoticeLinePicker>>() // 发货通知行选择器引用
const detailListMap = ref<Record<number, WmProductSalesDetail[]>>({}) // 拣货明细列表
const detailLoadingMap = ref<Record<number, boolean>>({}) // 拣货明细加载状态
const stockPickerRef = ref<InstanceType<typeof MaterialStockPicker>>() // 库存选择器引用
const selectedStock = ref<WmMaterialStock>() // 当前选择库存记录
const quantityMax = ref<number>() // 当前库存数量上限
const hasNotice = computed(() => Boolean(props.noticeId))
const formTitle = computed(() => formData.value.id ? '编辑出库物料' : '添加出库物料')
const detailFormTitle = computed(() => detailFormData.value.id ? '编辑拣货明细' : '添加拣货明细')
const selectedItemText = computed(() => {
  if (!formData.value.itemId) {
    return ''
  }
  return `${formData.value.itemCode || '-'} ${formData.value.itemName || ''}`.trim()
})
const selectedNoticeLineText = computed(() => {
  if (!formData.value.noticeLineId) {
    return ''
  }
  return `${formData.value.itemCode || '-'} ${formData.value.itemName || ''}`.trim()
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
  if (detailFormData.value.materialStockId) {
    return `${detailFormData.value.batchCode || `库存 #${detailFormData.value.materialStockId}`} / ${detailFormData.value.warehouseName || '-'}`
  }
  return ''
})
const formSchema = createFormSchema({
  noticeLineId: [{ required: () => hasNotice.value, message: '发货通知单行不能为空' }],
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '出库数量不能为空' },
    { validator: value => Number(value) > 0 || '出库数量必须大于 0' },
  ],
  oqcCheckFlag: [{ required: true, message: '是否检验不能为空' }],
})
const detailFormSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  materialStockId: [{ required: true, message: '请选择库存记录' }],
  quantity: [
    { required: true, message: '拣货数量不能为空' },
    { validator: value => Number(value) > 0 || '拣货数量必须大于 0' },
    { validator: value => quantityMax.value == null || Number(value) <= quantityMax.value || `拣货数量不能大于库存 ${quantityMax.value}` },
  ],
  warehouseId: [{ required: true, message: '仓库不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData(): WmProductSalesLine {
  return {
    salesId: props.salesId,
    oqcCheckFlag: true,
  }
}

/** 默认拣货明细表单数据 */
function getDefaultDetailFormData(): WmProductSalesDetail {
  return {
    salesId: props.salesId,
  }
}

/** 查询出库物料列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.salesId) {
    detailListMap.value = {}
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getProductSalesLinePage({
      pageNo,
      pageSize,
      salesId: props.salesId,
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
    const data = await getProductSalesDetailListByLineId(lineId)
    detailListMap.value = { ...detailListMap.value, [lineId]: data }
  } finally {
    detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: false }
  }
}

/** 打开新增表单 */
function openCreateForm() {
  formData.value = getDefaultFormData()
  formVisible.value = true
}

/** 打开编辑表单 */
function openUpdateForm(item: WmProductSalesLine) {
  formData.value = {
    ...item,
    oqcCheckFlag: item.oqcCheckFlag ?? true,
  }
  formVisible.value = true
}

/** 打开物料选择器 */
function openItemPicker() {
  if (formData.value.noticeLineId) {
    return
  }
  itemPickerRef.value?.open()
}

/** 打开发货通知行选择器 */
function openNoticeLinePicker() {
  noticeLinePickerRef.value?.open()
}

/** 选择物料 */
function handleItemConfirm(items: MdItem[]) {
  const item = items[0]
  if (!item || item.id == null) {
    return
  }
  formData.value = {
    ...formData.value,
    itemId: item.id,
    itemCode: item.code,
    itemName: item.name,
    specification: item.specification,
    unitMeasureName: item.unitMeasureName,
  }
}

/** 选择发货通知行 */
function handleNoticeLineConfirm(line: WmSalesNoticeLine) {
  formData.value = {
    ...formData.value,
    noticeLineId: line.id,
    itemId: line.itemId,
    itemCode: line.itemCode,
    itemName: line.itemName,
    specification: line.specification,
    unitMeasureName: line.unitMeasureName,
    batchId: line.batchId,
    batchCode: line.batchCode,
    quantity: line.quantity,
    oqcCheckFlag: line.oqcCheckFlag ?? false,
  }
}

/** 提交出库物料 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.salesId) {
    return
  }
  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateProductSalesLine(formData.value)
      toast.success('修改成功')
    } else {
      await createProductSalesLine(formData.value)
      toast.success('添加成功')
    }
    formVisible.value = false
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 删除出库物料 */
async function handleDelete(item: WmProductSalesLine) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteProductSalesLine(item.id)
  toast.success('删除成功')
  reload()
}

/** 打开新增拣货明细表单 */
function openCreateDetailForm(item: WmProductSalesLine) {
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
async function openUpdateDetailForm(item: WmProductSalesLine, detail: WmProductSalesDetail) {
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
    toast.warning('请先选择出库物料')
    return
  }
  selectedStock.value = undefined
  stockPickerRef.value?.open(
    detailFormData.value.materialStockId ? [detailFormData.value.materialStockId] : [],
    { itemId: detailFormData.value.itemId },
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
async function handleDeleteDetail(detail: WmProductSalesDetail) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除批次「${detail.batchCode || detail.id}」的拣货明细吗？`,
    })
  } catch {
    return
  }
  await deleteProductSalesDetail(detail.id)
  toast.success('删除成功')
  await loadDetailList(detail.lineId)
  reload()
}

/** 提交拣货明细表单 */
async function handleSubmitDetail() {
  const { valid } = await detailFormRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.salesId || !detailFormData.value.lineId) {
    return
  }
  detailFormLoading.value = true
  try {
    if (detailFormData.value.id) {
      await updateProductSalesDetail(detailFormData.value)
      toast.success('修改成功')
    } else {
      await createProductSalesDetail(detailFormData.value)
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
  uni.$on('mes:wm:productsales:reload', reload)
})

/** 监听销售出库和库存模式变化 */
watch(
  () => [props.salesId, props.stockMode],
  reload,
)

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:productsales:reload', reload)
})
</script>
