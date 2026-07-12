<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 处理步骤 -->
    <view class="bg-white px-24rpx py-20rpx">
      <wd-steps :active="activeStep" align-center>
        <wd-step title="上传文档" />
        <wd-step title="文档分段" />
        <wd-step title="处理完成" />
      </wd-steps>
    </view>

    <scroll-view scroll-y class="min-h-0 flex-1">
      <!-- 第一步：上传文档 -->
      <view v-if="activeStep === 0" class="p-24rpx">
        <wd-cell-group border>
          <KnowledgeFormPicker
            v-model="formData.knowledgeId"
            label-width="230rpx"
            :disabled="!!props.knowledgeId"
          />
          <wd-cell title="上传文档" vertical>
            <yd-upload-file
              v-model="uploadUrls"
              directory="ai/knowledge"
              accept="file"
              :limit="5"
              :file-size="15"
              :file-type="supportedFileTypes"
              @uploaded="handleUploadSuccess"
            />
          </wd-cell>
        </wd-cell-group>
        <view v-if="formData.list.length" class="mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view
            v-for="file in formData.list"
            :key="file.url"
            class="mb-16rpx flex items-center gap-12rpx last:mb-0"
          >
            <wd-icon name="file" size="36rpx" color="#409eff" />
            <text class="min-w-0 flex-1 break-all text-26rpx text-[#333]">
              {{ file.name }}
            </text>
          </view>
        </view>
        <view class="mt-24rpx">
          <wd-button block type="primary" @click="handleUploadNext">
            下一步
          </wd-button>
        </view>
      </view>

      <!-- 第二步：文档分段 -->
      <view v-else-if="activeStep === 1" class="p-24rpx">
        <wd-cell-group border>
          <wd-cell v-if="props.id" title="文档名称">
            <wd-input v-model="currentFile.name" clearable placeholder="请输入文档名称" />
          </wd-cell>
          <wd-cell title="最大 Token 数">
            <wd-input-number v-model="formData.segmentMaxTokens" :min="1" :max="2048" />
          </wd-cell>
          <wd-cell v-if="formData.list.length > 1" title="预览文档" vertical>
            <wd-radio-group v-model="currentFileIndex" type="button" custom-class="flex flex-wrap gap-12rpx">
              <wd-radio
                v-for="(file, index) in formData.list"
                :key="file.url"
                :value="index"
              >
                {{ file.name }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
        </wd-cell-group>

        <view class="mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-20rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-28rpx text-[#333] font-semibold">
                {{ currentFile.name || '请选择文档' }}
              </view>
              <view v-if="currentFile.segments" class="mt-6rpx text-22rpx text-[#999]">
                共 {{ currentFile.segments.length }} 个分段
              </view>
            </view>
            <wd-button size="small" variant="plain" :loading="splitLoading" @click="handlePreview">
              预览分段
            </wd-button>
          </view>
          <view v-if="!currentFile.segments?.length" class="py-60rpx text-center text-26rpx text-[#999]">
            暂无预览内容
          </view>
          <view
            v-for="(segment, index) in currentFile.segments"
            :key="index"
            class="mb-20rpx rounded-12rpx bg-[#f8fafc] p-20rpx last:mb-0"
          >
            <view class="mb-10rpx text-22rpx text-[#999]">
              分段 {{ index + 1 }} · {{ segment.contentLength || 0 }} 字符 · {{ segment.tokens || 0 }} Token
            </view>
            <view class="whitespace-pre-wrap break-all text-26rpx text-[#333] leading-42rpx">
              {{ segment.content || '-' }}
            </view>
          </view>
        </view>

        <view class="mt-24rpx flex gap-20rpx">
          <wd-button v-if="!props.id" class="flex-1" variant="plain" @click="activeStep = 0">
            上一步
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSave">
            保存并处理
          </wd-button>
        </view>
      </view>

      <!-- 第三步：处理进度 -->
      <view v-else class="p-24rpx">
        <view
          v-for="file in formData.list"
          :key="file.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-center gap-12rpx">
            <wd-icon name="file" size="36rpx" color="#409eff" />
            <text class="min-w-0 flex-1 break-all text-26rpx text-[#333]">
              {{ file.name }}
            </text>
          </view>
          <wd-progress
            :percentage="file.progress || 0"
            :status="file.progress === 100 ? 'success' : undefined"
          />
          <view class="mt-12rpx text-22rpx text-[#999]">
            分段数量：{{ file.count ?? '-' }}，已向量化：{{ file.embeddingCount ?? '-' }}
          </view>
        </view>
        <wd-button block type="primary" :disabled="!allProcessComplete" @click="handleComplete">
          {{ allProcessComplete ? '完成' : '处理中...' }}
        </wd-button>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeDocument } from '@/api/ai/knowledge/document'
