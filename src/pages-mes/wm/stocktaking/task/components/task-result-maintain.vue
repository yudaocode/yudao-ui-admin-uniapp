<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        盘点结果
      </view>
      <wd-button
        v-if="editable"
        size="small"
        type="primary"
        @click.stop="openCreateForm"
      >
        新增
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
      loading-more-no-more-text="没有更多盘点结果了"
      empty-view-text="暂无盘点结果"
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
                {{ item.itemCode || '-' }}
              </view>
              <view class="mt-4rpx truncate text-26rpx text-[#666]">
                {{ item.itemName || '-' }}
              </view>
            </view>
            <view class="shrink-0 text-28rpx text-[#1677ff] font-semibold">
              {{ item.quantity ?? '-' }}
            </view>
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
            <text class="mr-8rpx shrink-0 text-[#999]">批次：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
          </view>
          <view class="flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">库存位置：</text>
            <text class="min-w-0 flex-1 truncate">
              {{ item.warehouseName || '-' }} / {{ item.locationName || '-' }} / {{ item.areaName || '-' }}
            </text>
          </view>
          <view v-if="editable" class="mt-16rpx flex justify-end gap-16rpx">
            <wd-button size="small" type="warning" variant="plain" @click.stop="openUpdateForm(item)">
              编辑
            </wd-button>
            <wd-button size="small" type="danger" variant="plain" @click.stop="handleDeleteResult(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>

  <!-- 盘点结果表单 -->
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
        <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmitForm">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <yd-form-picker
              v-if="isCreateMode"
              v-model="formData.lineId"
              label="盘点清单"
              label-width="220rpx"
              :columns="taskLineOptions"
              label-key="label"
              value-key="id"
              placeholder="请选择盘点清单（可选）"
              clearable
              @confirm="handleLineConfirm"
              @clear="clearLine"
            />
            <wd-form-item
              title="物料"
              title-width="220rpx"
              prop="itemId"
              :is-link="!isLineSelected"
              :value="itemDisplayValue"
              placeholder="请选择物料"
              @click="openItemPicker"
            />
            <wd-form-item title="批次编码" title-width="220rpx" prop="batchCode">
              <wd-input v-model="formData.batchCode" clearable :disabled="isLineSelected" placeholder="请输入批次编码" />
            </wd-form-item>
            <wd-form-item title="盘点数量" title-width="220rpx" prop="takingQuantity" center>
              <wd-input-number v-model="formData.takingQuantity" allow-null :min="0" :precision="2" />
            </wd-form-item>
            <WarehouseFormPicker v-model="formData.warehouseId" label="仓库" prop="warehouseId" :disabled="isLineSelected" @change="handleWarehouseChange" />
            <WarehouseLocationFormPicker v-model="formData.locationId" prop="locationId" :warehouse-id="formData.warehouseId" :disabled="isLineSelected" @change="handleLocationChange" />
            <WarehouseAreaFormPicker v-model="formData.areaId" prop="areaId" :location-id="formData.locationId" :disabled="isLineSelected" />
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
  <!-- 物料选择弹窗 -->
  <ItemPicker ref="itemPickerRef" :multiple="false" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
import type { MdItem } from '@/api/mes/md/item'
import type { StockTakingResult } from '@/api/mes/wm/stocktaking/task/result'
import type { StockTakingTaskLine } from '@/api/mes/wm/stocktaking/task/line'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getStockTakingTaskLineSimpleList } from '@/api/mes/wm/stocktaking/task/line'
import {
  createStockTakingResult,
  deleteStockTakingResult,
  getStockTakingResult,
  getStockTakingResultPage,
  updateStockTakingResult,
} from '@/api/mes/wm/stocktaking/task/result'
import ItemPicker from '@/pages-mes/md/item/components/item-picker.vue'
import { createFormSchema } from '@/utils/wot'
import WarehouseAreaFormPicker from '../../../warehouse/area/components/warehouse-area-form-picker.vue'
import WarehouseFormPicker from '../../../warehouse/components/warehouse-form-picker.vue'
import WarehouseLocationFormPicker from '../../../warehouse/location/components/warehouse-location-form-picker.vue'

interface TaskLineOption extends StockTakingTaskLine {
  label: string
}

const props = defineProps<{
  editable?: boolean
  taskId?: number
}>()

