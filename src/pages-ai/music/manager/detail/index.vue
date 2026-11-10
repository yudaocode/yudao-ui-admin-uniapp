<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="音乐详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id ?? '-'" />
        <wd-cell title="用户" :value="formData?.userNickname || '-'" />
        <wd-cell title="音乐名称" :value="formData?.title || '-'" />
        <wd-cell title="音乐状态">
          <view class="flex items-center justify-end gap-8rpx">
            <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.AI_MUSIC_STATUS" :value="formData.status" />
            <text v-else>-</text>
            <text v-if="isAiMusicRunning(formData?.status)" class="text-[#999]">{{ formData?.progress || 0 }}%</text>
          </view>
        </wd-cell>
        <wd-cell title="生成模式">
          <dict-tag v-if="formData?.generateMode != null" :type="DICT_TYPE.AI_GENERATE_MODE" :value="formData.generateMode" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="模型" :value="formData?.model || '-'" />
        <wd-cell title="API 密钥" :value="formData?.apiKeyName || '-'" />
        <wd-cell title="任务编号" :value="formData?.taskId || '-'" />
        <wd-cell title="歌曲编号(clip)" :value="formData?.clipId || '-'" />
        <wd-cell title="时长" :value="formatMusicDuration(formData?.duration)" />
        <wd-cell title="播放次数" :value="formData?.playCount ?? 0" />
        <wd-cell title="是否公开">
          <wd-switch
            v-if="formData && hasAccessByCodes(['ai:music:update'])"
            :model-value="formData.publicStatus"
            :disabled="formData.status !== AiMusicStatusEnum.SUCCESS"
            @change="handlePublicChange"
          />
          <text v-else>{{ formData?.publicStatus ? '是' : '否' }}</text>
        </wd-cell>
        <wd-cell title="来源作品" :value="getRefMusicText()" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="完成时间" :value="formatDateTime(formData?.finishTime) || '-'" />
        <wd-cell v-if="formData?.status === AiMusicStatusEnum.FAIL" title="失败原因" layout="vertical" value-align="left">
          <text class="text-[#f5222d]">{{ formData.errorMessage || '-' }}</text>
        </wd-cell>
        <wd-cell title="封面">
          <wd-img v-if="formData?.coverUrl" :src="formData.coverUrl" width="160rpx" height="160rpx" radius="8rpx" mode="aspectFill" enable-preview />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="描述 / 风格" layout="vertical" value-align="left">
          <view v-if="formData?.prompt">
            {{ formData.prompt }}
          </view>
          <view v-if="formData?.tags">
            {{ formData.tags }}
          </view>
          <text v-if="!formData?.prompt && !formData?.tags">-</text>
        </wd-cell>
        <wd-cell title="歌词" layout="vertical" value-align="left">
          <view v-if="formData?.lyric" class="whitespace-pre-wrap leading-40rpx">
            {{ formData.lyric }}
          </view>
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="音频">
          <view v-if="canPlay" class="flex items-center justify-end gap-16rpx">
            <wd-button size="small" type="primary" @click="togglePlay">
              {{ playing ? '暂停' : '播放' }}
            </wd-button>
            <wd-button size="small" variant="plain" @click="handleCopyUrl(formData!.audioUrl!)">
              复制地址
            </wd-button>
          </view>
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="视频">
          <wd-button v-if="formData?.videoUrl" size="small" variant="plain" @click="handleCopyUrl(formData.videoUrl)">
            复制地址
          </wd-button>
          <text v-else>-</text>
        </wd-cell>
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['ai:music:delete'])" class="yd-detail-footer">
      <wd-button
        type="danger"
        block
        :loading="deleting"
        :disabled="isAiMusicRunning(formData?.status)"
        @click="handleDelete"
      >
        删除
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Music } from '@/api/ai/music'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteMusic, getMusic, updateMusic } from '@/api/ai/music'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { AiMusicStatusEnum, DICT_TYPE, formatMusicDuration, isAiMusicRunning } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<Music | null>() // 详情数据
const deleting = ref(false) // 删除状态
const playing = ref(false) // 是否播放中
const canPlay = computed(() => formData.value?.status === AiMusicStatusEnum.SUCCESS && !!formData.value?.audioUrl) // 是否可播放

const audio = uni.createInnerAudioContext() // 音频播放上下文
audio.onPlay(() => {
  playing.value = true
})
audio.onPause(() => {
  playing.value = false
})
audio.onStop(() => {
  playing.value = false
})
audio.onEnded(() => {
  playing.value = false
})
audio.onError(() => {
  playing.value = false
  toast.error('音频加载失败')
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/music/manager/index')
}

/** 加载音乐详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getMusic(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 来源作品文案 */
function getRefMusicText() {
  const item = formData.value
  if (!item?.refMusicId) {
    return '-'
  }
  if (item.extendSeconds !== undefined && item.extendSeconds !== null) {
    return `${item.refMusicId}（从 ${formatMusicDuration(item.extendSeconds)} 续写）`
  }
  return String(item.refMusicId)
}

/** 播放 / 暂停 */
function togglePlay() {
  const audioUrl = formData.value?.audioUrl
  if (!audioUrl) {
    return
  }
  if (playing.value) {
    audio.pause()
    return
  }
  if (audio.src !== audioUrl) {
    audio.src = audioUrl
  }
  audio.play()
}

/** 切换公开状态 */
async function handlePublicChange({ value }: { value: unknown }) {
  if (!formData.value) {
    return
  }
  const publicStatus = !!value
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认要“${publicStatus ? '公开' : '取消公开'}”该音乐吗？`,
    })
  } catch {
    return
  }
  await updateMusic({ id: formData.value.id, publicStatus })
  formData.value.publicStatus = publicStatus
  toast.success('更新成功')
  uni.$emit('ai:music:reload')
}

/** 删除音乐记录 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该音乐记录吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteMusic(Number(props.id))
    toast.success('删除成功')
    audio.stop()
    uni.$emit('ai:music:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 复制媒体地址 */
function handleCopyUrl(url: string) {
  uni.setClipboardData({
    data: url,
    success: () => toast.success('已复制地址'),
  })
}

/** 初始化 */
onMounted(() => {
  getDetail()
})

/** 卸载：销毁音频上下文 */
onUnload(() => {
  audio.destroy()
})
</script>
