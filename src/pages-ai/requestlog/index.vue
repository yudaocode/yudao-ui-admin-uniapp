<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="请求日志"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 请求日志列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无请求日志"
      @query="queryList"
    >
      <view class="p-24rpx">
        <!-- 统计：后端按同一筛选条件统计全部匹配记录 -->
        <Statistics ref="statisticsRef" />

        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-12rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex flex-1 items-center gap-12rpx">
              <view class="shrink-0">
                <dict-tag :type="DICT_TYPE.AI_REQUEST_LOG_BIZ_TYPE" :value="item.bizType" />
              </view>
              <text class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-semibold">{{ item.model }}</text>
            </view>
            <view class="shrink-0">
              <dict-tag :type="DICT_TYPE.AI_REQUEST_LOG_STATUS" :value="item.status" />
            </view>
          </view>
          <view class="truncate text-22rpx text-[#999]">
            {{ item.requestId }}
          </view>
          <view class="mt-12rpx text-24rpx text-[#666]">
            输入 {{ formatAiTokens(item.inputTokens) }} / 输出 {{ formatAiTokens(item.outputTokens) }} / 合计 {{ formatAiTokens(item.totalTokens) }}
          </view>
          <view v-if="item.errorMessage" class="line-clamp-2 mt-8rpx text-24rpx text-[#f5222d]">
            {{ item.errorMessage }}
          </view>
          <view class="mt-12rpx flex items-center justify-between text-22rpx text-[#999]">
            <text>{{ getUserName(item) }}<text v-if="item.platform"> / {{ getDictLabel(DICT_TYPE.AI_PLATFORM, item.platform) || item.platform }}</text></text>
            <text>{{ formatDateTime(item.beginTime) }}<text v-if="item.duration != null"> · {{ item.duration }}ms</text></text>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { AiRequestLog } from '@/api/ai/requestlog'
import { ref } from 'vue'
import { getRequestLogPage } from '@/api/ai/requestlog'
import { getDictLabel } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, formatAiTokens } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'
import Statistics from './components/statistics.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<AiRequestLog[]>([]) // 请求日志列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const statisticsRef = ref<InstanceType<typeof Statistics>>() // 统计组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询请求日志列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (pageNo === 1) {
    statisticsRef.value?.getStatistics(queryParams.value)
  }
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getRequestLogPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 查看请求日志详情 */
function handleDetail(item: AiRequestLog) {
  uni.navigateTo({
    url: `/pages-ai/requestlog/detail/index?id=${item.id}`,
  })
}

/** 获取用户昵称：后端已拼接，用户不存在时显示编号 */
function getUserName(item: AiRequestLog) {
  return item.userNickname || (item.userId ? String(item.userId) : '')
}
</script>
