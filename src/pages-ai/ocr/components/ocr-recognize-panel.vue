<template>
  <view class="p-24rpx">
    <view class="mb-20rpx">
      <view class="text-32rpx text-[#333] font-semibold">
        AI 图片识别
      </view>
      <view class="mt-6rpx text-24rpx text-[#999]">
        图片转文字：上传图片，识别后可直接复制
      </view>
    </view>

    <!-- 识别服务 -->
    <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
      <wd-cell
        title="识别服务"
        :value="selectedModel?.name || (modelLoaded ? '暂无可用的识别服务' : '加载中...')"
        is-link
        center
        @click="openModelPicker"
      />
    </view>
    <view v-if="modelLoaded && models.length === 0" class="px-8rpx pt-12rpx text-22rpx text-[#fa8c16] leading-34rpx">
      暂无可用的识别服务，请联系管理员配置
    </view>

    <!-- 原图 -->
    <view class="mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-16rpx flex items-center justify-between gap-16rpx">
        <view class="min-w-0 flex items-center gap-12rpx">
          <text class="shrink-0 text-28rpx text-[#333] font-semibold">原图</text>
          <text v-if="fileName" class="truncate text-22rpx text-[#999]">{{ fileName }}</text>
        </view>
        <wd-button v-if="imageSrc" size="small" variant="plain" :disabled="recognizing" @click="chooseImage">
          更换图片
        </wd-button>
      </view>
      <view
        v-if="!imageSrc"
        class="flex flex-col items-center justify-center gap-12rpx border-2rpx border-[#d9d9d9] rounded-12rpx border-dashed bg-[#fafafa] py-60rpx text-[#999]"
        @click="chooseImage"
      >
        <wd-icon name="camera" size="64rpx" color="#1677ff" />
        <text class="text-26rpx">点击拍照或从相册选择图片</text>
      </view>
      <view v-else class="flex justify-center overflow-hidden rounded-12rpx bg-[#fafafa]" @click="previewImage">
        <image :src="imageSrc" mode="widthFix" class="block w-full" />
      </view>
    </view>

    <!-- 识别 -->
    <view class="mt-24rpx">
      <wd-button block type="primary" :loading="recognizing" :disabled="!image || !modelId" @click="recognize">
        {{ recognizing ? '识别中...' : record || requestError ? '重新识别' : '开始识别' }}
      </wd-button>
      <view v-if="imageSrc && !image" class="mt-12rpx text-center text-22rpx text-[#999]">
        识别记录不含本地图片，请重新选择图片后再识别
      </view>
    </view>

    <!-- 识别结果 -->
    <view class="mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-16rpx flex flex-wrap items-center gap-12rpx">
        <text class="text-28rpx text-[#333] font-semibold">识别结果</text>
        <text v-if="record && phase === 'success'" class="text-22rpx text-[#999]">{{ resultMeta }}</text>
      </view>

      <!-- 空状态、待识别 -->
      <view v-if="phase === 'empty' || phase === 'ready'" class="py-40rpx text-center text-26rpx text-[#999]">
        {{ phase === 'empty' ? '上传图片后，选择识别服务开始识别' : '图片已就绪，点击「开始识别」' }}
      </view>
      <!-- 识别中 -->
      <view v-else-if="phase === 'recognizing'" class="flex flex-col items-center gap-16rpx py-40rpx text-26rpx text-[#999]">
        <wd-loading size="48rpx" />
        <text>正在识别，请稍候…</text>
      </view>
      <!-- 识别失败：失败原因按纯文本展示 -->
      <view v-else-if="phase === 'fail'" class="py-24rpx">
        <view class="text-center text-28rpx text-[#f5222d] font-semibold">
          识别失败
        </view>
        <view class="mt-12rpx whitespace-pre-wrap break-all rounded-8rpx bg-[#fff1f0] px-20rpx py-12rpx text-24rpx text-[#f5222d] leading-36rpx">
          {{ record?.errorMessage || requestError }}
        </view>
        <view class="mt-20rpx flex justify-center">
          <wd-button v-if="image" size="small" type="primary" :disabled="!modelId" @click="recognize">
            重试
          </wd-button>
          <wd-button v-else size="small" type="primary" @click="chooseImage">
            重新选择图片
          </wd-button>
        </view>
      </view>
      <!-- 识别成功：原文只读展示 -->
      <template v-else>
        <view v-if="originalText" class="min-h-320rpx whitespace-pre-wrap break-all text-28rpx text-[#333] leading-44rpx">
          <text user-select>{{ originalText }}</text>
        </view>
        <view v-else class="py-40rpx text-center text-26rpx text-[#999]">
          图片中没有识别到文字
        </view>
        <view class="mt-12rpx flex justify-between text-22rpx text-[#999]">
          <text>共 {{ originalText.length }} 字</text>
          <text>重新识别会新增一条记录</text>
        </view>
        <view class="mt-20rpx flex flex-wrap justify-end gap-16rpx">
          <wd-button size="small" type="primary" variant="plain" :disabled="!originalText" @click="handleCopy">
            复制
          </wd-button>
        </view>
      </template>
    </view>

    <!-- 识别服务选择 -->
    <wd-action-sheet
      v-model="modelPickerVisible"
      :actions="modelActions"
      title="选择识别服务"
      root-portal
      :z-index="30"
      @select="handleModelSelect"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Ocr, OcrModel } from '@/api/ai/ocr'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getOcrModelList, recognizeOcr } from '@/api/ai/ocr'
import { getDictLabel } from '@/hooks/useDict'
import { AiOcrStatusEnum, DICT_TYPE } from '@/utils/constants'
import { uploadFileFromPath } from '@/utils/uploadFile'

const toast = useToast()

