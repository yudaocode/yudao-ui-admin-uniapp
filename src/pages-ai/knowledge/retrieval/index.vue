<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="召回测试"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 表单区域 -->
        <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
          <wd-cell-group border>
            <KnowledgeFormPicker v-model="retrievalForm.knowledgeId" label-width="210rpx" />
            <wd-cell title="查询文本">
              <wd-textarea
                v-model="retrievalForm.content"
                placeholder="请输入召回测试文本"
                :maxlength="1000"
                show-word-limit
                clearable
              />
            </wd-cell>
            <wd-cell title="TopK">
              <wd-input-number v-model="retrievalForm.topK" :min="1" :max="20" />
            </wd-cell>
            <wd-cell title="相似度">
              <wd-input-number v-model="retrievalForm.similarityThreshold" :min="0" :max="1" :step="0.01" />
            </wd-cell>
          </wd-cell-group>
          <view class="mt-24rpx">
            <wd-button block type="primary" :loading="retrievalLoading" @click="handleRetrieval">
              开始测试
            </wd-button>
          </view>
        </view>

        <!-- 召回结果 -->
        <view class="mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            召回结果
          </view>
          <view v-if="retrievalSegments.length === 0" class="py-60rpx text-center text-26rpx text-[#999]">
            暂无召回结果
          </view>
          <view
            v-for="segment in retrievalSegments"
            :key="segment.id"
            class="mb-20rpx rounded-12rpx bg-[#f8fafc] p-20rpx"
          >
            <view class="mb-12rpx flex items-center justify-between text-24rpx text-[#999]">
              <text>分段 {{ segment.id }} · {{ segment.tokens ?? 0 }} Token · {{ segment.contentLength ?? 0 }} 字符</text>
              <text v-if="segment.score !== undefined">score: {{ segment.score }}</text>
            </view>
            <view class="whitespace-pre-wrap text-26rpx text-[#333] leading-42rpx">
              {{ segment.content || '-' }}
            </view>
            <view class="mt-12rpx text-24rpx text-[#999]">
              {{ segment.documentName || '未知文档' }}
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeSegmentVO } from '@/api/ai/knowledge/segment'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, reactive, ref } from 'vue'
import { searchKnowledgeSegment } from '@/api/ai/knowledge/segment'
import { navigateBackPlus } from '@/utils'
import KnowledgeFormPicker from '../components/knowledge-form-picker.vue'

const props = defineProps<{
  knowledgeId?: number | any
  knowledgeName?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const retrievalLoading = ref(false) // 召回测试状态
const retrievalSegments = ref<(KnowledgeSegmentVO & { score?: number })[]>([]) // 召回结果（含相似度 score）
const retrievalForm = reactive({
  knowledgeId: undefined as number | undefined,
  content: '',
  topK: 10,
  similarityThreshold: 0.5,
}) // 召回测试表单

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/knowledge/index')
}

/** 执行召回测试 */
async function handleRetrieval() {
  if (!retrievalForm.knowledgeId) {
    toast.warning('请选择知识库')
    return
  }
  if (!retrievalForm.content) {
    toast.warning('请输入查询文本')
    return
  }
  retrievalLoading.value = true
  retrievalSegments.value = []
  try {
    retrievalSegments.value = await searchKnowledgeSegment({
      knowledgeId: retrievalForm.knowledgeId,
      content: retrievalForm.content,
      topK: retrievalForm.topK,
      similarityThreshold: retrievalForm.similarityThreshold,
    }) || []
  } finally {
    retrievalLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  // 知识库编号通过 query 注入时预填，便于从知识库列表直接进入召回测试
  if (props.knowledgeId) {
    retrievalForm.knowledgeId = Number(props.knowledgeId)
  }
})
</script>
