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
          <wd-form-item title="出库单号" title-width="180rpx" prop="no">
            <wd-input v-model="formData.no" :maxlength="64" clearable placeholder="请输入出库单号" />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.type"
            label="出库类型"
            label-width="180rpx"
            prop="type"
            :dict-type="DICT_TYPE.WMS_SHIPMENT_ORDER_TYPE"
            placeholder="请选择出库类型"
          />
          <WarehouseFormPicker v-model="formData.warehouseId" prop="warehouseId" @change="handleWarehouseChange" />
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
          <MerchantFormPicker
            v-model="formData.merchantId"
            label="客户"
            prop="merchantId"
            placeholder="请选择客户"
            customer
          />
          <wd-form-item title="业务单号" title-width="180rpx">
            <wd-input v-model="formData.bizOrderNo" :maxlength="64" clearable placeholder="请输入业务单号" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="180rpx">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="255" clearable />
          </wd-form-item>
        </wd-cell-group>

        <view class="mx-24rpx mb-16rpx mt-24rpx flex items-center justify-between">
          <text class="text-30rpx text-[#333] font-semibold">出库明细</text>
          <wd-button size="small" type="primary" @click="handleAddDetail">
            添加商品
          </wd-button>
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
            <wd-cell title="可用库存" :value="formatQuantity(detail.availableQuantity) || '-'" />
            <wd-form-item title="数量" title-width="160rpx">
              <wd-input-number v-model="detail.quantity" :min="0" :precision="QUANTITY_PRECISION" allow-null @change="handleDetailQuantityChange(detail)" />
            </wd-form-item>
            <wd-form-item title="单价" title-width="160rpx">
              <wd-input-number v-model="detail.price" :min="0" :precision="PRICE_PRECISION" allow-null @change="handleDetailPriceChange(detail)" />
            </wd-form-item>
            <wd-form-item title="金额" title-width="160rpx">
              <wd-input-number v-model="detail.totalPrice" :min="0" :precision="PRICE_PRECISION" allow-null @change="handleDetailTotalPriceChange(detail)" />
            </wd-form-item>
            <wd-cell title="单位" :value="detail.unit || '-'" />
          </wd-cell-group>
        </view>
        <view v-if="!formData.details?.length" class="mx-24rpx rounded-12rpx bg-white py-48rpx text-center text-26rpx text-[#999]">
          暂无出库明细
        </view>
      </wd-form>
    </view>

    <!-- 库存选择器 -->
    <InventoryPicker ref="inventoryPickerRef" :warehouse-id="formData.warehouseId" @change="handleSelectInventory" />

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
import type { ShipmentOrder } from '@/api/wms/order/shipment'
import type { ShipmentOrderDetail } from '@/api/wms/order/shipment/detail'
import type { InventoryPickerRow } from '@/pages-wms/inventory/components/inventory-picker.vue'
import type { InputNumberValue } from '@/pages-wms/utils/format'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import { createShipmentOrder, getShipmentOrder, updateShipmentOrder } from '@/api/wms/order/shipment'
import InventoryPicker from '@/pages-wms/inventory/components/inventory-picker.vue'
import MerchantFormPicker from '@/pages-wms/md/merchant/components/merchant-form-picker.vue'
import WarehouseFormPicker from '@/pages-wms/md/warehouse/components/warehouse-form-picker.vue'
import { dividePrice, formatQuantity, multiplyPrice, PRICE_PRECISION, QUANTITY_PRECISION, toOptionalNumber } from '@/pages-wms/utils/format'
import { generateOrderNo } from '@/pages-wms/utils/order'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, WmsOrderStatusEnum, WmsOrderUpdateStatusList } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

