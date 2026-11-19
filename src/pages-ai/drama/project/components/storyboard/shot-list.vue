<template>
  <!-- 镜头列表：按原文场次分组，可筛选场次 -->
  <view class="bg-white p-24rpx">
    <view class="flex items-center justify-between">
      <text class="text-32rpx text-[#333] font-semibold">镜头（{{ storyboards.length }}）</text>
      <text class="text-24rpx text-[#999]">视频已完成 {{ successCount }} / {{ storyboards.length }}</text>
    </view>
    <view class="mt-12rpx">
      <wd-button size="small" variant="plain" @click="emit('create')">
        新增镜头
      </wd-button>
    </view>

    <!-- 场次筛选 -->
    <scroll-view v-if="groups.length > 1" scroll-x class="mt-16rpx whitespace-nowrap">
      <view class="inline-flex gap-12rpx">
        <wd-tag :type="sceneFilter ? 'default' : 'primary'" @click="sceneFilter = undefined">
          全部场次
        </wd-tag>
        <wd-tag
          v-for="group in groups"
          :key="group.key"
          :type="sceneFilter === group.key ? 'primary' : 'default'"
          @click="sceneFilter = group.key"
        >
          {{ group.label }}
        </wd-tag>
      </view>
    </scroll-view>

    <!-- 空状态 -->
    <view v-if="!storyboards.length" class="py-60rpx text-center text-26rpx text-[#999]">
      暂无镜头，可从剧本生成分镜
    </view>

    <!-- 分组列表 -->
    <view v-for="group in visibleGroups" :key="group.key" class="mt-20rpx">
      <view class="mb-8rpx flex items-center justify-between text-24rpx text-[#999]">
        <text class="min-w-0 flex-1 truncate">{{ group.label }}</text>
        <text>{{ group.items.length }} 镜</text>
      </view>
      <view
        v-for="item in group.items"
        :key="item.id"
        class="mb-12rpx rounded-12rpx bg-[#f8f8f8] p-20rpx"
        @click="emit('open', item)"
      >
        <view class="flex items-center gap-12rpx">
          <text class="shrink-0 text-28rpx text-[#333] font-semibold">镜 {{ item.sceneNo }}</text>
          <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">{{ item.title || '未命名镜头' }}</text>
        </view>
        <view class="mt-8rpx flex items-center justify-between text-24rpx text-[#999]">
          <text>{{ item.duration ? `${item.duration} 秒` : '-' }}</text>
          <dict-tag v-if="item.videoStatus" :type="DICT_TYPE.AI_DRAMA_STATUS" :value="item.videoStatus" />
          <text v-else>未生成</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DramaLocation } from '@/api/ai/drama/asset'
import type { DramaStoryboard } from '@/api/ai/drama/storyboard'
import { computed, ref } from 'vue'
import { AiDramaStatusEnum, DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  storyboards: DramaStoryboard[] // 当前剧本的镜头
  locations: DramaLocation[] // 场景：用于场次名称
}>()

const emit = defineEmits<{
  open: [item: DramaStoryboard] // 点击镜头
  create: [] // 新增镜头
}>()

const sceneFilter = ref<string>() // 筛选的场次；为空表示全部

const successCount = computed(() => props.storyboards.filter(item => item.videoStatus === AiDramaStatusEnum.SUCCESS && item.videoUrl).length) // 视频已完成的镜头数
const groups = computed(() => { // 按原文场次分组：取规划时记录的场次，没有场次的镜头归入「未分场」
  const result: { key: string, label: string, items: DramaStoryboard[] }[] = []
  props.storyboards.forEach((item) => {
    const sceneNumber = item.continuity?.sceneNumber
    const key = sceneNumber ? `scene-${sceneNumber}` : 'none'
    let group = result.find(group => group.key === key)
    if (!group) {
      const location = props.locations.find(location => location.id === item.locationId)
      const label = sceneNumber ? `场 ${sceneNumber}${location ? ` · ${location.name}` : ''}` : '未分场'
      group = { key, label, items: [] }
      result.push(group)
    }
    group.items.push(item)
  })
  return result
})
const visibleGroups = computed(() => sceneFilter.value ? groups.value.filter(group => group.key === sceneFilter.value) : groups.value) // 筛选后的分组
</script>
