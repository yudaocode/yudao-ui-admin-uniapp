<template>
  <!-- 配乐与参考音频：上传、AI 配乐、编辑、删除 -->
  <view class="mt-16rpx bg-white p-24rpx">
    <view class="flex items-center justify-between gap-12rpx">
      <text class="text-32rpx text-[#333] font-semibold">配乐与参考音频</text>
      <view class="flex gap-12rpx">
        <wd-button size="small" variant="plain" @click="musicPopupRef?.open()">
          AI 配乐
        </wd-button>
        <wd-button size="small" variant="plain" @click="audioPopupRef?.open()">
          上传音频
        </wd-button>
      </view>
    </view>
    <view v-if="!placementAudios.length" class="py-40rpx text-center text-26rpx text-[#999]">
      暂无配乐或参考音频
    </view>
    <view v-for="item in placementAudios" :key="item.id" class="mt-16rpx rounded-12rpx bg-[#f8f8f8] p-20rpx">
      <view class="flex items-center justify-between gap-12rpx">
        <view class="min-w-0 flex-1 truncate text-28rpx text-[#333]">
          <text class="mr-8rpx text-24rpx text-[#1677ff]">{{ item.type === AiDramaAudioTypeEnum.BGM ? '配乐' : '参考音频' }}</text>
          {{ item.name || `#${item.id}` }}
        </view>
        <AudioPlayButton :url="item.fileUrl" />
      </view>
      <view class="mt-8rpx text-22rpx text-[#999]">
        使用的镜头：{{ item.storyboardIds?.length ? getSceneNos(item.storyboardIds) : '候选，未使用' }}
        <text v-if="item.volume !== undefined && item.volume !== null" class="ml-16rpx">音量 {{ item.volume }}</text>
        <text v-if="item.startOffset" class="ml-16rpx">起始偏移 {{ item.startOffset }} 秒</text>
      </view>
      <view class="mt-12rpx flex justify-end gap-12rpx">
        <wd-button size="small" variant="plain" @click="audioPopupRef?.open(item)">
          编辑
        </wd-button>
        <wd-button size="small" type="danger" variant="plain" @click="handleDeleteAudio(item.id)">
          删除
        </wd-button>
      </view>
    </view>
  </view>

  <!-- 动作参考：上传并创建、删除 -->
  <view class="mt-16rpx bg-white p-24rpx">
    <view class="flex items-center justify-between gap-12rpx">
      <text class="text-32rpx text-[#333] font-semibold">动作参考</text>
      <wd-button size="small" variant="plain" @click="motionPopupRef?.open()">
        添加
      </wd-button>
    </view>
    <view v-if="!detail.motionReferences?.length" class="py-40rpx text-center text-26rpx text-[#999]">
      暂无动作参考视频
    </view>
    <view v-for="item in detail.motionReferences || []" :key="item.id" class="mt-16rpx">
      <video :src="item.fileUrl" controls object-fit="contain" class="h-360rpx w-full rounded-8rpx bg-black" />
      <view class="mt-8rpx flex items-center justify-between gap-12rpx text-24rpx text-[#666]">
        <text class="min-w-0 flex-1 truncate">{{ item.name }}</text>
        <text v-if="item.duration" class="text-[#999]">{{ item.duration.toFixed(1) }} 秒</text>
        <wd-button size="small" type="danger" variant="plain" @click="handleDeleteMotion(item.id)">
          删除
        </wd-button>
      </view>
    </view>
    <view class="mt-12rpx text-22rpx text-[#999]">
      添加后，可在镜头的「动作参考视频」中选用
    </view>
  </view>

  <!-- 弹窗 -->
  <AudioFormPopup ref="audioPopupRef" :detail="detail" @success="emit('refresh')" />
  <MusicPopup ref="musicPopupRef" :detail="detail" @success="emit('refresh')" />
  <MotionReferencePopup ref="motionPopupRef" :project-id="detail.project.id" @success="emit('refresh')" />
</template>

<script lang="ts" setup>
import type { DramaProjectDetail } from '@/api/ai/drama/project'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteDramaAudio, deleteDramaMotionReference } from '@/api/ai/drama/asset'
import { AiDramaAudioTypeEnum } from '@/utils/constants'
import AudioFormPopup from './audio-form-popup.vue'
import AudioPlayButton from './audio-play-button.vue'
import MotionReferencePopup from './motion-reference-popup.vue'
import MusicPopup from './music-popup.vue'

const props = defineProps<{
  detail: DramaProjectDetail // 项目详情
}>()

const emit = defineEmits<{
  refresh: [] // 数据有变化，需要刷新详情
}>()

const toast = useToast()
const dialog = useDialog()
const audioPopupRef = ref<InstanceType<typeof AudioFormPopup>>() // 音频表单引用
const musicPopupRef = ref<InstanceType<typeof MusicPopup>>() // AI 配乐弹窗引用
const motionPopupRef = ref<InstanceType<typeof MotionReferencePopup>>() // 动作参考表单引用

const placementAudios = computed(() => // 配乐、参考音频
  props.detail.audios.filter(item => item.type === AiDramaAudioTypeEnum.BGM || item.type === AiDramaAudioTypeEnum.REFERENCE),
)

/** 获得使用的镜头序号 */
function getSceneNos(storyboardIds: number[]) {
  return props.detail.storyboards.filter(item => storyboardIds.includes(item.id)).map(item => `#${item.sceneNo}`).join('、')
}

/** 删除配乐、参考音频 */
async function handleDeleteAudio(id: number) {
  try {
    await dialog.confirm({ title: '提示', msg: '确认删除该音频吗？' })
  } catch {
    return
  }
  await deleteDramaAudio(id)
  toast.success('删除成功')
  emit('refresh')
}

/** 删除动作参考视频 */
async function handleDeleteMotion(id: number) {
  try {
    await dialog.confirm({ title: '提示', msg: '删除后，已选用它的镜头仍保留视频地址，是否继续？' })
  } catch {
    return
  }
  await deleteDramaMotionReference(id)
  toast.success('删除成功')
  emit('refresh')
}
</script>
