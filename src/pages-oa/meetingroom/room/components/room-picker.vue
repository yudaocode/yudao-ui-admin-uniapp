<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col">
      <view class="flex items-center justify-between px-24rpx py-20rpx">
        <text class="text-32rpx text-[#333] font-semibold">选择会议室</text>
        <wd-icon name="close" size="32rpx" color="#999" @click="visible = false" />
      </view>
      <view class="px-24rpx pb-16rpx">
        <wd-search v-model="keyword" placeholder="搜索会议室名称" hide-cancel @search="handleSearch" @clear="handleSearch" />
      </view>
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="10"
        empty-view-text="暂无可预定会议室"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-16rpx flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx"
            @click="handleSelect(item)"
          >
            <view class="min-w-0 flex-1">
              <view class="text-30rpx text-[#333] font-semibold">
                {{ item.name }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ item.location || '-' }}<text v-if="item.seatCount != null"> · {{ item.seatCount }} 座</text>
              </view>
            </view>
            <view class="flex shrink-0 items-center gap-16rpx">
              <text class="text-24rpx text-[#1677ff]" @click.stop="emit('schedule', item)">占用</text>
              <wd-icon v-if="item.id === selectedId" name="check" size="32rpx" color="#1677ff" />
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { MeetingRoom } from '@/api/oa/meetingroom/room'
import { ref, watch } from 'vue'
import { getBookableMeetingRoomPage } from '@/api/oa/meetingroom/room'

const props = defineProps<{ selectedId?: number }>()
const emit = defineEmits<{ select: [item: MeetingRoom], schedule: [item: MeetingRoom] }>()
const visible = defineModel<boolean>({ default: false })
const list = ref<MeetingRoom[]>([]) // 可预定会议室列表
const pagingRef = ref<any>() // 分页组件引用
const keyword = ref('') // 搜索关键词

watch(visible, (value) => {
  if (value)
    pagingRef.value?.reload()
})

/** 查询可预定会议室 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getBookableMeetingRoomPage({ name: keyword.value.trim() || undefined, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索会议室 */
function handleSearch() {
  pagingRef.value?.reload()
}

/** 选择会议室 */
function handleSelect(item: MeetingRoom) {
  emit('select', item)
  visible.value = false
}
</script>
