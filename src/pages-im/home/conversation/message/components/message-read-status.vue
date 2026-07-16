<template>
  <text class="whitespace-nowrap" @click.stop="open">{{ label }}</text>

  <wd-popup
    v-if="visible"
    v-model="visible"
    position="bottom"
    root-portal
    custom-style="height: 60vh; border-radius: 24rpx 24rpx 0 0;"
    @after-enter="resetLocalPaging"
  >
    <view class="h-full flex flex-col bg-white">
      <view class="flex items-center justify-between border-b border-b-[#f2f3f5] px-24rpx py-20rpx">
        <view class="text-32rpx text-[#333] font-semibold">
          消息已读情况
        </view>
        <wd-button size="small" variant="plain" @click="visible = false">
          关闭
        </wd-button>
      </view>

      <wd-tabs v-model="tab" line-theme="text">
        <wd-tab :title="`已读 ${readMembers.length}`" />
        <wd-tab :title="`未读 ${unreadMembers.length}`" />
      </wd-tabs>

      <z-paging
        ref="pagingRef"
        v-model="pagedMembers"
        :fixed="false"
        :auto="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="false"
        :show-loading-more-no-more-view="false"
        @query="queryList"
      >
        <view v-if="loading" class="flex justify-center py-80rpx">
          <wd-loading />
        </view>
        <template v-else>
          <view
            v-for="member in pagedMembers"
            :key="member.userId"
            class="flex items-center gap-20rpx px-24rpx py-16rpx"
          >
            <ImAvatar :src="member.avatar" :name="member.nickname" :round="false" size="76rpx" />
            <text class="min-w-0 flex-1 truncate text-30rpx text-[#333]">
              {{ getMemberDisplayName(member) }}
            </text>
          </view>
        </template>
        <template #empty>
          <wd-empty
            v-if="!loading"
            icon="user"
            :tip="tab === 0 ? '暂无已读成员' : '全部已读'"
          />
        </template>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { GroupMember, Message } from '../../../types'
import { computed, nextTick, ref, watch } from 'vue'
import { getGroupReadUsers } from '@/api/im/message/group'
import {
  CommonStatusEnum,
  ImMessageReceiptStatus,
} from '@/pages-im/utils/constants'
import { getMemberDisplayName } from '@/pages-im/utils/user'
import ImAvatar from '../../../components/im-avatar.vue'

const props = defineProps<{
  message: Message // 当前消息
  groupId: number // 当前群编号
  groupMembers: GroupMember[] // 当前群成员
}>()

const emit = defineEmits<{
  receipt: [messageId: number, readCount: number, receiptStatus?: number] // 更新消息回执
}>()

const visible = ref(false) // 是否显示已读详情
const loading = ref(false) // 已读成员加载状态
const tab = ref(0) // 0=已读 1=未读
const readUserIds = ref<number[]>([]) // 已读用户编号
const pagedMembers = ref<GroupMember[]>([]) // 当前分段渲染成员
const pagingRef = ref<any>() // 本地分页组件引用

const label = computed(() => { // 已读状态文案
  if (props.message.receiptStatus === ImMessageReceiptStatus.DONE) {
    return '全部已读'
  }
  return props.message.readCount ? `${props.message.readCount} 人已读` : '未读'
})

const visibleMembers = computed(() => { // 当前消息实际接收成员
  const receiverUserIds = props.message.receiverUserIds
  const isDirected = !!receiverUserIds?.length
  return props.groupMembers.filter(member => member.status !== CommonStatusEnum.DISABLE
    && member.userId !== props.message.senderId
    && (!isDirected || receiverUserIds.includes(member.userId)))
})
const readMembers = computed(() => visibleMembers.value.filter(
  member => readUserIds.value.includes(member.userId),
)) // 已读成员
const unreadMembers = computed(() => visibleMembers.value.filter(
  member => !readUserIds.value.includes(member.userId),
)) // 未读成员
const currentList = computed(() => tab.value === 0 ? readMembers.value : unreadMembers.value) // 当前成员列表

/** 成员分类变化时重置本地分页 */
watch(currentList, () => {
  if (!visible.value) {
    return
  }
  void resetLocalPaging()
})

/** 重置已读成员本地分页 */
async function resetLocalPaging() {
  await nextTick()
  await pagingRef.value?.reload()
}

/** 查询当前成员分类分页 */
function queryList(pageNo: number, pageSize: number) {
  const start = (pageNo - 1) * pageSize
  const rows = currentList.value.slice(start, start + pageSize)
  void pagingRef.value?.completeByTotal(rows, currentList.value.length)
}

/** 打开消息已读详情 */
function open() {
  tab.value = 0
  visible.value = true
  void loadReadUsers()
}

/** 加载已读用户编号 */
async function loadReadUsers() {
  if (!props.message.id || loading.value) {
    return
  }
  loading.value = true
  try {
    readUserIds.value = await getGroupReadUsers({
      groupId: props.groupId,
      messageId: props.message.id,
    })
    const readCount = readUserIds.value.length
    const allRead = readCount > 0 && readCount >= visibleMembers.value.length
    emit(
      'receipt',
      props.message.id,
      readCount,
      allRead ? ImMessageReceiptStatus.DONE : undefined,
    )
  } catch (error) {
    console.error('[IM] 拉取群已读列表失败', error)
  } finally {
    loading.value = false
  }
}
</script>
