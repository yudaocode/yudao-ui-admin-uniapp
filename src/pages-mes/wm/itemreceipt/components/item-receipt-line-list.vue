<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        物料信息
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
      loading-more-no-more-text="没有更多物料信息了"
      empty-view-text="暂无物料信息"
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
              {{ item.batchCode || '未生成批次' }}
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
            <text class="mr-8rpx shrink-0 text-[#999]">入库数量：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.receivedQuantity ?? '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">生产日期：</text>
            <text class="min-w-0 flex-1 truncate">{{ formatDate(item.productionDate) || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">有效期：</text>
            <text class="min-w-0 flex-1 truncate">{{ formatDate(item.expireDate) || '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">生产批号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.lotNumber || '-' }}</text>
          </view>
          <view class="flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
          </view>
          <view v-if="!readonly" class="mt-16rpx flex justify-end gap-16rpx">
            <wd-button size="small" type="warning" variant="plain" @click="openUpdateForm(item)">
              编辑
            </wd-button>
            <wd-button size="small" type="danger" variant="plain" @click="handleDelete(item)">
              删除
            </wd-button>
          </view>
          <view class="mt-16rpx rounded-12rpx bg-[#f8fafc] p-16rpx">
            <view class="mb-12rpx flex items-center justify-between">
              <view class="text-26rpx text-[#333] font-medium">
                上架明细
              </view>
              <wd-button v-if="stockMode" size="small" type="primary" @click="openCreateDetailForm(item)">
                添加上架
              </wd-button>
            </view>
            <view v-if="isDetailLoading(item.id)" class="py-12rpx text-24rpx text-[#999]">
              加载中...
            </view>
            <view v-else-if="getDetailList(item.id).length === 0" class="py-12rpx text-24rpx text-[#999]">
              暂无上架明细
            </view>
            <view
              v-for="detail in getDetailList(item.id)"
              v-else
              :key="detail.id"
              class="mb-12rpx rounded-8rpx bg-white p-16rpx last:mb-0"
            >
              <view class="mb-8rpx text-26rpx text-[#333]">
                {{ detail.warehouseName || '-' }} / {{ detail.locationName || '-' }} / {{ detail.areaName || '-' }}
              </view>
              <view class="mb-8rpx text-24rpx text-[#666]">
                上架数量：{{ detail.quantity ?? '-' }}
              </view>
              <view v-if="detail.remark" class="text-24rpx text-[#666]">
                备注：{{ detail.remark }}
              </view>
              <view v-if="stockMode" class="mt-12rpx flex justify-end gap-16rpx">
                <wd-button size="small" type="warning" variant="plain" @click="openUpdateDetailForm(item, detail)">
                  编辑
                </wd-button>
                <wd-button size="small" type="danger" variant="plain" @click="handleDeleteDetail(detail)">
                  删除
                </wd-button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>

  <!-- 入库行表单弹窗 -->
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
              v-if="noticeId"
              title="到货通知行"
              title-width="220rpx"
              prop="arrivalNoticeLineId"
              is-link
              :value="selectedNoticeLineText"
              placeholder="请选择到货通知单行"
              @click="openNoticeLinePicker"
            />
            <wd-form-item
              title="物料"
              title-width="220rpx"
              prop="itemId"
              :is-link="!formData.arrivalNoticeLineId"
              :value="selectedItemText"
              placeholder="请选择物料"
              @click="openItemPicker"
            />
            <wd-form-item title="入库数量" title-width="220rpx" prop="receivedQuantity" center>
              <wd-input-number v-model="formData.receivedQuantity" allow-null :min="0.01" :precision="2" />
            </wd-form-item>
            <wd-form-item
              title="生产日期"
              title-width="220rpx"
              prop="productionDate"
              is-link
              placeholder="请选择生产日期"
              :value="formatDate(formData.productionDate)"
              @click="pickerVisible.productionDate = true"
            />
            <wd-datetime-picker v-model="formData.productionDate" v-model:visible="pickerVisible.productionDate" title="请选择生产日期" type="date" />
            <wd-form-item
              title="有效期"
              title-width="220rpx"
              prop="expireDate"
              is-link
              placeholder="请选择有效期"
              :value="formatDate(formData.expireDate)"
              @click="pickerVisible.expireDate = true"
            />
            <wd-datetime-picker v-model="formData.expireDate" v-model:visible="pickerVisible.expireDate" title="请选择有效期" type="date" />
            <wd-form-item title="生产批号" title-width="220rpx" prop="lotNumber">
              <wd-input v-model="formData.lotNumber" placeholder="请输入生产批号" clearable />
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
  <ArrivalNoticeLinePicker ref="noticeLinePickerRef" :notice-id="noticeId" @confirm="handleNoticeLineConfirm" />
  <ItemPicker ref="itemPickerRef" :multiple="false" @confirm="handleItemConfirm" />

  <!-- 上架明细表单弹窗 -->
  <wd-popup
    v-model="detailFormVisible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 78vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="detailFormVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ detailFormTitle }}
        </view>
        <wd-button size="small" type="primary" :loading="detailFormLoading" @click="handleSubmitDetail">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="detailFormRef" :model="detailFormData" :schema="detailFormSchema">
          <wd-cell-group border>
            <wd-form-item title="物料" title-width="220rpx" prop="itemId">
              <text>{{ detailSelectedItemText || '-' }}</text>
            </wd-form-item>
            <WarehouseFormPicker v-model="detailFormData.warehouseId" label="入库仓库" label-width="220rpx" prop="warehouseId" @change="handleWarehouseChange" />
            <WarehouseLocationFormPicker v-model="detailFormData.locationId" label="库区" label-width="220rpx" prop="locationId" :warehouse-id="detailFormData.warehouseId" @change="handleLocationChange" />
            <WarehouseAreaFormPicker v-model="detailFormData.areaId" label="库位" label-width="220rpx" prop="areaId" :location-id="detailFormData.locationId" />
            <wd-form-item title="上架数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="detailFormData.quantity" allow-null :min="0.01" :max="detailQuantityMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="detailFormData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItem } from '@/api/mes/md/item'
import type { WmArrivalNoticeLine } from '@/api/mes/wm/arrivalnotice/line'
import type { WmItemReceiptLine } from '@/api/mes/wm/itemreceipt/line'
import type { WmItemReceiptDetail } from '@/api/mes/wm/itemreceipt/detail'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createItemReceiptLine,
  deleteItemReceiptLine,
  getItemReceiptLinePage,
  updateItemReceiptLine,
} from '@/api/mes/wm/itemreceipt/line'
import { createItemReceiptDetail, deleteItemReceiptDetail, getItemReceiptDetailListByLineId, updateItemReceiptDetail } from '@/api/mes/wm/itemreceipt/detail'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ItemPicker from '../../../md/item/components/item-picker.vue'
import ArrivalNoticeLinePicker from '../../arrivalnotice/components/arrival-notice-line-picker.vue'
import WarehouseAreaFormPicker from '../../warehouse/area/components/warehouse-area-form-picker.vue'
import WarehouseFormPicker from '../../warehouse/components/warehouse-form-picker.vue'
import WarehouseLocationFormPicker from '../../warehouse/location/components/warehouse-location-form-picker.vue'

const props = defineProps<{
  receiptId?: number
  noticeId?: number
  readonly?: boolean
  stockMode?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const list = ref<WmItemReceiptLine[]>([]) // 入库行列表
const pagingRef = ref<ZPagingRef<WmItemReceiptLine>>() // 分页组件引用
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<WmItemReceiptLine>(getDefaultFormData()) // 表单数据
const detailFormVisible = ref(false) // 上架明细表单显示状态
const detailFormLoading = ref(false) // 上架明细表单提交状态
const detailFormRef = ref<FormInstance>() // 上架明细表单引用
const detailFormData = ref<WmItemReceiptDetail>(getDefaultDetailFormData()) // 上架明细表单数据
const currentDetailLine = ref<WmItemReceiptLine>() // 当前上架明细所属行
const detailQuantityMax = ref<number>() // 上架数量上限
const itemPickerRef = ref<InstanceType<typeof ItemPicker>>() // 物料选择器引用
const noticeLinePickerRef = ref<InstanceType<typeof ArrivalNoticeLinePicker>>() // 到货通知单行选择器引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器状态
const detailMap = ref<Record<number, WmItemReceiptDetail[]>>({}) // 行编号对应上架明细
const detailLoadingMap = ref<Record<number, boolean>>({}) // 行编号对应明细加载状态
const formTitle = computed(() => formData.value.id ? '编辑物料' : '添加物料')
const detailFormTitle = computed(() => detailFormData.value.id ? '编辑上架明细' : '添加上架明细')
const selectedItemText = computed(() => {
  if (!formData.value.itemId) {
    return ''
  }
  return `${formData.value.itemCode || '-'} ${formData.value.itemName || ''}`.trim()
})
const selectedNoticeLineText = computed(() => {
  if (!formData.value.arrivalNoticeLineId) {
    return ''
  }
  return `${formData.value.itemCode || `物料 #${formData.value.itemId}`} / 到货 ${formData.value.receivedQuantity ?? '-'}`
})
const detailSelectedItemText = computed(() => {
  if (currentDetailLine.value) {
    return `${currentDetailLine.value.itemCode || '-'} ${currentDetailLine.value.itemName || ''}`.trim()
  }
  if (detailFormData.value.itemCode || detailFormData.value.itemName) {
    return `${detailFormData.value.itemCode || '-'} ${detailFormData.value.itemName || ''}`.trim()
  }
  if (!detailFormData.value.itemId) {
    return ''
  }
  return `物料 #${detailFormData.value.itemId}`
})
const formSchema = createFormSchema({
  arrivalNoticeLineId: [{ required: () => !!props.noticeId, message: '到货通知单行不能为空' }],
  itemId: [{ required: true, message: '物料不能为空' }],
  receivedQuantity: [
    { required: true, message: '入库数量不能为空' },
    { validator: value => Number(value) > 0 || '入库数量必须大于 0' },
  ],
})
const detailFormSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  warehouseId: [{ required: true, message: '入库仓库不能为空' }],
  locationId: [{ required: true, message: '库区不能为空' }],
  areaId: [{ required: true, message: '库位不能为空' }],
  quantity: [
    { required: true, message: '上架数量不能为空' },
    { validator: value => Number(value) > 0 || '上架数量必须大于 0' },
    { validator: value => detailQuantityMax.value == null || Number(value) <= detailQuantityMax.value || `上架数量不能大于剩余数量 ${detailQuantityMax.value}` },
  ],
})

