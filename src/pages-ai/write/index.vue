<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="文章生成"
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
      <WriteResult v-model:content="writeResult" :writing="isWriting" />
      <WriteInputPanel
        ref="inputRef"
        :model-value="formData"
        :has-result="Boolean(writeResult)"
        :writing="isWriting"
        @submit="handleSubmit"
        @stop="stopStream"
        @reset="handleReset"
      />
    </view>

    <!-- 历史列表 -->
    <WriteHistoryList v-if="tabIndex === 1" />
  </view>
</template>

<script lang="ts" setup>
import type { AiWriteGenerateReq } from '@/api/ai/write'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnmounted, reactive, ref } from 'vue'
import { writeStream } from '@/api/ai/write'
import { navigateBackPlus } from '@/utils'
import { AiWriteDefaultOptions, AiWriteTypeEnum } from '@/utils/constants'
import WriteHistoryList from './components/write-history-list.vue'
import WriteInputPanel from './components/write-input-panel.vue'
import WriteResult from './components/write-result.vue'

interface WriteInputPanelExpose { validate: () => Promise<{ valid: boolean }> | undefined }

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const tabIndex = ref(0)
const inputRef = ref<WriteInputPanelExpose>() // 输入组件引用
const writeResult = ref('') // 写作结果
const isWriting = ref(false) // 写作生成状态
const streamController = ref<AbortController>() // 流式请求控制器
const formData = reactive<AiWriteGenerateReq>({
  type: AiWriteTypeEnum.WRITING,
  prompt: '',
  originalContent: '',
  ...AiWriteDefaultOptions,
}) // 写作表单数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 提交写作 */
async function handleSubmit() {
  if (isWriting.value) {
    return
  }
  const result = await inputRef.value?.validate()
  if (!result?.valid) {
    return
  }
  writeResult.value = ''
  isWriting.value = true
  streamController.value = new AbortController()
  void writeStream({
    data: { ...formData },
    ctrl: streamController.value,
    onMessage: (res) => {
      const data = parseStreamData(res.data)
      if (data !== undefined) {
        writeResult.value += data
      }
    },
    onError: (error) => {
      console.error('AI 写作异常', error)
      toast.error('写作生成失败')
      isWriting.value = false
    },
    onClose: () => {
      isWriting.value = false
      streamController.value = undefined
    },
  }).catch(() => undefined)
}

/** 停止生成 */
function stopStream() {
  streamController.value?.abort()
  streamController.value = undefined
  isWriting.value = false
}

/** 重置表单 */
function handleReset() {
  Object.assign(formData, {
    type: AiWriteTypeEnum.WRITING,
    prompt: '',
    originalContent: '',
    ...AiWriteDefaultOptions,
  })
  writeResult.value = ''
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
