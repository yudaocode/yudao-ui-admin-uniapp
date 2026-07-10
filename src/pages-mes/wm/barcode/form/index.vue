<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-form-picker v-model="formData.bizType" label="业务类型" label-width="220rpx" prop="bizType" :disabled="!!currentId" :columns="bizTypeOptions" placeholder="请选择业务类型" />
          <wd-form-item v-if="isWarehouseBizType && currentId" title="业务对象" title-width="220rpx" prop="bizId">
            <view
              class="min-h-72rpx flex items-center rounded-8rpx bg-[#f7f8fa] px-20rpx text-28rpx text-[#333]"
            >
              <text class="min-w-0 flex-1 truncate">
                {{ selectedBizText || '-' }}
              </text>
            </view>
          </wd-form-item>
          <template v-else-if="isWarehouseBizType">
            <WarehouseFormPicker
              v-model="warehouseId"
              label="仓库"
              label-width="220rpx"
              :prop="formData.bizType === BarcodeBizTypeEnum.WAREHOUSE ? 'bizId' : ''"
              placeholder="请选择仓库"
              clearable
              @change="handleWarehouseChange"
            />
            <WarehouseLocationFormPicker
              v-if="formData.bizType === BarcodeBizTypeEnum.LOCATION || formData.bizType === BarcodeBizTypeEnum.AREA"
              v-model="locationId"
              label="库区"
              label-width="220rpx"
              :prop="formData.bizType === BarcodeBizTypeEnum.LOCATION ? 'bizId' : ''"
              placeholder="请选择库区"
              :warehouse-id="warehouseId"
              clearable
              @change="handleLocationChange"
            />
            <WarehouseAreaFormPicker
              v-if="formData.bizType === BarcodeBizTypeEnum.AREA"
              v-model="formData.bizId"
              label="库位"
              label-width="220rpx"
              prop="bizId"
              placeholder="请选择库位"
              :location-id="locationId"
              clearable
              @change="handleAreaChange"
            />
          </template>
          <UserFormPicker
            v-else-if="formData.bizType === BarcodeBizTypeEnum.USER"
            v-model="formData.bizId"
            label="业务对象"
            label-width="220rpx"
            prop="bizId"
            placeholder="请选择业务对象"
            :disabled="!!currentId"
            @confirm="handleUserConfirm"
          />
          <wd-form-item
            v-else-if="isSupportedBizType"
            title="业务对象"
            title-width="220rpx"
            prop="bizId"
            :is-link="!currentId"
            :value="selectedBizText"
            placeholder="请选择业务对象"
            @click="openBizPicker"
          />
          <wd-form-item v-else title="业务对象" title-width="220rpx" prop="bizId">
            <view class="rounded-8rpx bg-[#fff7e6] px-20rpx py-18rpx text-26rpx text-[#8a5a00] leading-38rpx">
              {{ unsupportedTip }}
            </view>
          </wd-form-item>
          <wd-form-item title="业务编码" title-width="220rpx" prop="bizCode">
            <wd-input v-model="formData.bizCode" readonly placeholder="选择业务对象后回填" />
          </wd-form-item>
          <wd-form-item title="业务名称" title-width="220rpx" prop="bizName">
            <wd-input v-model="formData.bizName" readonly placeholder="选择业务对象后回填" />
          </wd-form-item>
          <wd-form-item title="条码内容" title-width="220rpx" prop="content">
            <wd-input v-model="formData.content" placeholder="选择业务对象后自动生成，也可手动调整" clearable />
          </wd-form-item>
          <yd-form-picker v-model="formData.status" label="状态" label-width="220rpx" prop="status" :dict-type="DICT_TYPE.COMMON_STATUS" placeholder="请选择状态" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" variant="plain" @click="handleConfig">
          条码设置
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
    <!-- 业务对象选择器 -->
    <ItemPicker ref="itemPickerRef" :multiple="false" @confirm="handleItemConfirm" />
    <VendorPicker ref="vendorPickerRef" @confirm="handleVendorConfirm" />
    <ClientPicker ref="clientPickerRef" @confirm="handleClientConfirm" />
    <WorkOrderPicker ref="workOrderPickerRef" :confirmed-only="false" @confirm="handleWorkOrderConfirm" />
    <PackagePicker ref="packagePickerRef" childable-only @confirm="handlePackageConfirm" />
    <MaterialStockPicker ref="materialStockPickerRef" @confirm="handleMaterialStockConfirm" />
    <MachineryPicker ref="machineryPickerRef" @confirm="handleMachineryConfirm" />
    <WorkstationPicker ref="workstationPickerRef" @confirm="handleWorkstationConfirm" />
    <BatchPicker ref="batchPickerRef" @confirm="handleBatchConfirm" />
    <ToolPicker ref="toolPickerRef" @confirm="handleToolConfirm" />
    <CardPicker ref="cardPickerRef" @confirm="handleCardConfirm" />
    <TaskPicker ref="taskPickerRef" :statuses="taskPickerStatuses" @confirm="handleTaskConfirm" />
    <WorkshopPicker ref="workshopPickerRef" @confirm="handleWorkshopConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DvMachinery } from '@/api/mes/dv/machinery'
