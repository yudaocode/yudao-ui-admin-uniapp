<template>
  <z-paging
    ref="pagingRef"
    v-model="list"
    :fixed="false"
    class="min-h-0 flex-1"
    :default-page-size="10"
    :refresher-enabled="true"
    :inside-more="true"
    :loading-more-default-as-loading="true"
    empty-view-text="暂无公开的短剧"
    @query="queryList"
  >
    <!-- 筛选：名称或画风、画幅、时长 -->
    <template #top>
      <view class="bg-white">
        <wd-search v-model="keyword" placeholder="搜索名称、画风" hide-cancel @search="reload" @clear="reload" />
        <view class="flex flex-wrap items-center gap-12rpx px-24rpx pb-16rpx">
          <wd-tag
            :type="aspectRatio === undefined ? 'primary' : 'default'"
            :variant="aspectRatio === undefined ? 'dark' : 'plain'"
            @click="handleAspectRatioClick(undefined)"
          >
            全部画幅
          </wd-tag>
          <wd-tag
            v-for="item in AI_DRAMA_ASPECT_RATIOS"
            :key="item"
            :type="aspectRatio === item ? 'primary' : 'default'"
            :variant="aspectRatio === item ? 'dark' : 'plain'"
            @click="handleAspectRatioClick(item)"
          >
            {{ item }}
          </wd-tag>
        </view>
        <view class="flex flex-wrap items-center gap-12rpx px-24rpx pb-16rpx">
          <wd-tag
            :type="durationType === undefined ? 'primary' : 'default'"
            :variant="durationType === undefined ? 'dark' : 'plain'"
            @click="handleDurationClick(undefined)"
          >
            全部时长
          </wd-tag>
          <wd-tag
            v-for="item in AI_DRAMA_DURATION_TYPE_OPTIONS"
            :key="item.value"
            :type="durationType === item.value ? 'primary' : 'default'"
            :variant="durationType === item.value ? 'dark' : 'plain'"
            @click="handleDurationClick(item.value)"
          >
            {{ item.label }}
          </wd-tag>
        </view>
      </view>
    </template>

    <!-- 公开项目列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        @click="emit('detail', item)"
      >
        <view class="relative h-240rpx flex items-center justify-center bg-[#1f1f1f]">
          <wd-icon name="play-circle-fill" size="88rpx" color="#fff" />
          <text class="absolute bottom-12rpx right-12rpx rounded-8rpx bg-black/60 px-12rpx text-22rpx text-white">
            {{ formatAiDramaDuration(item.composeDuration) }}
          </text>
        </view>
        <view class="p-24rpx">
          <view class="truncate text-30rpx text-[#333] font-semibold">
            {{ item.name }}
          </view>
          <view class="mt-8rpx flex items-center justify-between gap-16rpx text-24rpx text-[#999]">
            <text class="min-w-0 flex-1 truncate">{{ item.userNickname || '-' }}</text>
            <text v-if="item.aspectRatio" class="shrink-0">{{ item.aspectRatio }}</text>
          </view>
        </view>
      </view>
    </view>
  </z-paging>
</template>

<script lang="ts" setup>
import type { DramaPublic } from '@/api/ai/drama/project'
import { ref } from 'vue'
import { getDramaProjectPublicPage } from '@/api/ai/drama/project'
import { AI_DRAMA_ASPECT_RATIOS, AI_DRAMA_DURATION_TYPE_OPTIONS, formatAiDramaDuration } from '@/utils/constants'

const emit = defineEmits<{
  detail: [item: DramaPublic]
}>()

const list = ref<DramaPublic[]>([]) // 公开项目列表
const pagingRef = ref<any>() // 分页组件引用
const keyword = ref('') // 名称或画风搜索
const aspectRatio = ref<string>() // 画幅筛选
const durationType = ref<number>() // 时长筛选

/** 查询公开项目列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getDramaProjectPublicPage({
      pageNo,
      pageSize,
      keyword: keyword.value || undefined,
      aspectRatio: aspectRatio.value,
      durationType: durationType.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 筛选画幅 */
function handleAspectRatioClick(value?: string) {
  aspectRatio.value = value
  reload()
}

/** 筛选时长 */
function handleDurationClick(value?: number) {
  durationType.value = value
  reload()
}

defineExpose({ reload })
</script>
