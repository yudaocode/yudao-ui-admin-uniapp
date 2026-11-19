<template>
  <!-- 镜头内容 -->
  <view class="mt-16rpx bg-white pt-24rpx">
    <text class="px-24rpx text-30rpx text-[#333] font-semibold">镜头内容</text>
    <wd-form :model="formData">
      <wd-cell-group border>
        <wd-form-item title="镜头序号" title-width="180rpx" center>
          <wd-input-number v-model="formData.sceneNo" :min="1" />
        </wd-form-item>
        <wd-form-item title="镜头标题" title-width="180rpx">
          <wd-input v-model="formData.title" :maxlength="128" clearable placeholder="请输入镜头标题" />
        </wd-form-item>
        <yd-form-picker
          v-model="formData.sceneType"
          label="场景类型"
          label-width="180rpx"
          placeholder="请选择"
          :dict-type="DICT_TYPE.AI_DRAMA_SCENE_TYPE"
          clearable
        />
        <wd-form-item title="景别" title-width="180rpx">
          <wd-input v-model="formData.shotType" :maxlength="32" clearable placeholder="例如：中景" />
        </wd-form-item>
        <wd-form-item title="运镜" title-width="180rpx">
          <wd-input v-model="formData.cameraMove" :maxlength="64" clearable placeholder="例如：缓慢推进" />
        </wd-form-item>
        <wd-form-item title="时长（秒）" title-width="180rpx" center>
          <wd-input-number v-model="formData.duration" :min="1" :max="60" />
        </wd-form-item>
        <wd-form-item title="画面描述" title-width="180rpx" layout="vertical">
          <wd-textarea v-model="formData.sceneText" :maxlength="2000" show-word-limit auto-height placeholder="请输入画面描述" />
        </wd-form-item>
      </wd-cell-group>
    </wd-form>
  </view>

  <!-- 台词 -->
  <view class="mt-16rpx bg-white p-24rpx">
    <text class="text-30rpx text-[#333] font-semibold">台词</text>
    <view v-for="(dialogue, index) in formData.dialogues" :key="index" class="mt-16rpx rounded-12rpx bg-[#f8f8f8] p-16rpx">
      <wd-form :model="dialogue">
        <wd-cell-group border>
          <yd-form-picker
            v-model="dialogue.characterId"
            label="发言人"
            label-width="160rpx"
            placeholder="旁白"
            :columns="characterColumns"
            clearable
          />
          <wd-form-item title="台词" title-width="160rpx">
            <wd-input v-model="dialogue.line" clearable placeholder="请输入台词" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-8rpx flex justify-end">
        <wd-button size="small" type="danger" variant="plain" @click="formData.dialogues.splice(index, 1)">
          删除
        </wd-button>
      </view>
    </view>
    <view class="mt-16rpx">
      <wd-button size="small" variant="plain" @click="formData.dialogues.push({ line: '' })">
        添加台词
      </wd-button>
    </view>
  </view>

  <!-- 表演指导 -->
  <view class="mt-16rpx bg-white p-24rpx">
    <text class="text-30rpx text-[#333] font-semibold">表演指导</text>
    <view v-for="(note, index) in formData.actingNotes" :key="index" class="mt-16rpx rounded-12rpx bg-[#f8f8f8] p-16rpx">
      <wd-form :model="note">
        <wd-cell-group border>
          <wd-form-item title="角色" title-width="160rpx">
            <wd-input v-model="note.name" clearable placeholder="请输入角色名" />
          </wd-form-item>
          <wd-form-item title="表演指令" title-width="160rpx" layout="vertical">
            <wd-textarea v-model="note.acting" auto-height placeholder="请输入表演指令" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-8rpx flex justify-end">
        <wd-button size="small" type="danger" variant="plain" @click="formData.actingNotes.splice(index, 1)">
          删除
        </wd-button>
      </view>
    </view>
    <view class="mt-16rpx">
      <wd-button size="small" variant="plain" @click="formData.actingNotes.push({ name: '', acting: '' })">
        添加表演指导
      </wd-button>
    </view>
  </view>

  <!-- 提示词 -->
  <view class="mt-16rpx bg-white pt-24rpx">
    <text class="px-24rpx text-30rpx text-[#333] font-semibold">提示词</text>
    <wd-form :model="formData">
      <wd-cell-group border>
        <wd-form-item title="关键帧提示词" title-width="180rpx" layout="vertical">
          <wd-textarea v-model="formData.imagePrompt" :maxlength="2000" auto-height placeholder="为空时使用画面描述" />
        </wd-form-item>
        <wd-form-item title="视频提示词" title-width="180rpx" layout="vertical">
          <wd-textarea v-model="formData.videoPrompt" :maxlength="2000" auto-height placeholder="为空时使用画面描述" />
        </wd-form-item>
      </wd-cell-group>
    </wd-form>
  </view>

  <!-- 参考素材 -->
  <view class="mt-16rpx bg-white pt-24rpx">
    <text class="px-24rpx text-30rpx text-[#333] font-semibold">参考素材</text>
    <wd-form :model="formData">
      <wd-cell-group border>
        <yd-form-picker
          v-model="formData.locationId"
          label="场景"
          label-width="180rpx"
          placeholder="选择场景"
          :columns="locationColumns"
          clearable
        />
      </wd-cell-group>
    </wd-form>

    <!-- 出场角色：形象与站位 -->
    <view class="px-24rpx pb-8rpx pt-24rpx">
      <text class="text-28rpx text-[#333]">出场角色</text>
      <view v-for="(item, index) in formData.characters" :key="index" class="mt-16rpx rounded-12rpx bg-[#f8f8f8] p-16rpx">
        <wd-form :model="item">
          <wd-cell-group border>
            <yd-form-picker
              v-model="item.appearanceId"
              label="角色形象"
              label-width="160rpx"
              placeholder="选择角色形象"
              :columns="appearanceColumns"
              filterable
            />
            <yd-form-picker
              v-if="slots.length"
              v-model="item.slot"
              label="站位"
              label-width="160rpx"
              placeholder="选择站位"
              :columns="getSlotColumns(item.slot)"
              clearable
            />
            <wd-form-item v-else title="站位" title-width="160rpx">
              <wd-input v-model="item.slot" clearable placeholder="可选，所选场景没有可站位置时自行填写" />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="mt-8rpx flex justify-end">
          <wd-button size="small" type="danger" variant="plain" @click="formData.characters.splice(index, 1)">
            删除
          </wd-button>
        </view>
      </view>
      <view class="mt-16rpx">
        <wd-button size="small" variant="plain" @click="formData.characters.push({})">
          添加角色
        </wd-button>
      </view>
    </view>

    <wd-form :model="formData">
      <wd-cell-group border>
        <!-- 道具：默认按道具关联的镜头自动选择 -->
        <wd-form-item title="道具" title-width="180rpx" center>
          <view class="flex items-center justify-end gap-12rpx">
            <text class="text-24rpx text-[#666]">按道具关联的镜头自动选择</text>
            <wd-switch v-model="formData.propsAuto" />
          </view>
        </wd-form-item>
        <yd-form-picker
          v-if="!formData.propsAuto"
          v-model="formData.visualAssetIds"
          label="指定道具"
          label-width="180rpx"
          placeholder="不选表示没有道具"
          :columns="propColumns"
          type="checkbox"
          clearable
        />
        <yd-form-picker
          v-model="formData.referenceVideoUrls"
          label="动作参考视频"
          label-width="180rpx"
          placeholder="从动作参考中选择"
          :columns="motionColumns"
          type="checkbox"
          clearable
        />
        <wd-form-item title="素材图片" title-width="180rpx" layout="vertical">
          <yd-upload-imgs v-model="formData.materialUrls" :limit="9" directory="ai/drama" />
        </wd-form-item>
        <wd-form-item title="手动起始帧" title-width="180rpx" layout="vertical">
          <yd-upload-img v-model="formData.manualStartFrameUrl" :file-size="10" directory="ai/drama" />
          <view class="mt-8rpx text-22rpx text-[#999]">
            使用起始帧时，优先使用手动起始帧，否则使用关键帧
          </view>
        </wd-form-item>
      </wd-cell-group>
    </wd-form>
  </view>

  <!-- 生成设置 -->
  <view class="mt-16rpx bg-white pt-24rpx">
    <text class="px-24rpx text-30rpx text-[#333] font-semibold">生成设置</text>
    <wd-form :model="formData">
      <wd-cell-group border>
        <yd-form-picker
          v-model="formData.videoModelId"
          label="视频模型"
          label-width="180rpx"
          placeholder="跟随默认视频模型"
          :columns="toModelColumns(videoModels)"
          filterable
          clearable
        />
        <yd-form-picker
          v-model="formData.videoResolution"
          label="分辨率"
          label-width="180rpx"
          placeholder="跟随默认"
          :columns="resolutionColumns"
          :disabled="!formData.videoModelId"
          clearable
        />
        <wd-form-item title="使用起始帧" title-width="180rpx" center>
          <wd-switch v-model="formData.useFirstFrame" />
        </wd-form-item>
        <wd-form-item title="参考图包含场景" title-width="180rpx" center>
          <wd-switch v-model="formData.includeLocation" />
        </wd-form-item>
      </wd-cell-group>
    </wd-form>
    <view class="px-24rpx pb-24rpx pt-12rpx text-22rpx text-[#999]">
      视频模型留空时跟随默认视频模型（{{ defaultModelText }}）；设置后本镜固定使用。使用起始帧时按图生视频，不使用时由支持参考生视频的模型带上参考素材与选用样音
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AiModel } from '@/api/ai/model/model'
import type { DramaProjectDetail } from '@/api/ai/drama/project'
import type { ShotForm } from './shot-form'
import { computed, watch } from 'vue'
import { AiDramaVisualAssetKindEnum, DICT_TYPE, getVideoModelCapability } from '@/utils/constants'
import { toModelColumns } from '../../components/storyboard/use-drama-models'

