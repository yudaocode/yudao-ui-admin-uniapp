<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 头部 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <view class="flex items-center gap-12rpx">
          <wd-button variant="plain" size="small" @click="handleCancel">
            取消
          </wd-button>
          <wd-button v-if="props.clearable" variant="plain" size="small" :disabled="!canClear" @click="handleClear">
            清空
          </wd-button>
        </view>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <wd-button size="small" type="primary" :disabled="!tempSelected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="searchCode" placeholder="工单编码" clearable />
        <wd-input v-model="searchName" placeholder="工单名称" clearable class="mt-12rpx" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleResetSearch">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSearch">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 列表 -->
      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation @scrolltolower="handleLoadMore">
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="tempSelected?.id === item.id ? 'ring-2 ring-[#1677ff]' : ''"
            @click="tempSelected = item"
          >
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-30rpx text-[#333] font-semibold">
                  {{ item.name || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.code || '-' }}
                </view>
              </view>
              <dict-tag :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="item.status" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>产品：{{ item.productCode || '-' }} / {{ item.productName || '-' }}</view>
              <view>规格：{{ item.productSpecification || '-' }} / 单位：{{ item.unitMeasureName || '-' }}</view>
              <view>数量：{{ item.quantity ?? '-' }}，批次：{{ item.batchCode || '-' }}</view>
            </view>
          </view>
          <view v-if="list.length === 0 && !loading" class="py-100rpx text-center">
            <wd-empty icon="content" :tip="emptyTip" />
          </view>
          <view v-if="loading" class="flex justify-center py-24rpx">
            <wd-loading />
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import { computed, ref, watch } from 'vue'
import { getWorkOrder, getWorkOrderPage } from '@/api/mes/pro/workorder'
import { DICT_TYPE, MesProWorkOrderStatusEnum } from '@/utils/constants'

const props = withDefaults(defineProps<{
  modelValue?: number
  disabled?: boolean
  clearable?: boolean
  confirmedOnly?: boolean
  type?: number
  title?: string
  emptyTip?: string
}>(), {
  disabled: false,
  clearable: false,
  confirmedOnly: true,
  title: '选择生产工单',
  emptyTip: '暂无已确认工单',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ProWorkOrder | undefined]
  'confirm': [item: ProWorkOrder]
  'clear': []
}>()

const visible = ref(false) // 选择器显示状态
const loading = ref(false) // 列表加载状态
const list = ref<ProWorkOrder[]>([]) // 工单列表
const selectedItem = ref<ProWorkOrder>() // 当前选中工单
const tempSelected = ref<ProWorkOrder>() // 临时选择工单
const pageNo = ref(1) // 当前页码
const total = ref(0) // 总数
const searchCode = ref('') // 工单编码搜索
const searchName = ref('') // 工单名称搜索
const canClear = computed(() => Boolean(tempSelected.value || selectedItem.value || props.modelValue != null)) // 是否可清空

/** 打开选择器 */
async function open(selectedId?: number) {
  if (props.disabled) {
    return
  }
  const currentId = selectedId ?? props.modelValue
  visible.value = true
  tempSelected.value = selectedItem.value?.id === currentId ? selectedItem.value : undefined
  if (currentId == null) {
    selectedItem.value = undefined
  }
  searchCode.value = ''
  searchName.value = ''
  list.value = []
  total.value = 0
  pageNo.value = 1
  await loadList(false, currentId)
  if (currentId != null && !tempSelected.value) {
    await resolveItemById(currentId)
    tempSelected.value = selectedItem.value?.id === currentId ? selectedItem.value : undefined
  }
}

/** 加载工单列表 */
async function loadList(append = false, selectedId?: number) {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    const data = await getWorkOrderPage({
      pageNo: pageNo.value,
      pageSize: 20,
      code: searchCode.value || undefined,
      name: searchName.value || undefined,
      type: props.type,
      status: props.confirmedOnly ? MesProWorkOrderStatusEnum.CONFIRMED : undefined,
    })
    if (append) {
      list.value.push(...data.list)
    } else {
      list.value = data.list
    }
    total.value = data.total
    if (selectedId != null && !tempSelected.value) {
      tempSelected.value = list.value.find(item => item.id === selectedId)
    }
  } finally {
    loading.value = false
  }
}

/** 根据编号加载工单回显 */
async function resolveItemById(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await getWorkOrder(id)
  } catch {
    selectedItem.value = undefined
  }
}

/** 搜索 */
async function handleSearch() {
  pageNo.value = 1
  await loadList()
}

/** 重置搜索 */
function handleResetSearch() {
  searchCode.value = ''
  searchName.value = ''
  pageNo.value = 1
  loadList()
}

/** 加载更多 */
async function handleLoadMore() {
  if (loading.value || list.value.length >= total.value) {
    return
  }
  pageNo.value += 1
  await loadList(true)
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 清空选择 */
function handleClear() {
  tempSelected.value = undefined
  selectedItem.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  tempSelected.value = undefined
  searchCode.value = ''
  searchName.value = ''
}

/** 确认选择 */
function handleConfirm() {
  if (!tempSelected.value) {
    return
  }
  selectedItem.value = tempSelected.value
  emit('update:modelValue', tempSelected.value.id)
  emit('change', tempSelected.value)
  emit('confirm', tempSelected.value)
  visible.value = false
}

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  (value) => {
    resolveItemById(value)
  },
  { immediate: true },
)

defineExpose({ open, clear: handleClear, selectedItem })
</script>
