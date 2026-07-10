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
          <wd-form-item title="装箱单编号" title-width="220rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入装箱单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item
            title="装箱日期"
            title-width="220rpx"
            prop="packageDate"
            :is-link="!isHeaderReadonly"
            placeholder="请选择装箱日期"
            :value="formatDateTime(formData.packageDate)"
            @click="openPackageDatePicker"
          />
          <wd-datetime-picker
            v-model="formData.packageDate"
            v-model:visible="pickerVisible.packageDate"
            title="请选择装箱日期"
            type="date"
          />
          <wd-form-item
            v-if="isHeaderReadonly"
            title="检查员"
            title-width="220rpx"
            prop="inspectorUserId"
            :value="formData.inspectorName || '-'"
          />
          <UserFormPicker
            v-else
            v-model="formData.inspectorUserId"
            label="检查员"
            label-width="220rpx"
            prop="inspectorUserId"
            placeholder="请选择检查员"
          />
          <wd-form-item title="销售订单编号" title-width="220rpx" prop="salesOrderCode">
            <wd-input v-model="formData.salesOrderCode" clearable :disabled="isHeaderReadonly" placeholder="请输入销售订单编号" />
          </wd-form-item>
          <wd-form-item title="发票编号" title-width="220rpx" prop="invoiceCode">
            <wd-input v-model="formData.invoiceCode" clearable :disabled="isHeaderReadonly" placeholder="请输入发票编号" />
          </wd-form-item>
          <ClientFormPicker
            v-model="formData.clientId"
            label="客户"
            label-width="220rpx"
            prop="clientId"
            placeholder="请选择客户"
            :disabled="isHeaderReadonly"
            @change="handleClientChange"
          />
          <UnitMeasureFormPicker
            v-model="formData.sizeUnitId"
            label="尺寸单位"
            label-width="220rpx"
            prop="sizeUnitId"
            placeholder="请选择尺寸单位"
            :disabled="isHeaderReadonly"
            @change="handleSizeUnitChange"
          />
          <wd-form-item title="箱长度" title-width="220rpx" prop="length" center>
            <wd-input-number
              :model-value="formData.length ?? ''"
              :min="0"
              :precision="2"
              allow-null
              :disabled="isHeaderReadonly"
              @update:model-value="formData.length = toFiniteNumber($event)"
            />
          </wd-form-item>
          <wd-form-item title="箱宽度" title-width="220rpx" prop="width" center>
            <wd-input-number
              :model-value="formData.width ?? ''"
              :min="0"
              :precision="2"
              allow-null
              :disabled="isHeaderReadonly"
              @update:model-value="formData.width = toFiniteNumber($event)"
            />
          </wd-form-item>
          <wd-form-item title="箱高度" title-width="220rpx" prop="height" center>
            <wd-input-number
              :model-value="formData.height ?? ''"
              :min="0"
              :precision="2"
              allow-null
              :disabled="isHeaderReadonly"
              @update:model-value="formData.height = toFiniteNumber($event)"
            />
          </wd-form-item>
          <UnitMeasureFormPicker
            v-model="formData.weightUnitId"
            label="重量单位"
            label-width="220rpx"
            prop="weightUnitId"
            placeholder="请选择重量单位"
            :disabled="isHeaderReadonly"
            @change="handleWeightUnitChange"
          />
          <wd-form-item title="净重" title-width="220rpx" prop="netWeight" center>
            <wd-input-number
              :model-value="formData.netWeight ?? ''"
              :min="0"
              :precision="2"
              allow-null
              :disabled="isHeaderReadonly"
              @update:model-value="formData.netWeight = toFiniteNumber($event)"
            />
          </wd-form-item>
          <wd-form-item title="毛重" title-width="220rpx" prop="grossWeight" center>
            <wd-input-number
              :model-value="formData.grossWeight ?? ''"
              :min="0"
              :precision="2"
              allow-null
              :disabled="isHeaderReadonly"
              @update:model-value="formData.grossWeight = toFiniteNumber($event)"
            />
          </wd-form-item>
          <wd-form-item v-if="currentId" title="单据状态" title-width="220rpx">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_PACKAGE_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :disabled="isHeaderReadonly"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <view v-if="currentId" class="px-24rpx">
        <SubPackageList :package-id="currentId" :editable="isEditable" />
        <PackageLineList :package-id="currentId" :editable="isEditable" />
      </view>
      <view v-else class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx text-26rpx text-[#8c8c8c] leading-40rpx">
        请先保存装箱单主表，保存后可继续维护子箱和装箱清单。
      </view>
      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        完成后装箱单将不可编辑；H5 验证仅打开确认框并取消，不确认真实完成。
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view v-if="hasFooterActions" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="isEditable"
          class="flex-1"
          type="primary"
          :loading="formLoading" @click="handleSubmit"
        >
          保存
        </wd-button>
        <wd-button
          v-if="canFinish"
          class="flex-1"
          type="success"
          :loading="finishLoading" @click="handleFinishPackage"
        >
          完成
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MdClient } from '@/api/mes/md/client'
import type { MdUnitMeasure } from '@/api/mes/md/unitmeasure'
import type { WmPackage } from '@/api/mes/wm/packages'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createPackage, finishPackage, getPackage, updatePackage } from '@/api/mes/wm/packages'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import ClientFormPicker from '@/pages-mes/md/client/components/client-form-picker.vue'
import UnitMeasureFormPicker from '@/pages-mes/md/unitmeasure/components/unit-measure-form-picker.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmPackageStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { toFiniteNumber } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'
import PackageLineList from '../components/package-line-list.vue'
import SubPackageList from '../components/sub-package-list.vue'

