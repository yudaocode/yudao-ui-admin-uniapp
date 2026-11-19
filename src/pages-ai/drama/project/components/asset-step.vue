<template>
  <view class="pb-160rpx">
    <!-- 绘画模型与补齐出图 -->
    <view class="bg-white">
      <wd-form :model="imageForm">
        <wd-cell-group border>
          <yd-form-picker
            v-model="imageForm.modelId"
            label="绘画模型"
            label-width="180rpx"
            placeholder="请选择绘画模型"
            :columns="imageModels"
            label-key="name"
            value-key="id"
            filterable
          />
        </wd-cell-group>
      </wd-form>
      <view class="flex items-center justify-between gap-12rpx p-24rpx">
        <text class="min-w-0 flex-1 text-22rpx text-[#999] leading-34rpx">
          已出图：角色形象 {{ readiness.appearance }}，场景 {{ readiness.location }}，道具 {{ readiness.prop }}
        </text>
        <wd-button
          size="small"
          variant="plain"
          :disabled="!imageForm.modelId"
          :loading="generatingMissing"
          @click="handleGenerateMissing"
        >
          一键补齐图片
        </wd-button>
      </view>
    </view>

    <!-- 资产分类 -->
    <view class="mt-16rpx bg-white p-24rpx">
      <wd-segmented v-model:value="assetTab" :options="ASSET_TABS" />
    </view>

    <!-- 角色 -->
    <view v-if="assetTab === ASSET_TABS[0]" class="p-24rpx">
      <wd-button block variant="plain" @click="characterPopupRef?.open()">
        新增角色（{{ detail.characters.length }}）
      </wd-button>
      <view v-if="!detail.characters.length" class="py-60rpx text-center text-26rpx text-[#999]">
        暂无角色，可在剧本步骤「分析资产」自动提取
      </view>
      <view v-for="character in detail.characters" :key="character.id" class="mt-16rpx rounded-12rpx bg-white p-20rpx shadow-sm">
        <view class="mb-8rpx flex items-center justify-between gap-12rpx">
          <text class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">{{ character.name }}</text>
          <view class="flex shrink-0 items-center">
            <wd-button size="small" variant="text" type="primary" @click="characterPopupRef?.open(character.id)">
              详情
            </wd-button>
            <wd-button size="small" variant="text" type="danger" @click="handleDeleteCharacter(character.id)">
              删除
            </wd-button>
          </view>
        </view>
        <view class="line-clamp-2 mb-12rpx text-24rpx text-[#999]">
          {{ character.description || '暂无设定' }}
        </view>
        <view class="flex flex-wrap gap-16rpx">
          <view v-for="appearance in character.appearances" :key="appearance.id" class="w-160rpx text-center">
            <AssetImage
              :url="getSelectedImageUrl(appearance.imageUrls, appearance.selectedIndex)"
              :status="appearance.status"
              :error-message="appearance.errorMessage"
              :preview-urls="appearance.imageUrls"
            />
            <view class="mt-4rpx text-22rpx text-[#666]">
              形象 {{ appearance.appearanceIndex }}
            </view>
            <view class="flex items-center justify-center">
              <wd-button
                size="mini"
                variant="text"
                type="primary"
                :disabled="!imageForm.modelId || isAiDramaRunning(appearance.status)"
                @click="handleGenerate(AiDramaTaskTypeEnum.APPEARANCE, appearance.id)"
              >
                {{ appearance.imageUrls?.length ? '重新出图' : '出图' }}
              </wd-button>
              <wd-button
                v-if="appearance.previousImageUrls?.length"
                size="mini"
                variant="text"
                type="primary"
                :disabled="isAiDramaRunning(appearance.status)"
                @click="handleUndo(AiDramaTaskTypeEnum.APPEARANCE, appearance.id)"
              >
                撤销
              </wd-button>
            </view>
          </view>
        </view>
        <view class="mt-12rpx flex items-center gap-12rpx text-24rpx">
          <text class="text-[#999]">样音</text>
          <AudioPlayer v-if="getSelectedAudio(character)" :url="getSelectedAudio(character)!" />
          <text v-else class="text-[#999]">未选用</text>
        </view>
      </view>
    </view>

    <!-- 场景 -->
    <view v-else-if="assetTab === ASSET_TABS[1]" class="p-24rpx">
      <wd-button block variant="plain" @click="locationPopupRef?.open()">
        新增场景（{{ detail.locations.length }}）
      </wd-button>
      <view v-if="!detail.locations.length" class="py-60rpx text-center text-26rpx text-[#999]">
        暂无场景
      </view>
      <view class="mt-16rpx flex flex-wrap gap-16rpx">
        <view v-for="location in detail.locations" :key="location.id" class="w-[calc(50%-8rpx)] rounded-12rpx bg-white p-16rpx shadow-sm">
          <AssetImage
            :url="getSelectedImageUrl(location.imageUrls, location.selectedIndex)"
            :status="location.status"
            :error-message="location.errorMessage"
            :preview-urls="location.imageUrls"
            size="296rpx"
          />
          <view class="mt-8rpx truncate text-28rpx text-[#333] font-semibold">
            {{ location.name }}
          </view>
          <view class="mt-4rpx flex flex-wrap">
            <wd-button
              size="mini"
              variant="text"
              type="primary"
              :disabled="!imageForm.modelId || isAiDramaRunning(location.status)"
              @click="handleGenerate(AiDramaTaskTypeEnum.LOCATION, location.id)"
            >
              {{ location.imageUrls?.length ? '重新出图' : '出图' }}
            </wd-button>
            <wd-button
              v-if="location.previousImageUrls?.length"
              size="mini"
              variant="text"
              type="primary"
              :disabled="isAiDramaRunning(location.status)"
              @click="handleUndo(AiDramaTaskTypeEnum.LOCATION, location.id)"
            >
              撤销
            </wd-button>
            <wd-button size="mini" variant="text" type="primary" @click="locationPopupRef?.open(location)">
              编辑
            </wd-button>
            <wd-button size="mini" variant="text" type="danger" @click="handleDeleteLocation(location.id)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </view>

    <!-- 道具 -->
    <view v-else class="p-24rpx">
      <wd-button block variant="plain" @click="propPopupRef?.open()">
        新增道具（{{ propList.length }}）
      </wd-button>
      <view v-if="!propList.length" class="py-60rpx text-center text-26rpx text-[#999]">
        暂无道具
      </view>
      <view class="mt-16rpx flex flex-wrap gap-16rpx">
        <view v-for="asset in propList" :key="asset.id" class="w-[calc(50%-8rpx)] rounded-12rpx bg-white p-16rpx shadow-sm">
          <AssetImage
            :url="asset.imageUrl"
            :status="asset.status"
            :error-message="asset.errorMessage"
            size="296rpx"
          />
          <view class="mt-8rpx truncate text-28rpx text-[#333] font-semibold">
            {{ asset.title }}
          </view>
          <view class="truncate text-22rpx text-[#999]">
            镜头：{{ asset.referenceImages?.shotNumbers?.join('、') || '未关联' }}
          </view>
          <view class="mt-4rpx flex flex-wrap">
            <wd-button
              size="mini"
              variant="text"
              type="primary"
              :disabled="!imageForm.modelId || isAiDramaRunning(asset.status)"
              @click="handleGenerate(AiDramaTaskTypeEnum.VISUAL_ASSET, asset.id)"
            >
              {{ asset.imageUrl ? '重新出图' : '出图' }}
            </wd-button>
            <wd-button
              v-if="hasArchive(asset.id)"
              size="mini"
              variant="text"
              type="primary"
              :disabled="isAiDramaRunning(asset.status)"
              @click="handleUndo(AiDramaTaskTypeEnum.VISUAL_ASSET, asset.id)"
            >
              撤销
            </wd-button>
            <wd-button size="mini" variant="text" type="primary" @click="propPopupRef?.open(asset)">
              编辑
            </wd-button>
            <wd-button size="mini" variant="text" type="danger" @click="handleDeleteProp(asset.id)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </view>

    <!-- 角色、场景、道具表单 -->
    <CharacterFormPopup
      ref="characterPopupRef"
      :project-id="detail.project.id"
      :characters="detail.characters"
      :image-model-id="imageForm.modelId"
      @refresh="emit('refresh')"
    />
    <LocationFormPopup
      ref="locationPopupRef"
      :project-id="detail.project.id"
      :locations="detail.locations"
      @success="emit('refresh')"
    />
    <PropFormPopup
      ref="propPopupRef"
      :project-id="detail.project.id"
      :scene-nos="sceneNos"
      @success="emit('refresh')"
    />

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block @click="emit('next', AiDramaStepEnum.STORYBOARD)">
        下一步：分镜与成片
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DramaCharacter } from '@/api/ai/drama/asset'
import type { DramaProjectDetail } from '@/api/ai/drama/project'
import type { AiModel } from '@/api/ai/model/model'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  deleteDramaCharacter,
  deleteDramaLocation,
  deleteDramaVisualAsset,
  generateDramaAppearanceImage,
  generateDramaLocationImage,
  generateDramaMissingImages,
  generateDramaVisualAssetImage,
  undoDramaAppearanceImage,
  undoDramaLocationImage,
  undoDramaVisualAssetImage,
} from '@/api/ai/drama/asset'
import { getModelSimpleList } from '@/api/ai/model/model'
import { AiDramaStepEnum, AiDramaTaskTypeEnum, AiDramaVisualAssetKindEnum, AiModelTypeEnum, AiPlatformEnum, isAiDramaRunning } from '@/utils/constants'
import AssetImage from './asset/asset-image.vue'
import AudioPlayer from './asset/audio-player.vue'
import CharacterFormPopup from './asset/character-form-popup.vue'
import LocationFormPopup from './asset/location-form-popup.vue'
import PropFormPopup from './asset/prop-form-popup.vue'

