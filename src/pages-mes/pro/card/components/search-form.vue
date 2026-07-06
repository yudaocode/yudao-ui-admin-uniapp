<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          流转卡编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入流转卡编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          生产工单
        </view>
        <view class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx" @click="openWorkOrderPicker">
          <text v-if="selectedWorkOrderText" class="min-w-0 flex-1 truncate text-[#333]">
            {{ selectedWorkOrderText }}
          </text>
          <text v-else class="min-w-0 flex-1 truncate text-[#999]">
            请选择生产工单
          </text>
          <wd-icon
            v-if="selectedWorkOrderText"
            name="close-circle"
            size="30rpx"
            custom-style="color: #c0c4cc;"
            @click.stop="clearWorkOrder"
          />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          产品
        </view>
        <view class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx" @click="openItemPicker">
          <text v-if="selectedItemText" class="min-w-0 flex-1 truncate text-[#333]">
            {{ selectedItemText }}
          </text>
          <text v-else class="min-w-0 flex-1 truncate text-[#999]">
            请选择产品
          </text>
          <wd-icon
            v-if="selectedItemText"
            name="close-circle"
            size="30rpx"
            custom-style="color: #c0c4cc;"
            @click.stop="clearItem"
          />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          批次号
        </view>
        <wd-input v-model="formData.batchCode" placeholder="请输入批次号" clearable />
      </view>
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>

  <WorkOrderPicker ref="workOrderPickerRef" :confirmed-only="false" @confirm="handleWorkOrderConfirm" />
  <ItemPicker ref="itemPickerRef" item-or-product="PRODUCT" title="选择产品" :multiple="false" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
import type { MdItem } from '@/api/mes/md/item'
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import ItemPicker from '@/pages-mes/md/item/components/item-picker.vue'
import WorkOrderPicker from '@/pages-mes/pro/workorder/components/workorder-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const workOrderPickerRef = ref<InstanceType<typeof WorkOrderPicker>>() // 工单选择器
const itemPickerRef = ref<InstanceType<typeof ItemPicker>>() // 产品选择器
const selectedWorkOrder = ref<ProWorkOrder>() // 已选工单
const selectedItem = ref<MdItem>() // 已选产品
const formData = reactive<Record<string, any>>({
  code: undefined,
  workOrderId: undefined,
  itemId: undefined,
  batchCode: undefined,
}) // 搜索表单数据
const selectedWorkOrderText = computed(() => selectedWorkOrder.value ? `${selectedWorkOrder.value.code || '-'} / ${selectedWorkOrder.value.name || '-'}` : '')
const selectedItemText = computed(() => selectedItem.value ? `${selectedItem.value.code || '-'} / ${selectedItem.value.name || '-'}` : '')

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (selectedWorkOrder.value) {
    conditions.push(`工单:${selectedWorkOrder.value.code}`)
  }
  if (selectedItem.value) {
    conditions.push(`产品:${selectedItem.value.code}`)
  }
  if (formData.batchCode) {
    conditions.push(`批次:${formData.batchCode}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索生产流转卡'
})

/** 打开工单选择器 */
function openWorkOrderPicker() {
  workOrderPickerRef.value?.open(formData.workOrderId)
}

/** 打开产品选择器 */
function openItemPicker() {
  itemPickerRef.value?.open()
}

/** 选择工单 */
function handleWorkOrderConfirm(item: ProWorkOrder) {
  selectedWorkOrder.value = item
  formData.workOrderId = item.id
}

/** 选择产品 */
function handleItemConfirm(items: MdItem[]) {
  const item = items[0]
  if (!item) {
    return
  }
  selectedItem.value = item
  formData.itemId = item.id
}

/** 清空工单 */
function clearWorkOrder() {
  selectedWorkOrder.value = undefined
  formData.workOrderId = undefined
}

/** 清空产品 */
function clearItem() {
  selectedItem.value = undefined
  formData.itemId = undefined
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    workOrderId: formData.workOrderId,
    itemId: formData.itemId,
    batchCode: formData.batchCode || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.workOrderId = undefined
  formData.itemId = undefined
  formData.batchCode = undefined
  selectedWorkOrder.value = undefined
  selectedItem.value = undefined
  visible.value = false
  emit('reset')
}
</script>