/** 默认表单数据 */
function getDefaultFormData(): WmItemReceiptLine {
  return {
    receiptId: props.receiptId,
  }
}

/** 默认上架明细表单数据 */
function getDefaultDetailFormData(): WmItemReceiptDetail {
  return {
    receiptId: props.receiptId,
  }
}

/** 查询入库行列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.receiptId) {
    detailMap.value = {}
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getItemReceiptLinePage({
      pageNo,
      pageSize,
      receiptId: props.receiptId,
    })
    if (pageNo === 1) {
      detailMap.value = {}
    }
    await Promise.all(data.list.map(item => getDetailListByLine(item.id)))
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 查询单行上架明细 */
async function getDetailListByLine(lineId?: number) {
  if (!lineId) {
    return
  }
  detailLoadingMap.value[lineId] = true
  try {
    detailMap.value[lineId] = await getItemReceiptDetailListByLineId(lineId)
  } finally {
    detailLoadingMap.value[lineId] = false
  }
}

/** 获取单行上架明细 */
function getDetailList(lineId?: number) {
  if (!lineId) {
    return []
  }
  return detailMap.value[lineId] || []
}

/** 计算剩余可上架数量 */
function getDetailRemainingQuantity(line?: WmItemReceiptLine, editingDetailId?: number) {
  if (!line) {
    return undefined
  }
  const usedQuantity = getDetailList(line.id).reduce((total, item) => {
    if (editingDetailId && item.id === editingDetailId) {
      return total
    }
    return total + Number(item.quantity || 0)
  }, 0)
  return Math.max(Number(line.receivedQuantity || 0) - usedQuantity, 0)
}

