<template>
  <view
    v-if="count > 0"
    class="flex items-center gap-16rpx border-b border-b-[#eee] bg-[#fff8e8] px-24rpx py-18rpx"
    @click="handleOpen"
  >
    <wd-icon name="user-add" size="32rpx" color="#d48806" />
    <text class="min-w-0 flex-1 text-26rpx text-[#8f5b00]">{{ count }} 条入群申请待处理</text>
    <wd-icon name="arrow-right" size="30rpx" color="#b99a61" />
  </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useGroupRequestStore } from '../../../store/groupRequestStore'

const props = defineProps<{
  groupId: number // 群编号
  canManage: boolean // 是否可管理群申请
}>()

const groupRequestStore = useGroupRequestStore()
const count = computed(() => props.canManage
  ? groupRequestStore.getUnhandledGroupRequestCount(props.groupId)
  : 0) // 待处理申请数

/** 打开群申请列表 */
function handleOpen() {
  uni.navigateTo({ url: `/pages-im/home/contact/request/index?tab=group&groupId=${props.groupId}` })
}
</script>
