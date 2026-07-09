<template>
  <view class="mt-24rpx">
    <!-- 标题 -->
    <view class="mb-16rpx flex items-center justify-between">
      <view>
        <view class="text-30rpx text-[#333] font-semibold">
          盘点参数
        </view>
        <view class="mt-4rpx text-24rpx text-[#999]">
          {{ total }} 条
        </view>
      </view>
      <wd-button
        v-if="!readonly"
        size="small"
        type="primary"
        @click.stop="openCreateForm"
      >
        添加条件
      </wd-button>
    </view>

    <!-- 参数列表 -->
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
      loading-more-no-more-text="没有更多盘点参数了"
      empty-view-text="暂无盘点参数"
      @query="queryList"
    >
      <view class="py-4rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_WM_STOCK_TAKING_PLAN_PARAM_TYPE" :value="item.type" />
            </view>
            <view class="shrink-0 text-24rpx text-[#999]">
              #{{ item.id }}
            </view>
          </view>
          <view class="mb-10rpx text-26rpx text-[#666]">
            <text class="text-[#999]">条件值编码：</text>{{ item.valueCode || '-' }}
          </view>
          <view class="mb-10rpx text-26rpx text-[#666]">
            <text class="text-[#999]">条件值名称：</text>{{ item.valueName || '-' }}
          </view>
          <view class="text-26rpx text-[#666]">
            <text class="text-[#999]">备注：</text>{{ item.remark || '-' }}
          </view>
          <view v-if="!readonly" class="mt-16rpx flex justify-end gap-16rpx">
            <wd-button size="small" type="warning" variant="plain" @click.stop="openUpdateForm(item)">
              编辑
            </wd-button>
            <wd-button size="small" type="danger" variant="plain" @click.stop="handleDelete(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 参数表单 -->
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
              <yd-form-picker v-model="formData.type" label="条件类型" label-width="220rpx" prop="type" :columns="paramTypeOptions" placeholder="请选择条件类型" />

              <WarehouseFormPicker
                v-if="formData.type === MesWmStockTakingParamTypeEnum.WAREHOUSE"
                v-model="formData.valueId"
                label="仓库"
                label-width="220rpx"
                prop="valueId"
                placeholder="请选择仓库"
                @change="fillSelectedValue"
              />

              <template v-if="formData.type === MesWmStockTakingParamTypeEnum.LOCATION">
                <WarehouseFormPicker
                  v-model="locationWarehouseId"
                  label="仓库"
                  label-width="220rpx"
                  placeholder="请先选择仓库"
                  @change="handleLocationWarehouseChange"
                />
                <WarehouseLocationFormPicker
                  v-model="formData.valueId"
                  label="库区"
                  label-width="220rpx"
                  prop="valueId"
                  :warehouse-id="locationWarehouseId"
                  placeholder="请选择库区"
                  @change="fillSelectedValue"
                />
              </template>

              <template v-if="formData.type === MesWmStockTakingParamTypeEnum.AREA">
                <WarehouseFormPicker
                  v-model="areaWarehouseId"
                  label="仓库"
                  label-width="220rpx"
                  placeholder="请先选择仓库"
                  @change="handleAreaWarehouseChange"
                />
                <WarehouseLocationFormPicker
                  v-model="areaLocationId"
                  label="库区"
                  label-width="220rpx"
                  :warehouse-id="areaWarehouseId"
                  placeholder="请再选择库区"
                  @change="handleAreaLocationChange"
                />
                <WarehouseAreaFormPicker
                  v-model="formData.valueId"
                  label="库位"
                  label-width="220rpx"
                  prop="valueId"
                  :location-id="areaLocationId"
                  placeholder="请选择库位"
                  @change="fillSelectedValue"
                />
              </template>

              <wd-form-item
                v-if="formData.type === MesWmStockTakingParamTypeEnum.ITEM"
                title="物料"
                title-width="220rpx"
                prop="valueId"
                is-link
                :value="getValueText()"
                placeholder="请选择物料"
                @click="openItemPicker"
              />

              <wd-form-item
                v-if="formData.type === MesWmStockTakingParamTypeEnum.BATCH"
                title="批次"
                title-width="220rpx"
                prop="valueId"
                is-link
                :value="getValueText()"
                placeholder="请选择批次"
                @click="openBatchPicker"
              />

              <yd-form-picker
                v-if="formData.type === MesWmStockTakingParamTypeEnum.QUALITY_STATUS"
                v-model="qualityStatusValue"
                label="质量状态"
                label-width="220rpx"
                prop="valueId"
                :columns="qualityStatusOptions"
                placeholder="请选择质量状态"
              />

              <wd-form-item title="备注" title-width="220rpx" prop="remark">
                <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
        </scroll-view>
      </view>
    </wd-popup>

    <!-- 物料选择弹窗 -->
    <ItemPicker
      ref="itemPickerRef"
      :multiple="false"
      @confirm="handleItemConfirm"
    />
    <!-- 批次选择弹窗 -->
    <BatchPicker ref="batchPickerRef" @confirm="handleBatchConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItem } from '@/api/mes/md/item'
