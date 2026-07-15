<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    custom-style="height: 76vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col overflow-hidden bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button size="small" variant="plain" @click="close">
          取消
        </wd-button>
        <text class="text-30rpx text-[#333] font-semibold">{{ title }}</text>
        <wd-button
          size="small"
          type="primary"
          :disabled="!allowEmpty && selectedCount === 0"
          :loading="loading"
          @click="confirm"
        >
          {{ confirmText }}
        </wd-button>
      </view>
      <view class="bg-white px-20rpx pb-16rpx">
        <wd-search v-model="keyword" placeholder="搜索群成员" hide-cancel />
        <view class="px-8rpx pt-8rpx text-24rpx text-[#999]">
          {{ selectionSummary }}
        </view>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <view
          v-for="item in filteredMembers"
          :key="item.userId"
          class="flex items-center gap-20rpx border-b border-[#eee] bg-white px-28rpx py-20rpx"
          :class="isDisabled(item.userId) ? 'opacity-55' : ''"
          @click="toggle(item.userId)"
        >
          <view
            class="h-40rpx w-40rpx flex shrink-0 items-center justify-center border rounded-full"
            :class="isSelected(item.userId) ? 'border-[#07c160] bg-[#07c160]' : 'border-[#c8c9cc] bg-white'"
          >
            <wd-icon v-if="isSelected(item.userId)" name="check" size="28rpx" color="#fff" />
          </view>
          <ImAvatar :src="item.avatar" :name="item.nickname" size="76rpx" />
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333]">
              {{ getMemberDisplayName(item) }}
            </view>
            <view v-if="isLocked(item.userId)" class="mt-4rpx text-22rpx text-[#999]">
              已固定
            </view>
            <view v-else-if="isDisabled(item.userId)" class="mt-4rpx text-22rpx text-[#999]">
              不可选择
            </view>
          </view>
        </view>
        <wd-empty
          v-if="filteredMembers.length === 0"
          icon="search"
          :tip="keyword ? '没有匹配的群成员' : emptyTip"
        />
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { GroupMember } from '../../../types'
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { CommonStatusEnum } from '@/pages-im/utils/constants'
import { getMemberDisplayName } from '@/pages-im/utils/user'
import { useSelectedItems } from '../../../composables/useSelectedItems'
import ImAvatar from '../../../components/im-avatar.vue'

const props = withDefaults(defineProps<{
  modelValue: number[] // 已选择成员编号
  members: GroupMember[] // 群成员列表
  title?: string // 弹窗标题
  confirmText?: string // 确认按钮文案
  lockedIds?: number[] // 固定成员编号
  disabledIds?: number[] // 禁用成员编号
  hideIds?: number[] // 隐藏成员编号
  maxSize?: number // 最大选择人数
  allowEmpty?: boolean // 是否允许空选择
  loading?: boolean // 确认提交状态
  closeOnConfirm?: boolean // 确认后是否自动关闭
  emptyTip?: string // 空状态文案
}>(), {
  title: '选择群成员',
  confirmText: '确定',
  lockedIds: () => [],
  disabledIds: () => [],
  hideIds: () => [],
  maxSize: 0,
  allowEmpty: false,
  loading: false,
  closeOnConfirm: true,
  emptyTip: '暂无可选群成员',
})

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
  'confirm': [value: number[]]
}>()

const toast = useToast()
const visible = ref(false) // 选择弹窗显示状态
const keyword = ref('') // 群成员搜索关键词
const selectedIds = ref<number[]>([]) // 当前临时选中成员
const hideIdSet = computed(() => new Set(props.hideIds)) // 隐藏成员编号
const lockedIdSet = computed(() => new Set(props.lockedIds)) // 固定成员编号
const disabledIdSet = computed(() => new Set(props.disabledIds)) // 禁用成员编号
const memberById = computed(() => new Map(props.members.map(member => [member.userId, member]))) // 群成员编号索引
const filteredMembers = computed(() => { // 搜索后的可选成员
  const value = keyword.value.trim().toLowerCase()
  return props.members.filter(item => item.status !== CommonStatusEnum.DISABLE
    && !hideIdSet.value.has(item.userId)
    && (!value || getMemberDisplayName(item).toLowerCase().includes(value)))
})
const { selectedCount, selectedItems } = useSelectedItems(
  () => selectedIds.value,
  () => props.lockedIds,
  () => props.disabledIds,
  () => props.hideIds,
  memberById,
)
const selectionSummary = computed(() => props.maxSize > 0
  ? `已选择 ${selectedCount.value} 人，最多 ${props.maxSize} 人`
  : `已选择 ${selectedCount.value} 人`) // 当前选择人数文案

/** 是否固定选择 */
function isLocked(userId: number) {
  return lockedIdSet.value.has(userId)
}

/** 是否禁止选择 */
function isDisabled(userId: number) {
  return !isLocked(userId) && disabledIdSet.value.has(userId)
}

/** 是否已选择 */
function isSelected(userId: number) {
  return isLocked(userId) || selectedIds.value.includes(userId)
}

/** 打开群成员选择 */
function open(initialIds: number[] = props.modelValue) {
  keyword.value = ''
  selectedIds.value = Array.from(new Set([...initialIds, ...props.lockedIds]))
  visible.value = true
}

/** 关闭群成员选择 */
function close() {
  visible.value = false
}

/** 切换成员选中状态 */
function toggle(userId: number) {
  if (isLocked(userId) || isDisabled(userId)) {
    return
  }
  const index = selectedIds.value.indexOf(userId)
  if (index >= 0) {
    selectedIds.value.splice(index, 1)
    return
  }
  if (props.maxSize > 0 && selectedCount.value >= props.maxSize) {
    toast.show(`最多选择 ${props.maxSize} 位成员`)
    return
  }
  selectedIds.value.push(userId)
}

/** 确认群成员选择 */
function confirm() {
  const value = selectedItems.value.map(item => item.userId)
  if (!props.allowEmpty && value.length === 0) {
    return
  }
  emit('update:modelValue', value)
  emit('confirm', value)
  if (props.closeOnConfirm) {
    close()
  }
}

defineExpose({ open, close })
</script>
