<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="navTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view v-if="ready" class="pb-180rpx">
      <template v-if="storyboard">
        <!-- 切镜 -->
        <view class="flex items-center justify-between bg-white px-24rpx py-16rpx">
          <wd-button size="small" variant="plain" :disabled="shotIndex <= 0 || saving || generating" @click="handleSwitch(-1)">
            上一镜
          </wd-button>
          <view class="text-26rpx text-[#666]">
            {{ shotIndex + 1 }} / {{ detail!.storyboards.length }}
            <wd-tag v-if="dirty" type="warning" class="ml-8rpx">
              未保存
            </wd-tag>
          </view>
          <wd-button size="small" variant="plain" :disabled="shotIndex >= detail!.storyboards.length - 1 || saving || generating" @click="handleSwitch(1)">
            下一镜
          </wd-button>
        </view>

        <!-- 新增、删除镜头 -->
        <view class="flex justify-end gap-16rpx bg-white px-24rpx pb-16rpx">
          <wd-button size="small" variant="plain" @click="handleCreateShot">
            新增镜头
          </wd-button>
          <wd-button size="small" type="danger" variant="plain" :disabled="running" :loading="deleting" @click="handleDelete">
            删除镜头
          </wd-button>
        </view>

        <!-- 剧本已修改 -->
        <view v-if="scriptChanged" class="mx-24rpx mt-16rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-24rpx text-[#d46b08]">
          剧本已修改，请重新分析资产并从剧本生成分镜后，再生成关键帧和视频
        </view>

        <!-- 视频结果 -->
        <view class="mt-16rpx bg-white p-24rpx">
          <view class="mb-12rpx flex items-center gap-12rpx">
            <text class="text-30rpx text-[#333] font-semibold">视频结果</text>
            <dict-tag v-if="storyboard.videoStatus" :type="DICT_TYPE.AI_DRAMA_STATUS" :value="storyboard.videoStatus" />
            <text v-else class="text-24rpx text-[#999]">未生成</text>
            <wd-loading v-if="running" size="32rpx" />
          </view>
          <view v-if="modelText" class="mb-12rpx text-22rpx text-[#999]">
            本镜模型 {{ modelText }}
          </view>
          <!-- 重新生成时保留上次的视频，同时展示本次的状态与失败原因 -->
          <video
            v-if="storyboard.videoUrl"
            :key="storyboard.videoUrl"
            :src="storyboard.videoUrl"
            controls
            object-fit="contain"
            class="h-420rpx w-full rounded-8rpx bg-black"
          />
          <view v-else-if="isAiDramaRunning(storyboard.videoStatus)" class="h-200rpx flex items-center justify-center rounded-8rpx bg-[#f5f5f5] text-24rpx text-[#999]">
            生成中，完成后自动刷新
          </view>
          <view v-if="storyboard.videoStatus === AiDramaStatusEnum.FAIL" class="mt-12rpx break-all text-24rpx text-[#f5222d]">
            {{ storyboard.errorMessage || '生成失败' }}
          </view>
          <view class="mt-16rpx flex flex-wrap gap-16rpx">
            <wd-button v-if="storyboard.videoUrl" size="small" variant="plain" @click="openFile(storyboard.videoUrl)">
              下载
            </wd-button>
            <wd-button size="small" variant="plain" @click="submissionVisible = true">
              提交记录
            </wd-button>
            <wd-button size="small" variant="plain" @click="voicePopupRef?.open(storyboard)">
              镜头声音
            </wd-button>
            <wd-button size="small" variant="plain" :disabled="running" @click="importPopupRef?.open(storyboard)">
              导入视频
            </wd-button>
            <wd-button v-if="storyboard.continuity?.materialUrls?.length" size="small" variant="plain" :disabled="running" @click="handleRenderMaterial">
              素材成片
            </wd-button>
          </view>
        </view>

        <!-- 起始帧 -->
        <view class="mt-16rpx bg-white p-24rpx">
          <view class="mb-12rpx flex items-center gap-12rpx">
            <text class="text-30rpx text-[#333] font-semibold">起始帧</text>
            <wd-tag v-if="storyboard.continuity?.manualStartFrame?.url" type="warning">
              手动起始帧
            </wd-tag>
          </view>
          <view class="flex items-start gap-20rpx">
            <view class="shrink-0">
              <wd-img v-if="frame?.imageUrl" :src="frame.imageUrl" width="200rpx" height="200rpx" radius="8rpx" mode="aspectFill" enable-preview />
              <view v-else class="h-200rpx w-200rpx flex flex-col items-center justify-center gap-8rpx rounded-8rpx bg-[#f5f5f5] px-8rpx text-center text-22rpx text-[#999]">
                <wd-loading v-if="isAiDramaRunning(frame?.status)" size="36rpx" />
                <text v-else-if="frame?.status === AiDramaStatusEnum.FAIL" class="line-clamp-3 break-all text-[#f5222d]">{{ frame.errorMessage || '生成失败' }}</text>
                <text v-else>暂无关键帧</text>
              </view>
            </view>
            <view class="min-w-0 flex flex-1 flex-wrap gap-12rpx">
              <wd-button size="small" type="primary" variant="plain" :disabled="frameDisabled" @click="handleGenerateFrame()">
                {{ frame ? '重新生成关键帧' : '生成关键帧' }}
              </wd-button>
              <wd-button v-if="frame?.imageUrl" size="small" type="primary" variant="plain" :disabled="frameDisabled" @click="handleReviseFrame">
                修正构图
              </wd-button>
              <wd-button v-if="frame && hasArchive" size="small" type="primary" variant="plain" :disabled="isAiDramaRunning(frame.status)" @click="handleUndoFrame">
                撤销
              </wd-button>
              <wd-button v-if="shotIndex > 0" size="small" type="primary" variant="plain" :disabled="running" @click="handleUsePreviousLastFrame">
                承接上一镜
              </wd-button>
            </view>
          </view>
          <view class="mt-12rpx text-22rpx text-[#999]">
            使用起始帧时，优先使用手动起始帧，否则使用关键帧
          </view>
        </view>
      </template>

      <!-- 镜头字段 -->
      <ShotFields v-model="formData" :detail="detail!" :video-models="videoModels" :default-model-text="summary" />
    </view>

    <!-- 底部操作 -->
    <view v-if="ready" class="yd-detail-footer flex gap-24rpx">
      <template v-if="storyboard">
        <wd-button class="flex-1" variant="plain" :disabled="!effectiveVideoModelId || scriptChanged || running || saving" :loading="generating" @click="handleGenerateVideo">
          {{ storyboard.videoStatus ? '重新生成视频' : '生成视频' }}
        </wd-button>
        <wd-button class="flex-1" type="primary" :disabled="running || generating" :loading="saving" @click="handleSave">
          保存镜头
        </wd-button>
      </template>
      <wd-button v-else class="flex-1" type="primary" :loading="saving" @click="handleCreate">
        创建镜头
      </wd-button>
    </view>

    <!-- 弹窗 -->
    <VideoSubmissionPopup v-if="storyboard" v-model="submissionVisible" :storyboard="storyboard" @success="loadDetail" />
    <ShotVoicePopup ref="voicePopupRef" :characters="detail?.characters || []" @success="loadDetail" />
    <ShotImportVideoPopup ref="importPopupRef" @success="loadDetail" />
  </view>
