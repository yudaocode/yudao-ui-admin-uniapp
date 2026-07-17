<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    :custom-style="popupStyle"
    @after-enter="resetLocalPaging"
  >
    <view
      class="h-full flex flex-col overflow-hidden bg-[#f5f5f5]"
      :class="fullScreen ? 'pb-[env(safe-area-inset-bottom)]' : ''"
    >
      <view
        class="flex items-center justify-between bg-white px-24rpx"
        :class="fullScreen ? 'pb-20rpx pt-[calc(20rpx+env(safe-area-inset-top))]' : 'py-20rpx'"
      >
        <wd-button size="small" variant="plain" @click="visible = false">
          取消
        </wd-button>
        <text class="text-30rpx text-[#333] font-semibold">选择好友</text>
        <wd-button size="small" type="primary" @click="confirm">
          确定
        </wd-button>
      </view>
      <view class="bg-white px-20rpx pb-16rpx">
        <wd-search v-model="keyword" placeholder="搜索好友" hide-cancel />
        <view class="px-8rpx pt-8rpx text-24rpx text-[#999]">
          已选择 {{ selectedCount }} 人
        </view>
      </view>
      <z-paging
        ref="pagingRef"
        v-model="pagedFriends"
        :fixed="false"
        :auto="false"
        class="min-h-0 flex-1"
        :default-page-size="30"
        :refresher-enabled="false"
        :show-loading-more-no-more-view="false"
        @query="queryList"
      >
        <view
          v-for="item in pagedFriends"
          :key="item.id"
          class="flex items-center gap-20rpx border-b border-[#eee] bg-white px-28rpx py-20rpx"
          :class="isDisabled(item.id) ? 'opacity-55' : ''"
          @click="toggle(item.id)"
        >
          <view
            class="h-40rpx w-40rpx flex shrink-0 items-center justify-center border rounded-full"
            :class="isSelected(item.id) ? 'border-[#07c160] bg-[#07c160]' : 'border-[#c8c9cc] bg-white'"
          >
            <wd-icon v-if="isSelected(item.id)" name="check" size="28rpx" color="#fff" />
          </view>
          <ImAvatar :src="item.avatar" :name="item.nickname" size="76rpx" />
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333]">
              {{ item.displayName || item.nickname }}
            </view>
            <view v-if="isLocked(item.id)" class="mt-4rpx text-22rpx text-[#999]">
              已固定
            </view>
            <view v-else-if="isDisabled(item.id)" class="mt-4rpx text-22rpx text-[#999]">
              已在群聊
            </view>
          </view>
        </view>
        <template #empty>
          <wd-empty
            icon="search"
            :tip="keyword ? '没有匹配的好友' : '暂无好友'"
          />
        </template>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FriendLite } from '../../types'
import { computed, nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useFriendBuckets } from '../../composables/useFriendBuckets'
import { useSelectedItems } from '../../composables/useSelectedItems'
import { useFriendStore } from '../../store/friendStore'
import ImAvatar from '../../components/im-avatar.vue'

const props = withDefaults(defineProps<{
  modelValue: number[]
  lockedIds?: number[]
  disabledIds?: number[]
  hideIds?: number[]
  maxSize?: number
  fullScreen?: boolean
}>(), {
  lockedIds: () => [],
  disabledIds: () => [],
  hideIds: () => [],
  maxSize: 0,
  fullScreen: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
  'confirm': [value: number[]]
}>()

const toast = useToast()
const friendStore = useFriendStore()
const { getActiveFriendLiteList } = storeToRefs(friendStore)
const visible = ref(false) // 选择弹窗显示状态
const keyword = ref('') // 好友搜索关键词
const selectedIds = ref<number[]>([]) // 当前临时选中好友
const pagedFriends = ref<FriendLite[]>([]) // 当前分段渲染好友
const pagingRef = ref<any>() // 本地分页组件引用
const lockedIdSet = computed(() => new Set(props.lockedIds)) // 固定好友编号
const disabledIdSet = computed(() => new Set(props.disabledIds)) // 禁用好友编号
const hideIdSet = computed(() => new Set(props.hideIds)) // 隐藏好友编号
const popupStyle = computed(() => props.fullScreen
  ? 'height: 100vh; border-radius: 0;'
  : 'height: 76vh; border-radius: 24rpx 24rpx 0 0;') // 弹窗尺寸
const candidateFriends = computed(() => getActiveFriendLiteList.value
  .filter(friend => !hideIdSet.value.has(friend.id))) // 可展示的好友候选
const { filtered: filteredFriends } = useFriendBuckets(candidateFriends, keyword)
const friendById = computed(() => new Map(getActiveFriendLiteList.value.map(friend => [friend.id, friend]))) // 好友编号索引
const { selectedCount, selectedItems } = useSelectedItems(
  () => visible.value ? selectedIds.value : props.modelValue,
  () => props.lockedIds,
  () => props.disabledIds,
  () => props.hideIds,
  friendById,
)

/** 候选变化时重置本地分页 */
watch(filteredFriends, () => {
  if (!visible.value) {
    return
  }
  void resetLocalPaging()
})

/** 重置好友本地分页 */
async function resetLocalPaging() {
  await nextTick()
  await pagingRef.value?.reload()
}

/** 查询当前好友分页 */
function queryList(pageNo: number, pageSize: number) {
  const start = (pageNo - 1) * pageSize
  const rows = filteredFriends.value.slice(start, start + pageSize)
  void pagingRef.value?.completeByTotal(rows, filteredFriends.value.length)
}

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
  return selectedIds.value.includes(userId)
}

/** 打开好友选择 */
async function open() {
  await friendStore.fetchFriendList()
  keyword.value = ''
  selectedIds.value = Array.from(new Set([...props.modelValue, ...props.lockedIds]))
  visible.value = true
}

/** 切换好友选中状态 */
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
    toast.show(`最多选择 ${props.maxSize} 位好友`)
    return
  }
  selectedIds.value.push(userId)
}

/** 确认好友选择 */
function confirm() {
  const value = selectedItems.value.map(item => item.id)
  emit('update:modelValue', value)
  emit('confirm', value)
  visible.value = false
}

defineExpose({ open })
</script>