const dialog = useDialog()
const list = ref<StockTakingResult[]>([]) // 结果数据
const pagingRef = ref<ZPagingRef<StockTakingResult>>() // 分页组件引用
const formVisible = ref(false) // 表单弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const formType = ref<'create' | 'update'>('create') // 表单类型
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<StockTakingResult>(getDefaultFormData()) // 表单数据
const taskLineOptions = ref<TaskLineOption[]>([]) // 盘点清单选项
const itemPickerRef = ref<InstanceType<typeof ItemPicker>>() // 物料选择器
const isCreateMode = computed(() => formType.value === 'create')
const isLineSelected = computed(() => isCreateMode.value && formData.value.lineId !== undefined)
const formTitle = computed(() => isCreateMode.value ? '新增盘点结果' : '编辑盘点结果')
const itemDisplayValue = computed(() => {
  if (formData.value.itemCode || formData.value.itemName) {
    return `${formData.value.itemCode || '-'} ${formData.value.itemName || ''}`.trim()
  }
  return ''
})
const formSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  warehouseId: [{ required: true, message: '仓库不能为空' }],
  locationId: [{ required: true, message: '库区不能为空' }],
  areaId: [{ required: true, message: '库位不能为空' }],
  takingQuantity: [{ required: true, message: '盘点数量不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData(): StockTakingResult {
  return {
    taskId: props.taskId,
  }
}

/** 加载盘点结果 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.taskId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getStockTakingResultPage({
      pageNo,
      pageSize,
      taskId: props.taskId,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 加载任务行选项 */
async function loadTaskLineOptions() {
  if (!props.taskId) {
    taskLineOptions.value = []
    return
  }
  const rows = await getStockTakingTaskLineSimpleList(props.taskId)
  taskLineOptions.value = rows.map(row => ({
    ...row,
    label: `${row.itemCode || '-'} - ${row.itemName || '-'} (${[
      row.warehouseName,
      row.locationName,
      row.areaName,
    ].filter(Boolean).join(' / ') || '-'})`,
  }))
}

/** 打开新增表单 */
async function openCreateForm() {
  formType.value = 'create'
  formData.value = getDefaultFormData()
  await loadTaskLineOptions()
  formVisible.value = true
}

/** 打开编辑表单 */
async function openUpdateForm(item: StockTakingResult) {
  if (!item.id) {
    return
  }
  formType.value = 'update'
  formVisible.value = true
  formLoading.value = true
  try {
    const data = await getStockTakingResult(item.id)
    formData.value = {
      ...data,
      takingQuantity: data.takingQuantity ?? data.quantity,
    }
  } finally {
    formLoading.value = false
  }
}

/** 选择盘点清单 */
async function handleLineConfirm(value: number) {
  const lineId = Number(value)
  const line = taskLineOptions.value.find(item => item.id === lineId)
  if (!line) {
    return
  }
  formData.value.lineId = line.id
  formData.value.materialStockId = line.materialStockId
  formData.value.itemId = line.itemId
  formData.value.itemCode = line.itemCode
  formData.value.itemName = line.itemName
  formData.value.batchId = line.batchId
  formData.value.batchCode = line.batchCode
  formData.value.warehouseId = line.warehouseId
  formData.value.locationId = line.locationId
  formData.value.areaId = line.areaId
}

/** 清空盘点清单 */
function clearLine() {
  formData.value.lineId = undefined
  formData.value.materialStockId = undefined
  formData.value.itemId = undefined
  formData.value.itemCode = undefined
  formData.value.itemName = undefined
  formData.value.specification = undefined
  formData.value.unitMeasureName = undefined
  formData.value.batchId = undefined
  formData.value.batchCode = undefined
  formData.value.warehouseId = undefined
  formData.value.warehouseName = undefined
  formData.value.locationId = undefined
  formData.value.locationName = undefined
  formData.value.areaId = undefined
  formData.value.areaName = undefined
  formData.value.quantity = undefined
  formData.value.takingQuantity = undefined
}

/** 打开物料选择 */
function openItemPicker() {
  if (isLineSelected.value) {
    return
  }
  itemPickerRef.value?.open()
}

/** 确认物料选择 */
function handleItemConfirm(items: MdItem[]) {
  const item = items[0]
  if (!item) {
    return
  }
  formData.value.itemId = item.id
  formData.value.itemCode = item.code
  formData.value.itemName = item.name
}

/** 选择仓库 */
function handleWarehouseChange() {
  formData.value.locationId = undefined
  formData.value.areaId = undefined
}

/** 选择库区 */
function handleLocationChange() {
  formData.value.areaId = undefined
}

/** 提交表单 */
async function handleSubmitForm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await createStockTakingResult(formData.value)
    } else if (formData.value.id) {
      await updateStockTakingResult(formData.value)
    }
    formVisible.value = false
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 删除盘点结果 */
async function handleDeleteResult(item: StockTakingResult) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除确认',
      msg: `确定要删除盘点结果「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteStockTakingResult(item.id)
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:stocktaking:task:reload', reload)
})

/** 监听任务编号变化 */
watch(() => props.taskId, reload)

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:stocktaking:task:reload', reload)
})
</script>
