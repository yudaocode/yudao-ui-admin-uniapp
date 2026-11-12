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
    empty-view-text="暂无任务，去「创建」生成吧～"
    @query="queryList"
  >
    <!-- 轮询提示 -->
    <template v-if="runningList.length > 0" #top>
      <view class="bg-[#eef4ff] px-24rpx py-12rpx text-22rpx text-[#1677ff]">
        有生成中任务时每 3 秒刷新
      </view>
    </template>

    <!-- PPT 列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="flex gap-20rpx" @click="emit('preview', item)">
          <!-- 封面 -->
          <view class="h-135rpx w-240rpx shrink-0 overflow-hidden rounded-8rpx bg-[#f5f5f5]">
            <wd-img v-if="item.coverUrl" :src="item.coverUrl" width="240rpx" height="135rpx" mode="aspectFill" />
            <view
              v-else-if="item.status === AiPptStatusEnum.IN_PROGRESS"
              class="h-full w-full flex flex-col items-center justify-center gap-6rpx text-22rpx text-[#999]"
            >
              <wd-loading size="32rpx" />
              <text>正在生成中</text>
            </view>
            <view v-else class="h-full w-full flex items-center justify-center text-22rpx text-[#bbb]">
              暂无预览
            </view>
          </view>
          <!-- 基本信息 -->
          <view class="min-w-0 flex-1">
            <view class="line-clamp-2 text-28rpx text-[#333] font-semibold">
              {{ item.title }}
            </view>
            <view class="mt-8rpx flex flex-wrap items-center gap-12rpx text-24rpx text-[#666]">
              <dict-tag :type="DICT_TYPE.AI_PPT_STATUS" :value="item.status" />
              <text>{{ item.finishCount }} / {{ item.slideCount }} 页</text>
            </view>
            <view class="mt-8rpx text-22rpx text-[#999]">
              {{ formatDate(item.createTime, 'MM-DD HH:mm') }}
            </view>
          </view>
        </view>

        <!-- 进度、失败原因 -->
        <view v-if="item.status === AiPptStatusEnum.IN_PROGRESS" class="mt-12rpx truncate text-24rpx text-[#999]">
          {{ getProgressText(item) }}
        </view>
        <view
          v-if="item.status === AiPptStatusEnum.FAIL && item.errorMessage"
          class="mt-12rpx rounded-8rpx bg-[#fff1f0] px-20rpx py-12rpx text-24rpx text-[#f5222d] leading-36rpx"
        >
          {{ item.errorMessage }}
        </view>

        <!-- 操作 -->
        <view class="mt-16rpx flex flex-wrap items-center justify-end gap-16rpx">
          <wd-button size="small" variant="plain" @click="emit('prompt', item)">
            查看提示词
          </wd-button>
          <wd-button size="small" variant="plain" @click="emit('outline', item)">
            查看大纲
          </wd-button>
          <wd-button v-if="item.status === AiPptStatusEnum.FAIL" size="small" type="primary" variant="plain" @click="emit('resume', item)">
            继续生成
          </wd-button>
          <wd-button v-if="item.status === AiPptStatusEnum.SUCCESS" size="small" type="primary" variant="plain" @click="emit('export', item)">
            导出
          </wd-button>
          <wd-button v-if="item.status !== AiPptStatusEnum.IN_PROGRESS" size="small" type="danger" variant="plain" @click="emit('delete', item)">
            删除
          </wd-button>
        </view>
      </view>
    </view>
  </z-paging>
</template>

<script lang="ts" setup>
import type { Ppt } from '@/api/ai/ppt'
import { onHide, onShow } from '@dcloudio/uni-app'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getPptMy, getPptMyPage } from '@/api/ai/ppt'
import { AiPptStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'

const emit = defineEmits<{
  preview: [item: Ppt]
  outline: [item: Ppt]
  prompt: [item: Ppt]
  resume: [item: Ppt]
  export: [item: Ppt]
  delete: [item: Ppt]
}>()

const pollInterval = 3000 // 有生成中任务时的刷新间隔
const list = ref<Ppt[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const runningList = computed(() => list.value.filter(item => item.status === AiPptStatusEnum.IN_PROGRESS)) // 生成中的任务
let pollTimer: ReturnType<typeof setInterval> | undefined // 轮询定时器
let polling = false // 上一次轮询未返回时不再发起

/** 查询 PPT 列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPptMyPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 用最新详情更新列表中的同一任务，例如预览中重绘、切换版本后 */
function updateItem(data: Ppt) {
  const item = list.value.find(row => row.id === data.id)
  if (item) {
    Object.assign(item, data)
  }
}

/** 生成中的进度文案：分镜阶段没有页数；每页都有图时为单页重绘 */
function getProgressText(item: Ppt) {
  if (!item.slideCount) {
    return '正在生成分镜…'
  }
  if (item.finishCount < item.slideCount) {
    return `正在生成第 ${item.finishCount + 1} 页`
  }
  return '正在重绘…'
}

/** 轮询生成中的任务：逐条刷新详情，避免重载分页打断滚动位置 */
async function pollRunning() {
  if (polling || runningList.value.length === 0) {
    return
  }
  polling = true
  try {
    await Promise.all(runningList.value.map(async (item) => {
      Object.assign(item, await getPptMy(item.id))
    }))
  } catch {
    // 轮询失败不打断页面，等待下一次刷新
  } finally {
    polling = false
  }
}

/** 开始轮询 */
function startPolling() {
  stopPolling()
  pollTimer = setInterval(pollRunning, pollInterval)
}

/** 停止轮询 */
function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = undefined
  }
}

/** 初始化 */
onMounted(() => {
  startPolling()
})

/** 页面重新显示：恢复轮询 */
onShow(() => {
  startPolling()
})

/** 页面隐藏：暂停轮询 */
onHide(() => {
  stopPolling()
})

/** 卸载 */
onUnmounted(() => {
  stopPolling()
})

defineExpose({ reload, updateItem })
</script>
