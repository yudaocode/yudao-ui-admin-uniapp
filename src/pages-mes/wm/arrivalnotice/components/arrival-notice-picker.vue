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
        <wd-button size="small" type="primary" :disabled="!selectedNotice" @click="handleConfirm">
          确定{{ selectedNotice ? '(1)' : '' }}
        </wd-button>
      </view>

      <!-- 搜索 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="searchCode" placeholder="通知单编号" clearable />
        <wd-input v-model="searchName" placeholder="通知单名称" clearable class="mt-12rpx" />
        <wd-input v-model="searchPurchaseOrderCode" placeholder="采购订单编号" clearable class="mt-12rpx" />
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
            v-for="item in noticeList"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="selectedNotice?.id === item.id ? 'ring-2 ring-[#1677ff]' : ''"
            @click="selectedNotice = item"
          >
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ item.code || '-' }}
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_ARRIVAL_NOTICE_STATUS" :value="item.status" />
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">名称：</text>{{ item.name || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">采购订单：</text>{{ item.purchaseOrderCode || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">供应商：</text>{{ item.vendorName || item.vendorCode || '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">到货日期：</text>{{ formatDate(item.arrivalDate) || '-' }}
            </view>
          </view>
          <view v-if="noticeList.length === 0 && !loading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选到货通知" />
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
import type { WmArrivalNotice } from '@/api/mes/wm/arrivalnotice'
import { ref } from 'vue'
import { getArrivalNoticePage } from '@/api/mes/wm/arrivalnotice'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'

const props = withDefaults(defineProps<{
  title?: string
  status?: number
}>(), {
  title: '选择到货通知',
  status: undefined,
})

const emit = defineEmits<{
  confirm: [notice: WmArrivalNotice]
}>()

const visible = ref(false) // 弹层显示状态
const loading = ref(false) // 加载状态
const noticeList = ref<WmArrivalNotice[]>([]) // 到货通知列表
const selectedNotice = ref<WmArrivalNotice>() // 当前选中通知
const pageNo = ref(1) // 当前页码
const total = ref(0) // 总条数
const searchCode = ref('') // 通知单编号
const searchName = ref('') // 通知单名称
const searchPurchaseOrderCode = ref('') // 采购订单编号

/** 搜索 */
async function handleSearch() {
  pageNo.value = 1
  await loadNotices()
}

/** 重置搜索 */
function handleResetSearch() {
  searchCode.value = ''
  searchName.value = ''
  searchPurchaseOrderCode.value = ''
  pageNo.value = 1
  loadNotices()
}

/** 加载更多 */
async function handleLoadMore() {
  if (loading.value || noticeList.value.length >= total.value) {
    return
  }
  pageNo.value++
  await loadNotices(true)
}

/** 加载到货通知列表 */
async function loadNotices(append = false) {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    const data = await getArrivalNoticePage({
      pageNo: pageNo.value,
      pageSize: 20,
      code: searchCode.value || undefined,
      name: searchName.value || undefined,
      purchaseOrderCode: searchPurchaseOrderCode.value || undefined,
      status: props.status,
    })
    if (append) {
      noticeList.value.push(...data.list)
    } else {
      noticeList.value = data.list
    }
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 打开选择器 */
function open() {
  visible.value = true
  selectedNotice.value = undefined
  searchCode.value = ''
  searchName.value = ''
  searchPurchaseOrderCode.value = ''
  noticeList.value = []
  total.value = 0
  pageNo.value = 1
  loadNotices()
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  selectedNotice.value = undefined
  searchCode.value = ''
  searchName.value = ''
  searchPurchaseOrderCode.value = ''
}

/** 确认选择 */
function handleConfirm() {
  if (!selectedNotice.value) {
    return
  }
  emit('confirm', selectedNotice.value)
  visible.value = false
}

defineExpose({ open })
</script>
