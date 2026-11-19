<template>
  <!-- 成片 -->
  <ComposeCard :detail="detail" @refresh="emit('refresh')" />

  <!-- 工具栏 -->
  <view class="mb-16rpx bg-white p-24rpx">
    <view v-if="scriptChanged" class="mb-16rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-24rpx text-[#d46b08]">
      剧本已修改，请重新分析资产并从剧本生成分镜后，再生成关键帧和视频
    </view>
    <wd-button type="primary" block @click="planVisible = true">
      从剧本生成分镜
    </wd-button>
    <wd-form :model="{}">
      <wd-cell-group border>
        <yd-form-picker
          v-model="chatModelId"
          label="对话模型"
          label-width="180rpx"
          placeholder="默认对话模型"
          :columns="toModelColumns(chatModels)"
          filterable
          clearable
        />
      </wd-cell-group>
    </wd-form>
    <view class="mt-16rpx flex gap-16rpx">
      <wd-button class="min-w-0 flex-1" size="small" variant="plain" @click="modelVisible = true">
        默认模型
      </wd-button>
      <wd-button class="min-w-0 flex-1" size="small" variant="plain" :loading="generatingBatch" @click="batchVisible = true">
        批量
      </wd-button>
      <wd-button class="min-w-0 flex-1" size="small" variant="plain" :loading="!!generatingDetail" @click="moreVisible = true">
        {{ generatingDetail || '更多' }}
      </wd-button>
    </view>
    <view class="mt-12rpx break-all text-22rpx text-[#999]">
      默认模型：{{ summary }}
    </view>
  </view>

  <!-- 镜头列表 -->
  <ShotList :storyboards="detail.storyboards" :locations="detail.locations" @open="handleOpenShot" @create="handleCreateShot" />

  <!-- 配乐、参考音频、动作参考 -->
  <AudioMotionSection :detail="detail" @refresh="emit('refresh')" />

  <!-- 弹窗 -->
  <PlanPopup v-model="planVisible" :detail="detail" :chat-model-id="chatModelId" @imported="emit('refresh')" />
  <DefaultModelPopup
    v-model="modelVisible"
    v-model:image-model-id="imageModelId"
    v-model:video-model-id="videoModelId"
    v-model:resolution="resolution"
    :image-models="imageModels"
    :video-models="videoModels"
    :resolutions="resolutions"
  />
  <FrameBatchPopup v-model="frameBatchVisible" :project-id="project.id" :model-id="imageModelId" @success="emit('refresh')" />
  <wd-action-sheet
    v-model="batchVisible"
    :actions="batchActions"
    title="批量"
    cancel-text="取消"
    root-portal
    @select="handleBatchSelect"
  />
  <wd-action-sheet
    v-model="moreVisible"
    :actions="moreActions"
    title="更多"
    cancel-text="取消"
    root-portal
    @select="handleMoreSelect"
  />
</template>

<script lang="ts" setup>
import type { DramaProjectDetail } from '@/api/ai/drama/project'
import type { DramaStoryboard } from '@/api/ai/drama/storyboard'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateDramaActingNotes, generateDramaPhotographyRules, planDramaFrameList } from '@/api/ai/drama/script'
import { generateDramaStoryboardVideoBatch } from '@/api/ai/drama/storyboard'
import { AiDramaProjectStatusEnum } from '@/utils/constants'
import AudioMotionSection from './storyboard/audio-motion-section.vue'
import ComposeCard from './storyboard/compose-card.vue'
import DefaultModelPopup from './storyboard/default-model-popup.vue'
import FrameBatchPopup from './storyboard/frame-batch-popup.vue'
import PlanPopup from './storyboard/plan-popup.vue'
import ShotList from './storyboard/shot-list.vue'
import { toModelColumns, useDramaModels } from './storyboard/use-drama-models'

const props = defineProps<{
  detail: DramaProjectDetail // 项目详情
}>()