import type { Batch } from '@/api/mes/wm/batch'
import type { StockTakingPlanParam } from '@/api/mes/wm/stocktaking/plan'
import type { WmWarehouse } from '@/api/mes/wm/warehouse'
import type { WmWarehouseLocation } from '@/api/mes/wm/warehouse/location'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createStockTakingPlanParam,
  deleteStockTakingPlanParam,
  getStockTakingPlanParam,
  getStockTakingPlanParamPage,
  updateStockTakingPlanParam,
} from '@/api/mes/wm/stocktaking/plan'
import { getWarehouseArea } from '@/api/mes/wm/warehouse/area'
import { getWarehouseLocation } from '@/api/mes/wm/warehouse/location'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import ItemPicker from '@/pages-mes/md/item/components/item-picker.vue'
import BatchPicker from '@/pages-mes/wm/batch/components/batch-picker.vue'
import WarehouseFormPicker from '@/pages-mes/wm/warehouse/components/warehouse-form-picker.vue'
import WarehouseAreaFormPicker from '@/pages-mes/wm/warehouse/area/components/warehouse-area-form-picker.vue'
import WarehouseLocationFormPicker from '@/pages-mes/wm/warehouse/location/components/warehouse-location-form-picker.vue'
import { DICT_TYPE, MesWmStockTakingParamTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  planId?: number
  readonly?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const list = ref<StockTakingPlanParam[]>([]) // 盘点参数列表
const pagingRef = ref<ZPagingRef<StockTakingPlanParam>>() // 分页组件引用
const total = ref(0) // 参数总数
const formVisible = ref(false) // 表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formMode = ref<'create' | 'update'>('create') // 表单模式
const formData = ref<StockTakingPlanParam>(getDefaultFormData()) // 表单数据
const loadingDetail = ref(false) // 编辑回显状态
const locationWarehouseId = ref<number>() // 库区条件所属仓库
const areaWarehouseId = ref<number>() // 库位条件所属仓库
const areaLocationId = ref<number>() // 库位条件所属库区
const itemPickerRef = ref<InstanceType<typeof ItemPicker>>() // 物料选择器引用
const batchPickerRef = ref<InstanceType<typeof BatchPicker>>() // 批次选择器引用

const formTitle = computed(() => formMode.value === 'create' ? '添加盘点条件' : '编辑盘点条件')
const paramTypeOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_PLAN_PARAM_TYPE))
const qualityStatusOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_WM_QUALITY_STATUS))
const qualityStatusValue = ref<number>() // 质量状态临时值
const formSchema = createFormSchema({
  type: [{ required: true, message: '条件类型不能为空' }],
  valueId: [{ validator: validateValue }],
})

/** 默认表单数据 */
function getDefaultFormData(): StockTakingPlanParam {
  return {
    planId: props.planId,
  }
}

/** 条件值校验 */
function validateValue() {
  if (!formData.value.type) {
    return true
  }
  if (formData.value.type === MesWmStockTakingParamTypeEnum.QUALITY_STATUS) {
    return formData.value.valueCode ? true : '质量状态不能为空'
  }
  return formData.value.valueId ? true : '条件值不能为空'
}

/** 条件值展示 */
function getValueText() {
  return [formData.value.valueCode, formData.value.valueName].filter(Boolean).join(' / ')
}

/** 查询盘点参数 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.planId) {
    total.value = 0
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getStockTakingPlanParamPage({
      pageNo,
      pageSize,
      planId: props.planId,
    })
    total.value = data.total
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新盘点参数 */
function reloadList() {
  pagingRef.value?.reload()
}

/** 打开新增表单 */
function openCreateForm() {
  formMode.value = 'create'
  formData.value = getDefaultFormData()
  qualityStatusValue.value = undefined
  resetCascadeData()
  formVisible.value = true
}

/** 打开编辑表单 */
async function openUpdateForm(item: StockTakingPlanParam) {
  if (!item.id) {
    return
  }
  formMode.value = 'update'
  resetCascadeData()
  formVisible.value = true
  formLoading.value = true
  loadingDetail.value = true
  try {
    const data = await getStockTakingPlanParam(item.id)
    formData.value = data
    qualityStatusValue.value = data.type === MesWmStockTakingParamTypeEnum.QUALITY_STATUS
      ? (data.valueCode ? Number(data.valueCode) : undefined)
      : undefined
    await loadCascadeData()
  } finally {
    formLoading.value = false
    loadingDetail.value = false
  }
}