// ========== 识别服务 ==========

const models = ref<OcrModel[]>([]) // 可用的识别服务：后端已按启用、密钥、平台过滤并排序
const modelLoaded = ref(false) // 识别服务是否已加载
const modelId = ref<number>() // 当前识别服务编号
const modelPickerVisible = ref(false) // 识别服务选择显示状态
const selectedModel = computed(() => models.value.find(item => item.id === modelId.value)) // 当前识别服务
const modelActions = computed(() => models.value.map(item => ({
  name: item.name,
  description: getDictLabel(DICT_TYPE.AI_PLATFORM, item.platform) || item.platform,
  color: item.id === modelId.value ? '#1677ff' : undefined,
  value: item.id,
}))) // 识别服务选项

/** 加载识别服务：未选择时默认选中第一个 */
async function getModelList() {
  try {
    models.value = await getOcrModelList()
    if (!models.value.some(item => item.id === modelId.value)) {
      modelId.value = models.value[0]?.id
    }
  } finally {
    modelLoaded.value = true
  }
}

// ========== 工作台状态 ==========

const image = ref<{ path: string, name: string }>() // 当前本地图片：只有本次选择的图片可以直接识别；切换图片、打开记录后，旧的识别结果不再覆盖
const fileUrl = ref<string>() // 当前图片上传到文件服务后的地址
const fileName = ref<string>() // 文件名
const record = ref<Ocr>() // 当前识别记录
const recognizing = ref(false) // 识别中
const requestError = ref<string>() // 请求失败（未生成识别记录）的提示

/** 打开识别服务选择：识别中不允许切换 */
function openModelPicker() {
  if (recognizing.value || models.value.length === 0) {
    return
  }
  modelPickerVisible.value = true
}

/** 选择识别服务 */
function handleModelSelect({ item }: { item: { value: number } }) {
  modelId.value = item.value
}

/** 预览图：本地图片优先，否则使用记录的图片地址 */
const imageSrc = computed(() => image.value?.path || record.value?.imageUrl)

/** 当前阶段 */
const phase = computed(() => {
  if (recognizing.value) {
    return 'recognizing'
  }
  if (record.value) {
    return record.value.status === AiOcrStatusEnum.SUCCESS ? 'success' : 'fail'
  }
  if (requestError.value) {
    return 'fail'
  }
  return imageSrc.value ? 'ready' : 'empty'
})

const originalText = computed(() => record.value?.originalText ?? '') // 识别出的原文
/** 结果说明：识别服务、耗时 */
const resultMeta = computed(() => {
  const current = record.value
  if (!current) {
    return ''
  }
  const duration = current.duration ? ` · ${(current.duration / 1000).toFixed(1)} 秒` : ''
  return `${current.modelName || ''}${duration}`
})
/** 当前记录编号 */
const currentId = computed(() => record.value?.id)

/** 重置结果区 */
function resetResult() {
  recognizing.value = false
  record.value = undefined
  requestError.value = undefined
}

// ========== 选择图片 ==========

/** 选择图片：拍照或相册 */
function chooseImage() {
  if (recognizing.value) {
    return
  }
  uni.chooseImage({
    count: 1,
    sizeType: ['original'],
    success: (res) => {
      const path = res.tempFilePaths[0]
      const file = (res.tempFiles as any[])[0] || {}
      // H5 的 blob 路径不含文件名，优先使用文件自带的名字
      selectImage(path, file.name || path.substring(path.lastIndexOf('/') + 1))
    },
  })
}

/** 切换图片：图片在识别时再上传 */
function selectImage(path: string, name: string) {
  resetResult()
  image.value = { path, name }
  fileUrl.value = undefined
  fileName.value = name
}

/** 预览大图 */
function previewImage() {
  if (imageSrc.value) {
    uni.previewImage({ urls: [imageSrc.value] })
  }
}

// ========== 识别 ==========

async function recognize() {
  if (!image.value || !modelId.value) {
    return
  }
  const current = image.value // 响应式代理：用于判断识别期间是否已切换图片或打开记录
  record.value = undefined
  requestError.value = undefined
  recognizing.value = true
  try {
    // 先上传：同一张图片重试时，复用已上传的地址
    if (!fileUrl.value) {
      const url = await uploadFileFromPath(current.path, undefined, undefined, current.name)
      if (image.value !== current) {
        return
      }
      fileUrl.value = url
    }
    const data = await recognizeOcr({ modelId: modelId.value, fileUrl: fileUrl.value })
    // 识别期间切换了图片或打开了记录，不覆盖当前内容
    if (image.value !== current) {
      return
    }
    record.value = data
  } catch {
    if (image.value === current) {
      requestError.value = '识别请求失败，请检查图片和识别服务后重试'
    }
  } finally {
    if (image.value === current) {
      recognizing.value = false
    }
  }
}

// ========== 复制 ==========

/** 复制识别出的原文 */
function handleCopy() {
  uni.setClipboardData({
    data: originalText.value,
    success: () => toast.success('复制成功'),
  })
}

// ========== 识别记录 ==========

/** 打开记录：没有本地图片，重新识别需要重新选择 */
function openRecord(item: Ocr) {
  if (item.id === record.value?.id) {
    return
  }
  resetResult()
  image.value = undefined
  fileUrl.value = undefined
  fileName.value = item.fileName
  record.value = item
}

/** 删除的是当前记录时，结果区回到待识别 */
function handleDeleted(id: number) {
  if (record.value?.id !== id) {
    return
  }
  resetResult()
  if (!image.value) {
    fileName.value = undefined
  }
}

/** 初始化 */
onMounted(() => {
  getModelList()
})

defineExpose({ currentId, openRecord, handleDeleted })
</script>
