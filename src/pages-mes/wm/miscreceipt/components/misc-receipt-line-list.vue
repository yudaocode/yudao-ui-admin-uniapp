<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        入库物料
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
      loading-more-no-more-text="没有更多入库物料了"
      empty-view-text="暂无入库物料"
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
            <text class="mr-8rpx shrink-0 text-[#999]">入库数量：</text>
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

  <!-- 入库物料表单弹窗 -->
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
              title="物料"
              title-width="220rpx"
              prop="itemId"
              is-link
              :value="selectedItemText"
              placeholder="请选择物料"
              @click="openItemPicker"
            />
            <wd-form-item title="入库数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" allow-null :min="0.01" :precision="2" />
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
              <wd-input v-model="formData.batchCode" clearable placeholder="请输入批次号" />
            </wd-form-item>
            <WarehouseFormPicker v-model="formData.warehouseId" label="仓库" label-width="220rpx" prop="warehouseId" :disabled="props.readonly" @change="handleWarehouseChange" />
            <WarehouseLocationFormPicker v-model="formData.locationId" label="库区" label-width="220rpx" prop="locationId" :disabled="props.readonly" :warehouse-id="formData.warehouseId" @change="handleLocationChange" />
            <WarehouseAreaFormPicker v-model="formData.areaId" label="库位" label-width="220rpx" prop="areaId" :disabled="props.readonly" :location-id="formData.locationId" />
            <wd-form-item title="物料编码" title-width="220rpx">
              <text>{{ formData.itemCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="物料名称" title-width="220rpx">
              <text>{{ formData.itemName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="规格型号" title-width="220rpx">
              <text>{{ formData.specification || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="单位" title-width="220rpx">
              <text>{{ formData.unitMeasureName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <ItemPicker ref="itemPickerRef" :multiple="false" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItem } from '@/api/mes/md/item'
import type { WmMiscReceiptLine } from '@/api/mes/wm/miscreceipt/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createMiscReceiptLine,
  deleteMiscReceiptLine,
  getMiscReceiptLinePage,
  updateMiscReceiptLine,
} from '@/api/mes/wm/miscreceipt/line'
import ItemPicker from '@/pages-mes/md/item/components/item-picker.vue'
import { createFormSchema } from '@/utils/wot'
import WarehouseAreaFormPicker from '../../warehouse/area/components/warehouse-area-form-picker.vue'
import WarehouseFormPicker from '../../warehouse/components/warehouse-form-picker.vue'
import WarehouseLocationFormPicker from '../../warehouse/location/components/warehouse-location-form-picker.vue'

const props = defineProps<{
  receiptId?: number
  readonly?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const list = ref<WmMiscReceiptLine[]>([]) // 入库物料列表
const pagingRef = ref<ZPagingRef<WmMiscReceiptLine>>() // 分页组件引用
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 行表单提交状态
const formRef = ref<FormInstance>() // 行表单引用
const formData = ref<WmMiscReceiptLine>(getDefaultFormData()) // 行表单数据
const itemPickerRef = ref<InstanceType<typeof ItemPicker>>() // 物料选择器引用
const formTitle = computed(() => formData.value.id ? '编辑入库物料' : '添加入库物料')
const selectedItemText = computed(() => {
  if (formData.value.itemCode || formData.value.itemName) {
    return `${formData.value.itemCode || '-'} ${formData.value.itemName || ''}`.trim()
  }
  return formData.value.itemId ? `物料 #${formData.value.itemId}` : ''
})
const formSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '入库数量不能为空' },
    { validator: value => Number(value) > 0 || '入库数量必须大于 0' },
  ],
  batchCode: [{ required: true, message: '批次号不能为空' }],
  warehouseId: [{ required: true, message: '仓库不能为空' }],
  locationId: [{ required: true, message: '库区不能为空' }],
  areaId: [{ required: true, message: '库位不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData(): WmMiscReceiptLine {
  return {
    receiptId: props.receiptId,
  }
}

/** 查询入库物料列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.receiptId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getMiscReceiptLinePage({
      pageNo,
      pageSize,
      receiptId: props.receiptId,
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
  formVisible.value = true
}

/** 打开编辑表单 */
function openUpdateForm(item: WmMiscReceiptLine) {
  if (props.readonly) {
    return
  }
  formData.value = { ...item }
  formVisible.value = true
}

/** 打开物料选择器 */
function openItemPicker() {
  if (props.readonly) {
    return
  }
  itemPickerRef.value?.open()
}

/** 确认选择物料 */
function handleItemConfirm(items: MdItem[]) {
  const item = items[0]
  if (!item) {
    return
  }
  formData.value.itemId = item.id
  formData.value.itemCode = item.code
  formData.value.itemName = item.name
  formData.value.specification = item.specification
  formData.value.unitMeasureName = item.unitMeasureName
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

/** 提交入库物料 */
async function handleSubmit() {
  if (props.readonly) {
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.receiptId) {
    return
  }

  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateMiscReceiptLine(formData.value)
      toast.success('修改成功')
    } else {
      await createMiscReceiptLine(formData.value)
      toast.success('添加成功')
    }
    formVisible.value = false
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 删除入库物料 */
async function handleDelete(item: WmMiscReceiptLine) {
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
  await deleteMiscReceiptLine(item.id)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:miscreceipt:reload', reload)
})

/** 监听杂项入库编号变化 */
watch(() => props.receiptId, reload)

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:miscreceipt:reload', reload)
})
</script>
