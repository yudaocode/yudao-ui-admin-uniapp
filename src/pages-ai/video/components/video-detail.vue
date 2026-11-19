<template>
  <!-- 视频 -->
  <view class="bg-white p-24rpx">
    <video
      v-if="video.status === AiVideoStatusEnum.SUCCESS && video.videoUrl"
      :src="video.videoUrl"
      :poster="video.coverUrl"
      controls
      object-fit="contain"
      class="h-420rpx w-full rounded-8rpx bg-black"
    />
    <view v-else class="h-240rpx flex items-center justify-center rounded-8rpx bg-[#f5f5f5] text-24rpx text-[#999]">
      {{ isAiVideoRunning(video.status) ? `生成中 ${video.progress || 0}%` : '暂无视频' }}
    </view>
  </view>

  <!-- 基本信息 -->
  <wd-cell-group border>
    <template v-if="admin">
      <wd-cell title="编号" :value="video.id" />
      <wd-cell title="用户" :value="video.userNickname || video.userId" />
    </template>
    <wd-cell title="创作类型">
      <dict-tag :type="DICT_TYPE.AI_VIDEO_TYPE" :value="video.type" />
    </wd-cell>
    <wd-cell v-if="video.mode" title="生成方式" :value="AI_VIDEO_MODE_LABELS[video.mode] || video.mode" />
    <wd-cell title="状态">
      <view class="flex items-center justify-end gap-8rpx">
        <dict-tag :type="DICT_TYPE.AI_VIDEO_STATUS" :value="video.status" />
        <text v-if="isAiVideoRunning(video.status)" class="text-[#999]">{{ video.progress || 0 }}%</text>
      </view>
    </wd-cell>
    <wd-cell title="服务商">
      <dict-tag :type="DICT_TYPE.AI_PLATFORM" :value="video.platform" />
    </wd-cell>
    <wd-cell title="模型" :value="video.model || '-'" />
    <wd-cell v-if="!admin" title="作者" :value="video.userNickname || '-'" />
    <template v-if="admin">
      <wd-cell title="API 密钥" :value="video.apiKeyName || video.apiKeyId || '-'" />
      <wd-cell title="服务商任务" layout="vertical" value-align="left">
        <text class="break-all">{{ video.taskId || '-' }}</text>
      </wd-cell>
    </template>
    <wd-cell title="提示词" layout="vertical" value-align="left">
      <text class="whitespace-pre-wrap break-all">{{ video.prompt || '-' }}</text>
    </wd-cell>
    <wd-cell title="参数" layout="vertical" value-align="left">
      <text class="break-all">{{ formatVideoOptions(video) }}</text>
    </wd-cell>
    <wd-cell v-if="video.inputUrls" title="输入文件" layout="vertical" value-align="left">
      <view v-for="(urls, role) in video.inputUrls" :key="role" class="flex flex-wrap items-center gap-16rpx leading-48rpx">
        <text class="text-[#999]">{{ AI_VIDEO_ROLE_LABELS[role] || role }}：</text>
        <text v-for="(url, index) in urls" :key="index" class="text-[#1677ff]" @click="openAttachment(url)">
          查看{{ urls.length > 1 ? index + 1 : '' }}
        </text>
      </view>
    </wd-cell>
    <wd-cell v-if="video.errorMessage" title="失败原因" layout="vertical" value-align="left">
      <text class="break-all text-[#f5222d]">{{ video.errorMessage }}</text>
    </wd-cell>
    <wd-cell title="创建时间" :value="formatDateTime(video.createTime) || '-'" />
    <wd-cell title="完成时间" :value="formatDateTime(video.finishTime) || '-'" />
  </wd-cell-group>
</template>

<script lang="ts" setup>
import type { Video } from '@/api/ai/video'
import { AI_VIDEO_MODE_LABELS, AI_VIDEO_ROLE_LABELS, AiVideoStatusEnum, DICT_TYPE, formatVideoOptions, isAiVideoRunning } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'

withDefaults(defineProps<{
  video: Video // 视频详情
  admin?: boolean // 是否视频生成管理：额外展示编号、用户、密钥与服务商任务
}>(), {
  admin: false,
})
</script>