const props = defineProps<{
  detail: DramaProjectDetail // 项目详情
}>()

const emit = defineEmits<{
  refresh: []
  next: [step: number]
}>()

const ASSET_TABS = ['角色', '场景', '道具'] // 资产分类

const toast = useToast()
const dialog = useDialog()
const assetTab = ref(ASSET_TABS[0]) // 当前资产分类
const characterPopupRef = ref<InstanceType<typeof CharacterFormPopup>>() // 角色表单引用
const locationPopupRef = ref<InstanceType<typeof LocationFormPopup>>() // 场景表单引用
const propPopupRef = ref<InstanceType<typeof PropFormPopup>>() // 道具表单引用
const imageModels = ref<AiModel[]>([]) // 绘画模型：不含 Midjourney
const imageForm = reactive({ modelId: undefined as number | undefined }) // 选择的绘画模型
const generatingMissing = ref(false) // 一键补齐状态

const propList = computed(() => // 当前的道具：不含关键帧、历史版本
  props.detail.visualAssets.filter(item => item.kind === AiDramaVisualAssetKindEnum.PROP && !item.parentId),
)
const sceneNos = computed(() => // 当前分镜的镜头序号：道具关联镜头时选择
  props.detail.storyboards
    .filter(item => item.scriptId === props.detail.script?.id && item.sceneNo)
    .map(item => item.sceneNo!),
)
const readiness = computed(() => { // 已出图的数量
  const appearances = props.detail.characters.flatMap(item => item.appearances)
  const count = (list: { imageUrls?: string[], imageUrl?: string }[]) => `${list.filter(item => item.imageUrls?.length || item.imageUrl).length}/${list.length}`
  return {
    appearance: count(appearances),
    location: count(props.detail.locations),
    prop: count(propList.value),
  }
})

