<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell v-if="parentWorkOrder" title="父工单" :value="`${parentWorkOrder.code} / ${parentWorkOrder.name}`" />
          <wd-form-item title="工单编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="工单名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入工单名称" clearable />
          </wd-form-item>
          <yd-form-picker v-model="formData.orderSourceType" label="工单来源" label-width="220rpx" prop="orderSourceType" :dict-type="DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE" placeholder="请选择工单来源" />
          <wd-form-item v-if="formData.orderSourceType === MesProWorkOrderSourceTypeEnum.ORDER" title="来源单据" title-width="220rpx" prop="orderSourceCode">
            <wd-input v-model="formData.orderSourceCode" placeholder="请输入来源单据编号" clearable />
          </wd-form-item>
          <yd-form-picker v-model="formData.type" label="工单类型" label-width="220rpx" prop="type" :dict-type="DICT_TYPE.MES_PRO_WORK_ORDER_TYPE" placeholder="请选择工单类型" />
          <ItemFormPicker v-model="formData.productId" label="产品" label-width="220rpx" prop="productId" item-or-product="PRODUCT" title="选择产品" placeholder="请选择产品" @change="handleProductChange" />
          <wd-form-item title="工单数量" title-width="220rpx" prop="quantity" center>
            <wd-input-number v-model="formData.quantity" :min="1" :precision="2" />
          </wd-form-item>
          <ClientFormPicker
            v-if="formData.orderSourceType === MesProWorkOrderSourceTypeEnum.ORDER"
            v-model="formData.clientId"
            label="客户"
            label-width="220rpx"
            prop="clientId"
            placeholder="请选择客户"
          />
          <VendorFormPicker
            v-if="showVendor"
            v-model="formData.vendorId"
            label="供应商"
            label-width="220rpx"
            prop="vendorId"
            placeholder="请选择供应商"
          />
          <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
            <wd-input v-model="formData.batchCode" placeholder="请输入批次号" clearable />
          </wd-form-item>
          <wd-form-item title="需求日期" title-width="220rpx" prop="requestDate" is-link :value="formatDateTime(formData.requestDate) || ''" placeholder="请选择需求日期" @click="dateVisible.requestDate = true" />
          <wd-datetime-picker v-model="formData.requestDate" v-model:visible="dateVisible.requestDate" title="请选择需求日期" type="date" />
          <wd-cell v-if="formData.status != null" title="工单状态">
            <dict-tag :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="formData.status" />
          </wd-cell>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="300" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <WorkOrderBomList
        v-if="workOrderId"
        :work-order-id="workOrderId"
        :work-order="formData"
        @generate-work-order="handleGenerateWorkOrder"
      />
      <WorkOrderItemList v-if="workOrderId" :work-order-id="workOrderId" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
        <wd-button v-if="canConfirm" class="flex-1" type="warning" :loading="formLoading" @click="handleConfirm">
          确认
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItem } from '@/api/mes/md/item'
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import type { ProWorkOrderBom } from '@/api/mes/pro/workorder/bom'
import ClientFormPicker from '@/pages-mes/md/client/components/client-form-picker.vue'
import ItemFormPicker from '@/pages-mes/md/item/components/item-form-picker.vue'
import VendorFormPicker from '@/pages-mes/md/vendor/components/vendor-form-picker.vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { confirmWorkOrder, createWorkOrder, getWorkOrder, updateWorkOrder } from '@/api/mes/pro/workorder'
import { getWorkOrderBom } from '@/api/mes/pro/workorder/bom'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesProWorkOrderSourceTypeEnum, MesProWorkOrderStatusEnum, MesProWorkOrderTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { toFiniteNumber } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'
import WorkOrderBomList from '../components/workorder-bom-list.vue'
import WorkOrderItemList from '../components/workorder-item-list.vue'

