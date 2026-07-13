<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="通话记录"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 通话记录列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无通话记录数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="flex items-center justify-between">
            <view class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">
              {{ item.inviterNickname || `用户 ${item.inviterUserId}` }} 发起
            </view>
            <dict-tag :type="DICT_TYPE.IM_RTC_CALL_STATUS" :value="item.status" />
          </view>
          <view class="mt-10rpx text-26rpx text-[#999]">
            {{ getDictLabel(DICT_TYPE.IM_RTC_CALL_CONVERSATION_TYPE, item.conversationType) }}
            · {{ getDictLabel(DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE, item.mediaType) }}
            <text v-if="item.groupName"> · {{ item.groupName }}</text>
          </view>
          <view class="mt-12rpx flex items-center justify-between text-24rpx text-[#999]">
            <text>{{ formatDateTime(item.startTime) }}</text>
            <text>时长 {{ formatCallDuration(item.acceptTime, item.endTime) }}</text>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerRtcCallVO } from '@/api/im/manager/rtc'
import { ref } from 'vue'
import { getManagerRtcCallPage } from '@/api/im/manager/rtc'
import { getDictLabel } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatCallDuration } from './utils'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<ImManagerRtcCallVO[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询通话记录列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getManagerRtcCallPage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看通话记录详情 */
function handleDetail(item: ImManagerRtcCallVO) {
  uni.navigateTo({ url: `/pages-im/manager/rtc/detail/index?id=${item.id}` })
}
</script>
