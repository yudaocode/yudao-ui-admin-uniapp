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
          选择流转卡
        </view>
        <wd-button size="small" type="primary" :disabled="!selected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="searchCode" placeholder="流转卡编码" clearable />
        <wd-input v-model="searchBatchCode" placeholder="批次号" clearable class="mt-12rpx" />
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
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无流转卡"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="selected?.id === item.id ? 'ring-2 ring-[#1677ff]' : ''"
            @click="selected = item"
          >
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-30rpx text-[#333] font-semibold">
                  {{ item.code || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.workOrderCode || '-' }} / {{ item.workOrderName || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="item.status" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>产品：{{ item.itemCode || '-' }} / {{ item.itemName || '-' }}</view>
              <view>批次：{{ item.batchCode || '-' }}</view>
              <view>流转数量：{{ item.transferedQuantity ?? '-' }} {{ item.unitMeasureName || '' }}</view>
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ProCard } from '@/api/mes/pro/card'
import { computed, ref, watch } from 'vue'
import { getCard, getCardPage } from '@/api/mes/pro/card'
import { DICT_TYPE } from '@/utils/constants'

const props = withDefaults(defineProps<{
  modelValue?: number
  disabled?: boolean
  clearable?: boolean
}>(), {
  disabled: false,
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ProCard | undefined]
  'confirm': [item: ProCard]
  'clear': []
}>()

const visible = ref(false) // 弹层显示状态
const list = ref<ProCard[]>([]) // 流转卡列表
const selectedItem = ref<ProCard>() // 当前选中流转卡
const selected = ref<ProCard>() // 当前选择流转卡
const pagingRef = ref<ZPagingRef<ProCard>>() // 分页组件引用
const searchCode = ref('') // 流转卡编码
const searchBatchCode = ref('') // 批次号
const pendingSelectedId = ref<number>() // 待回显编号
const canClear = computed(() => Boolean(selected.value || selectedItem.value || props.modelValue != null)) // 是否可清空

/** 打开选择器 */
async function open(currentId?: number) {
  if (props.disabled) {
    return
  }
  const selectedId = currentId ?? props.modelValue
  visible.value = true
  selected.value = selectedItem.value
  pendingSelectedId.value = selectedId
  searchCode.value = ''
  searchBatchCode.value = ''
  reload()
  if (selectedId && !selected.value) {
    await resolveItemById(selectedId)
    selected.value = selectedItem.value
  }
}

/** 查询流转卡列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getCardPage({
      pageNo,
      pageSize,
      code: searchCode.value || undefined,
      batchCode: searchBatchCode.value || undefined,
    })
    if (pendingSelectedId.value && !selected.value) {
      selected.value = data.list.find(item => item.id === pendingSelectedId.value)
    }
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 根据编号加载流转卡回显 */
async function resolveItemById(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await getCard(id)
  } catch {
    selectedItem.value = undefined
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 搜索 */
function handleSearch() {
  reload()
}

/** 重置搜索 */
function handleResetSearch() {
  searchCode.value = ''
  searchBatchCode.value = ''
  reload()
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 清空选择 */
function handleClear() {
  selected.value = undefined
  selectedItem.value = undefined
  pendingSelectedId.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  selected.value = undefined
  pendingSelectedId.value = undefined
}

/** 确认选择 */
function handleConfirm() {
  if (!selected.value) {
    return
  }
  selectedItem.value = selected.value
  emit('update:modelValue', selected.value.id)
  emit('change', selected.value)
  emit('confirm', selected.value)
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