/** 获得选用的候选图：未选用时为空 */
function getSelectedImageUrl(imageUrls?: string[], selectedIndex?: number) {
  if (!imageUrls?.length || selectedIndex === undefined || selectedIndex === null) {
    return undefined
  }
  return imageUrls[selectedIndex]
}

/** 获得角色选用的样音地址 */
function getSelectedAudio(character: DramaCharacter) {
  return character.audios.find(item => item.id === character.sampleAudioId)?.fileUrl
}

/** 道具是否有历史版本：可撤销 */
function hasArchive(id: number) {
  return props.detail.visualAssets.some(item => item.parentId === id)
}

/** 出图：角色形象、场景、道具；提交后由轮询刷新结果 */
async function handleGenerate(type: number, id: number) {
  const data = { id, modelId: imageForm.modelId! }
  if (type === AiDramaTaskTypeEnum.APPEARANCE) {
    await generateDramaAppearanceImage(data)
  } else if (type === AiDramaTaskTypeEnum.LOCATION) {
    await generateDramaLocationImage(data)
  } else {
    await generateDramaVisualAssetImage(data)
  }
  toast.success('已提交出图')
  emit('refresh')
}

/** 撤销上次出图：恢复为上一版图片 */
async function handleUndo(type: number, id: number) {
  try {
    await dialog.confirm({ title: '提示', msg: '撤销后恢复为上一版图片，是否继续？' })
  } catch {
    return
  }
  if (type === AiDramaTaskTypeEnum.APPEARANCE) {
    await undoDramaAppearanceImage(id)
  } else if (type === AiDramaTaskTypeEnum.LOCATION) {
    await undoDramaLocationImage(id)
  } else {
    await undoDramaVisualAssetImage(id)
  }
  toast.success('已撤销')
  emit('refresh')
}

/** 一键补齐图片 */
async function handleGenerateMissing() {
  generatingMissing.value = true
  try {
    const count = await generateDramaMissingImages({ id: props.detail.project.id, modelId: imageForm.modelId! })
    toast.success(count ? `已提交 ${count} 个出图任务` : '没有需要补齐的图片')
    emit('refresh')
  } finally {
    generatingMissing.value = false
  }
}

/** 删除角色 */
async function handleDeleteCharacter(id: number) {
  try {
    await dialog.confirm({ title: '提示', msg: '删除角色会一并删除其形象与样音，是否继续？' })
  } catch {
    return
  }
  await deleteDramaCharacter(id)
  toast.success('删除成功')
  emit('refresh')
}

/** 删除场景 */
async function handleDeleteLocation(id: number) {
  try {
    await dialog.confirm({ title: '提示', msg: '确认删除该场景吗？' })
  } catch {
    return
  }
  await deleteDramaLocation(id)
  toast.success('删除成功')
  emit('refresh')
}

/** 删除道具 */
async function handleDeleteProp(id: number) {
  try {
    await dialog.confirm({ title: '提示', msg: '确认删除该道具吗？' })
  } catch {
    return
  }
  await deleteDramaVisualAsset(id)
  toast.success('删除成功')
  emit('refresh')
}

/** 初始化 */
onMounted(async () => {
  // Midjourney 不支持，不展示
  const list = await getModelSimpleList(AiModelTypeEnum.IMAGE)
  imageModels.value = list.filter(item => item.platform !== AiPlatformEnum.MIDJOURNEY)
  imageForm.modelId = imageModels.value[0]?.id
})
</script>
