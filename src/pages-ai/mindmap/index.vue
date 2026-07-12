<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="思维导图生成"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink>
        <wd-tab title="生成" />
        <wd-tab title="历史" />
      </wd-tabs>
    </view>

    <!-- 当前生成 -->
    <view v-show="tabIndex === 0" class="min-h-0 flex flex-1 flex-col">
      <MindmapResult :content="generatedContent" :generating="isGenerating" />
      <MindmapInputPanel
        ref="inputRef"
        :model-value="formData"
        :generating="isGenerating"
        :has-result="Boolean(generatedContent)"
        @submit="handleSubmit"
        @stop="stopStream"
        @reset="handleReset"
      />
    </view>

    <!-- 历史列表 -->
    <MindmapHistoryList v-if="tabIndex === 1" />
  </view>
</template>

<script lang="ts" setup>
import type { AiMindMapGenerateReq } from '@/api/ai/mindmap'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnmounted, reactive, ref } from 'vue'
import { generateMindMap } from '@/api/ai/mindmap'
import { navigateBackPlus } from '@/utils'
import MindmapHistoryList from './components/mindmap-history-list.vue'
import MindmapInputPanel from './components/mindmap-input-panel.vue'
import MindmapResult from './components/mindmap-result.vue'

interface MindmapInputPanelExpose { validate: () => Promise<{ valid: boolean }> | undefined }

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const tabIndex = ref(0)
const inputRef = ref<MindmapInputPanelExpose>() // 输入组件引用
const generatedContent = ref('') // 生成结果
const isGenerating = ref(false) // 生成状态
const streamController = ref<AbortController>() // 流式请求控制器
const formData = reactive<AiMindMapGenerateReq>({
  prompt: '',
}) // 生成表单数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 提交生成 */
async function handleSubmit() {
  if (isGenerating.value) {
    return
  }
  const result = await inputRef.value?.validate()
  if (!result?.valid) {
    return
  }
  generatedContent.value = ''
  isGenerating.value = true
  streamController.value = new AbortController()
  void generateMindMap({
    data: { ...formData },
    ctrl: streamController.value,
    onMessage: (res) => {
      const data = parseStreamData(res.data)
      if (data !== undefined) {
        generatedContent.value += data
      }
    },
    onError: (error) => {
      console.error('AI 思维导图异常', error)
      toast.error('思维导图生成失败')
      isGenerating.value = false
    },
    onClose: () => {
      isGenerating.value = false
      streamController.value = undefined
    },
  }).catch(() => undefined)
}

/** 停止生成 */
function stopStream() {
  streamController.value?.abort()
  streamController.value = undefined
  isGenerating.value = false
}

/** 新建导图 */
function handleReset() {
  formData.prompt = ''
  generatedContent.value = ''
}

/** 解析流式消息 */
function parseStreamData(raw: string) {
  try {
    const result = JSON.parse(raw)
    if (result.code !== 0) {
      toast.error(result.msg || result.message || '生成失败')
      stopStream()
      return undefined
    }
    return result.data
  } catch {
    return raw
  }
}

/** 卸载 */
onUnmounted(stopStream)
</script>
