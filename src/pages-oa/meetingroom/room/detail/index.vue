<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="会议室详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <!-- 会议室图片 -->
      <view v-if="formData?.picUrl" class="mb-20rpx rounded-12rpx bg-white p-24rpx">
        <image :src="formData.picUrl" class="h-320rpx w-full rounded-12rpx" mode="aspectFit" />
      </view>

      <wd-cell-group border>
        <wd-cell title="会议室名称" :value="formData?.name ?? '-'" />
        <wd-cell title="位置" :value="formData?.location || '-'" />
        <wd-cell title="类型">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_MEETING_ROOM_TYPE" :value="formData.type" />
        </wd-cell>
        <wd-cell title="负责人" :value="formData?.managerName || '-'" />
        <wd-cell title="负责人电话" :value="formData?.managerPhone || '-'" />
        <wd-cell title="可用状态">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_MEETING_ROOM_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="座位数" :value="formData?.seatCount != null ? `${formData.seatCount} 座` : '-'" />
        <wd-cell title="设备" :value="equipmentText" />
        <wd-cell title="允许预定" :value="formData?.allowBooking ? '是' : '否'" />
        <wd-cell title="预定需审批" :value="formData?.needApproval ? '是' : '否'" />
        <wd-cell title="可用范围">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_MEETING_ROOM_BOOKING_SCOPE" :value="formData.bookingScope" />
        </wd-cell>
        <wd-cell title="显示顺序" :value="formData?.sort != null ? String(formData.sort) : '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 附件 -->
      <view v-if="formData?.fileUrls?.length" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
          附件（{{ formData.fileUrls.length }}）
        </view>
        <view
          v-for="(url, index) in formData.fileUrls"
          :key="index"
          class="mb-12rpx flex items-center gap-12rpx text-26rpx text-[#1677ff]"
          @click="openAttachment(url)"
        >
          <wd-icon name="link" size="26rpx" />
          <text class="line-clamp-1">{{ getFileName(url) }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['oa:meeting-room-booking:query'])"
          class="flex-1" variant="plain" @click="handleSchedule"
        >
          预定信息
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:meeting-room:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:meeting-room:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MeetingRoom } from '@/api/oa/meetingroom/room'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteMeetingRoom, getMeetingRoom } from '@/api/oa/meetingroom/room'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<MeetingRoom>() // 详情数据
const deleting = ref(false) // 删除状态
const equipmentText = computed(() => // 设备名称拼接
  formData.value?.equipments?.length
    ? formData.value.equipments.map(value => getDictLabel(DICT_TYPE.OA_MEETING_ROOM_EQUIPMENT, value)).join('、')
    : '-')

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载会议室详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getMeetingRoom(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 编辑会议室 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/meetingroom/room/form/index?id=${props.id}`,
  })
}

/** 查看会议室预定排期 */
function handleSchedule() {
  uni.navigateTo({
    url: `/pages-oa/meetingroom/room/schedule/index?roomId=${props.id}&roomName=${encodeURIComponent(formData.value?.name || '')}`,
  })
}

/** 删除会议室 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该会议室吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteMeetingRoom(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:meeting-room:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:meeting-room:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:meeting-room:reload', getDetail)
})
</script>
