<template>
  <!-- 公开项目详情弹窗：播放、下载成片 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="max-height: 86vh; border-radius: 32rpx 32rpx 0 0; background-color: #f5f5f5;"
    @after-leave="detail = undefined"
  >
    <view class="pb-24rpx pt-24rpx">
      <view class="mb-20rpx flex items-center justify-between gap-16rpx px-24rpx">
        <text class="min-w-0 flex-1 truncate text-32rpx text-[#222] font-semibold">{{ detail?.name || '短剧详情' }}</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <view v-if="loading" class="py-80rpx text-center">
        <wd-loading />
      </view>
      <template v-else-if="detail">
        <scroll-view scroll-y class="max-h-[64vh]">
          <!-- 成片 -->
          <view class="bg-white p-24rpx">
            <video
              :src="detail.composeFileUrl"
              controls
              object-fit="contain"
              class="h-420rpx w-full rounded-8rpx bg-black"
            />
          </view>

          <!-- 基本信息 -->
          <wd-cell-group border>
            <wd-cell title="作者" :value="detail.userNickname || '-'" />
            <wd-cell title="时长" :value="formatAiDramaDuration(detail.composeDuration)" />
            <wd-cell title="画风">
              <dict-tag v-if="detail.style" :type="DICT_TYPE.AI_DRAMA_STYLE" :value="detail.style" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="画幅" :value="detail.aspectRatio || '-'" />
            <wd-cell title="镜头数" :value="detail.storyboardCount ? `${detail.storyboardCount} 个` : '-'" />
            <wd-cell title="剧情大纲" layout="vertical" value-align="left">
              <text class="whitespace-pre-wrap break-all">{{ detail.outline || '-' }}</text>
            </wd-cell>
          </wd-cell-group>

          <!-- 角色 -->
          <view v-if="detail.characters?.length" class="mt-16rpx bg-white p-24rpx">
            <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
              角色
            </view>
            <view class="flex flex-wrap gap-20rpx">
              <view v-for="(item, index) in detail.characters" :key="index" class="w-140rpx text-center">
                <wd-img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  width="140rpx"
                  height="140rpx"
                  radius="12rpx"
                  mode="aspectFill"
                  enable-preview
                />
                <view v-else class="h-140rpx w-140rpx flex items-center justify-center rounded-12rpx bg-[#f5f5f5]">
                  <wd-icon name="user" size="48rpx" color="#bbb" />
                </view>
                <view class="mt-8rpx truncate text-22rpx text-[#666]">
                  {{ item.name }}
                </view>
              </view>
            </view>
          </view>
        </scroll-view>

        <!-- 操作 -->
        <view class="px-24rpx pt-24rpx">
          <wd-button block type="primary" @click="handleDownload">
            下载成片
          </wd-button>
        </view>
      </template>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { DramaPublic } from '@/api/ai/drama/project'
import { ref } from 'vue'
import { getDramaProjectPublicDetail } from '@/api/ai/drama/project'
import { DICT_TYPE, formatAiDramaDuration } from '@/utils/constants'
import { openAttachment } from '@/utils/download'

const visible = ref(false) // 弹窗显示状态
const loading = ref(false) // 加载状态
const detail = ref<DramaPublic>() // 详情数据

/** 打开公开项目详情 */
async function open(id: number) {
  visible.value = true
  detail.value = undefined
  loading.value = true
  try {
    detail.value = await getDramaProjectPublicDetail(id)
  } catch {
    visible.value = false
  } finally {
    loading.value = false
  }
}

/** 下载成片 */
function handleDownload() {
  openAttachment(detail.value?.composeFileUrl)
}

defineExpose({ open })
</script>