import type { KnowledgeSegment } from '@/api/ai/knowledge/segment'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  createKnowledgeDocumentList,
  getKnowledgeDocument,
  updateKnowledgeDocument,
} from '@/api/ai/knowledge/document'
import {
  getKnowledgeSegmentProcessList,
  splitContent,
} from '@/api/ai/knowledge/segment'
import { delay, navigateBackPlus } from '@/utils'
import { getFileNameFromUrl } from '@/utils/download'
import KnowledgeFormPicker from '../../components/knowledge-form-picker.vue'

interface DocumentFile {
  id?: number
  name: string
  url: string
  segments?: KnowledgeSegment[]
  count?: number
  embeddingCount?: number
  progress?: number
}

interface DocumentFormData {
  knowledgeId?: number
  segmentMaxTokens: number
  list: DocumentFile[]
}

const props = defineProps<{
  id?: number | any
  knowledgeId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑文档' : '新增文档')
const activeStep = ref(0) // 当前处理步骤
const uploadUrls = ref<string[]>([]) // 已上传文档地址
const currentFileIndex = ref(0) // 当前预览文档下标
const splitLoading = ref(false) // 分段预览状态
const formLoading = ref(false) // 保存处理状态
const pollingTimer = ref<ReturnType<typeof setTimeout>>() // 处理进度轮询定时器
let pollingStopped = true // 是否停止处理进度轮询
let pollingCount = 0 // 当前轮询次数
const maxPollingCount = 200 // 最长轮询约十分钟
const formData = ref<DocumentFormData>({
  knowledgeId: props.knowledgeId ? Number(props.knowledgeId) : undefined,
  segmentMaxTokens: 500,
  list: [],
}) // 文档处理数据
const supportedFileTypes = [ // 支持上传的文档类型
  'txt',
  'markdown',
  'mdx',
  'pdf',
  'html',
  'xlsx',
  'xls',
  'doc',
  'docx',
  'csv',
  'eml',
  'msg',
  'pptx',
  'xml',
  'epub',
  'ppt',
  'md',
  'htm',
]
const currentFile = computed(() => formData.value.list[currentFileIndex.value] || ({
  name: '',
  url: '',
} as DocumentFile))
const allProcessComplete = computed(() => formData.value.list.length > 0
  && formData.value.list.every(file => file.progress === 100))

/** 同步上传文档列表 */
watch(uploadUrls, (urls) => {
  const fileMap = new Map(formData.value.list.map(file => [file.url, file]))
  formData.value.list = urls.map(url => fileMap.get(url) || {
    name: getFileNameFromUrl(url) || '未命名文档',
    url,
  })
  if (currentFileIndex.value >= formData.value.list.length) {
    currentFileIndex.value = 0
  }
}, { deep: true })

/** 返回上一页 */
function handleBack() {
  const query = [
    props.knowledgeId ? `knowledgeId=${props.knowledgeId}` : '',
  ].filter(Boolean).join('&')
  navigateBackPlus(`/pages-ai/knowledge/document/index${query ? `?${query}` : ''}`)
}

/** 回填上传时的原始文档名称 */
async function handleUploadSuccess(url: string, name?: string) {
  if (!name) {
    return
  }
  await nextTick()
  const document = formData.value.list.find(item => item.url === url)
  if (document) {
    document.name = name
  }
}

/** 加载文档详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    const document: KnowledgeDocument = await getKnowledgeDocument(Number(props.id))
    formData.value = {
      knowledgeId: document.knowledgeId,
      segmentMaxTokens: document.segmentMaxTokens || 500,
      list: [{
        id: document.id,
        name: document.name || '未命名文档',
        url: document.url || '',
      }],
    }
    uploadUrls.value = document.url ? [document.url] : []
    activeStep.value = 1
  } finally {
    toast.close()
  }
}

/** 上传完成进入下一步 */
function handleUploadNext() {
  if (!formData.value.knowledgeId) {
    toast.warning('请选择知识库')
    return
  }
  if (!formData.value.list.length) {
    toast.warning('请至少上传一个文档')
    return
  }
  activeStep.value = 1
}

/** 预览当前文档分段 */
async function handlePreview() {
  if (!currentFile.value.url) {
    toast.warning('文档地址不存在')
    return
  }
  splitLoading.value = true
  try {
    currentFile.value.segments = await splitContent(
      currentFile.value.url,
      formData.value.segmentMaxTokens,
    )
  } finally {
    splitLoading.value = false
  }
}

/** 保存文档并开始处理 */
async function handleSave() {
  if (!currentFile.value.segments?.length) {
    toast.warning('请先预览分段内容')
    return
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateKnowledgeDocument({
        id: Number(props.id),
        name: currentFile.value.name,
        segmentMaxTokens: formData.value.segmentMaxTokens,
      })
    } else {
      const ids = await createKnowledgeDocumentList({
        knowledgeId: Number(formData.value.knowledgeId),
        segmentMaxTokens: formData.value.segmentMaxTokens,
        list: formData.value.list.map(file => ({
          name: file.name,
          url: file.url,
        })),
      })
      formData.value.list.forEach((file, index) => file.id = ids[index])
    }
    uni.$emit('ai:knowledge-document:reload')
    uni.$emit('ai:knowledge-document:detail-reload')
    if (props.id) {
      toast.success('修改成功')
      delay(handleBack)
      return
    }
    activeStep.value = 2
    startPolling()
  } finally {
    formLoading.value = false
  }
}

