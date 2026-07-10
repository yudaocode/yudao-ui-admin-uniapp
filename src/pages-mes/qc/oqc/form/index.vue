<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="检验单编号" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="检验单名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入检验单名称" clearable />
          </wd-form-item>

          <template v-if="isFromPendingTask">
            <wd-cell title="来源单据类型">
              <dict-tag v-if="formData.sourceDocType != null" :type="DICT_TYPE.MES_QC_SOURCE_DOC_TYPE" :value="formData.sourceDocType" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="来源单据编号" :value="formData.sourceDocCode || '-'" />
          </template>

          <ClientFormPicker
            v-model="formData.clientId"
            label="客户"
            label-width="220rpx"
            prop="clientId"
            :placeholder="isFromPendingTask ? '由待检任务带入' : '请选择客户'"
            :disabled="isFromPendingTask"
            @change="handleClientChange"
          />
          <ItemFormPicker
            v-model="formData.itemId"
            label="产品物料"
            label-width="220rpx"
            prop="itemId"
            :placeholder="isFromPendingTask || props.id ? '由单据带入' : '请选择产品物料'"
            title="选择产品物料"
            :disabled="isFromPendingTask || !!props.id"
            @change="handleItemChange"
          />
          <wd-cell v-if="formData.itemSpecification || formData.unitName" title="规格单位" :value="`${formData.itemSpecification || '-'} / ${formData.unitName || '-'}`" />
          <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
            <wd-input v-model="formData.batchCode" placeholder="请输入批次号" clearable />
          </wd-form-item>

          <wd-form-item title="发货数量" title-width="220rpx" prop="outQuantity" center>
            <wd-input-number :model-value="formData.outQuantity" :min="0" :precision="2" :disabled="isFromPendingTask" @update:model-value="handleOutQuantityChange" />
          </wd-form-item>
          <wd-form-item title="检测数量" title-width="220rpx" prop="checkQuantity" center>
            <wd-input-number v-model="formData.checkQuantity" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="合格数量" title-width="220rpx" prop="qualifiedQuantity" center>
            <wd-input-number v-model="formData.qualifiedQuantity" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="不合格数量" title-width="220rpx" prop="unqualifiedQuantity" center>
            <wd-input-number v-model="formData.unqualifiedQuantity" :min="0" :precision="2" />
          </wd-form-item>
          <UserFormPicker v-model="formData.inspectorUserId" label="检测人员" label-width="220rpx" prop="inspectorUserId" placeholder="请选择检测人员" />
          <wd-form-item title="出货日期" title-width="220rpx" prop="outDate" is-link :value="formatDateTime(formData.outDate) || ''" placeholder="请选择出货日期" @click="dateVisible.outDate = true" />
          <wd-datetime-picker v-model="formData.outDate" v-model:visible="dateVisible.outDate" title="请选择出货日期" type="date" />
          <wd-form-item title="检测日期" title-width="220rpx" prop="inspectDate" is-link :value="formatDateTime(formData.inspectDate) || ''" placeholder="请选择检测日期" @click="dateVisible.inspectDate = true" />
          <wd-datetime-picker v-model="formData.inspectDate" v-model:visible="dateVisible.inspectDate" title="请选择检测日期" type="date" />
          <yd-form-picker v-model="formData.checkResult" label="检测结果" label-width="220rpx" prop="checkResult" :dict-type="DICT_TYPE.MES_QC_CHECK_RESULT" placeholder="请选择检测结果" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="300" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <template v-if="formData.id">
        <QcLineList :order-id="formData.id" :qc-type="MesQcTypeEnum.OQC" :readonly="!isDraft" />
        <IndicatorResultList :qc-id="formData.id" :qc-type="MesQcTypeEnum.OQC" :readonly="!isDraft" />
      </template>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view v-if="isDraft" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdClient } from '@/api/mes/md/client'
