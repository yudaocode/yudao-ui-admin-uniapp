<template>
  <view class="rounded-12rpx bg-white p-24rpx">
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
  </view>
</template>

<script lang="ts" setup>
import type { Plan } from '@/api/oa/plan'
import { onMounted, ref } from 'vue'
import { getPlanPage } from '@/api/oa/plan'
import { DICT_TYPE } from '@/utils/constants'

const plans = ref<Plan[]>([]) // 最近计划

/** 页面跳转 */
function handleGo(url: string) {
  uni.navigateTo({ url })
}

/** 初始化 */
onMounted(() => {
  getPlanPage({ pageNo: 1, pageSize: 2 }).then((data) => {
    plans.value = data.list
  })
})
</script>