/** 判断单行上架明细是否加载中 */
function isDetailLoading(lineId?: number) {
  if (!lineId) {
    return false
  }
  return !!detailLoadingMap.value[lineId]
}

/** 打开新增表单 */
function openCreateForm() {
  formData.value = getDefaultFormData()
  formVisible.value = true
}

/** 打开编辑表单 */
function openUpdateForm(item: WmItemReceiptLine) {
  formData.value = { ...item }
  formVisible.value = true
}

/** 打开到货通知单行选择器 */
function openNoticeLinePicker() {
  noticeLinePickerRef.value?.open()
}

/** 打开物料选择器 */
function openItemPicker() {
  if (formData.value.arrivalNoticeLineId) {
    return
  }
  itemPickerRef.value?.open()
}

/** 选择到货通知单行 */
function handleNoticeLineConfirm(line: WmArrivalNoticeLine) {
  formData.value = {
    ...formData.value,
    arrivalNoticeLineId: line.id,
    itemId: line.itemId,
    itemCode: line.itemCode,
    itemName: line.itemName,
    specification: line.specification,
    unitMeasureName: line.unitMeasureName,
    receivedQuantity: line.qualifiedQuantity ?? line.arrivalQuantity,
  }
}

/** 选择物料 */
function handleItemConfirm(items: MdItem[]) {
  const item = items[0]
  if (!item || item.id == null) {
    return
  }
  formData.value = {
    ...formData.value,
    itemId: item.id,
    itemCode: item.code,
    itemName: item.name,
    specification: item.specification,
    unitMeasureName: item.unitMeasureName,
  }
}