/** 开始轮询处理进度 */
function startPolling() {
  clearPolling()
  pollingStopped = false
  pollingCount = 0
  void getProcessList()
}

/** 查询文档处理进度 */
async function getProcessList() {
  const documentIds = formData.value.list.map(file => file.id).filter((id): id is number => !!id)
  if (!documentIds.length) {
    return
  }
  pollingCount += 1
  try {
    const processList = await getKnowledgeSegmentProcessList(documentIds)
    if (pollingStopped) {
      return
    }
    formData.value.list.forEach((file) => {
      const process = processList.find(item => item.documentId === file.id)
      if (!process) {
        return
      }
      file.count = process.count
      file.embeddingCount = process.embeddingCount
      file.progress = process.count > 0
        ? Math.min(100, Math.floor(process.embeddingCount / process.count * 100))
        : 0
    })
    if (!allProcessComplete.value) {
      if (pollingCount >= maxPollingCount) {
        toast.error('文档处理等待超时，请稍后查看处理进度')
        return
      }
      pollingTimer.value = setTimeout(() => void getProcessList(), 3000)
    }
  } catch {
    if (pollingStopped) {
      return
    }
    if (pollingCount >= maxPollingCount) {
      toast.error('文档处理进度查询失败，请稍后重试')
      return
    }
    pollingTimer.value = setTimeout(() => void getProcessList(), 5000)
  }
}

/** 清理处理进度轮询 */
function clearPolling() {
  pollingStopped = true
  if (pollingTimer.value) {
    clearTimeout(pollingTimer.value)
    pollingTimer.value = undefined
  }
}

/** 完成文档处理 */
function handleComplete() {
  if (!allProcessComplete.value) {
    return
  }
  toast.success('文档处理完成')
  handleBack()
}

/** 初始化 */
onMounted(() => {
  getDetail()
})

/** 卸载 */
onUnload(() => {
  clearPolling()
})
</script>
