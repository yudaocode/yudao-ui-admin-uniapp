<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="视频生成管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 视频列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无视频记录"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="flex gap-20rpx">
            <view class="relative h-120rpx w-160rpx shrink-0 overflow-hidden rounded-8rpx bg-[#f5f5f5]">
              <wd-img v-if="item.coverUrl" :src="item.coverUrl" width="160rpx" height="120rpx" mode="aspectFill" />
              <view v-else class="h-full w-full flex items-center justify-center">
                <wd-icon name="video-camera" size="48rpx" color="#bbb" />
              </view>
              <view v-if="isAiVideoRunning(item.status)" class="absolute inset-0 flex items-center justify-center bg-white/70">
                <wd-loading size="36rpx" />
              </view>
            </view>
            <view class="min-w-0 flex-1">
              <view class="flex items-start justify-between gap-16rpx">
                <view class="line-clamp-2 min-w-0 flex-1 text-28rpx text-[#333] font-semibold">
                  {{ item.prompt || `#${item.id}` }}
                </view>
                <dict-tag :type="DICT_TYPE.AI_VIDEO_STATUS" :value="item.status" />
              </view>
              <view class="mt-8rpx flex flex-wrap items-center gap-8rpx text-24rpx text-[#999]">
                <dict-tag :type="DICT_TYPE.AI_VIDEO_TYPE" :value="item.type" />
                <dict-tag :type="DICT_TYPE.AI_PLATFORM" :value="item.platform" />
                <text>{{ item.model || '-' }}</text>
              </view>
            </view>
          </view>
          <view class="mt-12rpx text-24rpx text-[#999]">
            用户：{{ item.userNickname || '-' }} · {{ item.duration ? `${item.duration} 秒` : '-' }} · {{ item.publicStatus ? '已公开' : '未公开' }}
          </view>
          <view v-if="isAiVideoRunning(item.status)" class="mt-16rpx">
            <wd-progress :percentage="item.progress || 0" />
          </view>
          <view v-if="item.status === AiVideoStatusEnum.FAIL" class="line-clamp-2 mt-12rpx text-24rpx text-[#f5222d]">
            {{ item.errorMessage || '-' }}
          </view>
          <view class="mt-12rpx text-22rpx text-[#999]">
            #{{ item.id }} · {{ formatDateTime(item.createTime) }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { Video } from '@/api/ai/video'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getVideoPage } from '@/api/ai/video'
import { navigateBackPlus } from '@/utils'
import { AiVideoStatusEnum, DICT_TYPE, isAiVideoRunning } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<Video[]>([]) // 视频列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询视频列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getVideoPage(params)
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

/** 查看视频详情 */
function handleDetail(item: Video) {
  uni.navigateTo({
    url: `/pages-ai/video/manager/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('ai:video:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:video:reload', reload)
})
</script>
