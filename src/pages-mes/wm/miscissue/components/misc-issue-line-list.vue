<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        出库物料
      </view>
      <wd-button v-if="!readonly" size="small" type="primary" @click="openCreateForm">
        添加物料
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
      loading-more-no-more-text="没有更多出库物料了"
      empty-view-text="暂无出库物料"
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
                {{ item.itemCode || `物料 #${item.itemId}` }}
              </view>
              <view class="mt-4rpx truncate text-26rpx text-[#666]">
                {{ item.itemName || '-' }}
              </view>
            </view>
            <view class="shrink-0 text-24rpx text-[#999]">
              {{ item.unitMeasureName || '-' }}
            </view>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">出库数量：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">批次号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">仓储位置：</text>
            <text class="min-w-0 flex-1 truncate">
              {{ item.warehouseName || '-' }} / {{ item.locationName || '-' }} / {{ item.areaName || '-' }}
            </text>
          </view>
          <view class="flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
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
  </view>

  <!-- 出库物料表单弹窗 -->
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
            <wd-form-item
              title="库存物资"
              title-width="220rpx"
              prop="materialStockId"
              is-link
              :value="selectedStockText"
              placeholder="请选择库存物资"
              @click="openStockPicker"
            />
            <wd-form-item title="出库数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" allow-null :min="0.01" :max="quantityInputMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="物料编码" title-width="220rpx" prop="itemId">
              <text>{{ formData.itemCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="物料名称" title-width="220rpx">
              <text>{{ formData.itemName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx">
              <text>{{ formData.batchCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="仓库" title-width="220rpx" prop="warehouseId">
              <text>{{ formData.warehouseName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="库区" title-width="220rpx" prop="locationId">
              <text>{{ formData.locationName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="库位" title-width="220rpx" prop="areaId">
              <text>{{ formData.areaName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="可用库存" title-width="220rpx">
              <text>{{ quantityMax ?? '-' }}</text>
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <!-- 库存选择弹窗 -->
  <MaterialStockPicker ref="stockPickerRef" :multiple="false" virtual-filter="exclude" @confirm="handleStockConfirm" />
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { WmMaterialStock } from '@/api/mes/wm/materialstock'
import type { WmMiscIssueLine } from '@/api/mes/wm/miscissue/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createMiscIssueLine,
  deleteMiscIssueLine,
  getMiscIssueLinePage,
  updateMiscIssueLine,
} from '@/api/mes/wm/miscissue/line'
import { getMaterialStock } from '@/api/mes/wm/materialstock'
import { createFormSchema } from '@/utils/wot'
import MaterialStockPicker from '../../materialstock/components/material-stock-picker.vue'

const props = defineProps<{
  issueId?: number
  readonly?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const list = ref<WmMiscIssueLine[]>([]) // 出库物料列表
const pagingRef = ref<ZPagingRef<WmMiscIssueLine>>() // 分页组件引用
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 行表单提交状态
const formRef = ref<FormInstance>() // 行表单引用
const formData = ref<WmMiscIssueLine>(getDefaultFormData()) // 行表单数据
const stockPickerRef = ref<InstanceType<typeof MaterialStockPicker>>() // 库存选择器引用
const selectedStock = ref<WmMaterialStock>() // 当前选择库存
const quantityMax = ref<number>() // 当前可用库存
const quantityInputMax = computed(() => quantityMax.value ?? 999999999)
const formTitle = computed(() => formData.value.id ? '编辑出库物料' : '添加出库物料')
const selectedStockText = computed(() => {
  if (selectedStock.value) {
    return `${selectedStock.value.batchCode || `库存 #${selectedStock.value.id}`} / ${selectedStock.value.itemCode || '-'}`
  }
  if (formData.value.materialStockId) {
    return `${formData.value.batchCode || `库存 #${formData.value.materialStockId}`} / ${formData.value.itemCode || '-'}`
  }
  return ''
})
const formSchema = createFormSchema({
  materialStockId: [{ required: true, message: '库存物资不能为空' }],
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '出库数量不能为空' },
    { validator: value => Number(value) > 0 || '出库数量必须大于 0' },
    { validator: value => quantityMax.value == null || Number(value) <= quantityMax.value || `出库数量不能大于库存 ${quantityMax.value}` },
  ],
  warehouseId: [{ required: true, message: '仓库不能为空' }],
  locationId: [{ required: true, message: '库区不能为空' }],
  areaId: [{ required: true, message: '库位不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData(): WmMiscIssueLine {
  return {
    issueId: props.issueId,
  }
}

/** 查询出库物料列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.issueId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getMiscIssueLinePage({
      pageNo,
      pageSize,
      issueId: props.issueId,
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

/** 打开新增表单 */
function openCreateForm() {
  if (props.readonly) {
    return
  }
  formData.value = getDefaultFormData()
  selectedStock.value = undefined
  quantityMax.value = undefined
  formVisible.value = true
}

/** 打开编辑表单 */
async function openUpdateForm(item: WmMiscIssueLine) {
  if (props.readonly) {
    return
  }
  formData.value = { ...item }
  selectedStock.value = undefined
  quantityMax.value = undefined
  if (item.materialStockId) {
    selectedStock.value = await getMaterialStock(item.materialStockId)
    quantityMax.value = Number(selectedStock.value.quantity || 0) + Number(item.quantity || 0)
  }
  formVisible.value = true
}

/** 打开库存选择器 */
function openStockPicker() {
  if (props.readonly) {
    return
  }
  selectedStock.value = undefined
  stockPickerRef.value?.open(formData.value.materialStockId ? [formData.value.materialStockId] : [])
}

/** 确认库存选择 */
function handleStockConfirm(rows: WmMaterialStock[]) {
  const stock = rows[0]
  if (!stock) {
    return
  }
  selectedStock.value = stock
  formData.value.materialStockId = stock.id
  formData.value.itemId = stock.itemId
  formData.value.itemCode = stock.itemCode
  formData.value.itemName = stock.itemName
  formData.value.specification = stock.specification
  formData.value.unitMeasureName = stock.unitMeasureName
  formData.value.batchId = stock.batchId
  formData.value.batchCode = stock.batchCode
  formData.value.warehouseId = stock.warehouseId
  formData.value.warehouseName = stock.warehouseName
  formData.value.locationId = stock.locationId
  formData.value.locationName = stock.locationName
  formData.value.areaId = stock.areaId
  formData.value.areaName = stock.areaName
  quantityMax.value = stock.quantity
  if (!formData.value.quantity || formData.value.quantity > stock.quantity) {
    formData.value.quantity = stock.quantity
  }
}

/** 提交出库物料 */
async function handleSubmit() {
  if (props.readonly) {
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.issueId) {
    return
  }

  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateMiscIssueLine(formData.value)
      toast.success('修改成功')
    } else {
      await createMiscIssueLine(formData.value)
      toast.success('添加成功')
    }
    formVisible.value = false
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 删除出库物料 */
async function handleDelete(item: WmMiscIssueLine) {
  if (props.readonly) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteMiscIssueLine(item.id)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:miscissue:reload', reload)
})

/** 监听杂项出库编号变化 */
watch(() => props.issueId, reload)

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:miscissue:reload', reload)
})
</script>