const props = defineProps<{
  id?: number | string
  parentId?: number | string
  bomId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const getTitle = computed(() => props.parentId ? '新增子工单' : props.id ? '编辑生产工单' : '新增生产工单')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formRef = ref<FormInstance>() // 表单组件引用
const dateVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const parentWorkOrder = ref<ProWorkOrder>() // 父工单
const formData = ref<ProWorkOrder>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '工单编码不能为空' }],
  name: [{ required: true, message: '工单名称不能为空' }],
  type: [{ required: true, message: '工单类型不能为空' }],
  orderSourceType: [{ required: true, message: '工单来源不能为空' }],
  productId: [{ required: true, message: '产品不能为空' }],
  quantity: [{ required: true, message: '工单数量不能为空' }],
  requestDate: [{ required: true, message: '需求日期不能为空' }],
})
const workOrderId = computed(() => formData.value.id)
const canConfirm = computed(() => !!formData.value.id && formData.value.status === MesProWorkOrderStatusEnum.PREPARE)
const showVendor = computed(() =>
  formData.value.type === MesProWorkOrderTypeEnum.OUTSOURCE || formData.value.type === MesProWorkOrderTypeEnum.PURCHASE,
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/workorder/index')
}

/** 默认表单数据 */
function getDefaultFormData(): ProWorkOrder {
  return {
    orderSourceType: MesProWorkOrderSourceTypeEnum.STORE,
    quantity: 1,
    requestDate: Date.now(),
  }
}

/** 加载详情 */
async function getDetail() {
  formData.value = getDefaultFormData()
  parentWorkOrder.value = undefined
  const parentId = toFiniteNumber(props.parentId)
  if (parentId && !props.id) {
    parentWorkOrder.value = await getWorkOrder(parentId)
    await applyChildWorkOrderPreset(parentWorkOrder.value)
    return
  }
  if (!props.id) {
    return
  }
  formData.value = await getWorkOrder(Number(props.id))
}

/** 应用子工单预填 */
async function applyChildWorkOrderPreset(parent: ProWorkOrder) {
  formData.value = {
    ...formData.value,
    parentId: parent.id,
    type: parent.type,
    orderSourceType: parent.orderSourceType,
    orderSourceCode: parent.orderSourceCode,
    clientId: parent.clientId,
    vendorId: parent.vendorId,
    requestDate: parent.requestDate,
  }

  // 如果是从 BOM 行生成子工单，则预填产品和数量
  const bomId = toFiniteNumber(props.bomId)
  if (bomId == null) {
    return
  }
  const bom = await getWorkOrderBom(bomId)
  formData.value = {
    ...formData.value,
    productId: bom.itemId,
    quantity: bom.quantity ?? formData.value.quantity,
    name: bom.itemName ? `${bom.itemName}【${bom.quantity ?? '-'}】${bom.unitMeasureName || ''}` : formData.value.name,
  }
}

/** 生成工单编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.PRO_WORK_ORDER_CODE)
    toast.success('生成成功')
  } finally {
    codeLoading.value = false
  }
}

/** 选择产品 */
function handleProductChange(product?: MdItem) {
  if (!product) {
    return
  }
  formData.value.productId = product.id
  if (!formData.value.name) {
    formData.value.name = product.name
  }
}

/** 从 BOM 行生成子工单 */
function handleGenerateWorkOrder(row: ProWorkOrderBom) {
  if (!formData.value.id || !row.id) {
    return
  }
  const query = [
    `parentId=${formData.value.id}`,
    `bomId=${row.id}`,
  ].join('&')
  uni.navigateTo({ url: `/pages-mes/pro/workorder/form/index?${query}` })
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  const isOrderSource = formData.value.orderSourceType === MesProWorkOrderSourceTypeEnum.ORDER
  const data: ProWorkOrder = {
    ...formData.value,
    orderSourceCode: isOrderSource ? formData.value.orderSourceCode || undefined : undefined,
    clientId: isOrderSource ? formData.value.clientId : undefined,
    vendorId: showVendor.value ? formData.value.vendorId : undefined,
  }
  try {
    if (formData.value.id) {
      await updateWorkOrder(data)
      toast.success('修改成功')
    } else {
      formData.value.id = await createWorkOrder(data)
      formData.value.status = MesProWorkOrderStatusEnum.PREPARE
      toast.success('新增成功')
    }
    uni.$emit('mes:pro:workorder:reload')
  } finally {
    formLoading.value = false
  }
}

/** 确认工单 */
async function handleConfirm() {
  if (!formData.value.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确认要完成工单编制吗？确认后将不能更改。' })
  } catch {
    return
  }

  formLoading.value = true
  try {
    await confirmWorkOrder(formData.value.id)
    toast.success('工单已确认')
    uni.$emit('mes:pro:workorder:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await getDetail()
})
</script>
