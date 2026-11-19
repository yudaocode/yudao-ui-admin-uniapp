<template>
  <!-- 成片卡片 -->
  <view class="mb-16rpx bg-white p-24rpx">
    <view class="flex flex-wrap items-center gap-12rpx">
      <text class="text-32rpx text-[#333] font-semibold">{{ previous ? '上次成片' : '成片' }}</text>
      <wd-tag v-if="stale" type="warning">
        待重新合成
      </wd-tag>
      <dict-tag v-else-if="project.composeStatus" :type="DICT_TYPE.AI_DRAMA_STATUS" :value="project.composeStatus" />
      <wd-tag v-if="hasFile && project.publicStatus" type="success">
        已公开
      </wd-tag>
    </view>
    <view v-if="stale" class="mt-12rpx break-all text-24rpx text-[#fa8c16]">
      {{ project.composeStaleReason || '合成使用的镜头已变化' }}
    </view>
    <view v-if="isAiDramaRunning(project.composeStatus)" class="mt-16rpx">
      <wd-progress :percentage="project.composeProgress || 0" />
    </view>
    <view v-if="project.composeStatus === AiDramaStatusEnum.FAIL" class="mt-12rpx break-all text-24rpx text-[#f5222d]">
      {{ project.composeErrorMessage || '合成失败' }}
    </view>

    <!-- 成片：待重新合成、重新合成中、失败时，上次的成片仍可播放、下载 -->
    <video
      v-if="hasFile"
      :key="project.composeFileUrl"
      :src="project.composeFileUrl"
      controls
      object-fit="contain"
      class="mt-16rpx h-420rpx w-full rounded-8rpx bg-black"
    />
    <view v-else class="mt-16rpx text-24rpx text-[#999]">
      {{ summary }}
    </view>
    <view v-if="hasFile" class="mt-12rpx text-24rpx text-[#999]">
      {{ summary }}
    </view>
    <view v-if="successCount < 2" class="mt-12rpx text-24rpx text-[#999]">
      至少需要 2 个视频已完成的镜头才能合成
    </view>

    <view class="mt-16rpx flex gap-16rpx">
      <wd-button v-if="hasFile" class="flex-1" variant="plain" @click="openFile(project.composeFileUrl)">
        下载
      </wd-button>
      <wd-button
        class="flex-1"
        type="primary"
        :disabled="successCount < 2 || isAiDramaRunning(project.composeStatus)"
        @click="handleOpen"
      >
        {{ project.composeStatus ? '重新合成' : '合成成片' }}
      </wd-button>
    </view>
  </view>

  <!-- 合成弹窗 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="max-height: 86vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="pb-24rpx pt-24rpx">
      <view class="mb-20rpx flex items-center justify-between px-24rpx">
        <text class="text-32rpx text-[#222] font-semibold">{{ project.composeStatus ? '重新合成' : '合成成片' }}</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <scroll-view scroll-y class="max-h-[64vh]">
        <!-- 镜头：按镜头顺序拼接，与勾选先后无关 -->
        <view class="px-24rpx">
          <view class="mb-12rpx flex items-center justify-between">
            <text class="text-28rpx text-[#333] font-semibold">镜头（按镜头顺序拼接）</text>
            <text class="text-26rpx text-[#1677ff]" @click="handleCheckAll">
              {{ formData.storyboardIds.length === successStoryboards.length ? '取消全选' : '全选' }}
            </text>
          </view>
          <wd-checkbox-group v-model="formData.storyboardIds">
            <wd-checkbox v-for="item in successStoryboards" :key="item.id" :name="item.id">
              镜 {{ item.sceneNo }} {{ item.title || '未命名镜头' }}（{{ item.duration || '-' }} 秒）
            </wd-checkbox>
          </wd-checkbox-group>
        </view>

        <!-- 转场 -->
        <view class="mt-24rpx px-24rpx">
          <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
            转场
          </view>
          <wd-radio-group v-model="formData.transitionType" type="button">
            <wd-radio v-for="item in transitions" :key="item.value" :value="item.value">
              {{ item.label }}
            </wd-radio>
          </wd-radio-group>
          <view v-if="formData.transitionType !== 0" class="mt-12rpx flex items-center gap-12rpx">
            <wd-input-number v-model="formData.transitionDuration" :min="0.1" :max="2" :step="0.1" :precision="1" />
            <text class="text-24rpx text-[#999]">秒，需短于每个镜头</text>
          </view>
        </view>

        <!-- 画幅、水印、旁白 -->
        <wd-form :model="formData" class="mt-16rpx">
          <wd-cell-group border>
            <yd-form-picker v-model="formData.aspectRatio" label="画幅" :columns="aspectColumns" />
            <wd-form-item title="水印" title-width="200rpx" center>
              <wd-input v-model="formData.watermarkText" placeholder="可选，显示在右下角" :maxlength="32" clearable />
            </wd-form-item>
            <yd-form-picker v-model="formData.narrationAudioId" label="旁白" placeholder="不使用旁白" :columns="narrationColumns" clearable />
          </wd-cell-group>
        </wd-form>
        <view v-if="narrationUrl" class="px-24rpx pt-16rpx">
          <AudioPlayButton :url="narrationUrl" />
        </view>

        <!-- 上传或生成旁白 -->
        <view class="px-24rpx pb-16rpx pt-16rpx">
          <text class="text-26rpx text-[#1677ff]" @click="narrationVisible = !narrationVisible">
            {{ narrationVisible ? '收起旁白设置' : '上传或生成旁白' }}
          </text>
          <NarrationForm v-if="narrationVisible" :detail="detail" @success="emit('refresh')" />
        </view>
      </scroll-view>

      <view class="px-24rpx pt-24rpx">
        <view v-if="formData.storyboardIds.length < 2" class="mb-12rpx text-24rpx text-[#999]">
          至少选择 2 个视频已完成的镜头
        </view>
        <wd-button
          type="primary"
          block
          :loading="submitting"
          :disabled="formData.storyboardIds.length < 2 || isAiDramaRunning(project.composeStatus)"
          @click="handleSubmit"
        >
          合成所选 {{ formData.storyboardIds.length }} 段
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { DramaProjectDetail } from '@/api/ai/drama/project'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, reactive, ref } from 'vue'
import { composeDramaProject } from '@/api/ai/drama/project'
import { AI_DRAMA_ASPECT_RATIOS, AiDramaAudioTypeEnum, AiDramaStatusEnum, DICT_TYPE, formatAiDramaDuration, isAiDramaRunning } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { openFile } from '@/utils/download'
import AudioPlayButton from './audio-play-button.vue'
import NarrationForm from './narration-form.vue'

