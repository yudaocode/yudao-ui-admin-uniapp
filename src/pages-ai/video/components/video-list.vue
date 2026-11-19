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
    :empty-view-text="square ? '暂无公开作品' : '暂无作品，去「创作」开始吧'"
    @query="queryList"
  >
    <!-- 筛选：创作类型；公开作品支持搜索提示词 -->
    <template #top>
      <view class="bg-white">
        <wd-search v-if="square" v-model="prompt" placeholder="搜索提示词" hide-cancel @search="reload" @clear="reload" />
        <view class="flex flex-wrap items-center gap-12rpx px-24rpx py-16rpx">
          <wd-tag
            :type="type === undefined ? 'primary' : 'default'"
            :variant="type === undefined ? 'dark' : 'plain'"
            @click="handleTypeClick(undefined)"
          >
            全部类型
          </wd-tag>
          <wd-tag
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_VIDEO_TYPE)"
            :key="dict.value"
            :type="type === dict.value ? 'primary' : 'default'"
            :variant="type === dict.value ? 'dark' : 'plain'"
            @click="handleTypeClick(dict.value)"
          >
            {{ dict.label }}
          </wd-tag>
        </view>
      </view>
      <view v-if="runningList.length > 0" class="bg-[#eef4ff] px-24rpx py-12rpx text-22rpx text-[#1677ff]">
        有生成中的作品，每 5 秒自动刷新
      </view>
    </template>

    <!-- 作品列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
      >
        <!-- 封面 / 状态：点击查看详情 -->
        <view class="relative h-360rpx bg-[#1f1f1f]" @click="emit('detail', item)">
          <template v-if="item.status === AiVideoStatusEnum.SUCCESS">
            <wd-img v-if="item.coverUrl" :src="item.coverUrl" width="100%" height="360rpx" mode="aspectFit" />
            <view class="absolute inset-0 flex items-center justify-center">
              <wd-icon name="play-circle-fill" size="88rpx" color="#fff" />
            </view>
          </template>
          <view
            v-else-if="isAiVideoRunning(item.status)"
            class="absolute inset-0 flex flex-col items-center justify-center gap-16rpx bg-[#f5f5f5] px-80rpx text-24rpx text-[#999]"
          >
            <wd-loading size="40rpx" />
            <dict-tag :type="DICT_TYPE.AI_VIDEO_STATUS" :value="item.status" />
            <view class="w-full">
              <wd-progress :percentage="item.progress || 0" />
            </view>
          </view>
          <view v-else class="absolute inset-0 flex flex-col items-center justify-center gap-12rpx bg-[#f5f5f5] px-40rpx">
            <wd-icon name="exclamation-circle-fill" size="48rpx" color="#f5222d" />
            <text class="line-clamp-3 break-all text-center text-24rpx text-[#f5222d]">{{ item.errorMessage || '生成失败' }}</text>
          </view>
          <view class="absolute left-16rpx top-16rpx flex gap-8rpx">
            <dict-tag :type="DICT_TYPE.AI_VIDEO_TYPE" :value="item.type" />
            <wd-tag v-if="!square && item.publicStatus" type="success">
              已公开
            </wd-tag>
          </view>
        </view>

        <!-- 信息 -->
        <view class="p-24rpx">
          <view class="line-clamp-2 break-all text-28rpx text-[#333] leading-40rpx" @click="emit('detail', item)">
            {{ item.prompt || '（无提示词）' }}
          </view>
          <view class="mt-8rpx flex items-center justify-between gap-16rpx text-22rpx text-[#999]">
            <text class="min-w-0 flex-1 truncate">{{ item.model }}</text>
            <text class="shrink-0">
              {{ square ? (item.userNickname || '-') : formatDate(item.createTime, 'MM-DD HH:mm') }}<text v-if="item.duration"> · {{ item.duration }} 秒</text>
            </text>
          </view>

          <!-- 操作 -->
          <view class="mt-20rpx flex flex-wrap items-center justify-end gap-16rpx">
            <wd-button size="small" variant="plain" @click="emit('detail', item)">
              详情
            </wd-button>
            <wd-button size="small" type="primary" variant="plain" @click="emit('same', item)">
              做同款
            </wd-button>
            <template v-if="!square">
              <wd-button
                size="small"
                type="danger"
                variant="plain"
                :disabled="isAiVideoRunning(item.status)"
                @click="emit('delete', item)"
              >
                删除
              </wd-button>
            </template>
          </view>
        </view>
      </view>
    </view>
  </z-paging>
</template>

<script lang="ts" setup>
import type { Video } from '@/api/ai/video'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getVideoDetail, getVideoMyPage, getVideoPublicPage } from '@/api/ai/video'
import { getIntDictOptions } from '@/hooks/useDict'
import { AiVideoStatusEnum, DICT_TYPE, isAiVideoRunning } from '@/utils/constants'
import { formatDate } from '@/utils/date'

const props = withDefaults(defineProps<{
  square?: boolean // 是否公开作品：只读，显示作者
}>(), {
  square: false,
})

const emit = defineEmits<{
  detail: [item: Video]
  same: [item: Video]
  delete: [item: Video]
}>()

const pollInterval = 5000 // 有未结束作品时的刷新间隔
const list = ref<Video[]>([]) // 作品列表
const pagingRef = ref<any>() // 分页组件引用
const type = ref<number>() // 创作类型筛选
const prompt = ref('') // 公开作品的提示词搜索
const runningList = computed(() => props.square ? [] : list.value.filter(item => isAiVideoRunning(item.status))) // 未结束的作品：只在我的作品轮询
let pollTimer: ReturnType<typeof setInterval> | undefined // 轮询定时器
let polling = false // 上一次轮询未返回时不再发起

/** 查询作品列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = props.square
      ? await getVideoPublicPage({ pageNo, pageSize, type: type.value, prompt: prompt.value || undefined })
      : await getVideoMyPage({ pageNo, pageSize, type: type.value })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 筛选创作类型 */
function handleTypeClick(value?: number) {
  type.value = value
  reload()
}

/** 轮询未结束的作品：逐条刷新详情，避免重载分页打断滚动位置 */
async function pollRunning() {
  if (polling || runningList.value.length === 0) {
    return
  }
  polling = true
  try {
    await Promise.all(runningList.value.map(async (item) => {
      const data = await getVideoDetail(item.id)
      Object.assign(item, data)
    }))
  } catch {
    // 轮询失败不打断页面，等待下一次刷新
  } finally {
    polling = false
  }
}

/** 初始化：我的作品开启轮询 */
onMounted(() => {
  if (!props.square) {
    pollTimer = setInterval(pollRunning, pollInterval)
  }
})

/** 卸载 */
onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = undefined
  }
})

defineExpose({ reload })
</script>