const emit = defineEmits<{
  refresh: [] // 数据有变化，需要刷新详情
}>()

const toast = useToast()
const dialog = useDialog()
const project = computed(() => props.detail.project) // 项目
const { chatModels, imageModels, videoModels, chatModelId, imageModelId, videoModelId, resolution, resolutions, summary, loadModels } = useDramaModels(props.detail.project.id)
const planVisible = ref(false) // 规划分镜弹窗
const modelVisible = ref(false) // 默认模型弹窗
const frameBatchVisible = ref(false) // 批量关键帧弹窗
const batchVisible = ref(false) // 批量菜单
const moreVisible = ref(false) // 更多菜单
const generatingDetail = ref('') // 生成中的镜头设计名称
const generatingBatch = ref(false) // 批量提交中
const scriptChanged = computed(() => project.value.status === AiDramaProjectStatusEnum.SCRIPT_CHANGED) // 剧本已修改：分镜可能已过期，不能生成关键帧、视频
const batchActions = computed(() => [ // 批量菜单
  { name: '批量关键帧', value: 'frame', disabled: !imageModelId.value || scriptChanged.value },
  { name: '批量生成视频', value: 'video', disabled: !videoModelId.value || scriptChanged.value },
])
const moreActions = computed(() => [ // 更多菜单：生成镜头设计
  { name: '生成摄影规则', value: 'photography', disabled: !props.detail.storyboards.length },
  { name: '生成表演指导', value: 'acting', disabled: !props.detail.storyboards.length },
  { name: '生成关键帧规划', value: 'frame', disabled: !props.detail.storyboards.length },
])
const detailGenerators: Record<string, { name: string, api: (projectId: number, modelId?: number) => Promise<boolean> }> = { // 镜头设计生成接口
  photography: { name: '摄影规则', api: generateDramaPhotographyRules },
  acting: { name: '表演指导', api: generateDramaActingNotes },
  frame: { name: '关键帧规划', api: planDramaFrameList },
}

/** 进入单镜页 */
function handleOpenShot(item: DramaStoryboard) {
  uni.navigateTo({ url: `/pages-ai/drama/project/shot/index?id=${item.id}&projectId=${project.value.id}` })
}

/** 新增镜头：进入新增页，默认排在最后 */
function handleCreateShot() {
  uni.navigateTo({ url: `/pages-ai/drama/project/shot/index?projectId=${project.value.id}` })
}

/** 批量：批量关键帧、批量生成视频（未生成、已失败的镜头） */
async function handleBatchSelect({ item }: { item: { value: string, disabled?: boolean } }) {
  if (item.disabled) {
    return
  }
  if (item.value === 'frame') {
    frameBatchVisible.value = true
    return
  }
  generatingBatch.value = true
  try {
    const count = await generateDramaStoryboardVideoBatch({
      id: project.value.id,
      modelId: videoModelId.value!,
      resolution: resolution.value,
    })
    toast.success(count ? `已提交 ${count} 个镜头` : '没有需要生成的镜头')
    emit('refresh')
  } finally {
    generatingBatch.value = false
  }
}

/** 更多：生成镜头设计，覆盖当前剧本全部镜头的对应内容；调用耗时较长 */
async function handleMoreSelect({ item }: { item: { value: string, disabled?: boolean } }) {
  const generator = detailGenerators[item.value]
  if (item.disabled || !generator) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `为当前剧本的全部镜头生成${generator.name}，会覆盖已有的内容，是否继续？`,
    })
  } catch {
    return
  }
  generatingDetail.value = `${generator.name}生成中`
  try {
    await generator.api(project.value.id, chatModelId.value)
    toast.success(`${generator.name}已生成`)
    emit('refresh')
  } finally {
    generatingDetail.value = ''
  }
}

/** 初始化 */
onMounted(() => {
  loadModels()
})

/** 从单镜页返回：镜头可能已修改，刷新详情 */
onShow(() => {
  emit('refresh')
})
</script>
