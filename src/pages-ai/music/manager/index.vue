<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="音乐管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 音乐列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无音乐记录"
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
            <view class="relative h-120rpx w-120rpx shrink-0 overflow-hidden rounded-8rpx bg-[#f5f5f5]">
              <wd-img v-if="item.coverUrl" :src="item.coverUrl" width="120rpx" height="120rpx" mode="aspectFill" />
              <view v-else class="h-full w-full flex items-center justify-center">
                <wd-icon name="headset" size="48rpx" color="#bbb" />
              </view>
              <view v-if="isAiMusicRunning(item.status)" class="absolute inset-0 flex items-center justify-center bg-white/70">
                <wd-loading size="36rpx" />
              </view>
            </view>
            <view class="min-w-0 flex-1">
              <view class="flex items-start justify-between gap-16rpx">
                <view class="truncate text-30rpx text-[#333] font-semibold">
                  {{ getMusicTitle(item.title) }}
                </view>
                <dict-tag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="item.status" />
              </view>
              <view class="mt-8rpx flex flex-wrap items-center gap-8rpx text-24rpx text-[#999]">
                <dict-tag :type="DICT_TYPE.AI_GENERATE_MODE" :value="item.generateMode" />
                <text>{{ item.model || '-' }}</text>
                <text>· {{ formatMusicDuration(item.duration) }}</text>
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                用户：{{ item.userNickname || '-' }} · 播放 {{ item.playCount ?? 0 }} · {{ item.publicStatus ? '已公开' : '未公开' }}
              </view>
            </view>
          </view>
          <view v-if="isAiMusicRunning(item.status)" class="mt-16rpx">
            <wd-progress :percentage="item.progress || 0" />
          </view>
          <view v-if="item.status === AiMusicStatusEnum.FAIL" class="line-clamp-2 mt-12rpx text-24rpx text-[#f5222d]">
            {{ item.errorMessage || '-' }}
          </view>
          <view class="mt-12rpx text-22rpx text-[#999]">
            {{ formatDateTime(item.createTime) }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { Music } from '@/api/ai/music'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getMusicPage } from '@/api/ai/music'
import { navigateBackPlus } from '@/utils'
import { AiMusicStatusEnum, DICT_TYPE, formatMusicDuration, getMusicTitle, isAiMusicRunning } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<Music[]>([]) // 音乐列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询音乐列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getMusicPage(params)
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

/** 查看音乐详情 */
function handleDetail(item: Music) {
  uni.navigateTo({
    url: `/pages-ai/music/manager/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('ai:music:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:music:reload', reload)
})
</script>