const props = defineProps<{
  detail: DramaProjectDetail // 项目详情：角色、场景、道具、动作参考
  videoModels: AiModel[] // 视频模型：用于取所选模型可选的分辨率
  defaultModelText: string // 默认模型摘要
}>()

const formData = defineModel<ShotForm>({ required: true }) // 镜头编辑表单

const characterColumns = computed(() => props.detail.characters.map(item => ({ label: item.name, value: item.id }))) // 发言人选项
const locationColumns = computed(() => props.detail.locations.map(item => ({ label: item.name, value: item.id }))) // 场景选项
const appearanceColumns = computed(() => // 角色形象选项：按角色分组展开
  props.detail.characters.flatMap(character => (character.appearances || []).map(appearance => ({
    label: `${character.name} · 形象 ${appearance.appearanceIndex}`,
    value: appearance.id,
  }))),
)
const slots = computed(() => props.detail.locations.find(item => item.id === formData.value.locationId)?.availableSlots || []) // 站位：取自所选场景的可站位置
const propColumns = computed(() => // 道具选项：不含历史版本
  props.detail.visualAssets
    .filter(item => item.kind === AiDramaVisualAssetKindEnum.PROP && !item.parentId)
    .map(item => ({ label: item.title || `#${item.id}`, value: item.id })),
)
const motionColumns = computed(() => { // 动作参考视频选项：项目的动作参考，加上镜头已有但不在其中的地址
  const columns = (props.detail.motionReferences || []).map(item => ({ label: item.name, value: item.fileUrl }))
  formData.value.referenceVideoUrls.forEach((url) => {
    if (!columns.some(item => item.value === url)) {
      columns.push({ label: url, value: url })
    }
  })
  return columns
})
const videoModel = computed(() => props.videoModels.find(item => item.id === formData.value.videoModelId)) // 单镜指定的视频模型：未指定、模型列表未加载或模型已删除时为空
const resolutionList = computed(() => videoModel.value ? getVideoModelCapability(videoModel.value.platform, videoModel.value.model).resolutions : []) // 所选视频模型可选的分辨率
const resolutionColumns = computed(() => resolutionList.value.map(item => ({ label: item, value: item })))

/** 获得站位选项：场景的可站位置，加上已填写但不在其中的站位 */
function getSlotColumns(current?: string) {
  const list = current && !slots.value.includes(current) ? [...slots.value, current] : slots.value
  return list.map(item => ({ label: item, value: item }))
}

/**
 * 单镜指定了视频模型时，分辨率只取该模型可选的值：为空（包括历史数据）或不可选时改为该模型的默认分辨率，
 * 模型没有可选分辨率时清空、不传；未指定模型时跟随项目设置，不处理。
 * 立即执行：页面在详情、模型都加载后才挂载本组件，挂载时已有的空值也要处理
 */
watch(() => [videoModel.value, formData.value.videoResolution] as const, ([model, resolution]) => {
  if (!model) {
    return
  }
  const list = resolutionList.value
  if (!list.length) {
    if (resolution) {
      formData.value.videoResolution = undefined
    }
    return
  }
  if (!resolution || !list.includes(resolution)) {
    formData.value.videoResolution = list[0]
  }
}, { immediate: true })
</script>
