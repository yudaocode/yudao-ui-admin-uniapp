<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="流转卡编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :disabled="headerReadonly" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <WorkOrderFormPicker v-model="formData.workOrderId" label="生产工单" label-width="220rpx" prop="workOrderId" placeholder="请选择已确认工单" :disabled="headerReadonly" @change="handleWorkOrderChange" />
          <ItemFormPicker v-model="formData.itemId" label="产品" label-width="220rpx" prop="itemId" item-or-product="PRODUCT" title="选择产品" :disabled="productReadonly" @change="handleItemChange" />
          <wd-cell title="规格型号" :value="productSpecText" />
          <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
            <wd-input v-model="formData.batchCode" placeholder="请输入批次号" clearable :disabled="headerReadonly" />
          </wd-form-item>
          <wd-form-item title="流转数量" title-width="220rpx" prop="transferedQuantity" center>
            <wd-input-number
              :model-value="formData.transferedQuantity ?? ''"
              allow-null
              :min="0"
              :precision="2"
              :disabled="headerReadonly"
              @update:model-value="value => formData.transferedQuantity = toFiniteNumber(value)"
            />
          </wd-form-item>
          <wd-cell v-if="formData.status != null" title="单据状态">
            <dict-tag :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="formData.status" />
          </wd-cell>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="300" show-word-limit clearable :disabled="headerReadonly" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <CardProcessList v-if="formData.id" :card-id="formData.id" :editable="isEditable" @changed="handleProcessChanged" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="isEditable" class="flex-1" type="primary" :loading="formLoading" @click="submitForm">
          保存
        </wd-button>
        <wd-button v-if="canSubmit" class="flex-1" type="warning" :loading="formLoading" @click="handleSubmit">
          提交
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItem } from '@/api/mes/md/item'
import type { ProCard } from '@/api/mes/pro/card'
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createCard, getCard, submitCard, updateCard } from '@/api/mes/pro/card'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesProCardStatusEnum } from '@/utils/constants'
import { toFiniteNumber } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'
import ItemFormPicker from '@/pages-mes/md/item/components/item-form-picker.vue'
import WorkOrderFormPicker from '@/pages-mes/pro/workorder/components/workorder-form-picker.vue'
import CardProcessList from '../components/card-process-list.vue'

const props = defineProps<{
  id?: number | string
}>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const getTitle = computed(() => props.id ? '编辑流转卡' : '新增流转卡')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<ProCard>({
  code: '',
  batchCode: '',
  remark: '',
}) // 表单数据
const originalFormData = ref('') // 原始表单数据快照
const formSchema = createFormSchema({
  code: [{ required: true, message: '流转卡编码不能为空' }],
  workOrderId: [{ required: true, message: '生产工单不能为空' }],
  itemId: [{ required: true, message: '产品不能为空' }],
  transferedQuantity: [{ required: true, message: '流转数量不能为空' }],
})
const isEditable = computed(() => !formData.value.id || formData.value.status === MesProCardStatusEnum.PREPARE)
const canSubmit = computed(() => formData.value.id && formData.value.status === MesProCardStatusEnum.PREPARE)
const headerReadonly = computed(() => !isEditable.value)
const productReadonly = computed(() => headerReadonly.value || !!formData.value.workOrderId)
const productSpecText = computed(() => `${formData.value.specification || '-'} / ${formData.value.unitMeasureName || '-'}`)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/card/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getCard(Number(props.id))
  originalFormData.value = JSON.stringify(formData.value)
}

/** 选择工单 */
function handleWorkOrderChange(item?: ProWorkOrder) {
  if (!item) {
    return
  }
  formData.value.workOrderId = item.id
  formData.value.workOrderCode = item.code
  formData.value.workOrderName = item.name
  formData.value.itemId = item.productId
  formData.value.itemCode = item.productCode
  formData.value.itemName = item.productName
  formData.value.specification = item.productSpecification
  formData.value.unitMeasureName = item.unitMeasureName
  formData.value.batchCode = item.batchCode || formData.value.batchCode
  formData.value.transferedQuantity = item.quantity
}

/** 选择产品 */
function handleItemChange(item?: MdItem) {
  if (!item || item.id == null) {
    return
  }
  formData.value.itemId = item.id
  formData.value.itemCode = item.code
  formData.value.itemName = item.name
  formData.value.specification = item.specification || undefined
  formData.value.unitMeasureId = item.unitMeasureId
  formData.value.unitMeasureName = item.unitMeasureName
}

/** 生成流转卡编码 */
async function handleGenerateCode() {
  if (headerReadonly.value || codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.PRO_CARD_CODE)
    toast.success('生成成功')
  } finally {
    codeLoading.value = false
  }
}

/** 提交表单（create/update 模式） */
async function submitForm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateCard(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createCard(formData.value)
      toast.success('新增成功')
      formData.value.id = id
      formData.value.status = MesProCardStatusEnum.PREPARE
    }
    originalFormData.value = JSON.stringify(formData.value)
    uni.$emit('mes:pro:card:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交操作：表单修改过则先保存，再提交 */
async function handleSubmit() {
  if (!formData.value.id) {
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确认提交该流转卡？提交后将不能修改。' })
  } catch {
    return
  }

  formLoading.value = true
  try {
    if (JSON.stringify(formData.value) !== originalFormData.value) {
      await updateCard(formData.value)
      originalFormData.value = JSON.stringify(formData.value)
    }
    await submitCard(formData.value.id)
    toast.success('提交成功')
    uni.$emit('mes:pro:card:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 工序记录变更 */
function handleProcessChanged() {
  uni.$emit('mes:pro:card:reload')
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
