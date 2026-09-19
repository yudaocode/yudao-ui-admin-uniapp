<template>
  <view class="rounded-12rpx bg-white p-24rpx">
    <view v-if="loadError" class="py-24rpx text-center text-26rpx" @click.stop="loadData">
      工作计划加载失败，点击重试
    </view>
    <template v-else>
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-30rpx text-[#333] font-semibold">工作计划</text>
        <text class="text-26rpx text-[#1677ff]" @click="handleGo('/pages-oa/plan/index')">更多</text>
      </view>
      <view v-if="!plans.length" class="py-24rpx text-center text-24rpx text-[#999]">
        暂无计划
      </view>
      <view
        v-for="item in plans"
        :key="item.id"
        class="mb-12rpx flex items-center gap-12rpx"
        @click="handleGo(`/pages-oa/plan/detail/index?id=${item.id}`)"
      >
        <dict-tag :type="DICT_TYPE.OA_PLAN_TYPE" :value="item.type" />
        <text class="line-clamp-1 min-w-0 flex-1 text-28rpx text-[#333]">{{ item.title }}</text>
        <dict-tag :type="DICT_TYPE.OA_PLAN_STATUS" :value="item.status" />
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { Plan } from '@/api/oa/plan'
import { onMounted, ref } from 'vue'
import { getPlanPage } from '@/api/oa/plan'
import { DICT_TYPE } from '@/utils/constants'

const loadError = ref(false) // 加载失败时显示重试入口
const loading = ref(false) // 防止重复加载

const plans = ref<Plan[]>([]) // 最近计划

/** 页面跳转 */
function handleGo(url: string) {
  uni.navigateTo({ url })
}

/** 加载面板数据，失败不展示为零值或空列表 */
async function loadData() {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    plans.value = (await getPlanPage({ pageNo: 1, pageSize: 2 })).list
    loadError.value = false
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(loadData)
</script>
