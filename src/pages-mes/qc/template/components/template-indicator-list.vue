<template>
  <view class="mt-24rpx bg-white">
    <view v-if="showTitle" class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        检测指标项
      </view>
      <wd-button
        v-if="hasAccessByCodes(['mes:qc-template:create'])"
        size="small"
        type="primary"
        variant="plain"
        @click="handleAdd"
      >
        新增
      </wd-button>
    </view>
    <view v-if="loading" class="p-24rpx text-28rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="p-24rpx text-28rpx text-[#999]">
      暂无检测指标项
    </view>
    <view v-else class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-20rpx rounded-12rpx bg-[#f8f9fb] p-20rpx last:mb-0"
      >
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333] font-semibold">
              {{ item.indicatorName || '-' }}
            </view>
            <view class="mt-6rpx truncate text-24rpx text-[#999]">
              {{ item.indicatorCode || '-' }}
            </view>
          </view>
          <dict-tag v-if="item.indicatorType != null" :type="DICT_TYPE.MES_INDICATOR_TYPE" :value="item.indicatorType" />
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">检测工具：</text>{{ item.indicatorTool || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">检测方法：</text>{{ item.checkMethod || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">标准值：</text>{{ formatDisplayValue(item.standardValue) }} {{ item.unitMeasureName || '' }}
        </view>
        <view class="mb-16rpx text-26rpx text-[#666]">
          <text class="text-[#999]">误差范围：</text>{{ formatDisplayValue(item.thresholdMin) }} ~ {{ formatDisplayValue(item.thresholdMax) }}
        </view>
        <view v-if="hasAccessByCodes(['mes:qc-template:update'])" class="flex gap-16rpx">
          <wd-button class="flex-1" size="small" variant="plain" @click="handleEdit(item)">
            编辑
          </wd-button>
          <wd-button class="flex-1" size="small" type="danger" variant="plain" @click="handleDelete(item)">
            删除
          </wd-button>
        </view>
      </view>
    </view>

    <!-- 检测指标项表单 -->
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
            {{ editingId ? '编辑检测指标项' : '新增检测指标项' }}
          </view>
          <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
            保存
          </wd-button>
        </view>

        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <wd-form ref="formRef" :model="formData" :schema="formSchema">
            <wd-cell-group border>
              <wd-form-item title="质检指标" title-width="220rpx" prop="indicatorId" is-link :value="indicatorDisplay" placeholder="请选择质检指标" @click="indicatorPickerRef?.open(formData.indicatorId)" />
              <wd-form-item title="标准值" title-width="220rpx" prop="standardValue">
                <wd-input-number v-model="formData.standardValue" allow-null :min="-999999999" :max="999999999" :precision="4" />
              </wd-form-item>
              <wd-form-item title="计量单位" title-width="220rpx" prop="unitMeasureId" is-link :value="unitDisplay" placeholder="请选择计量单位" @click="unitPickerRef?.open(formData.unitMeasureId)" />
              <wd-form-item title="误差上限" title-width="220rpx" prop="thresholdMax">
                <wd-input-number v-model="formData.thresholdMax" allow-null :min="-999999999" :max="999999999" :precision="4" />
              </wd-form-item>
              <wd-form-item title="误差下限" title-width="220rpx" prop="thresholdMin">
                <wd-input-number v-model="formData.thresholdMin" allow-null :min="-999999999" :max="999999999" :precision="4" />
              </wd-form-item>
              <wd-form-item title="检测方法" title-width="220rpx" prop="checkMethod">
                <wd-textarea v-model="formData.checkMethod" placeholder="请输入检测方法" :maxlength="500" show-word-limit clearable />
              </wd-form-item>
              <wd-form-item title="说明图URL" title-width="220rpx" prop="docUrl">
                <wd-input v-model="formData.docUrl" placeholder="请输入说明图URL" clearable />
              </wd-form-item>
              <wd-form-item title="备注" title-width="220rpx" prop="remark">
                <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
          <view class="h-48rpx" />
        </scroll-view>
      </view>
    </wd-popup>

    <wd-fab v-if="!showTitle && hasAccessByCodes(['mes:qc-template:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
    <QcIndicatorPicker ref="indicatorPickerRef" @confirm="handleIndicatorConfirm" />
    <UnitMeasurePicker ref="unitPickerRef" @confirm="handleUnitConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdUnitMeasure } from '@/api/mes/md/unitmeasure'
import type { QcIndicator } from '@/api/mes/qc/indicator'
import type { QcTemplateIndicator } from '@/api/mes/qc/template/indicator'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  createTemplateIndicator,
  deleteTemplateIndicator,
  getTemplateIndicator,
  getTemplateIndicatorPage,
  updateTemplateIndicator,
} from '@/api/mes/qc/template/indicator'
import { useAccess } from '@/hooks/useAccess'
import { formatDisplayValue } from '@/utils/format'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import UnitMeasurePicker from '@/pages-mes/md/unitmeasure/components/unit-measure-picker.vue'
import QcIndicatorPicker from '@/pages-mes/qc/indicator/components/qc-indicator-picker.vue'

const props = withDefaults(defineProps<{
  templateId: number
  showTitle?: boolean
}>(), {
  showTitle: true,
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<QcTemplateIndicator[]>([]) // 检测指标项
const loading = ref(false) // 列表加载状态
const formVisible = ref(false) // 表单弹层状态
const formLoading = ref(false) // 表单提交状态
const editingId = ref<number>() // 当前编辑编号
const formRef = ref<FormInstance>() // 表单组件引用
const indicatorPickerRef = ref<InstanceType<typeof QcIndicatorPicker>>() // 指标选择器
const unitPickerRef = ref<InstanceType<typeof UnitMeasurePicker>>() // 单位选择器
const selectedIndicator = ref<QcIndicator>() // 当前选择指标
const selectedUnit = ref<MdUnitMeasure>() // 当前选择单位
const formData = ref<QcTemplateIndicator>({
  templateId: props.templateId,
}) // 表单数据

const formSchema = createFormSchema({
  indicatorId: [{ required: true, message: '质检指标不能为空' }],
})

const indicatorDisplay = computed(() => {
  return selectedIndicator.value
    ? `${selectedIndicator.value.name}（${selectedIndicator.value.code}）`
    : formData.value.indicatorName
      ? `${formData.value.indicatorName}（${formData.value.indicatorCode || '-'}）`
      : ''
})

const unitDisplay = computed(() => {
  return selectedUnit.value?.name || formData.value.unitMeasureName || ''
})

/** 加载检测指标项 */
async function loadList() {
  if (!props.templateId) {
    return
  }
  loading.value = true
  try {
    const data = await getTemplateIndicatorPage({
      pageNo: 1,
      pageSize: 100,
      templateId: props.templateId,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  editingId.value = undefined
  selectedIndicator.value = undefined
  selectedUnit.value = undefined
  formData.value = {
    templateId: props.templateId,
  }
}

/** 新增检测指标项 */
function handleAdd() {
  resetForm()
  formVisible.value = true
}

/** 编辑检测指标项 */
async function handleEdit(item: QcTemplateIndicator) {
  resetForm()
  formVisible.value = true
  const data = await getTemplateIndicator(item.id)
  editingId.value = data.id
  formData.value = { ...data }
}

/** 选择质检指标 */
function handleIndicatorConfirm(item: QcIndicator) {
  selectedIndicator.value = item
  formData.value.indicatorId = item.id
  formData.value.indicatorCode = item.code
  formData.value.indicatorName = item.name
  formData.value.indicatorType = item.type
  formData.value.indicatorTool = item.tool || ''
}

/** 选择计量单位 */
function handleUnitConfirm(item: MdUnitMeasure) {
  if (!item.id) {
    return
  }
  selectedUnit.value = item
  formData.value.unitMeasureId = item.id
  formData.value.unitMeasureName = item.name
}

/** 构造提交数据 */
function buildSubmitData(): QcTemplateIndicator {
  return {
    ...formData.value,
    templateId: props.templateId,
  }
}

/** 提交检测指标项 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (editingId.value) {
      await updateTemplateIndicator(data)
      toast.success('修改成功')
    } else {
      await createTemplateIndicator(data)
      toast.success('新增成功')
    }
    formVisible.value = false
    loadList()
  } finally {
    formLoading.value = false
  }
}

/** 删除检测指标项 */
async function handleDelete(item: QcTemplateIndicator) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除检测指标项「${item.indicatorName || item.indicatorCode || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteTemplateIndicator(item.id)
  toast.success('删除成功')
  loadList()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:qc:template:reload', loadList)
  loadList()
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:qc:template:reload', loadList)
})
</script>
