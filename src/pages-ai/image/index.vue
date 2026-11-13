<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="AI 图片生成"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink>
        <wd-tab title="创作" />
        <wd-tab title="我的作品" />
        <wd-tab title="公开画廊" />
      </wd-tabs>
    </view>

    <!-- 创作：切换 Tab 时保留表单内容；参数区单独滚动，生成按钮在下方独占一行 -->
    <view v-show="tabIndex === 0" class="min-h-0 flex flex-1 flex-col">
      <scroll-view scroll-y class="min-h-0 flex-1">
        <view class="p-24rpx">
          <!-- 模型 -->
          <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
            <wd-cell-group border>
              <ImageModelFormPicker v-model="modelId" :models="models" />
            </wd-cell-group>
            <view v-if="modelsLoadFailed" class="px-32rpx pb-16rpx text-22rpx text-[#f5222d]" @click="loadModels">
              模型列表加载失败，点击重试
            </view>
            <view v-else-if="modelsLoaded && models.length === 0" class="px-32rpx pb-16rpx text-22rpx text-[#fa8c16] leading-34rpx">
              没有可用的绘图模型，请先在「模型配置」启用绘图模型
            </view>
          </view>

          <!-- 创作表单：按模型能力显示参数 -->
          <view v-if="selectedModel && isMidjourney" class="mt-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <ImageMidjourneyForm ref="midjourneyFormRef" :model="selectedModel" />
          </view>
          <view v-else-if="selectedModel && selectedCapability" class="mt-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <ImageDrawForm
              ref="drawFormRef"
              :key="selectedModel.id"
              :model="selectedModel"
              :capability="selectedCapability"
            />
          </view>
        </view>
      </scroll-view>

      <!-- 底部生成按钮 -->
      <view class="shrink-0 bg-white px-24rpx pb-[calc(16rpx+env(safe-area-inset-bottom))] pt-16rpx">
        <wd-button block type="primary" :loading="submitting" :disabled="!selectedModel" @click="handleSubmit">
          {{ submitting ? '提交中...' : '生成图片' }}
        </wd-button>
      </view>
    </view>

    <!-- 我的作品 / 公开画廊 -->
    <ImageList
      v-if="tabIndex !== 0"
      :key="tabIndex"
      :scope="tabIndex === 2 ? 'public' : 'mine'"
      @detail="handleDetail"
      @regenerate="handleRegenerate"
    />

    <!-- 详情 -->
    <ImageDetailPopup ref="detailRef" />
  </view>
</template>

<script lang="ts" setup>
import type { AiImage } from '@/api/ai/image'
import type { AiModel } from '@/api/ai/model/model'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, ref } from 'vue'
import { getModelSimpleList } from '@/api/ai/model/model'
import { navigateBackPlus } from '@/utils'
import { AiModelTypeEnum, AiPlatformEnum, getImageModelCapability, getImageModelDisabledReason, isImagePlatform } from '@/utils/constants'
import ImageDetailPopup from './components/image-detail-popup.vue'
import ImageDrawForm from './components/image-draw-form.vue'
import ImageList from './components/image-list.vue'
import ImageMidjourneyForm from './components/image-midjourney-form.vue'
import ImageModelFormPicker from './components/image-model-form-picker.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const tabIndex = ref(0) // 当前 Tab：0 创作、1 我的作品、2 公开画廊
const models = ref<AiModel[]>([]) // 绘图模型列表
const modelsLoaded = ref(false) // 模型列表是否已加载
const modelsLoadFailed = ref(false) // 模型列表加载失败：提示重试
const modelId = ref<number>() // 选中的模型编号
const submitting = ref(false) // 提交状态
const drawFormRef = ref<InstanceType<typeof ImageDrawForm>>() // 通用模型、Seedream 表单引用
const midjourneyFormRef = ref<InstanceType<typeof ImageMidjourneyForm>>() // Midjourney 表单引用
const detailRef = ref<InstanceType<typeof ImageDetailPopup>>() // 详情弹窗引用
const selectedModel = computed(() => models.value.find(item => item.id === modelId.value)) // 选中的模型
const isMidjourney = computed(() => selectedModel.value?.platform === AiPlatformEnum.MIDJOURNEY) // 是否 Midjourney
const selectedCapability = computed(() => getImageModelCapability(selectedModel.value?.platform, selectedModel.value?.model)) // 选中模型的能力

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载绘图模型：默认选中第一个可用模型 */
async function loadModels() {
  modelsLoadFailed.value = false
  try {
    const list = await getModelSimpleList(AiModelTypeEnum.IMAGE)
    models.value = list.filter(item => isImagePlatform(item.platform))
    if (!models.value.some(item => item.id === modelId.value)) {
      modelId.value = models.value.find(item => !getImageModelDisabledReason(item.platform, item.model))?.id
    }
  } catch {
    modelsLoadFailed.value = true
  } finally {
    modelsLoaded.value = true
  }
}

/** 提交：成功后切到我的作品，列表重新挂载后从第 1 页加载 */
async function handleSubmit() {
  const formRef = isMidjourney.value ? midjourneyFormRef.value : drawFormRef.value
  if (!formRef || submitting.value) {
    return
  }
  submitting.value = true
  try {
    if (await formRef.submit()) {
      toast.success('已提交，生成结果见我的作品')
      tabIndex.value = 1
    }
  } finally {
    submitting.value = false
  }
}

/** 详情 */
function handleDetail(item: AiImage) {
  detailRef.value?.open(item.id, tabIndex.value === 2 ? 'public' : 'mine')
}

/** 重新生成：切换到原模型，回填参数 */
async function handleRegenerate(image: AiImage) {
  const model = models.value.find(item => item.id === image.modelId)
    || models.value.find(item => item.platform === image.platform && item.model === image.model)
  if (!model || getImageModelDisabledReason(model.platform, model.model)) {
    toast.warning('原模型已不可用，请重新选择模型')
    return
  }
  modelId.value = model.id
  tabIndex.value = 0
  await nextTick()
  if (isMidjourney.value) {
    midjourneyFormRef.value?.setValues(image)
  } else {
    drawFormRef.value?.setValues(image)
  }
}

/** 初始化 */
onMounted(() => {
  loadModels()
})
</script>