/** 条件类型变化 */
function handleTypeChange() {
  clearSelectedValue()
  qualityStatusValue.value = undefined
  resetCascadeData()
}

/** 清理级联状态 */
function resetCascadeData() {
  locationWarehouseId.value = undefined
  areaWarehouseId.value = undefined
  areaLocationId.value = undefined
}

/** 加载编辑级联数据 */
async function loadCascadeData() {
  if (!formData.value.valueId) {
    return
  }
  if (formData.value.type === MesWmStockTakingParamTypeEnum.LOCATION) {
    const location = await getWarehouseLocation(formData.value.valueId)
    locationWarehouseId.value = location.warehouseId
  }
  if (formData.value.type === MesWmStockTakingParamTypeEnum.AREA) {
    const area = await getWarehouseArea(formData.value.valueId)
    areaWarehouseId.value = area.warehouseId
    areaLocationId.value = area.locationId
  }
}

/** 选择库区条件所属仓库 */
function handleLocationWarehouseChange(item?: WmWarehouse) {
  locationWarehouseId.value = item?.id
  clearSelectedValue()
}

/** 选择库位条件所属仓库 */
function handleAreaWarehouseChange(item?: WmWarehouse) {
  areaWarehouseId.value = item?.id
  areaLocationId.value = undefined
  clearSelectedValue()
}

/** 选择库位条件所属库区 */
function handleAreaLocationChange(item?: WmWarehouseLocation) {
  areaLocationId.value = item?.id
  clearSelectedValue()
}

/** 打开物料选择器 */
function openItemPicker() {
  itemPickerRef.value?.open()
}

/** 物料选择确认 */
function handleItemConfirm(items: MdItem[]) {
  const item = items[0]
  if (!item) {
    return
  }
  formData.value.valueId = item.id
  formData.value.valueCode = item.code
  formData.value.valueName = item.name
}

/** 打开批次选择器 */
function openBatchPicker() {
  batchPickerRef.value?.open()
}

/** 批次选择确认 */
function handleBatchConfirm(batch: Batch) {
  if (!batch) {
    return
  }
  formData.value.valueId = batch.id
  formData.value.valueCode = batch.code
  formData.value.valueName = batch.code
}

/** 质量状态选择 */
function handleQualityStatusChange(value?: number) {
  if (value === undefined) {
    formData.value.valueId = undefined
    formData.value.valueCode = undefined
    formData.value.valueName = undefined
    return
  }
  const label = getDictLabel(DICT_TYPE.MES_WM_QUALITY_STATUS, value)
  formData.value.valueId = undefined
  formData.value.valueCode = String(value)
  formData.value.valueName = label
}

/** 回填通用选择值 */
function fillSelectedValue(item?: { id?: number, code?: string, name?: string }) {
  if (item?.id == null) {
    clearSelectedValue()
    return
  }
  formData.value.valueId = item.id
  formData.value.valueCode = item.code
  formData.value.valueName = item.name
}

/** 清空条件值 */
function clearSelectedValue() {
  formData.value.valueId = undefined
  formData.value.valueCode = undefined
  formData.value.valueName = undefined
}

/** 删除参数 */
async function handleDelete(item: StockTakingPlanParam) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除盘点条件「${item.valueName || item.valueCode || item.id}」吗？`,
      confirmButtonText: '删除',
    })
  } catch {
    return
  }
  await deleteStockTakingPlanParam(item.id)
  toast.success('删除成功')
  reloadList()
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.planId) {
    return
  }
  formLoading.value = true
  try {
    formData.value.planId = props.planId
    if (formData.value.type === MesWmStockTakingParamTypeEnum.QUALITY_STATUS) {
      formData.value.valueId = undefined
    }
    if (formMode.value === 'create') {
      await createStockTakingPlanParam(formData.value)
      toast.success('新增成功')
    } else if (formData.value.id) {
      await updateStockTakingPlanParam(formData.value)
      toast.success('修改成功')
    }
    formVisible.value = false
    reloadList()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:stocktaking:plan:reload', reloadList)
})

/** 监听盘点计划编号变化 */
watch(() => props.planId, reloadList)

/** 监听参数类型变化 */
watch(() => formData.value.type, (type, oldType) => {
  if (!loadingDetail.value && oldType !== undefined && type !== oldType) {
    handleTypeChange()
  }
})

/** 监听质量状态变化 */
watch(qualityStatusValue, (value) => {
  if (formData.value.type === MesWmStockTakingParamTypeEnum.QUALITY_STATUS) {
    handleQualityStatusChange(value)
  }
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:stocktaking:plan:reload', reloadList)
})
</script>