const props = defineProps<{
  detail: DramaProjectDetail // 项目详情
}>()

const emit = defineEmits<{
  refresh: [] // 已提交合成、新增旁白，需要刷新详情
}>()

const toast = useToast()
const visible = ref(false) // 合成弹窗显示状态
const submitting = ref(false) // 提交状态
const narrationVisible = ref(false) // 上传或生成旁白区域展开状态
const formData = reactive({ // 合成设置
  storyboardIds: [] as number[],
  aspectRatio: '9:16',
  transitionType: 0,
  transitionDuration: 0.5,
  narrationAudioId: undefined as number | undefined,
  watermarkText: '',
})
const transitions = [ // 转场类型，与后端 AiDramaTransitionTypeEnum 一致
  { label: '无', value: 0 },
  { label: '溶解', value: 1 },
  { label: '黑场淡入淡出', value: 2 },
  { label: '滑动', value: 3 },
]
const aspectColumns = AI_DRAMA_ASPECT_RATIOS.map(item => ({ label: item, value: item })) // 画幅选项

const project = computed(() => props.detail.project) // 项目
const hasFile = computed(() => !!project.value.composeFileUrl) // 有成片文件
const stale = computed(() => project.value.composeStatus === AiDramaStatusEnum.SUCCESS && !!project.value.composeStale) // 待重新合成：上次合成成功后，合成输入已变化
const previous = computed(() => hasFile.value && (stale.value || project.value.composeStatus !== AiDramaStatusEnum.SUCCESS)) // 展示的是上次成片
const successStoryboards = computed(() => // 视频已完成的镜头
  props.detail.storyboards.filter(item => item.videoStatus === AiDramaStatusEnum.SUCCESS && item.videoUrl),
)
const successCount = computed(() => successStoryboards.value.length) // 视频已完成的镜头数
const narrations = computed(() => props.detail.audios.filter(item => item.type === AiDramaAudioTypeEnum.NARRATION)) // 已有的旁白音频
const narrationColumns = computed(() => narrations.value.map((item, index) => ({ label: `旁白 ${index + 1}`, value: item.id })))
const narrationUrl = computed(() => narrations.value.find(item => item.id === formData.narrationAudioId)?.fileUrl) // 所选旁白的音频地址
const summary = computed(() => { // 摘要：时长 · 画幅 · 镜头数 · 完成时间；没有成片时为合成条件
  if (!hasFile.value) {
    return `视频已完成 ${successCount.value} / ${props.detail.storyboards.length} 镜`
  }
  return [
    project.value.composeDuration ? formatAiDramaDuration(project.value.composeDuration) : '',
    project.value.composeAspectRatio,
    project.value.composeStoryboardCount ? `${project.value.composeStoryboardCount} 镜` : '',
    project.value.composeFinishTime ? formatDateTime(project.value.composeFinishTime) : '',
  ].filter(Boolean).join(' · ')
})

/** 打开合成弹窗：默认选中全部已完成镜头；转场、画幅取上次合成的设置 */
function handleOpen() {
  formData.storyboardIds = successStoryboards.value.map(item => item.id)
  formData.aspectRatio = project.value.composeAspectRatio || '9:16'
  formData.transitionType = project.value.composeTransitionType ?? 0
  formData.transitionDuration = project.value.composeTransitionDurationSeconds || 0.5
  formData.narrationAudioId = undefined
  formData.watermarkText = ''
  visible.value = true
}

/** 全选、取消全选镜头 */
function handleCheckAll() {
  formData.storyboardIds = formData.storyboardIds.length === successStoryboards.value.length
    ? []
    : successStoryboards.value.map(item => item.id)
}

/** 提交合成 */
async function handleSubmit() {
  if (formData.storyboardIds.length < 2) {
    toast.warning('至少选择 2 个视频已完成的镜头')
    return
  }
  submitting.value = true
  try {
    await composeDramaProject({
      projectId: project.value.id,
      // 按镜头顺序拼接，不按勾选先后
      storyboardIds: successStoryboards.value.map(item => item.id).filter(id => formData.storyboardIds.includes(id)),
      aspectRatio: formData.aspectRatio,
      transitionType: formData.transitionType,
      // 无转场时不传时长；没有水印、旁白时不传
      transitionDuration: formData.transitionType === 0 ? undefined : formData.transitionDuration,
      narrationAudioId: formData.narrationAudioId,
      watermarkText: formData.watermarkText || undefined,
    })
    toast.success('已开始合成，完成后自动刷新')
    visible.value = false
    emit('refresh')
  } finally {
    submitting.value = false
  }
}
</script>
