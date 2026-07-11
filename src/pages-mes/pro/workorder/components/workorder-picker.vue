<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 顶部操作 -->
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

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.code" placeholder="工单编码" clearable />
        <wd-input v-model="queryParams.name" placeholder="工单名称" clearable class="mt-12rpx" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 生产工单列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        :empty-view-text="emptyTip"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="tempSelected?.id === item.id ? 'ring-2 ring-[#1677ff]' : ''"
            @click="handleSelect(item)"
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
        </view>
      </z-paging>
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
const list = ref<ProWorkOrder[]>([]) // 工单列表
const selectedItem = ref<ProWorkOrder>() // 当前选中工单
const tempSelected = ref<ProWorkOrder>() // 临时选择工单
const pagingRef = ref<ZPagingRef<ProWorkOrder>>() // 分页组件引用
const pendingSelectedId = ref<number>() // 待回显编号
const queryParams = ref<Record<string, any>>({ // 查询参数
  code: '',
  name: '',
})
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
  queryParams.value = {
    code: '',
    name: '',
  }
  pendingSelectedId.value = currentId
  reload()
  if (currentId != null && !tempSelected.value) {
    const item = await resolveItemById(currentId)
    if (item && pendingSelectedId.value === currentId && !tempSelected.value) {
      selectedItem.value = item
      tempSelected.value = item
      pendingSelectedId.value = undefined
    }
  }
}

/** 查询工单列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getWorkOrderPage({
      pageNo,
      pageSize,
      code: queryParams.value.code || undefined,
      name: queryParams.value.name || undefined,
      type: props.type,
      status: props.confirmedOnly ? MesProWorkOrderStatusEnum.CONFIRMED : undefined,
    })
    if (pendingSelectedId.value != null && !tempSelected.value) {
      const item = data.list.find(item => item.id === pendingSelectedId.value)
      if (item) {
        selectedItem.value = item
        tempSelected.value = item
        pendingSelectedId.value = undefined
      }
    }
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 根据编号加载工单回显 */
async function resolveItemById(id?: number) {
  if (id == null) {
    return undefined
  }
  if (selectedItem.value?.id === id) {
    return selectedItem.value
  }
  try {
    return await getWorkOrder(id)
  } catch {
    return undefined
  }
}

/** 选择工单 */
function handleSelect(item: ProWorkOrder) {
  tempSelected.value = item
  pendingSelectedId.value = undefined
}

/** 搜索按钮操作 */
function handleQuery() {
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = {
    code: '',
    name: '',
  }
  reload()
}

/** 取消 */
function handleCancel() {
  pendingSelectedId.value = undefined
  visible.value = false
}

/** 清空选择 */
function handleClear() {
  tempSelected.value = undefined
  selectedItem.value = undefined
  pendingSelectedId.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  tempSelected.value = undefined
  pendingSelectedId.value = undefined
  queryParams.value = {
    code: '',
    name: '',
  }
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
  async (value) => {
    const item = await resolveItemById(value)
    if (props.modelValue === value) {
      selectedItem.value = item
    }
  },
  { immediate: true },
)

defineExpose({ open, clear: handleClear, selectedItem })
</script>
