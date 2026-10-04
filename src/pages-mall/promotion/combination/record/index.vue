<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="拼团记录"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view class="grid grid-cols-3 gap-12rpx px-24rpx py-20rpx">
      <view class="rounded-12rpx bg-white p-16rpx text-center">
        <view class="text-36rpx font-semibold">
          {{ summary.userCount }}
        </view>
        <view class="text-24rpx text-[#999]">
          参与人数
        </view>
      </view>
      <view class="rounded-12rpx bg-white p-16rpx text-center">
        <view class="text-36rpx font-semibold">
          {{ summary.successCount }}
        </view>
        <view class="text-24rpx text-[#999]">
          成团数量
        </view>
      </view>
      <view class="rounded-12rpx bg-white p-16rpx text-center">
        <view class="text-36rpx font-semibold">
          {{ summary.virtualGroupCount }}
        </view>
        <view class="text-24rpx text-[#999]">
          虚拟成团数量
        </view>
      </view>
    </view>

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无拼团记录"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-start gap-16rpx">
            <view v-if="item.picUrl || item.avatar" class="shrink-0">
              <wd-img :src="item.picUrl || item.avatar" width="96rpx" height="96rpx" radius="8rpx" mode="aspectFill" />
            </view>
            <view class="min-w-0 flex-1">
              <view class="flex items-center justify-between gap-16rpx">
                <text class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                  {{ item.spuName || `拼团 #${item.id}` }}
                </text>
                <dict-tag v-if="item.status != null" class="shrink-0" :type="DICT_TYPE.PROMOTION_COMBINATION_RECORD_STATUS" :value="item.status" />
              </view>
              <view class="mt-6rpx text-26rpx text-[#999]">
                团长：{{ item.headNickname || '-' }}
              </view>
            </view>
          </view>
          <view class="flex items-center justify-between text-26rpx text-[#666]">
            <text>成团人数：{{ item.userSize ?? '-' }}</text>
            <text>已参团：{{ item.userCount ?? '-' }}</text>
          </view>
          <view class="mt-8rpx flex items-center justify-between text-24rpx text-[#999]">
            <text>开始：{{ formatDateTime(item.startTime) || '-' }}</text>
            <text>{{ item.virtualGroup ? '虚拟成团' : '' }}</text>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionCombinationRecord, PromotionCombinationRecordSummary } from '@/api/mall/promotion/combination'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getPromotionCombinationRecordPage, getPromotionCombinationRecordSummary } from '@/api/mall/promotion/combination'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const summary = ref<PromotionCombinationRecordSummary>({ userCount: 0, successCount: 0, virtualGroupCount: 0 })

async function getSummary() {
  summary.value = await getPromotionCombinationRecordSummary()
}

const list = ref<PromotionCombinationRecord[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询拼团记录列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPromotionCombinationRecordPage({ ...queryParams.value, pageNo, pageSize })
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

/** 初始化 */
onMounted(() => {
  getSummary()
  uni.$on('mall:promotion-combination-record:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:promotion-combination-record:reload', reload)
})
</script>
