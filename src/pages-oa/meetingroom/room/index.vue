<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="会议室信息"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 会议室列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无会议室数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="flex gap-20rpx">
            <view class="shrink-0">
              <wd-img
                v-if="item.picUrl"
                :width="140"
                :height="100"
                radius="8rpx"
                mode="aspectFill"
                :src="item.picUrl"
                enable-preview
              />
            </view>
            <view class="min-w-0 flex-1">
              <view class="mb-8rpx flex items-center justify-between gap-12rpx">
                <text class="line-clamp-1 min-w-0 flex-1 text-30rpx text-[#333] font-semibold">{{ item.name }}</text>
                <dict-tag :type="DICT_TYPE.OA_MEETING_ROOM_STATUS" :value="item.status" />
              </view>
              <view class="mb-4rpx text-24rpx text-[#666]">
                <dict-tag :type="DICT_TYPE.OA_MEETING_ROOM_TYPE" :value="item.type" />
                <text v-if="item.seatCount" class="ml-12rpx">坐席 {{ item.seatCount }}</text>
              </view>
              <view class="line-clamp-1 text-24rpx text-[#999]">
                {{ item.location || '-' }} · 负责人 {{ item.managerName || '-' }}
              </view>
            </view>
          </view>
          <!-- 行内操作 -->
          <view class="mt-16rpx flex items-center gap-32rpx border-t border-[#f0f0f0] border-t-solid pt-16rpx text-26rpx">
            <text
              v-if="hasAccessByCodes(['oa:meeting-room:query', 'oa:meeting-room-booking:query'])"
              class="text-[#1677ff]"
              @click="handleSchedule(item)"
            >
              预定信息
            </text>
            <text
              v-if="hasAccessByCodes(['oa:meeting-room:update'])"
              class="text-[#fa8c16]"
              @click="handleEdit(item)"
            >
              修改
            </text>
            <text
              v-if="hasAccessByCodes(['oa:meeting-room:delete'])"
              class="text-[#f56c6c]"
              @click="handleDelete(item)"
            >
              删除
            </text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['oa:meeting-room:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MeetingRoom } from '@/api/oa/meetingroom/room'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteMeetingRoom, getMeetingRoomPage } from '@/api/oa/meetingroom/room'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<MeetingRoom[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询会议室列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getMeetingRoomPage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增会议室 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-oa/meetingroom/room/form/index',
  })
}

/** 修改会议室 */
function handleEdit(item: MeetingRoom) {
  uni.navigateTo({
    url: `/pages-oa/meetingroom/room/form/index?id=${item.id}`,
  })
}

/** 会议室预定信息 */
function handleSchedule(item: MeetingRoom) {
  uni.navigateTo({
    url: `/pages-oa/meetingroom/room/schedule/index?roomId=${item.id}&roomName=${encodeURIComponent(item.name)}`,
  })
}

/** 删除会议室 */
async function handleDelete(item: MeetingRoom) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除会议室「${item.name}」？`,
    })
  } catch {
    return
  }
  await deleteMeetingRoom(item.id)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:meeting-room:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:meeting-room:reload', reload)
})
</script>
