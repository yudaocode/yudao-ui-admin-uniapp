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
        <wd-button variant="plain" size="small" @click="handleCancel">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <wd-button size="small" type="primary" :disabled="!tempSelected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="searchCode" placeholder="装箱单编号" clearable />
        <wd-input v-model="searchSalesOrderCode" placeholder="销售订单编号" clearable class="mt-12rpx" />
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
                  {{ item.code || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ formatDateTime(item.packageDate) || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_PACKAGE_STATUS" :value="item.status" />
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">客户：</text>{{ getClientText(item) }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">销售订单：</text>{{ item.salesOrderCode || '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">尺寸/重量：</text>{{ getSizeText(item) }}，{{ getWeightText(item) }}
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
import type { WmPackage } from '@/api/mes/wm/packages'
import { ref } from 'vue'
import { getPackagePage } from '@/api/mes/wm/packages'
import { DICT_TYPE, MesWmPackageStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = withDefaults(defineProps<{
  excludeId?: number
  childableOnly?: boolean
  title?: string
  emptyTip?: string
}>(), {
  excludeId: undefined,
  childableOnly: false,
  title: '选择装箱单',
  emptyTip: '暂无可选装箱单',
})

const emit = defineEmits<{
  confirm: [item: WmPackage]
}>()

const visible = ref(false) // 选择器显示状态
const loading = ref(false) // 列表加载状态
const list = ref<WmPackage[]>([]) // 装箱单列表
const tempSelected = ref<WmPackage>() // 临时选择装箱单
const pageNo = ref(1) // 当前页码
const total = ref(0) // 总数
const searchCode = ref('') // 装箱单编号搜索
const searchSalesOrderCode = ref('') // 销售订单编号搜索

/** 客户展示 */
function getClientText(item: WmPackage) {
  const code = item.clientCode || ''
  const name = item.clientName || ''
  return [code, name].filter(Boolean).join(' / ') || '-'
}

/** 尺寸展示 */
function getSizeText(item: WmPackage) {
  const values = [item.length, item.width, item.height].map(value => value ?? '-').join(' x ')
  return `${values} ${item.sizeUnitName || ''}`.trim()
}

/** 重量展示 */
function getWeightText(item: WmPackage) {
  const net = item.netWeight ?? '-'
  const gross = item.grossWeight ?? '-'
  return `净重 ${net} / 毛重 ${gross} ${item.weightUnitName || ''}`.trim()
}

/** 打开选择器 */
function open(selectedId?: number) {
  visible.value = true
  tempSelected.value = undefined
  searchCode.value = ''
  searchSalesOrderCode.value = ''
  list.value = []
  total.value = 0
  pageNo.value = 1
  loadList(false, selectedId)
}

/** 加载装箱单列表 */
async function loadList(append = false, selectedId?: number) {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    const data = await getPackagePage({
      pageNo: pageNo.value,
      pageSize: 20,
      code: searchCode.value || undefined,
      salesOrderCode: searchSalesOrderCode.value || undefined,
      parentId: props.childableOnly ? 0 : undefined,
      status: props.childableOnly ? MesWmPackageStatusEnum.FINISHED : undefined,
    })
    const rows = props.excludeId
      ? data.list.filter(item => item.id !== props.excludeId)
      : data.list
    if (append) {
      list.value.push(...rows)
    } else {
      list.value = rows
    }
    total.value = data.total
    if (selectedId && !tempSelected.value) {
      tempSelected.value = list.value.find(item => item.id === selectedId)
    }
  } finally {
    loading.value = false
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
  searchSalesOrderCode.value = ''
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

/** 关闭时清理 */
function handleClose() {
  tempSelected.value = undefined
  searchCode.value = ''
  searchSalesOrderCode.value = ''
}

/** 确认选择 */
function handleConfirm() {
  if (!tempSelected.value) {
    return
  }
  emit('confirm', tempSelected.value)
  visible.value = false
}

defineExpose({ open })
</script>
