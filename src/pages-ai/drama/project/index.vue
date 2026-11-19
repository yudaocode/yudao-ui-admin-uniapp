<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 步骤 -->
    <view class="bg-white">
      <wd-tabs v-model="stepIndex" shrink @change="handleStepChange">
        <wd-tab
          v-for="(item, index) in STEPS"
          :key="item.value"
          :title="item.label"
          :disabled="isCreate && index > 0"
        />
      </wd-tabs>
    </view>
    <view v-if="running" class="bg-[#f0f7ff] px-24rpx py-12rpx text-24rpx text-[#1677ff]">
      生成中，每 5 秒自动刷新
    </view>

    <!-- 新建：只有故事想法，保存或生成后进入该项目 -->
    <IdeaStep v-if="isCreate" @created="handleCreated" />

    <!-- 加载中 -->
    <view v-else-if="!detail" class="flex justify-center py-80rpx">
      <wd-loading />
    </view>

    <!-- 项目步骤 -->
    <template v-else>
      <IdeaStep
        v-if="step === AiDramaStepEnum.IDEA"
        :detail="detail"
        @refresh="loadDetail"
        @next="goStep"
      />
      <ScriptStep
        v-else-if="step === AiDramaStepEnum.SCRIPT"
        :detail="detail"
        @refresh="loadDetail"
        @next="goStep"
      />
      <AssetStep
        v-else-if="step === AiDramaStepEnum.ASSET"
        :detail="detail"
        @refresh="loadDetail"
        @next="goStep"
      />
      <StoryboardStep
        v-else
        :detail="detail"
        @refresh="loadDetail"
      />
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { DramaProjectDetail } from '@/api/ai/drama/project'
import { onHide, onShow, onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref, watch } from 'vue'
import { getDramaProjectDetailMy } from '@/api/ai/drama/project'
import { navigateBackPlus } from '@/utils'
import { AiDramaProjectStatusEnum, AiDramaStepEnum, isAiDramaRunning } from '@/utils/constants'
import AssetStep from './components/asset-step.vue'
import IdeaStep from './components/idea-step.vue'
import ScriptStep from './components/script-step.vue'
import StoryboardStep from './components/storyboard-step.vue'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const STEPS = [ // 步骤：故事想法 → 剧本审阅 → 资产配置 → 分镜与成片
  { label: '故事想法', value: AiDramaStepEnum.IDEA },
  { label: '剧本审阅', value: AiDramaStepEnum.SCRIPT },
  { label: '资产配置', value: AiDramaStepEnum.ASSET },
  { label: '分镜与成片', value: AiDramaStepEnum.STORYBOARD },
]
const POLL_INTERVAL = 5000 // 生成中的轮询间隔（毫秒）

const isCreate = computed(() => !props.id) // 是否新建
const detail = ref<DramaProjectDetail>() // 项目详情
const stepIndex = ref(0) // 当前步骤下标
const step = computed(() => STEPS[stepIndex.value].value) // 当前步骤
const getTitle = computed(() => isCreate.value ? '新建短剧' : detail.value?.project.name || '加载中') // 标题
const running = computed(() => hasDramaRunning(detail.value)) // 是否有生成中的任务
let timer: ReturnType<typeof setInterval> | undefined // 轮询定时器
let polling = false // 本轮轮询是否在请求中

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/drama/index')
}

/** 进入项目时的步骤：按项目进度推断 */
function getDramaStep(data: DramaProjectDetail) {
  if (!data.script?.content) {
    return AiDramaStepEnum.IDEA
  }
  if (data.project.status === AiDramaProjectStatusEnum.SCRIPT_CHANGED) {
    return AiDramaStepEnum.SCRIPT
  }
  if (!data.storyboards.length) {
    return data.characters.length || data.locations.length ? AiDramaStepEnum.ASSET : AiDramaStepEnum.SCRIPT
  }
  return AiDramaStepEnum.STORYBOARD
}

/** 项目详情中是否有生成中的任务：出图、镜头视频、成片 */
function hasDramaRunning(data?: DramaProjectDetail) {
  if (!data) {
    return false
  }
  return isAiDramaRunning(data.project.composeStatus)
    || data.characters.some(character => character.appearances.some(item => isAiDramaRunning(item.status)))
    || data.locations.some(item => isAiDramaRunning(item.status))
    || data.visualAssets.some(item => isAiDramaRunning(item.status))
    || data.storyboards.some(item => isAiDramaRunning(item.videoStatus))
}

/** 加载项目详情：首次加载时按项目进度推断步骤 */
async function loadDetail() {
  const data = await getDramaProjectDetailMy(Number(props.id))
  if (!detail.value) {
    stepIndex.value = STEPS.findIndex(item => item.value === getDramaStep(data))
  }
  detail.value = data
}

/** 切换步骤：只在前端切换，并刷新详情 */
async function goStep(value: number) {
  stepIndex.value = STEPS.findIndex(item => item.value === value)
  await loadDetail()
}

/** 点击步骤标签 */
async function handleStepChange() {
  await loadDetail()
}

/** 新建完成：进入该项目，进入后按项目进度推断步骤 */
function handleCreated(id: number) {
  uni.redirectTo({ url: `/pages-ai/drama/project/index?id=${id}` })
}

/** 静默刷新详情：不提示加载中 */
async function pollDetail() {
  if (polling || !props.id) {
    return
  }
  polling = true
  try {
    detail.value = await getDramaProjectDetailMy(Number(props.id))
  } catch {
    // 静默轮询失败时等待下一轮，不打断当前操作
  } finally {
    polling = false
  }
}

/** 开始轮询 */
function startPolling() {
  if (!timer && running.value) {
    timer = setInterval(pollDetail, POLL_INTERVAL)
  }
}

/** 停止轮询 */
function stopPolling() {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
}

/** 生成中时轮询，结束后停止 */
watch(running, (value) => {
  stopPolling()
  if (value) {
    startPolling()
  }
})

/** 初始化 */
onMounted(() => {
  if (!isCreate.value) {
    loadDetail()
  }
})

/** 页面重新显示：恢复轮询 */
onShow(startPolling)

/** 页面隐藏：暂停轮询 */
onHide(stopPolling)

/** 页面卸载：停止轮询 */
onUnload(stopPolling)
</script>
