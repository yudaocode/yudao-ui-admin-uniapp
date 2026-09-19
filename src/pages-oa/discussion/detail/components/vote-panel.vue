<template>
  <view class="mt-24rpx rounded-20rpx bg-white p-28rpx">
    <!-- 投票标题与状态 -->
    <view class="mb-8rpx flex items-center justify-between">
      <text class="text-30rpx text-[#333] font-semibold">投票（{{ detail.voteMultiple ? '多选' : '单选' }}）</text>
      <wd-tag :type="voteStatusTagType">
        {{ voteStatusText }}
      </wd-tag>
    </view>
    <view class="mb-16rpx text-24rpx text-[#999]">
      {{ formatDateTime(detail.voteStartTime) }} 至 {{ formatDateTime(detail.voteEndTime) }}
    </view>

    <!-- 投票选项 -->
    <view v-for="option in detail.voteOptions" :key="option.id" class="mb-20rpx">
      <view class="mb-8rpx flex items-center justify-between gap-12rpx" @click="handleSelect(option)">
        <view class="min-w-0 flex flex-1 items-center gap-12rpx">
          <!-- 选中态图标：纯 CSS 圆点/方块，避免依赖图标库 -->
          <view
            class="h-32rpx w-32rpx flex shrink-0 items-center justify-center border-2rpx border-solid"
            :class="[
              detail.voteMultiple ? 'rounded-6rpx' : 'rounded-full',
              isSelected(option) ? 'border-[#1677ff] bg-[#1677ff]' : 'border-[#ccc]',
            ]"
          >
            <view v-if="isSelected(option)" class="h-14rpx w-14rpx" :class="detail.voteMultiple ? 'bg-white' : 'rounded-full bg-white'" />
          </view>
          <text class="line-clamp-1 text-28rpx text-[#333]">{{ option.title }}</text>
        </view>
        <text class="shrink-0 text-24rpx text-[#999]">{{ option.voteCount || 0 }} 票</text>
      </view>
      <!-- 票数占比条 -->
      <view class="h-12rpx overflow-hidden rounded-full bg-[#f5f5f5]">
        <view
          class="h-full rounded-full"
          :style="{ width: `${getVotePercentage(option)}%`, backgroundColor: option.color || '#409EFF' }"
        />
      </view>
      <view
        v-if="option.voterUserNames?.length"
        class="mt-4rpx text-24rpx text-[#1677ff]"
        @click="handleShowVoters(option)"
      >
        查看投票人
      </view>
    </view>

    <!-- 提交投票 -->
    <wd-button
      v-if="!voteDisabled"
      type="primary"
      block
      :loading="submitLoading"
      @click="submitVote"
    >
      提交投票
    </wd-button>
    <wd-tag v-else-if="hasVoted" type="success">
      已投票
    </wd-tag>

    <!-- 投票人名单弹窗 -->
    <wd-popup v-model="voterPopupVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-32rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          投票人（{{ currentVoters.length }}）
        </view>
        <view class="break-words text-28rpx text-[#666] leading-relaxed">
          {{ currentVoters.join('、') }}
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { Discussion, VoteOption } from '@/api/oa/discussion'
import { computed, ref, toRef, watch } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { voteDiscussion } from '@/api/oa/discussion'
import { formatDateTime, toTimestamp } from '@/utils/date'

const props = defineProps<{
  detail: Discussion
}>()

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const detail = toRef(props, 'detail') // 讨论详情
const selectedOptionIds = ref<number[]>([]) // 已选中的选项编号
const submitLoading = ref(false) // 投票提交状态
const voterPopupVisible = ref(false) // 投票人名单弹窗状态
const currentVoters = ref<string[]>([]) // 当前查看的投票人名单
const hasVoted = computed(() => detail.value?.voteOptions?.some(item => item.voted) || false) // 是否已投票
const votedOptionIds = computed(() => detail.value?.voteOptions?.filter(item => item.voted).map(item => item.id!) || []) // 已投票选项编号
const voteStatus = computed(() => {
  const now = Date.now()
  const startTime = toTimestamp(detail.value?.voteStartTime) || 0
  const endTime = toTimestamp(detail.value?.voteEndTime) || 0
  if (now < startTime) {
    return 'notStarted'
  }
  return now > endTime ? 'ended' : 'ongoing'
}) // 投票状态
const voteStatusText = computed(() =>
  voteStatus.value === 'notStarted' ? '未开始' : voteStatus.value === 'ended' ? '已结束' : '进行中') // 投票状态文本
const voteStatusTagType = computed(() =>
  voteStatus.value === 'ongoing' ? 'success' : voteStatus.value === 'ended' ? 'info' : 'warning') // 投票状态标签类型
const voteDisabled = computed(() => {
  if (voteStatus.value !== 'ongoing') {
    return true
  }
  return detail.value.voteMultiple
    ? votedOptionIds.value.length >= (detail.value.voteOptions?.length || 0)
    : hasVoted.value
}) // 是否禁止投票
const voteCount = computed(() =>
  (detail.value?.voteOptions || []).reduce((total, item) => total + (item.voteCount || 0), 0)) // 投票总票数

/** 选项是否被选中 */
function isSelected(option: VoteOption) {
  return selectedOptionIds.value.includes(option.id!)
}

/** 选择或取消选项，进行中且未投过的选项才可选 */
function handleSelect(option: VoteOption) {
  if (voteStatus.value !== 'ongoing' || option.voted) {
    return
  }
  if (detail.value.voteMultiple) {
    const index = selectedOptionIds.value.indexOf(option.id!)
    if (index >= 0) {
      selectedOptionIds.value.splice(index, 1)
    } else {
      selectedOptionIds.value.push(option.id!)
    }
  } else {
    selectedOptionIds.value = [option.id!]
  }
}

/** 获得投票选项百分比 */
function getVotePercentage(option: VoteOption) {
  return voteCount.value > 0 ? Math.round(((option.voteCount || 0) / voteCount.value) * 100) : 0
}

/** 查看投票人名单 */
function handleShowVoters(option: VoteOption) {
  currentVoters.value = option.voterUserNames || []
  voterPopupVisible.value = true
}

/** 提交投票 */
async function submitVote() {
  if (!detail.value?.id || submitLoading.value) {
    return
  }
  // 过滤掉已经投过的选项
  const optionIds = selectedOptionIds.value.filter(optionId => !votedOptionIds.value.includes(optionId))
  if (optionIds.length === 0) {
    toast.warning('请选择投票选项')
    return
  }
  submitLoading.value = true
  try {
    await voteDiscussion(detail.value.id, optionIds)
    toast.success('投票成功')
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

/** 回显已提交的选项 */
watch(
  () => props.detail,
  (discussion) => {
    selectedOptionIds.value = discussion.voteOptions?.filter(item => item.voted).map(item => item.id!) || []
  },
  { immediate: true },
)
</script>