/** 提交入库行 */
async function handleSubmit() {
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
      await updateItemReceiptLine(formData.value)
      toast.success('修改成功')
    } else {
      await createItemReceiptLine(formData.value)
      toast.success('添加成功')
    }
    formVisible.value = false
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 打开新增上架明细表单 */
function openCreateDetailForm(line: WmItemReceiptLine) {
  currentDetailLine.value = line
  detailQuantityMax.value = getDetailRemainingQuantity(line)
  detailFormData.value = {
    ...getDefaultDetailFormData(),
    lineId: line.id,
    itemId: line.itemId,
    batchId: line.batchId,
    quantity: detailQuantityMax.value,
  }
  detailFormVisible.value = true
}

/** 打开编辑上架明细表单 */
function openUpdateDetailForm(line: WmItemReceiptLine, detail: WmItemReceiptDetail) {
  currentDetailLine.value = line
  detailQuantityMax.value = getDetailRemainingQuantity(line, detail.id)
  detailFormData.value = { ...detail }
  detailFormVisible.value = true
}

/** 选择仓库 */
function handleWarehouseChange() {
  detailFormData.value.locationId = undefined
  detailFormData.value.areaId = undefined
}

/** 选择库区 */
function handleLocationChange() {
  detailFormData.value.areaId = undefined
}

/** 提交上架明细 */
async function handleSubmitDetail() {
  const { valid } = await detailFormRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.receiptId) {
    return
  }

  detailFormLoading.value = true
  try {
    if (detailFormData.value.id) {
      await updateItemReceiptDetail(detailFormData.value)
      toast.success('修改成功')
    } else {
      await createItemReceiptDetail(detailFormData.value)
      toast.success('添加成功')
    }
    detailFormVisible.value = false
    await getDetailListByLine(detailFormData.value.lineId)
    reload()
  } finally {
    detailFormLoading.value = false
  }
}

/** 删除上架明细 */
async function handleDeleteDetail(detail: WmItemReceiptDetail) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除上架明细「${detail.warehouseName || '-'} / ${detail.locationName || '-'} / ${detail.areaName || '-'}」吗？`,
    })
  } catch {
    return
  }
  await deleteItemReceiptDetail(detail.id)
  toast.success('删除成功')
  await getDetailListByLine(detail.lineId)
  reload()
}

/** 删除入库行 */
async function handleDelete(item: WmItemReceiptLine) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteItemReceiptLine(item.id)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:itemreceipt:reload', reload)
})

/** 监听入库单编号变化 */
watch(() => props.receiptId, reload)

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:itemreceipt:reload', reload)
})
</script>
