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
    :empty-view-text="square ? '还没有公开的作品' : '还没有作品，去「创作」开始吧'"
    @query="queryList"
  >
    <!-- 音乐广场：名称搜索 -->
    <template v-if="square" #top>
      <wd-search v-model="title" placeholder="搜索名称" hide-cancel @search="reload" @clear="reload" />
    </template>

    <!-- 作品列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        :class="{ 'ring-2 ring-[#1677ff]': item.id === currentId }"
      >
        <view class="flex gap-20rpx">
          <!-- 封面：点击播放 -->
          <view class="relative h-140rpx w-140rpx shrink-0 overflow-hidden rounded-12rpx bg-[#f5f5f5]" @click="handlePlay(item)">
            <wd-img v-if="item.coverUrl" :src="item.coverUrl" width="140rpx" height="140rpx" mode="aspectFill" />
            <view v-else class="h-full w-full flex items-center justify-center">
              <wd-icon name="headset" size="56rpx" color="#bbb" />
            </view>
            <view v-if="isAiMusicRunning(item.status)" class="absolute inset-0 flex items-center justify-center bg-white/70">
              <wd-loading size="40rpx" />
            </view>
            <view v-else-if="canPlay(item)" class="absolute inset-0 flex items-center justify-center bg-black/20">
              <wd-icon :name="item.id === currentId && playing ? 'pause-circle-fill' : 'play-circle-fill'" size="60rpx" color="#fff" />
            </view>
          </view>

          <!-- 基本信息 -->
          <view class="min-w-0 flex-1" @click="emit('detail', item)">
            <view class="truncate text-30rpx text-[#333] font-semibold">
              {{ getMusicTitle(item.title) }}
            </view>
            <view class="mt-8rpx flex flex-wrap items-center gap-8rpx">
              <wd-tag type="default" variant="light">
                {{ item.model }}
              </wd-tag>
              <wd-tag v-if="getModeTag(item)" :type="getModeTag(item)!.type" variant="light">
                {{ getModeTag(item)!.label }}
              </wd-tag>
              <wd-tag v-if="item.makeInstrumental" type="default" variant="light">
                纯音乐
              </wd-tag>
              <wd-tag v-if="!square && item.publicStatus" type="success" variant="light">
                已公开
              </wd-tag>
            </view>
            <view class="mt-8rpx truncate text-24rpx text-[#999]">
              {{ getDescription(item) }}
            </view>
          </view>
        </view>

        <!-- 状态 -->
        <view class="mt-16rpx text-24rpx">
          <template v-if="isAiMusicRunning(item.status)">
            <view class="flex items-center gap-16rpx">
              <dict-tag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="item.status" />
              <view class="min-w-0 flex-1">
                <wd-progress :percentage="item.progress || 0" />
              </view>
            </view>
            <view class="mt-6rpx text-22rpx text-[#bbb]">
              {{ item.status === AiMusicStatusEnum.SAVING ? '正在保存封面与音频，完成后即可播放' : '通常 1~3 分钟完成' }}
            </view>
          </template>
          <view v-else-if="item.status === AiMusicStatusEnum.FAIL" class="line-clamp-2 text-[#f5222d]">
            {{ item.errorMessage || '生成失败' }}
          </view>
          <view v-else class="flex items-center gap-20rpx text-[#999]">
            <text>{{ formatMusicDuration(item.duration) }}</text>
            <view class="flex items-center gap-4rpx">
              <wd-icon name="headset" size="24rpx" color="#999" />
              <text>{{ item.playCount || 0 }}</text>
            </view>
            <text>{{ formatDateTime(item.createTime) }}</text>
          </view>
        </view>

        <!-- 操作 -->
        <view class="mt-16rpx flex flex-wrap items-center justify-end gap-16rpx">
          <wd-button v-if="canPlay(item)" size="small" variant="plain" @click="handlePlay(item)">
            {{ item.id === currentId && playing ? '暂停' : '播放' }}
          </wd-button>
          <wd-button v-if="square" size="small" variant="plain" @click="emit('detail', item)">
            详情
          </wd-button>
          <template v-else>
            <template v-if="item.status === AiMusicStatusEnum.SUCCESS">
              <wd-button
                v-if="item.generateMode === AiMusicGenerateModeEnum.EXTEND"
                size="small"
                variant="plain"
                @click="emit('concat', item)"
              >
                合并
              </wd-button>
              <wd-button size="small" variant="plain" @click="emit('extend', item)">
                续写
              </wd-button>
              <wd-button size="small" variant="plain" @click="emit('edit', item)">
                编辑
              </wd-button>
              <view class="flex items-center gap-8rpx text-24rpx text-[#666]">
                <text>公开</text>
                <wd-switch :model-value="item.publicStatus" size="36rpx" @change="handlePublicChange(item, $event)" />
              </view>
            </template>
            <wd-button
              size="small"
              type="danger"
              variant="plain"
              :disabled="isAiMusicRunning(item.status)"
              @click="emit('delete', item)"
            >
              删除
            </wd-button>
          </template>
        </view>
      </view>
    </view>
  </z-paging>
