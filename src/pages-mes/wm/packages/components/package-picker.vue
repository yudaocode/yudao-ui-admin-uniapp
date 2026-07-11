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
        <wd-button size="small" type="primary" :disabled="!tempSelected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.code" placeholder="装箱单编号" clearable />
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

      <!-- 装箱单列表 -->
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
        </view>
      </z-paging>
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
const list = ref<WmPackage[]>([]) // 装箱单列表
const tempSelected = ref<WmPackage>() // 临时选择装箱单
const pagingRef = ref<ZPagingRef<WmPackage>>() // 分页组件引用
const pendingSelectedId = ref<number>() // 待回显编号
const queryParams = ref<Record<string, any>>({ // 查询参数
  code: '',
  salesOrderCode: '',
})

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
  queryParams.value = {
    code: '',
    salesOrderCode: '',
  }
  pendingSelectedId.value = selectedId
  reload()
}

/** 查询装箱单列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPackagePage({
      pageNo,
      pageSize,
      code: queryParams.value.code || undefined,
      salesOrderCode: queryParams.value.salesOrderCode || undefined,
      parentId: props.childableOnly ? 0 : undefined,
      status: props.childableOnly ? MesWmPackageStatusEnum.FINISHED : undefined,
    })
    const rows = props.excludeId
      ? data.list.filter(item => item.id !== props.excludeId)
      : data.list
    if (pendingSelectedId.value != null && !tempSelected.value) {
      tempSelected.value = rows.find(item => item.id === pendingSelectedId.value)
    }
    if (props.excludeId) {
      pagingRef.value?.completeByNoMore(rows, pageNo * pageSize >= data.total)
    } else {
      pagingRef.value?.completeByTotal(rows, data.total)
    }
  } catch {
    pagingRef.value?.complete(false)
  }
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
  tempSelected.value = undefined
  pendingSelectedId.value = undefined
  queryParams.value = {
    code: '',
    salesOrderCode: '',
  }
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
