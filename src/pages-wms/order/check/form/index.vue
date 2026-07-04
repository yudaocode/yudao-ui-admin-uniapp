<template>
  <view class="yd-page-container pb-120rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border title="单据信息">
          <wd-form-item title="盘库单号" title-width="180rpx" prop="no">
            <wd-input v-model="formData.no" :maxlength="64" clearable placeholder="请输入盘库单号" />
          </wd-form-item>
          <WarehousePicker
            v-model="formData.warehouseId"
            prop="warehouseId"
            :disabled="!!props.id"
            @change="handleWarehouseChange"
          />
          <wd-form-item
            title="单据日期"
            title-width="180rpx"
            prop="orderTime"
            is-link
            :value="formatDate(formData.orderTime)"
            placeholder="请选择单据日期"
            @click="pickerVisible.orderTime = true"
          />
          <wd-datetime-picker
            v-model="formData.orderTime"
            v-model:visible="pickerVisible.orderTime"
            title="请选择单据日期"
            type="date"
          />
          <wd-cell title="实际金额" :value="formatPrice(actualPrice) || '0.00'" />
          <wd-form-item title="备注" title-width="180rpx">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="255" clearable />
          </wd-form-item>
        </wd-cell-group>

        <view class="mx-24rpx mb-16rpx mt-24rpx flex items-center justify-between">
          <text class="text-30rpx text-[#333] font-semibold">盘库明细</text>
          <view class="flex gap-12rpx">
            <wd-button size="small" variant="plain" @click="handleImportAllInventory">
              导入库存
            </wd-button>
            <wd-button size="small" type="primary" @click="handleAddDetail">
              添加商品
            </wd-button>
          </view>
        </view>
        <view
          v-for="(detail, index) in formData.details"
          :key="detail.skuId || index"
          class="mx-24rpx mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="flex items-center justify-between border-b border-b-[#f5f5f5] px-24rpx py-20rpx">
            <view>
              <view class="text-28rpx text-[#333] font-semibold">
                {{ detail.itemName || '-' }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ detail.skuName || '-' }}
              </view>
            </view>
            <wd-button size="small" type="danger" @click="handleDeleteDetail(index)">
              删除
            </wd-button>
          </view>
          <wd-cell-group border>
            <wd-cell title="账面库存" :value="formatQuantity(detail.quantity) || '0.00'" />
            <wd-form-item title="实盘数量" title-width="160rpx">
              <wd-input-number v-model="detail.checkQuantity" :min="0" :precision="QUANTITY_PRECISION" allow-null @change="handleDetailCheckQuantityChange(detail)" />
            </wd-form-item>
            <wd-form-item title="单价" title-width="160rpx">
              <wd-input-number v-model="detail.price" :min="0" :precision="PRICE_PRECISION" allow-null @change="handleDetailPriceChange(detail)" />
            </wd-form-item>
            <wd-form-item title="实际金额" title-width="160rpx">
              <wd-input-number v-model="detail.actualPrice" :min="0" :precision="PRICE_PRECISION" allow-null @change="handleDetailActualPriceChange(detail)" />
            </wd-form-item>
            <wd-cell title="盈亏数量">
              <text :class="getLossClass(getDifferenceQuantity(detail))">
                {{ formatQuantity(getDifferenceQuantity(detail)) || '0.00' }}
              </text>
            </wd-cell>
            <wd-cell title="盈亏金额">
              <text :class="getLossClass(getDifferencePrice(detail))">
                {{ formatPrice(getDifferencePrice(detail)) || '0.00' }}
              </text>
            </wd-cell>
          </wd-cell-group>
        </view>
        <view v-if="!formData.details?.length" class="mx-24rpx rounded-12rpx bg-white py-48rpx text-center text-26rpx text-[#999]">
          暂无盘库明细
        </view>
      </wd-form>
    </view>

    <!-- 商品选择器 -->
    <ItemSkuPicker ref="skuPickerRef" @change="handleSelectSku" />

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button v-if="canSave" type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Inventory } from '@/api/wms/inventory'
import type { ItemSku } from '@/api/wms/md/item/sku'
import type { Warehouse } from '@/api/wms/md/warehouse'
import type { CheckOrder } from '@/api/wms/order/check'
import type { CheckOrderDetail } from '@/api/wms/order/check/detail'
import type { InputNumberValue } from '@/pages-wms/utils/format'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import { getInventoryList } from '@/api/wms/inventory'
import { createCheckOrder, getCheckOrder, updateCheckOrder } from '@/api/wms/order/check'
import ItemSkuPicker from '@/pages-wms/md/item/components/item-sku-picker.vue'
import WarehousePicker from '@/pages-wms/md/warehouse/components/warehouse-picker.vue'
import {
  dividePrice,
  formatPrice,
  formatQuantity,
  getLossClass,
  multiplyPrice,
  PRICE_PRECISION,
  QUANTITY_PRECISION,
  roundPrice,
  sumPrice,
  toOptionalNumber,
} from '@/pages-wms/utils/format'
import { generateOrderNo } from '@/pages-wms/utils/order'
import { delay, navigateBackPlus } from '@/utils'
import { WmsOrderStatusEnum, WmsOrderUpdateStatusList } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