type DetailNumberKey = 'quantity' | 'price' | 'totalPrice'
type ShipmentOrderFormDetail = Omit<ShipmentOrderDetail, DetailNumberKey> & Record<DetailNumberKey, InputNumberValue> & {
  availableQuantity?: number
}
type ShipmentOrderFormData = Omit<ShipmentOrder, 'details'> & { details?: ShipmentOrderFormDetail[] }

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
const getTitle = computed(() => props.id ? '编辑出库单' : '新增出库单')
const formLoading = ref(false) // 表单提交状态
const pickerVisible = reactive({
  orderTime: false,
}) // 选择器显示状态
const formData = ref<ShipmentOrderFormData>({
  id: undefined,
  no: generateOrderNo('CK'),
  type: undefined,
  orderTime: '',
  status: props.id ? undefined : WmsOrderStatusEnum.PREPARE,
  bizOrderNo: '',
  merchantId: undefined,
  warehouseId: undefined,
  remark: '',
  details: [],
}) // 表单数据
const canSave = computed(() => !props.id || (
  formData.value.status !== undefined && WmsOrderUpdateStatusList.includes(formData.value.status)
)) // 仅草稿单据可保存
const formSchema = createFormSchema({
  no: [{ required: true, message: '出库单号不能为空' }],
  type: [{ required: true, message: '出库类型不能为空' }],
  orderTime: [{ required: true, message: '单据日期不能为空' }],
  warehouseId: [{ required: true, message: '仓库不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const inventoryPickerRef = ref<InstanceType<typeof InventoryPicker>>() // 库存选择器引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-wms/order/shipment/index')
}

/** 加载出库单详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const order = await getShipmentOrder(Number(props.id))
  formData.value = {
    ...order,
    details: normalizeDetails(order.details || []),
  }
}

/** 构建出库明细 */
function buildDetail(inventory: InventoryPickerRow): ShipmentOrderFormDetail {
  return {
    id: undefined,
    itemId: inventory.itemId,
    itemCode: inventory.itemCode,
    itemName: inventory.itemName,
    unit: inventory.unit,
    skuId: inventory.skuId,
    skuCode: inventory.skuCode,
    skuName: inventory.skuName,
    warehouseId: inventory.warehouseId,
    warehouseName: inventory.warehouseName,
    quantity: '',
    availableQuantity: inventory.availableQuantity,
    price: '',
    totalPrice: '',
  }
}

/** 规范明细金额 */
function normalizeDetails(details: ShipmentOrderDetail[]): ShipmentOrderFormDetail[] {
  return details.map(detail => ({
    ...detail,
    quantity: detail.quantity ?? '',
    price: detail.price ?? '',
    totalPrice: detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price) ?? '',
  }))
}

/** 添加商品 */
function handleAddDetail() {
  inventoryPickerRef.value?.open(getSelectedInventoryKeys())
}

/** 选择库存 */
function handleSelectInventory(inventories: InventoryPickerRow[]) {
  formData.value.details = formData.value.details || []
  inventories.forEach((inventory) => {
    if (isInventorySelected(inventory)) {
      return
    }
    formData.value.details!.push(buildDetail(inventory))
  })
}

/** 判断库存是否已选择 */
function isInventorySelected(inventory: InventoryPickerRow) {
  return (formData.value.details || []).some((detail) => {
    return detail.skuId === inventory.skuId && detail.warehouseId === inventory.warehouseId
  })
}

/** 获取已选库存标识 */
function getSelectedInventoryKeys() {
  return (formData.value.details || [])
    .map(detail => detail.skuId && detail.warehouseId ? `${detail.skuId}-${detail.warehouseId}` : undefined)
    .filter((key): key is string => !!key)
}

/** 删除明细 */
function handleDeleteDetail(index: number) {
  formData.value.details?.splice(index, 1)
}

/** 仓库变化 */
function handleWarehouseChange() {
  formData.value.details = []
}

/** 明细数量变化 */
function handleDetailQuantityChange(detail: ShipmentOrderFormDetail) {
  if (toOptionalNumber(detail.price) !== undefined) {
    detail.totalPrice = multiplyPrice(detail.quantity, detail.price)
    return
  }
  detail.price = dividePrice(detail.totalPrice, detail.quantity)
}

/** 明细单价变化 */
function handleDetailPriceChange(detail: ShipmentOrderFormDetail) {
  detail.totalPrice = multiplyPrice(detail.quantity, detail.price)
}

/** 明细金额变化 */
function handleDetailTotalPriceChange(detail: ShipmentOrderFormDetail) {
  detail.price = dividePrice(detail.totalPrice, detail.quantity)
}

/** 校验明细 */
function validateDetails() {
  const details = formData.value.details || []
  for (let i = 0; i < details.length; i++) {
    const detail = details[i]
    const quantity = toOptionalNumber(detail.quantity)
    if (!quantity || quantity <= 0) {
      toast.error(`第 ${i + 1} 行明细出库数量必须大于 0`)
      return false
    }
    if (detail.availableQuantity !== undefined && quantity > detail.availableQuantity) {
      toast.error(`第 ${i + 1} 行明细出库数量不能大于可用库存`)
      return false
    }
  }
  return true
}

/** 构建提交数据 */
function buildSubmitData(): ShipmentOrder {
  const { totalQuantity: _totalQuantity, totalPrice: _totalPrice, details, ...order } = formData.value
  return {
    ...order,
    details: (details || []).map(({ availableQuantity: _availableQuantity, ...detail }) => ({
      ...detail,
      quantity: toOptionalNumber(detail.quantity),
      price: toOptionalNumber(detail.price),
      totalPrice: toOptionalNumber(detail.totalPrice),
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
      await updateShipmentOrder(buildSubmitData())
      toast.success('修改成功')
    } else {
      await createShipmentOrder(buildSubmitData())
      toast.success('新增成功')
    }
    uni.$emit('wms:shipment-order:reload')
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
