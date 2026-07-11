<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="设备消息" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <view class="p-24rpx pb-0" @click="visible = true">
      <wd-search :placeholder="placeholder" hide-cancel disabled />
    </view>

    <!-- 刷新工具栏 -->
    <view class="mx-24rpx mt-16rpx flex justify-end">
      <view class="flex items-center gap-8rpx rounded-12rpx bg-white px-20rpx py-12rpx">
        <text class="text-24rpx text-[#666]">定时刷新</text>
        <wd-switch v-model="autoRefresh" size="20px" />
      </view>
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
        <yd-search-picker
          v-model="formData.method"
          label="消息方法"
          :columns="methodOptions"
          placeholder="请选择消息方法"
        />
        <yd-search-picker
          v-model="formData.upstream"
          label="消息方向"
          :columns="directionOptions"
          all-option
        />
        <yd-search-picker
          v-model="formData.reply"
          label="是否回复"
          :columns="replyOptions"
          all-option
        />
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">
            标识符
          </view>
          <wd-input v-model="formData.identifier" placeholder="请输入标识符" clearable />
        </view>
        <yd-search-date-range v-model="formData.times" label="时间范围" />
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

    <!-- 消息列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无设备消息"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id || item.requestId" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 text-30rpx text-[#333] font-semibold">
              {{ getDeviceMessageMethodLabel(item.method) || item.method || '-' }}
            </view>
            <view class="shrink-0 rounded-6rpx px-12rpx py-4rpx text-24rpx" :class="item.upstream ? 'bg-[#e6f4ff] text-[#1677ff]' : 'bg-[#f6ffed] text-[#52c41a]'">
              {{ item.upstream ? '上行' : '下行' }}
            </view>
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">请求编号：</text>{{ item.requestId || '-' }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">是否回复：</text>{{ item.reply ? '是' : '否' }}
          </view>
          <view class="mb-12rpx break-all rounded-8rpx bg-[#f7f8fa] p-16rpx text-24rpx text-[#666]">
            {{ formatPayload(item) }}
          </view>
          <view class="text-24rpx text-[#999]">
            {{ formatDateTime(item.ts || item.reportTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { IotDeviceMessage } from '@/api/iot/device/device'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { getDeviceMessagePage } from '@/api/iot/device/device'
import { getDeviceMessageMethodLabel, getDeviceMessageMethodOptions } from '@/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle, navigateBackPlus } from '@/utils'
import { formatDateRange, formatDateTime } from '@/utils/date'

const props = defineProps<{ deviceId?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<IotDeviceMessage[]>([]) // 消息列表
const pagingRef = ref<any>() // 分页组件引用
const visible = ref(false) // 搜索弹窗显示状态
const queryParams = ref<Record<string, any>>({}) // 查询参数
const autoRefresh = ref(false) // 定时刷新开关
let autoRefreshTimer: any = null // 定时刷新定时器
const formData = reactive({
  method: undefined as string | undefined,
  upstream: undefined as boolean | undefined,
  reply: undefined as boolean | undefined,
  identifier: undefined as string | undefined,
  times: [undefined, undefined] as [any, any],
}) // 搜索表单数据
const methodOptions = getDeviceMessageMethodOptions()
const directionOptions = [
  { label: '上行', value: true },
  { label: '下行', value: false },
] // 消息方向
const replyOptions = [
  { label: '是', value: true },
  { label: '否', value: false },
] // 回复状态
const placeholder = computed(() => { // 搜索条件文案
  const conditions: string[] = []
  if (formData.method) {
    conditions.push(`方法:${getDeviceMessageMethodLabel(formData.method)}`)
  }
  if (formData.upstream !== undefined) {
    conditions.push(formData.upstream ? '方向:上行' : '方向:下行')
  }
  if (formData.reply !== undefined) {
    conditions.push(formData.reply ? '回复:是' : '回复:否')
  }
  if (formData.identifier) {
    conditions.push(`标识符:${formData.identifier}`)
  }
  return conditions.length ? conditions.join(' | ') : '搜索设备消息'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-iot/device/device/detail/index?id=${props.deviceId}`)
}

/** 查询设备消息 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.deviceId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getDeviceMessagePage({
      ...queryParams.value,
      deviceId: Number(props.deviceId),
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 格式化消息数据 */
function formatPayload(item: IotDeviceMessage) {
  if (item.reply) {
    return JSON.stringify({ code: item.code, msg: item.msg, data: item.data })
  }
  if (typeof item.params === 'string') {
    return item.params || '-'
  }
  return item.params ? JSON.stringify(item.params) : '-'
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  queryParams.value = {
    method: formData.method,
    upstream: formData.upstream,
    reply: formData.reply,
    identifier: formData.identifier || undefined,
    times: formatDateRange(formData.times),
  }
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  formData.method = undefined
  formData.upstream = undefined
  formData.reply = undefined
  formData.identifier = undefined
  formData.times = [undefined, undefined]
  visible.value = false
  queryParams.value = {}
  pagingRef.value?.reload()
}

watch(autoRefresh, (value) => {
  if (value) {
    autoRefreshTimer = setInterval(() => pagingRef.value?.reload(), 5000)
    return
  }
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
})

/** 清理定时器 */
onBeforeUnmount(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
})
</script>
