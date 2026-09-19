<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="日程详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="日程标题" :value="formData?.title ?? '-'" />
        <wd-cell title="日程类型">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_SCHEDULE_TYPE" :value="formData.type" />
        </wd-cell>
        <wd-cell title="优先级">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_PRIORITY" :value="formData.priority" />
        </wd-cell>
        <wd-cell title="开始时间" :value="formatDateTime(formData?.startTime) || '-'" />
        <wd-cell title="结束时间" :value="formatDateTime(formData?.endTime) || '-'" />
        <wd-cell title="日程提醒" :value="formData?.remind ? '是' : '否'" />
        <wd-cell title="创建人" :value="formData?.creatorName ? `${formData.creatorName}${formData.creatorDeptName ? `（${formData.creatorDeptName}）` : ''}` : '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 日程描述 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          日程描述
        </view>
        <view v-if="formData?.description" class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.description }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无描述
        </view>
      </view>

      <!-- 参与人列表 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-26rpx text-[#999]">
          参与人（{{ formData?.participants?.length ?? 0 }}）
        </view>
        <view v-if="formData?.participants?.length">
          <view
            v-for="participant in formData.participants"
            :key="participant.userId"
            class="flex items-center justify-between border-0 border-b border-[#f5f5f5] border-solid py-16rpx last:border-b-0"
          >
            <text class="text-28rpx text-[#333]">{{ participant.userName }}</text>
            <view class="flex items-center gap-12rpx">
              <text v-if="participant.readStatus && participant.readTime" class="text-24rpx text-[#999]">
                {{ formatDateTime(participant.readTime) }}
              </text>
              <wd-tag :type="participant.readStatus ? 'success' : 'warning'">
                {{ participant.readStatus ? '已读' : '未读' }}
              </wd-tag>
            </view>
          </view>
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无参与人
        </view>
      </view>
    </view>

    <!-- 底部操作按钮：仅创建人可编辑、删除日程 -->
    <view v-if="isCreator" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['oa:schedule:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:schedule:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Schedule } from '@/api/oa/schedule'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteSchedule, getSchedule, updateScheduleReadStatus } from '@/api/oa/schedule'
import { useAccess } from '@/hooks/useAccess'
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

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
const userStore = useUserStore()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Schedule>() // 详情数据
const deleting = ref(false) // 删除状态
const isCreator = computed(() => Number(formData.value?.creator) === userStore.userInfo.userId) // 当前用户是否创建人

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载日程详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const data = await getSchedule(Number(props.id))
    formData.value = data
    // 本人是参与人且未读时，同步阅读状态并重拉详情，拿到阅读时间等最新数据
    const mine = data.participants?.find(item => item.userId === userStore.userInfo.userId)
    if (mine && !mine.readStatus) {
      await updateScheduleReadStatus(Number(props.id))
      formData.value = await getSchedule(Number(props.id))
    }
  } finally {
    toast.close()
  }
}

/** 编辑日程 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/schedule/form/index?id=${props.id}`,
  })
}

/** 删除日程 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该日程吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteSchedule(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:schedule:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:schedule:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:schedule:reload', getDetail)
})
</script>