import type { MdClient } from '@/api/mes/md/client'
import type { MdItem } from '@/api/mes/md/item'
import type { MdVendor } from '@/api/mes/md/vendor'
import type { MdWorkstation } from '@/api/mes/md/workstation'
import type { MdWorkshop } from '@/api/mes/md/workstation/workshop'
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import type { ProCard } from '@/api/mes/pro/card'
import type { ProTask } from '@/api/mes/pro/task'
import type { WmBarcode } from '@/api/mes/wm/barcode'
import type { Batch } from '@/api/mes/wm/batch'
import type { WmMaterialStock } from '@/api/mes/wm/materialstock'
import type { WmPackage } from '@/api/mes/wm/packages'
import type { WmWarehouse } from '@/api/mes/wm/warehouse'
import type { WmWarehouseArea } from '@/api/mes/wm/warehouse/area'
import type { WmWarehouseLocation } from '@/api/mes/wm/warehouse/location'
import type { TmTool } from '@/api/mes/tm/tool'
import type { User } from '@/api/system/user'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import MachineryPicker from '@/pages-mes/dv/machinery/components/machinery-picker.vue'
import ClientPicker from '@/pages-mes/md/client/components/client-picker.vue'
import ItemPicker from '@/pages-mes/md/item/components/item-picker.vue'
import VendorPicker from '@/pages-mes/md/vendor/components/vendor-picker.vue'
import WorkOrderPicker from '@/pages-mes/pro/workorder/components/workorder-picker.vue'
import WorkstationPicker from '@/pages-mes/md/workstation/components/workstation-picker.vue'
import WorkshopPicker from '@/pages-mes/md/workstation/workshop/components/workshop-picker.vue'
import CardPicker from '@/pages-mes/pro/card/components/card-picker.vue'
import ToolPicker from '@/pages-mes/tm/tool/components/tool-picker.vue'
import BatchPicker from '@/pages-mes/wm/batch/components/batch-picker.vue'
import TaskPicker from '@/pages-mes/pro/task/components/task-picker.vue'
import MaterialStockPicker from '@/pages-mes/wm/materialstock/components/material-stock-picker.vue'
import PackagePicker from '@/pages-mes/wm/packages/components/package-picker.vue'
import WarehouseFormPicker from '@/pages-mes/wm/warehouse/components/warehouse-form-picker.vue'
import WarehouseAreaFormPicker from '@/pages-mes/wm/warehouse/area/components/warehouse-area-form-picker.vue'
import WarehouseLocationFormPicker from '@/pages-mes/wm/warehouse/location/components/warehouse-location-form-picker.vue'
import { createBarcode, generateBarcodeContent, getBarcode, updateBarcode } from '@/api/mes/wm/barcode'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { BarcodeBizTypeEnum, CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

interface BarcodeFormData {
  id?: number
  bizType?: number
  bizId?: number
  bizCode: string
  bizName: string
  content: string
  status: number
  remark: string
}

const toast = useToast()
const currentId = computed(() => props.id ? Number(props.id) : undefined) // 当前条码编号
const formLoading = ref(false) // 表单提交状态
const loadingDetail = ref(false) // 详情加载状态
const formRef = ref<FormInstance>() // 表单组件引用
const itemPickerRef = ref<InstanceType<typeof ItemPicker>>() // 物料选择器
const vendorPickerRef = ref<InstanceType<typeof VendorPicker>>() // 供应商选择器
const clientPickerRef = ref<InstanceType<typeof ClientPicker>>() // 客户选择器
const workOrderPickerRef = ref<InstanceType<typeof WorkOrderPicker>>() // 工单选择器
const packagePickerRef = ref<InstanceType<typeof PackagePicker>>() // 装箱单选择器
const materialStockPickerRef = ref<InstanceType<typeof MaterialStockPicker>>() // 库存选择器
const machineryPickerRef = ref<InstanceType<typeof MachineryPicker>>() // 设备选择器
const workstationPickerRef = ref<InstanceType<typeof WorkstationPicker>>() // 工作站选择器
const batchPickerRef = ref<InstanceType<typeof BatchPicker>>() // 批次选择器
const toolPickerRef = ref<InstanceType<typeof ToolPicker>>() // 工具选择器
const cardPickerRef = ref<InstanceType<typeof CardPicker>>() // 流转卡选择器
const taskPickerRef = ref<InstanceType<typeof TaskPicker>>() // 生产任务选择器
const workshopPickerRef = ref<InstanceType<typeof WorkshopPicker>>() // 车间选择器
const warehouseId = ref<number>() // 仓库编号
const locationId = ref<number>() // 库区编号
const taskPickerStatuses = [0, 1, 2, 3, 4, 5, 10] // 条码选择任务时不过滤状态
const formData = ref<BarcodeFormData>({
  bizType: undefined,
  bizId: undefined,
  bizCode: '',
  bizName: '',
  content: '',
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  bizType: [{ required: true, message: '业务类型不能为空' }],
  bizId: [{ required: true, message: '业务对象不能为空' }],
  bizCode: [{ required: true, message: '业务编码不能为空' }],
  bizName: [{ required: true, message: '业务名称不能为空' }],
  content: [{ required: true, message: '条码内容不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
  remark: [{ max: 200, message: '备注长度不能超过 200 个字符' }],
})
const getTitle = computed(() => currentId.value ? '编辑条码' : '新增条码')
const bizTypeOptions = computed(() => {
  const options = [...getIntDictOptions(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE)]
  if (!options.some(item => item.value === BarcodeBizTypeEnum.TASK)) {
    options.push({ label: '任务', value: BarcodeBizTypeEnum.TASK })
  }
  return options
})
const supportedBizTypes: number[] = [
  BarcodeBizTypeEnum.ITEM,
  BarcodeBizTypeEnum.VENDOR,
  BarcodeBizTypeEnum.CLIENT,
  BarcodeBizTypeEnum.WORKORDER,
  BarcodeBizTypeEnum.PACKAGE,
  BarcodeBizTypeEnum.STOCK,
  BarcodeBizTypeEnum.WAREHOUSE,
  BarcodeBizTypeEnum.LOCATION,
  BarcodeBizTypeEnum.AREA,
  BarcodeBizTypeEnum.BATCH,
  BarcodeBizTypeEnum.PROCARD,
  BarcodeBizTypeEnum.MACHINERY,
  BarcodeBizTypeEnum.TOOL,
  BarcodeBizTypeEnum.WORKSTATION,
  BarcodeBizTypeEnum.TASK,
  BarcodeBizTypeEnum.WORKSHOP,
  BarcodeBizTypeEnum.USER,
] // 已接入移动端选择器的业务类型
const isSupportedBizType = computed(() => {
  return formData.value.bizType !== undefined && supportedBizTypes.includes(formData.value.bizType)
})
const isWarehouseBizType = computed(() => {
  return formData.value.bizType === BarcodeBizTypeEnum.WAREHOUSE
    || formData.value.bizType === BarcodeBizTypeEnum.LOCATION
    || formData.value.bizType === BarcodeBizTypeEnum.AREA
})
const selectedBizText = computed(() => {
  const code = formData.value.bizCode
  const name = formData.value.bizName
  return [code, name].filter(Boolean).join(' / ')
})
const unsupportedTip = computed(() => {
  if (!formData.value.bizType) {
    return '请先选择业务类型。'
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.TRANSORDER) {
    return '流转单后端模块尚未实现，移动端暂不开放该业务条码保存。'
  }
  const label = getDictLabel(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE, formData.value.bizType)
  return `${label || '当前业务类型'}暂未纳入移动端条码对象维护范围；如需开放，请先确认后端业务对象来源和移动端选择器设计。`
})

/** 默认表单数据 */
function getDefaultFormData(): BarcodeFormData {
  return {
    bizType: undefined,
    bizId: undefined,
    bizCode: '',
    bizName: '',
    content: '',
    status: CommonStatusEnum.ENABLE,
    remark: '',
  }
}

/** 返回列表 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/barcode/index')
}

/** 打开条码设置 */
function handleConfig() {
  uni.navigateTo({
    url: '/pages-mes/wm/barcode/config/index',
  })
}

/** 清空业务对象 */
function clearBizObject() {
  formData.value.bizId = undefined
  formData.value.bizCode = ''
  formData.value.bizName = ''
  formData.value.content = ''
  warehouseId.value = undefined
  locationId.value = undefined
}

/** 重置表单 */
function resetForm() {
  formData.value = getDefaultFormData()
  clearBizObject()
}

/** 清空仓库业务对象 */
function clearWarehouseObject() {
  clearBizObject()
}

/** 清空库区业务对象 */
function clearLocationObject() {
  locationId.value = undefined
  if (formData.value.bizType === BarcodeBizTypeEnum.LOCATION) {
    clearBizObject()
    return
  }
  formData.value.bizId = undefined
  formData.value.bizCode = ''
  formData.value.bizName = ''
  formData.value.content = ''
}

/** 清空库位业务对象 */
function clearAreaObject() {
  formData.value.bizId = undefined
  formData.value.bizCode = ''
  formData.value.bizName = ''
  formData.value.content = ''
}

/** 打开业务对象选择器 */
function openBizPicker() {
  if (currentId.value) {
    toast.warning('编辑条码时不支持切换业务对象')
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.ITEM) {
    itemPickerRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.VENDOR) {
    vendorPickerRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.CLIENT) {
    clientPickerRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.WORKORDER) {
    workOrderPickerRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.PACKAGE) {
    packagePickerRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.STOCK) {
    materialStockPickerRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.BATCH) {
    batchPickerRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.MACHINERY) {
    machineryPickerRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.TOOL) {
    toolPickerRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.WORKSTATION) {
    workstationPickerRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.PROCARD) {
    cardPickerRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.TASK) {
    taskPickerRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.WORKSHOP) {
    workshopPickerRef.value?.open()
    return
  }
  toast.warning(unsupportedTip.value)
}

/** 回填业务对象 */
async function fillBizObject(bizId: number, bizCode: string, bizName: string) {
  formData.value.bizId = bizId
  formData.value.bizCode = bizCode
  formData.value.bizName = bizName
  await generateContent()
}

/** 生成条码内容 */
async function generateContent() {
  if (!formData.value.bizType || !formData.value.bizCode) {
    formData.value.content = ''
    return
  }
  try {
    formData.value.content = await generateBarcodeContent(formData.value.bizType, formData.value.bizCode)
  } catch {
    formData.value.content = ''
  }
}

/** 确认物料 */
function handleItemConfirm(items: MdItem[]) {
  const item = items[0]
  if (!item) {
    return
  }
  fillBizObject(item.id, item.code || '', item.name || item.code || '')
}

/** 确认供应商 */
function handleVendorConfirm(vendors: MdVendor[]) {
  const vendor = vendors[0]
  if (!vendor) {
    return
  }
  fillBizObject(vendor.id, vendor.code || '', vendor.name || vendor.nickname || vendor.code || '')
}

/** 确认客户 */
function handleClientConfirm(clients: MdClient[]) {
  const client = clients[0]
  if (!client) {
    return
  }
  fillBizObject(client.id, client.code || '', client.name || client.nickname || client.code || '')
}

/** 确认生产工单 */
function handleWorkOrderConfirm(item: ProWorkOrder) {
  fillBizObject(item.id, item.code || '', item.name || item.code || '')
}

/** 确认装箱单 */
function handlePackageConfirm(item: WmPackage) {
  fillBizObject(item.id, item.code || '', item.clientName || item.code || '')
}

/** 确认库存台账 */
function handleMaterialStockConfirm(rows: WmMaterialStock[]) {
  const stock = rows[0]
  if (!stock) {
    return
  }
  fillBizObject(stock.id, stock.itemCode || stock.batchCode || String(stock.id), stock.itemName || stock.batchCode || '')
}

/** 仓库变更 */
async function handleWarehouseChange(warehouse?: WmWarehouse) {
  if (!warehouse?.id) {
    clearWarehouseObject()
    return
  }
  warehouseId.value = warehouse.id
  locationId.value = undefined
  if (formData.value.bizType === BarcodeBizTypeEnum.WAREHOUSE) {
    await fillBizObject(warehouse.id, warehouse.code || '', warehouse.name || warehouse.code || '')
    return
  }
  clearAreaObject()
}

/** 库区变更 */
async function handleLocationChange(location?: WmWarehouseLocation) {
  if (!location?.id) {
    clearLocationObject()
    return
  }
  locationId.value = location.id
  if (formData.value.bizType === BarcodeBizTypeEnum.LOCATION) {
    await fillBizObject(location.id, location.code || '', location.name || location.code || '')
    return
  }
  clearAreaObject()
}

/** 库位变更 */
async function handleAreaChange(area?: WmWarehouseArea) {
  if (!area?.id) {
    clearAreaObject()
    return
  }
  await fillBizObject(area.id, area.code || '', area.name || area.code || '')
}

/** 确认批次 */
function handleBatchConfirm(item: Batch) {
  fillBizObject(item.id, item.code || '', item.itemName || item.code || '')
}

/** 确认设备 */
function handleMachineryConfirm(item: DvMachinery) {
  fillBizObject(item.id, item.code || '', item.name || item.code || '')
}

/** 确认工具 */
function handleToolConfirm(item: TmTool) {
  fillBizObject(item.id, item.code || '', item.name || item.code || '')
}

/** 确认工作站 */
function handleWorkstationConfirm(item: MdWorkstation) {
  fillBizObject(item.id, item.code || '', item.name || item.code || '')
}

/** 确认流转卡 */
function handleCardConfirm(item: ProCard) {
  fillBizObject(item.id, item.code || '', item.workOrderName || item.itemName || item.code || '')
}

/** 确认生产任务 */
function handleTaskConfirm(item: ProTask) {
  fillBizObject(item.id, item.code || item.name || String(item.id), item.name || item.itemName || item.processName || '')
}

/** 确认车间 */
function handleWorkshopConfirm(item: MdWorkshop) {
  fillBizObject(item.id, item.code || '', item.name || item.code || '')
}

/** 确认人员 */
function handleUserConfirm(users: User[]) {
  const user = users[0]
  if (!user?.id) {
    return
  }
  fillBizObject(user.id, user.username || String(user.id), user.nickname || user.username || '')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  loadingDetail.value = true
  try {
    const data = await getBarcode(currentId.value)
    formData.value = {
      id: data.id,
      bizType: data.bizType,
      bizId: data.bizId,
      bizCode: data.bizCode || '',
      bizName: data.bizName || '',
      content: data.content || '',
      status: data.status,
      remark: data.remark || '',
    }
  } finally {
    loadingDetail.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData(): WmBarcode {
  const data: WmBarcode = {
    bizType: Number(formData.value.bizType),
    bizId: Number(formData.value.bizId),
    bizCode: formData.value.bizCode,
    bizName: formData.value.bizName || undefined,
    content: formData.value.content || undefined,
    status: formData.value.status,
    remark: formData.value.remark || undefined,
  }
  if (currentId.value) {
    data.id = currentId.value
  }
  return data
}

/** 提交表单 */
async function handleSubmit() {
  if (!isSupportedBizType.value) {
    toast.warning(unsupportedTip.value)
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (currentId.value) {
      await updateBarcode(data)
      toast.success('修改成功')
    } else {
      await createBarcode(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:barcode:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 监听业务类型变化 */
watch(
  () => formData.value.bizType,
  () => {
    if (currentId.value || loadingDetail.value) {
      return
    }
    clearBizObject()
  },
)

/** 初始化 */
onMounted(() => {
  if (currentId.value) {
    getDetail()
    return
  }
  resetForm()
})
</script>