type DetailNumberKey = 'checkQuantity' | 'price'
type CheckOrderFormDetail = Omit<CheckOrderDetail, DetailNumberKey> & Record<DetailNumberKey, InputNumberValue> & {
  availableQuantity?: number
  actualPrice?: InputNumberValue
}
type CheckOrderFormData = Omit<CheckOrder, 'details'> & { details?: CheckOrderFormDetail[] }
type CheckInventoryRow = Inventory & { price?: number, availableQuantity?: number }

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const getTitle = computed(() => props.id ? '编辑盘库单' : '新增盘库单')
const formLoading = ref(false) // 表单提交状态
const pickerVisible = reactive({
  orderTime: false,
}) // 选择器显示状态
const formData = ref<CheckOrderFormData>({
  id: undefined,
  no: generateOrderNo('PK'),
  orderTime: '',
  status: props.id ? undefined : WmsOrderStatusEnum.PREPARE,
  warehouseId: undefined,
  remark: '',
  details: [],
}) // 表单数据
const canSave = computed(() => !props.id || (
  formData.value.status !== undefined && WmsOrderUpdateStatusList.includes(formData.value.status)
)) // 仅草稿单据可保存
const formSchema = createFormSchema({
  no: [{ required: true, message: '盘库单号不能为空' }],
  orderTime: [{ required: true, message: '单据日期不能为空' }],
  warehouseId: [{ required: true, message: '仓库不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const skuPickerRef = ref<InstanceType<typeof ItemSkuPicker>>() // 商品选择器引用

const actualPrice = computed(() => sumPrice(formData.value.details || [], detail => getActualPrice(detail)))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-wms/order/check/index')
}

/** 加载盘库单详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const order = await getCheckOrder(Number(props.id))
  formData.value = {
    ...order,
    details: normalizeDetails(order.details || []),
  }
}

/** 构建盘库明细 */
function buildDetail(inventory: CheckInventoryRow): CheckOrderFormDetail {
  return {
    id: undefined,
    itemId: inventory.itemId,
    itemCode: inventory.itemCode,
    itemName: inventory.itemName,
    unit: inventory.unit,
    skuId: inventory.skuId,
    skuCode: inventory.skuCode,
    skuName: inventory.skuName,
    inventoryId: inventory.id,
    warehouseId: inventory.warehouseId,
    warehouseName: inventory.warehouseName,
    quantity: inventory.availableQuantity,
    checkQuantity: inventory.availableQuantity ?? '',
    availableQuantity: inventory.availableQuantity,
    price: inventory.price ?? '',
    actualPrice: multiplyPrice(inventory.availableQuantity, inventory.price) ?? '',
  }
}

/** 构建零库存盘库明细 */
function buildZeroInventoryDetail(sku: ItemSku): CheckOrderFormDetail {
  return {
    id: undefined,
    itemId: sku.itemId,
    itemCode: sku.itemCode,
    itemName: sku.itemName,
    unit: sku.unit,
    skuId: sku.id,
    skuCode: sku.code,
    skuName: sku.name,
    inventoryId: undefined,
    warehouseId: formData.value.warehouseId,
    warehouseName: formData.value.warehouseName,
    quantity: 0,
    checkQuantity: 0,
    availableQuantity: 0,
    price: sku.costPrice ?? '',
    actualPrice: 0,
  }
}

/** 规范明细金额 */
function normalizeDetails(details: CheckOrderDetail[]): CheckOrderFormDetail[] {
  return details.map(detail => ({
    ...detail,
    checkQuantity: detail.checkQuantity ?? '',
    price: detail.price ?? '',
    actualPrice: multiplyPrice(detail.checkQuantity, detail.price) ?? '',
  }))
}

/** 导入仓库库存 */
async function handleImportAllInventory() {
  if (!formData.value.warehouseId) {
    toast.error('请先选择仓库')
    return
  }
  if (formData.value.details?.length) {
    try {
      await dialog.confirm({
        title: '提示',
        msg: '导入仓库库存会覆盖当前盘库明细，是否继续？',
      })
    } catch {
      return
    }
  }
  formLoading.value = true
  try {
    const inventories = await loadWarehouseInventoryList()
    formData.value.details = inventories.map(item => buildDetail({ ...item, availableQuantity: item.quantity }))
  } finally {
    formLoading.value = false
  }
}

/** 添加盘库商品 */
function handleAddDetail() {
  if (!formData.value.warehouseId) {
    toast.error('请先选择仓库')
    return
  }
  skuPickerRef.value?.open(getSelectedSkuIds(), { multiple: false })
}

/** 选择商品 SKU */
async function handleSelectSku(skus: ItemSku[]) {
  if (!skus.length) {
    return
  }
  formLoading.value = true
  try {
    const warehouseInventoryMap = await getWarehouseInventoryMap()
    formData.value.details = formData.value.details || []
    const selectedSkuIds = new Set(getSelectedSkuIds())
    skus.forEach((sku) => {
      if (!sku.id || selectedSkuIds.has(sku.id)) {
        return
      }
      const inventory = warehouseInventoryMap.get(sku.id)
      formData.value.details!.push(
        inventory
          ? buildDetail({ ...inventory, availableQuantity: inventory.quantity })
          : buildZeroInventoryDetail(sku),
      )
      selectedSkuIds.add(sku.id)
    })
  } finally {
    formLoading.value = false
  }
}

/** 获取已选 SKU */
function getSelectedSkuIds() {
  return (formData.value.details || [])
    .map(detail => detail.skuId)
    .filter((id): id is number => !!id)
}

/** 查询当前仓库库存 */
async function loadWarehouseInventoryList(): Promise<Inventory[]> {
  return await getInventoryList({ warehouseId: formData.value.warehouseId! })
}

/** 获取当前仓库 SKU 库存映射 */
async function getWarehouseInventoryMap() {
  const inventories = await loadWarehouseInventoryList()
  return new Map(
    inventories
      .filter(inventory => !!inventory.skuId)
      .map(inventory => [inventory.skuId!, inventory] as const),
  )
}

/** 删除明细 */
function handleDeleteDetail(index: number) {
  formData.value.details?.splice(index, 1)
}

/** 仓库变化 */
function handleWarehouseChange(warehouse?: Warehouse) {
  if (props.id) {
    return
  }
  formData.value.warehouseName = warehouse?.name
  formData.value.details = []
}

/** 获取实际金额 */
function getActualPrice(detail: CheckOrderFormDetail) {
  return toOptionalNumber(detail.actualPrice) ?? multiplyPrice(detail.checkQuantity, detail.price)
}

/** 获取盈亏数量 */
function getDifferenceQuantity(detail: CheckOrderFormDetail) {
  return Number(toOptionalNumber(detail.checkQuantity) || 0) - Number(detail.quantity || 0)
}

/** 获取盈亏金额 */
function getDifferencePrice(detail: CheckOrderFormDetail) {
  const price = toOptionalNumber(detail.price)
  if (price === undefined) {
    return undefined
  }
  return roundPrice(getDifferenceQuantity(detail) * price)
}

/** 明细实盘数量变化 */
function handleDetailCheckQuantityChange(detail: CheckOrderFormDetail) {
  if (toOptionalNumber(detail.price) !== undefined) {
    detail.actualPrice = multiplyPrice(detail.checkQuantity, detail.price)
    return
  }
  detail.price = dividePrice(detail.actualPrice, detail.checkQuantity)
}

/** 明细单价变化 */
function handleDetailPriceChange(detail: CheckOrderFormDetail) {
  detail.actualPrice = multiplyPrice(detail.checkQuantity, detail.price)
}

/** 明细实际金额变化 */
function handleDetailActualPriceChange(detail: CheckOrderFormDetail) {
  detail.price = dividePrice(detail.actualPrice, detail.checkQuantity)
}

/** 校验明细 */
function validateDetails() {
  const details = formData.value.details || []
  for (let i = 0; i < details.length; i++) {
    const detail = details[i]
    const checkQuantity = toOptionalNumber(detail.checkQuantity)
    if (checkQuantity === undefined || checkQuantity < 0) {
      toast.error(`第 ${i + 1} 行明细实盘数量不能小于 0`)
      return false
    }
  }
  return true
}

/** 构建提交数据 */
function buildSubmitData(): CheckOrder {
  const { totalQuantity: _totalQuantity, totalPrice: _totalPrice, actualPrice: _actualPrice, details, ...order } = formData.value
  return {
    ...order,
    details: (details || []).map(({ actualPrice: _rowActualPrice, availableQuantity: _availableQuantity, ...detail }) => ({
      ...detail,
      checkQuantity: toOptionalNumber(detail.checkQuantity),
      price: toOptionalNumber(detail.price),
    })),
  }
}

/** 提交表单 */
async function handleSubmit() {
  if (!canSave.value) {
    toast.error('当前单据状态不可编辑')
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid || !validateDetails()) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateCheckOrder(buildSubmitData())
      toast.success('修改成功')
    } else {
      await createCheckOrder(buildSubmitData())
      toast.success('新增成功')
    }
    uni.$emit('wms:check-order:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