const props = defineProps<{
  id?: number | string
  mode?: 'finish' | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const routeId = computed(() => props.id ? Number(props.id) : undefined) // 路由编号
const routeMode = computed(() => String(props.mode || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'finish') {
    return '完成装箱单'
  }
  return currentId.value ? '编辑装箱单' : '新增装箱单'
})
const formLoading = ref(false) // 表单提交状态
const finishLoading = ref(false) // 完成状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmPackage>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '装箱单编号不能为空' }],
  packageDate: [{ required: true, message: '装箱日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const isPrepare = computed(() => !currentId.value || formData.value.status === MesWmPackageStatusEnum.PREPARE)
const isFinish = computed(() => currentMode.value === 'finish' && isPrepare.value)
const isEditable = computed(() => isPrepare.value && (!currentMode.value || currentMode.value === 'update'))
const isHeaderReadonly = computed(() => !isEditable.value)
const canFinish = computed(() => {
  return (isEditable.value || isFinish.value)
    && currentId.value
    && formData.value.status === MesWmPackageStatusEnum.PREPARE
})
const hasFooterActions = computed(() => isEditable.value || canFinish.value)

/** 默认表单数据 */
function getDefaultFormData(): WmPackage {
  return {}
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/packages/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = await getPackage(currentId.value)
}

/** 打开装箱日期选择 */
function openPackageDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.packageDate = true
}

/** 客户变更 */
function handleClientChange(client?: MdClient) {
  formData.value.clientId = client?.id
  formData.value.clientCode = client?.code
  formData.value.clientName = client?.name
}

/** 尺寸单位变更 */
function handleSizeUnitChange(unit?: MdUnitMeasure) {
  formData.value.sizeUnitName = unit?.name
}

/** 重量单位变更 */
function handleWeightUnitChange(unit?: MdUnitMeasure) {
  formData.value.weightUnitName = unit?.name
}

/** 生成装箱单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_PACKAGE_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (currentId.value) {
      await updatePackage(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createPackage(formData.value)
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmPackageStatusEnum.PREPARE
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:packages:reload')
    await getDetail()
  } finally {
    formLoading.value = false
  }
}

/** 完成装箱单 */
async function handleFinishPackage() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认完成该装箱单？完成后将不可编辑。',
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    if (isEditable.value) {
      await updatePackage(formData.value)
    }
    await finishPackage(currentId.value)
    toast.success('完成成功')
    await getDetail()
    uni.$emit('mes:wm:packages:reload')
  } finally {
    finishLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  currentId.value = routeId.value
  currentMode.value = routeMode.value
  await getDetail()
})
</script>