</template>

<script lang="ts" setup>
import type { Music } from '@/api/ai/music'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getMusicDetail, getMusicMyPage, getMusicPublicPage } from '@/api/ai/music'
import { AiMusicGenerateModeEnum, AiMusicStatusEnum, DICT_TYPE, formatMusicDuration, getMusicTitle, isAiMusicRunning } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = withDefaults(defineProps<{
  square?: boolean // 是否音乐广场：只读，显示作者
  currentId?: number // 播放器当前的音乐编号
  playing?: boolean // 播放器是否播放中
}>(), {
  square: false,
  playing: false,
})

const emit = defineEmits<{
  play: [item: Music, list: Music[]]
  detail: [item: Music]
  extend: [item: Music]
  concat: [item: Music]
  edit: [item: Music]
  delete: [item: Music]
  public: [item: Music, value: boolean]
}>()

const pollInterval = 5000 // 有未结束作品时的刷新间隔
const list = ref<Music[]>([]) // 作品列表
const pagingRef = ref<any>() // 分页组件引用
const title = ref('') // 音乐广场的名称搜索
const runningList = computed(() => list.value.filter(item => isAiMusicRunning(item.status))) // 未结束的作品
let pollTimer: ReturnType<typeof setInterval> | undefined // 轮询定时器
let polling = false // 上一次轮询未返回时不再发起

/** 查询作品列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = props.square
      ? await getMusicPublicPage({ pageNo, pageSize, title: title.value || undefined })
      : await getMusicMyPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 是否可播放：已完成且有音频 */
function canPlay(item: Music) {
  return item.status === AiMusicStatusEnum.SUCCESS && !!item.audioUrl
}

/** 播放：播放列表为当前列表中可播放的作品 */
function handlePlay(item: Music) {
  if (!canPlay(item)) {
    return
  }
  emit('play', item, list.value.filter(canPlay))
}

/** 公开 / 取消公开 */
function handlePublicChange(item: Music, { value }: { value: unknown }) {
  emit('public', item, !!value)
}

/** 生成模式标签：续写、完整歌曲、用户上传 */
function getModeTag(item: Music): { label: string, type: 'primary' | 'success' | 'warning' } | undefined {
  switch (item.generateMode) {
    case AiMusicGenerateModeEnum.EXTEND:
      return { label: '续写', type: 'primary' }
    case AiMusicGenerateModeEnum.CONCAT:
      return { label: '完整歌曲', type: 'success' }
    case AiMusicGenerateModeEnum.UPLOAD:
      return { label: '用户上传', type: 'warning' }
    default:
      return undefined
  }
}

/** 描述行：续写来源 / 风格 / 描述；广场附作者 */
function getDescription(item: Music) {
  let text: string
  if (item.generateMode === AiMusicGenerateModeEnum.EXTEND && item.refMusicId) {
    text = `续写自 #${item.refMusicId}，${formatMusicDuration(item.extendSeconds)} 起`
  } else if (item.generateMode === AiMusicGenerateModeEnum.CONCAT && item.refMusicId) {
    text = `合并：#${item.refMusicId} 与原曲`
  } else {
    text = item.tags || item.prompt || '-'
  }
  if (props.square && item.userNickname) {
    text += ` · by ${item.userNickname}`
  }
  return text
}

/** 轮询未结束的作品：逐条刷新详情，避免重载分页打断滚动位置 */
async function pollRunning() {
  if (props.square || polling || runningList.value.length === 0) {
    return
  }
  polling = true
  try {
    await Promise.all(runningList.value.map(async (item) => {
      const data = await getMusicDetail(item.id)
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