</template>

<script lang="ts" setup>
import type { DramaProjectDetail } from '@/api/ai/drama/project'
import type { DramaStoryboard } from '@/api/ai/drama/storyboard'
import type { ShotForm } from './components/shot-form'
import { onHide, onShow, onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { undoDramaVisualAssetImage } from '@/api/ai/drama/asset'
import { getDramaProjectDetailMy } from '@/api/ai/drama/project'
import { applyDramaPreviousLastFrame, createDramaStoryboard, deleteDramaStoryboard, generateDramaStoryboardFrame, generateDramaStoryboardVideo, renderDramaStoryboardMaterial, updateDramaStoryboard } from '@/api/ai/drama/storyboard'
import { navigateBackPlus } from '@/utils'
import { AiDramaProjectStatusEnum, AiDramaStatusEnum, AiDramaVisualAssetKindEnum, DICT_TYPE, isAiDramaRunning } from '@/utils/constants'
import { openFile } from '@/utils/download'
import VideoSubmissionPopup from '../components/storyboard/video-submission-popup.vue'
import { useDramaModels } from '../components/storyboard/use-drama-models'
import ShotFields from './components/shot-fields.vue'
import ShotImportVideoPopup from './components/shot-import-video-popup.vue'
import ShotVoicePopup from './components/shot-voice-popup.vue'
import { buildShotSaveReq, createShotForm } from './components/shot-form'

const props = defineProps<{
  id?: number | any // 镜头编号；为空时为新增镜头
  projectId?: number | any // 项目编号
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const POLL_INTERVAL = 5000 // 生成中的轮询间隔（毫秒）
const toast = useToast()
const dialog = useDialog()
const { videoModels, imageModelId, videoModelId, resolution, summary, loadModels } = useDramaModels(Number(props.projectId))
const detail = ref<DramaProjectDetail>() // 项目详情
const shotId = ref(Number(props.id)) // 当前编辑的镜头编号
const formData = ref<ShotForm>(createShotForm()) // 编辑表单
const loadedSnapshot = ref('') // 加载时的表单快照：用于判断是否有未保存的修改
const loadedShotId = ref<number>() // 表单对应的镜头编号
const submissionVisible = ref(false) // 提交记录弹窗
const voicePopupRef = ref<InstanceType<typeof ShotVoicePopup>>() // 镜头声音弹窗引用
const importPopupRef = ref<InstanceType<typeof ShotImportVideoPopup>>() // 导入视频弹窗引用
const saving = ref(false) // 保存状态
const deleting = ref(false) // 删除状态
const generating = ref(false) // 生成视频提交状态
let pollTimer: ReturnType<typeof setTimeout> | undefined // 轮询定时器

const isCreate = !props.id // 新增镜头：没有镜头编号
const shotIndex = computed(() => detail.value?.storyboards.findIndex(item => item.id === shotId.value) ?? -1) // 镜头在列表中的位置
const storyboard = computed(() => detail.value?.storyboards[shotIndex.value]) // 当前镜头
const ready = computed(() => !!detail.value && (isCreate || !!storyboard.value)) // 可以展示：详情已加载，镜头存在或为新增
const navTitle = computed(() => { // 导航栏标题
  if (storyboard.value) {
    return `镜 ${storyboard.value.sceneNo}`
  }
  return isCreate ? '新增镜头' : '镜头'
})
const defaultSceneNo = computed(() => Math.max(0, ...(detail.value?.storyboards || []).map(item => item.sceneNo || 0)) + 1) // 新增镜头的默认序号：排在最后
const scriptChanged = computed(() => detail.value?.project.status === AiDramaProjectStatusEnum.SCRIPT_CHANGED) // 剧本已修改：不能生成关键帧、视频
const frame = computed(() => // 镜头的当前关键帧：不含历史版本
  detail.value?.visualAssets.find(item => item.kind === AiDramaVisualAssetKindEnum.SHOT_FRAME && !item.parentId && item.storyboardId === shotId.value),
)
const hasArchive = computed(() => !!frame.value && !!detail.value?.visualAssets.some(item => item.parentId === frame.value!.id)) // 关键帧有历史版本：可撤销
const running = computed(() => isAiDramaRunning(storyboard.value?.videoStatus)) // 视频生成中
const polling = computed(() => running.value || isAiDramaRunning(frame.value?.status)) // 有生成中的任务：需要轮询
const frameDisabled = computed(() => !imageModelId.value || scriptChanged.value || isAiDramaRunning(frame.value?.status)) // 不能生成关键帧
const dirty = computed(() => !!loadedSnapshot.value && JSON.stringify(formData.value) !== loadedSnapshot.value) // 有未保存的修改
const effectiveVideoModelId = computed(() => formData.value.videoModelId ?? videoModelId.value) // 生成视频使用的模型：镜头指定的，否则默认
const modelText = computed(() => { // 本镜固定使用的视频模型：名称取模型列表，已删除时取快照
  const item = storyboard.value
  if (!item?.videoModelId) {
    return ''
  }
  const name = videoModels.value.find(model => model.id === item.videoModelId)?.name || item.videoModel || `#${item.videoModelId}`
  return item.videoResolution ? `${name} · ${item.videoResolution}` : name
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-ai/drama/project/index?id=${props.projectId}`)
}

/** 加载镜头到表单：复制字段，修改不影响详情；为空时为新增 */
function loadForm(item?: DramaStoryboard) {
  formData.value = createShotForm(item, defaultSceneNo.value)
  loadedSnapshot.value = JSON.stringify(formData.value)
  loadedShotId.value = item?.id
}

/** 同步表单：切换镜头、或没有未保存的修改时加载；有未保存的修改时保留，只刷新视频、关键帧状态；新增时只初始化一次 */
function syncForm() {
  if (!storyboard.value) {
    if (isCreate && !loadedSnapshot.value) {
      loadForm()
    }
    return
  }
  if (loadedShotId.value !== storyboard.value.id || !dirty.value) {
    loadForm(storyboard.value)
  }
}

/** 加载项目详情 */
async function loadDetail() {
  detail.value = await getDramaProjectDetailMy(Number(props.projectId))
  syncForm()
}

/** 停止轮询 */
function stopPoll() {
  clearTimeout(pollTimer)
  pollTimer = undefined
}

/** 开始轮询：生成中时每隔一段时间刷新详情 */
function startPoll() {
  stopPoll()
  pollTimer = setTimeout(async () => {
    try {
      await loadDetail()
    } finally {
      if (polling.value && pollTimer) {
        startPoll()
      }
    }
  }, POLL_INTERVAL)
}

/** 有生成中的任务时轮询，结束后停止 */
watch(polling, (value) => {
  if (value) {
    startPoll()
  } else {
    stopPoll()
  }
})

/** 切换镜头：有未保存的修改时需确认 */
async function handleSwitch(offset: number) {
  // 保存、生成请求未返回时不能切镜：回包按发起的镜头与表单处理
  if (saving.value || generating.value) {
    return
  }
  const target = detail.value?.storyboards[shotIndex.value + offset]
  if (!target) {
    return
  }
  if (dirty.value) {
    try {
      await dialog.confirm({ title: '提示', msg: '有未保存的修改，切换镜头将丢弃，是否继续？' })
    } catch {
      return
    }
  }
  if (saving.value || generating.value) {
    return
  }
  shotId.value = target.id
  syncForm()
}

/** 新增镜头：进入新增页，默认排在最后 */
function handleCreateShot() {
  uni.navigateTo({ url: `/pages-ai/drama/project/shot/index?projectId=${props.projectId}` })
}

/** 创建镜头：保存后进入该镜头 */
async function handleCreate() {
  saving.value = true
  try {
    const id = await createDramaStoryboard(buildShotSaveReq(formData.value, Number(props.projectId)))
    toast.success('保存成功')
    uni.redirectTo({ url: `/pages-ai/drama/project/shot/index?id=${id}&projectId=${props.projectId}` })
  } finally {
    saving.value = false
  }
}

/** 删除镜头：一并删除其关键帧；删除后进入相邻的镜头，没有镜头时返回 */
async function handleDelete() {
  try {
    await dialog.confirm({ title: '提示', msg: '删除镜头会一并删除其关键帧，是否继续？' })
  } catch {
    return
  }
  const list = detail.value!.storyboards
  const neighbor = list[shotIndex.value + 1] || list[shotIndex.value - 1]
  deleting.value = true
  try {
    await deleteDramaStoryboard(shotId.value)
    toast.success('删除成功')
    if (!neighbor) {
      handleBack()
      return
    }
    shotId.value = neighbor.id
    await loadDetail()
  } finally {
    deleting.value = false
  }
}

/**
 * 保存镜头：按发起时的镜头与表单快照提交，其它字段原样提交
 *
 * 1. 回包时仍是发起的表单：以本次提交的快照为已保存的基线；保存期间与快照不同的编辑仍为未保存，刷新时保留
 * 2. 切走又切回该镜头（表单已重新加载）、且又有编辑：同样以提交的快照为基线，保留编辑
 * 3. 切走又切回该镜头、且没有编辑：不动基线，刷新时按服务端保存的结果重新加载
 * 4. 回包时已切到其它镜头：不动其基线
 */
async function save() {
  const id = shotId.value
  const form = formData.value // 发起的表单：加载镜头时会整体替换
  const snapshot = JSON.stringify(form)
  await updateDramaStoryboard(buildShotSaveReq(JSON.parse(snapshot), Number(props.projectId), storyboard.value!))
  if (shotId.value === id && loadedShotId.value === id && (formData.value === form || dirty.value)) {
    loadedSnapshot.value = snapshot
  }
  await loadDetail()
}

/** 保存镜头 */
async function handleSave() {
  saving.value = true
  try {
    await save()
    toast.success('保存成功')
  } finally {
    saving.value = false
  }
}

/**
 * 生成视频：有未保存的修改时先保存，视频按保存后的镜头生成；镜头、模型、分辨率都取发起时的，保存期间切镜、继续编辑不影响；
 * 每次点击一个请求编号，服务端据此识别重复提交
 */
async function handleGenerateVideo() {
  const data = {
    id: shotId.value,
    modelId: effectiveVideoModelId.value!,
    resolution: formData.value.videoModelId ? formData.value.videoResolution || undefined : resolution.value,
    requestId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`,
  }
  generating.value = true
  try {
    const saved = dirty.value
    if (saved) {
      await save()
    }
    await generateDramaStoryboardVideo(data)
    toast.success(saved ? '已保存镜头并提交生成' : '已提交生成')
    await loadDetail()
  } finally {
    generating.value = false
  }
}

/** 素材成片：素材图片直接渲染为镜头视频，不调用视频模型 */
async function handleRenderMaterial() {
  await renderDramaStoryboardMaterial(shotId.value)
  toast.success('已开始渲染素材')
  await loadDetail()
}

/** 生成关键帧；有修正说明时，以当前关键帧为参考修正构图 */
async function handleGenerateFrame(revisePrompt?: string) {
  await generateDramaStoryboardFrame({ id: shotId.value, modelId: imageModelId.value!, revisePrompt })
  toast.success(revisePrompt ? '已提交修正构图' : '已提交生成关键帧')
  await loadDetail()
}

/** 修正构图：输入修正说明 */
async function handleReviseFrame() {
  let value: string | number | undefined
  try {
    const result = await dialog.prompt({
      title: '修正构图',
      inputProps: { placeholder: '请输入修正说明，例如：人物移到画面左侧' },
    })
    value = result.value
  } catch {
    return
  }
  const revisePrompt = String(value || '').trim()
  if (!revisePrompt) {
    toast.warning('修正说明不能为空')
    return
  }
  await handleGenerateFrame(revisePrompt)
}

/** 撤销关键帧：恢复为上一版 */
async function handleUndoFrame() {
  try {
    await dialog.confirm({ title: '提示', msg: '撤销后恢复为上一版关键帧，是否继续？' })
  } catch {
    return
  }
  await undoDramaVisualAssetImage(frame.value!.id)
  toast.success('已撤销')
  await loadDetail()
}

/** 承接上一镜：上一镜视频的尾帧作为本镜的手动起始帧；有未保存的修改时提示，避免保存时覆盖 */
async function handleUsePreviousLastFrame() {
  if (dirty.value) {
    toast.warning('请先保存本镜的修改，再承接上一镜')
    return
  }
  await applyDramaPreviousLastFrame(shotId.value)
  toast.success('已使用上一镜的尾帧作为起始帧')
  await loadDetail()
}

/** 初始化：显示、从提交记录等返回时刷新详情，并加载默认模型 */
onShow(async () => {
  if (!detail.value) {
    toast.loading('加载中...')
    try {
      await Promise.all([loadDetail(), loadModels()])
    } finally {
      toast.close()
    }
    return
  }
  await loadDetail()
  if (polling.value) {
    startPoll()
  }
})

/** 页面隐藏、卸载：停止轮询 */
onHide(stopPoll)
onUnload(stopPoll)
</script>