import type { MdItem } from '@/api/mes/md/item'
import type { QcOqc } from '@/api/mes/qc/oqc'
import ClientFormPicker from '@/pages-mes/md/client/components/client-form-picker.vue'
import ItemFormPicker from '@/pages-mes/md/item/components/item-form-picker.vue'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createOqc, getOqc, updateOqc } from '@/api/mes/qc/oqc'
import { decodeUrlText, delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesQcStatusEnum, MesQcTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { toFiniteNumber } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'
import IndicatorResultList from '../../indicatorresult/components/indicator-result-list.vue'
import QcLineList from '../../components/qc-line-list.vue'

const props = defineProps<{
  id?: number | string
  sourceDocType?: number | string
  sourceDocId?: number | string
  sourceLineId?: number | string
  sourceDocCode?: string
  itemId?: number | string
  itemCode?: string
  itemName?: string
  itemSpecification?: string
  unitName?: string
  quantity?: number | string
  recordTime?: string
  clientId?: number | string
  clientName?: string
  batchCode?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑出货检验单（OQC）' : '新增出货检验单（OQC）')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const dateVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const formData = ref<QcOqc>({
  code: '',
  name: '',
  outQuantity: 0,
  checkQuantity: 0,
  qualifiedQuantity: 0,
  unqualifiedQuantity: 0,
}) // 表单数据
const isDraft = computed(() => !props.id || formData.value.status === MesQcStatusEnum.DRAFT)
const isFromPendingTask = computed(() => !props.id && formData.value.sourceDocId != null)
const formSchema = createFormSchema({
  code: [{ required: true, message: '检验单编号不能为空' }],
  name: [{ required: true, message: '检验单名称不能为空' }],
  clientId: [{ required: true, message: '客户不能为空' }],
  itemId: [{ required: true, message: '产品物料不能为空' }],
  outQuantity: [
    { required: true, message: '发货数量不能为空' },
    { validator: value => Number(value) >= 0 || '发货数量不能小于 0' },
  ],
  checkQuantity: [
    { required: true, message: '检测数量不能为空' },
    { validator: value => Number(value) >= 0 || '检测数量不能小于 0' },
    { validator: () => validateQuantitySum() },
  ],
  qualifiedQuantity: [
    { required: true, message: '合格数量不能为空' },
    { validator: value => Number(value) >= 0 || '合格数量不能小于 0' },
    { validator: () => validateQuantitySum() },
  ],
  unqualifiedQuantity: [
    { required: true, message: '不合格数量不能为空' },
    { validator: value => Number(value) >= 0 || '不合格数量不能小于 0' },
    { validator: () => validateQuantitySum() },
  ],
  inspectorUserId: [{ required: true, message: '检测人员不能为空' }],
  outDate: [{ required: true, message: '出货日期不能为空' }],
  inspectDate: [{ required: true, message: '检测日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 校验数量合计 */
function validateQuantitySum() {
  const checkQuantity = Number(formData.value.checkQuantity || 0)
  const qualifiedQuantity = Number(formData.value.qualifiedQuantity || 0)
  const unqualifiedQuantity = Number(formData.value.unqualifiedQuantity || 0)
  return checkQuantity === qualifiedQuantity + unqualifiedQuantity || '检测数量必须等于合格数量与不合格数量之和'
}

/** 发货数量变更 */
function handleOutQuantityChange(value: number) {
  formData.value.outQuantity = value
  if (!props.id && formData.value.checkQuantity === 0 && value != null) {
    formData.value.checkQuantity = Number(value)
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/oqc/index')
}

/** 生成检验单编号 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.QC_OQC_CODE)
    toast.success('生成成功')
  } finally {
    codeLoading.value = false
  }
}

/** 客户变更 */
function handleClientChange(client?: MdClient) {
  formData.value.clientId = client?.id
  formData.value.clientNickname = client?.nickname || client?.name || ''
}

/** 物料变更 */
function handleItemChange(item?: MdItem) {
  formData.value.itemId = item?.id
  formData.value.itemCode = item?.code || ''
  formData.value.itemName = item?.name || ''
  formData.value.itemSpecification = item?.specification || ''
  formData.value.unitName = item?.unitMeasureName || ''
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getOqc(Number(props.id))
}

/** 是否有待检任务参数 */
function hasPendingInspectPreset() {
  return [
    toFiniteNumber(props.sourceDocType),
    toFiniteNumber(props.sourceDocId),
    toFiniteNumber(props.sourceLineId),
  ].every(value => value != null)
}

/** 应用待检任务预填 */
function applyPendingInspectPreset() {
  if (props.id || !hasPendingInspectPreset()) {
    return
  }
  const sourceDocCode = decodeUrlText(props.sourceDocCode)
  formData.value.name = sourceDocCode ? `${sourceDocCode} 出货检验单` : formData.value.name
  formData.value.sourceDocType = toFiniteNumber(props.sourceDocType)
  formData.value.sourceDocId = toFiniteNumber(props.sourceDocId)
  formData.value.sourceLineId = toFiniteNumber(props.sourceLineId)
  formData.value.sourceDocCode = sourceDocCode
  formData.value.clientId = toFiniteNumber(props.clientId)
  formData.value.clientNickname = decodeUrlText(props.clientName)
  formData.value.itemId = toFiniteNumber(props.itemId)
  formData.value.itemCode = decodeUrlText(props.itemCode)
  formData.value.itemName = decodeUrlText(props.itemName)
  formData.value.itemSpecification = decodeUrlText(props.itemSpecification)
  formData.value.unitName = decodeUrlText(props.unitName)
  formData.value.batchCode = decodeUrlText(props.batchCode)
  formData.value.outQuantity = toFiniteNumber(props.quantity) ?? 0
  formData.value.checkQuantity = formData.value.outQuantity
  formData.value.outDate = toFiniteNumber(props.recordTime) ?? decodeUrlText(props.recordTime)
  formData.value.inspectDate = formData.value.outDate
}

/** 提交表单 */
async function handleSubmit() {
  if (!isDraft.value) {
    toast.warning('已完成检验单不能修改')
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateOqc(formData.value)
      toast.success('修改成功')
    } else {
      await createOqc(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:qc:oqc:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  applyPendingInspectPreset()
  await getDetail()
})
</script>
