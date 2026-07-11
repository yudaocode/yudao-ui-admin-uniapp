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

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.code" placeholder="通知单编号" clearable />
        <wd-input v-model="queryParams.name" placeholder="通知单名称" clearable class="mt-12rpx" />
        <wd-input v-model="queryParams.salesOrderCode" placeholder="销售订单编号" clearable class="mt-12rpx" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 销售通知列表 -->
      <z-paging
        ref="pagingRef"
        v-model="noticeList"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无可选发货通知"
        @query="queryList"
      >
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
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_SALES_NOTICE_STATUS" :value="item.status" />
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">名称：</text>{{ item.name || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">销售订单：</text>{{ item.salesOrderCode || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">客户：</text>{{ item.clientName || item.clientCode || '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">发货日期：</text>{{ formatDate(item.salesDate) || '-' }}
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { WmSalesNotice } from '@/api/mes/wm/salesnotice'
import { ref } from 'vue'
import { getSalesNoticePage } from '@/api/mes/wm/salesnotice'
import { DICT_TYPE, MesWmSalesNoticeStatusEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'

const props = withDefaults(defineProps<{
  title?: string
  status?: number
}>(), {
  title: '选择发货通知',
  status: MesWmSalesNoticeStatusEnum.APPROVED,
})

const emit = defineEmits<{
  confirm: [notice: WmSalesNotice]
}>()

const visible = ref(false) // 弹层显示状态
const noticeList = ref<WmSalesNotice[]>([]) // 发货通知列表
const selectedNotice = ref<WmSalesNotice>() // 当前选中通知
const pagingRef = ref<ZPagingRef<WmSalesNotice>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ // 查询参数
  code: '',
  name: '',
  salesOrderCode: '',
})

/** 查询发货通知列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getSalesNoticePage({
      pageNo,
      pageSize,
      code: queryParams.value.code || undefined,
      name: queryParams.value.name || undefined,
      salesOrderCode: queryParams.value.salesOrderCode || undefined,
      status: props.status,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 打开选择器 */
function open() {
  visible.value = true
  selectedNotice.value = undefined
  queryParams.value = {
    code: '',
    name: '',
    salesOrderCode: '',
  }
  reload()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
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
    salesOrderCode: '',
  }
  reload()
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  selectedNotice.value = undefined
  queryParams.value = {
    code: '',
    name: '',
    salesOrderCode: '',
  }
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
