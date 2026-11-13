<template>
  <!-- 图片 -->
  <view class="bg-white p-24rpx">
    <wd-img
      v-if="image.status === AiImageStatusEnum.SUCCESS && image.picUrl"
      :src="image.picUrl"
      width="100%"
      height="560rpx"
      radius="8rpx"
      mode="aspectFit"
      enable-preview
    />
    <view v-else class="h-240rpx flex items-center justify-center rounded-8rpx bg-[#f5f5f5] text-24rpx text-[#999]">
      {{ image.status === AiImageStatusEnum.IN_PROGRESS ? `生成中 ${image.progress || 0}%` : '暂无图片' }}
    </view>
  </view>

  <!-- 基本信息 -->
  <wd-cell-group border>
    <wd-cell v-if="scope !== 'public'" title="编号" :value="image.id" />
    <wd-cell title="类型">
      <wd-tag v-if="image.platform === AiPlatformEnum.BYTEDANCE" type="primary">
        Seedream
      </wd-tag>
      <dict-tag v-else :type="DICT_TYPE.AI_IMAGE_MODE" :value="image.mode" />
    </wd-cell>
    <wd-cell title="状态">
      <view class="flex items-center justify-end gap-8rpx">
        <dict-tag :type="DICT_TYPE.AI_IMAGE_STATUS" :value="image.status" />
        <text v-if="image.status === AiImageStatusEnum.IN_PROGRESS" class="text-[#999]">{{ image.progress || 0 }}%</text>
      </view>
    </wd-cell>
    <wd-cell title="平台">
      <dict-tag :type="DICT_TYPE.AI_PLATFORM" :value="image.platform" />
    </wd-cell>
    <wd-cell title="模型" :value="image.model || '-'" />
    <wd-cell title="尺寸" :value="sizeText" />
    <wd-cell v-if="scope !== 'admin'" title="公开" :value="image.publicStatus ? '已公开' : '未公开'" />
    <wd-cell title="提交时间" :value="formatDateTime(image.createTime) || '-'" />
    <wd-cell title="完成时间" :value="formatDateTime(image.finishTime) || '-'" />
    <template v-if="scope === 'admin'">
      <wd-cell title="用户编号" :value="image.userId ?? '-'" />
      <wd-cell title="模型编号" :value="image.modelId ?? '-'" />
      <wd-cell title="密钥编号" :value="image.apiKeyId ?? '-'" />
    </template>
    <wd-cell v-if="scope !== 'public'" title="上游任务号" :value="image.taskId || '-'" />
    <wd-cell v-if="scope !== 'public' && image.errorMessage" title="失败原因" layout="vertical" value-align="left">
      <text class="break-all text-[#f5222d]">{{ image.errorMessage }}</text>
    </wd-cell>
  </wd-cell-group>

  <!-- 提示词 -->
  <view class="px-32rpx pb-12rpx pt-24rpx text-26rpx text-[#999]">
    提示词
  </view>
  <wd-cell-group border>
    <wd-cell title="画面描述" layout="vertical" value-align="left">
      <text class="whitespace-pre-wrap break-all">{{ image.prompt || '-' }}</text>
    </wd-cell>
    <wd-cell v-if="image.negativePrompt" title="不希望出现" layout="vertical" value-align="left">
      <text class="whitespace-pre-wrap break-all">{{ image.negativePrompt }}</text>
    </wd-cell>
    <wd-cell v-if="mjOptions.finalPrompt" title="最终提示词" layout="vertical" value-align="left">
      <text class="whitespace-pre-wrap break-all">{{ mjOptions.finalPrompt }}</text>
    </wd-cell>
  </wd-cell-group>

  <!-- 参数：通用模型 -->
  <template v-if="image.options">
    <view class="px-32rpx pb-12rpx pt-24rpx text-26rpx text-[#999]">
      参数
    </view>
    <wd-cell-group border>
      <wd-cell v-if="image.options.quality" title="画质" :value="image.options.quality" />
      <wd-cell v-if="image.options.aspectRatio" title="比例" :value="image.options.aspectRatio" />
      <wd-cell v-if="image.options.seed != null" title="随机种子" :value="image.options.seed" />
      <wd-cell v-if="image.options.steps != null" title="推理步数" :value="image.options.steps" />
      <wd-cell v-if="image.options.cfgScale != null" title="引导系数" :value="image.options.cfgScale" />
      <wd-cell v-if="image.options.sampler" title="采样方法" :value="image.options.sampler" />
      <wd-cell v-if="image.options.stylePreset" title="风格预设" :value="image.options.stylePreset" />
      <wd-cell v-if="image.options.clipGuidancePreset" title="CLIP 引导" :value="image.options.clipGuidancePreset" />
      <wd-cell v-if="image.options.style" title="风格" :value="image.options.style" />
    </wd-cell-group>
  </template>

  <!-- 参数：Midjourney -->
  <template v-if="image.midjourneyOptions">
    <view class="px-32rpx pb-12rpx pt-24rpx text-26rpx text-[#999]">
      Midjourney 参数
    </view>
    <wd-cell-group border>
      <wd-cell v-if="mjOptions.version" title="版本" :value="mjOptions.version" />
      <wd-cell v-if="mjOptions.aspectRatio" title="比例" :value="mjOptions.aspectRatio" />
      <wd-cell v-if="mjOptions.quality != null" title="画质 --q" :value="mjOptions.quality" />
      <wd-cell v-if="mjOptions.stylize != null" title="风格化 --s" :value="mjOptions.stylize" />
      <wd-cell v-if="mjOptions.chaos != null" title="创意度 --c" :value="mjOptions.chaos" />
      <wd-cell v-if="mjOptions.seed != null" title="随机种子" :value="mjOptions.seed" />
      <wd-cell v-if="mjOptions.tile != null" title="平铺 --tile" :value="mjOptions.tile ? '是' : '否'" />
      <wd-cell v-if="mjOptions.raw != null" title="RAW --raw" :value="mjOptions.raw ? '是' : '否'" />
      <wd-cell v-if="mjOptions.hd != null" title="HD --hd" :value="mjOptions.hd ? '是' : '否'" />
      <wd-cell v-if="mjOptions.imageWeight != null" title="图片权重 --iw" :value="mjOptions.imageWeight" />
      <wd-cell v-if="mjOptions.characterWeight != null" title="角色权重 --cw" :value="mjOptions.characterWeight" />
      <wd-cell v-if="mjOptions.styleWeight != null" title="风格权重 --sw" :value="mjOptions.styleWeight" />
      <wd-cell v-if="mjOptions.styleVersion != null" title="风格版本 --sv" :value="mjOptions.styleVersion" />
      <wd-cell v-if="mjOptions.dimensions" title="融图尺寸" :value="mjOptions.dimensions" />
      <wd-cell v-if="mjOptions.actionLabel" title="按钮动作" :value="mjOptions.actionLabel" />
      <wd-cell v-if="scope !== 'public' && mjOptions.providerStatus" title="中转状态" :value="mjOptions.providerStatus" />
      <wd-cell v-if="mjOptions.modalProtocol" title="局部重绘协议" :value="mjOptions.modalProtocol" />
    </wd-cell-group>
  </template>

  <!-- 参数：Seedream -->
  <template v-if="image.seedreamOptions">
    <view class="px-32rpx pb-12rpx pt-24rpx text-26rpx text-[#999]">
      Seedream 参数
    </view>
    <wd-cell-group border>
      <wd-cell v-if="image.seedreamOptions.size" title="尺寸档位" :value="image.seedreamOptions.size" />
      <wd-cell v-if="image.seedreamOptions.optimizePromptMode" title="提示词优化" :value="image.seedreamOptions.optimizePromptMode" />
      <wd-cell v-if="image.seedreamOptions.watermark != null" title="水印" :value="image.seedreamOptions.watermark ? '是' : '否'" />
      <wd-cell v-if="image.seedreamOptions.resultSize" title="结果尺寸" :value="image.seedreamOptions.resultSize" />
      <wd-cell v-if="scope !== 'public' && image.seedreamOptions.errorCode" title="错误码" :value="image.seedreamOptions.errorCode" />
    </wd-cell-group>
  </template>

  <!-- 输入图片：按角色 -->
  <template v-if="image.inputImages?.length">
    <view class="px-32rpx pb-12rpx pt-24rpx text-26rpx text-[#999]">
      输入图片
    </view>
    <view class="flex flex-wrap gap-16rpx bg-white p-24rpx">
      <view v-for="(item, index) in image.inputImages" :key="index" class="w-160rpx text-center">
        <wd-img :src="item.url" width="160rpx" height="160rpx" radius="8rpx" mode="aspectFill" enable-preview />
        <view class="mt-4rpx text-22rpx text-[#999]">
          {{ AI_IMAGE_INPUT_ROLE_LABELS[item.role] || item.role }}
        </view>
      </view>
    </view>
  </template>

  <!-- 来源与派生：公开视角不展示 -->
  <template v-if="scope !== 'public' && (image.parentId || image.children?.length)">
    <view class="px-32rpx pb-12rpx pt-24rpx text-26rpx text-[#999]">
      来源与派生
    </view>
    <wd-cell-group border>
      <wd-cell v-if="image.parentId" title="来源作品" :value="`#${image.parentId}`" is-link @click="emit('open', image.parentId)" />
      <wd-cell
        v-for="child in image.children"
        :key="child.id"
        :title="`派生作品 #${child.id}`"
        :label="child.midjourneyOptions?.actionLabel"
        is-link
        @click="emit('open', child.id)"
      >
        <view class="flex items-center justify-end gap-8rpx">
          <dict-tag :type="DICT_TYPE.AI_IMAGE_MODE" :value="child.mode" />
          <dict-tag :type="DICT_TYPE.AI_IMAGE_STATUS" :value="child.status" />
        </view>
      </wd-cell>
    </wd-cell-group>
  </template>
</template>

<script lang="ts" setup>
import type { AiImage, AiImageMidjourneyOptions } from '@/api/ai/image'
import { computed } from 'vue'
import { AI_IMAGE_INPUT_ROLE_LABELS, AiImageModeEnum, AiImageStatusEnum, AiPlatformEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  image: AiImage // 作品详情
  scope: string // 详情的来源：mine - 我的作品；public - 公开画廊；admin - 作品管理
}>()

const emit = defineEmits<{
  open: [id: number] // 打开来源、派生作品
}>()

const mjOptions = computed<AiImageMidjourneyOptions>(() => props.image.midjourneyOptions || {}) // Midjourney 参数
const sizeText = computed(() => { // 尺寸：MJ 记录的宽高为比例；宽高为 0 表示未知
  const image = props.image
  if (image.mode !== AiImageModeEnum.DRAW) {
    return image.midjourneyOptions?.aspectRatio || (image.width && image.height ? `${image.width}:${image.height}` : '-')
  }
  if (image.seedreamOptions) {
    return image.seedreamOptions.resultSize || image.seedreamOptions.size || '-'
  }
  return image.width && image.height ? `${image.width}x${image.height}` : '-'
})
</script>
