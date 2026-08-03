<template>
  <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
    <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
      招聘动态（{{ recruitRange }}）
    </view>
    <view class="grid grid-cols-2 gap-16rpx p-24rpx">
      <view
        v-for="item in surveyItems"
        :key="item.label"
        class="rounded-12rpx bg-[#f7f8fa] px-12rpx py-24rpx text-center"
        :class="item.disabled ? 'opacity-80' : 'active:opacity-80'"
        @click="goRecruitSurvey(item.action)"
      >
        <view class="text-36rpx text-[#333] font-semibold">
          {{ item.value }}
        </view>
        <view class="mt-8rpx text-24rpx text-[#999]">
          {{ item.label }}
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { HrHomeRecruitSurvey } from '@/api/hrm/home'
import dayjs from 'dayjs'
import { computed } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { HrmRecruitCandidateStatus } from '@/pages-hrm/utils/constants'

type RecruitAction = 'post' | 'pending-entry' | 'joined'

const props = defineProps<{
  survey?: HrHomeRecruitSurvey
}>()

const { hasAccessByCodes } = useAccess()
const recruitRange = `${dayjs().subtract(6, 'month').format('YYYY.MM.DD')}-${dayjs().format('YYYY.MM.DD')}`

const surveyItems = computed(() => [
  {
    label: '正在招聘职位',
    value: props.survey?.recruitingPostCount || 0,
    action: 'post' as RecruitAction,
    disabled: !hasAccessByCodes(['hrm:recruit:post:query']),
  },
  {
    label: '评选中',
    value: props.survey?.candidateInProcessCount || 0,
    action: undefined,
    disabled: true,
  },
  {
    label: '待入职',
    value: props.survey?.pendingEntryCount || 0,
    action: 'pending-entry' as RecruitAction,
    disabled: !hasAccessByCodes(['hrm:recruit:candidate:query']),
  },
  {
    label: '已入职',
    value: props.survey?.joinedCount || 0,
    action: 'joined' as RecruitAction,
    disabled: !hasAccessByCodes(['hrm:recruit:candidate:query']),
  },
])

/** 打开招聘动态对应的列表 */
function goRecruitSurvey(action?: RecruitAction) {
  if (action === 'post' && hasAccessByCodes(['hrm:recruit:post:query'])) {
    uni.navigateTo({ url: '/pages-hrm/recruit/post/index' })
  } else if (action === 'pending-entry' && hasAccessByCodes(['hrm:recruit:candidate:query'])) {
    uni.navigateTo({
      url: `/pages-hrm/recruit/candidate/index?status=${HrmRecruitCandidateStatus.PENDING_ENTRY}`,
    })
  } else if (action === 'joined' && hasAccessByCodes(['hrm:recruit:candidate:query'])) {
    uni.navigateTo({
      url: `/pages-hrm/recruit/candidate/index?status=${HrmRecruitCandidateStatus.JOINED}`,
    })
  }
}
</script>
