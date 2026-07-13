<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="群组详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <!-- 基本信息 -->
      <wd-cell-group border>
        <wd-cell title="群头像" center>
          <wd-img
            v-if="formData?.avatar"
            :src="formData.avatar"
            width="96rpx"
            height="96rpx"
            radius="12rpx"
            mode="aspectFill"
            enable-preview
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="群名称" :value="formData?.name || '-'" />
        <wd-cell title="群主" :value="formData?.ownerNickname || (formData ? `用户 ${formData.ownerUserId}` : '-')" />
        <wd-cell title="成员数" :value="`${formData?.memberCount ?? 0} 人`" />
        <wd-cell title="群状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.IM_GROUP_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="封禁状态" :value="formData?.banned ? '已封禁' : '未封禁'" />
        <wd-cell v-if="formData?.banned && formData?.bannedReason" title="封禁原因" :value="formData.bannedReason" />
        <wd-cell title="全员禁言" :value="formData?.mutedAll ? '是' : '否'" />
        <wd-cell title="群公告" :value="formData?.notice || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 群成员 -->
      <wd-cell-group border class="mt-20rpx">
        <view class="flex items-center justify-between gap-16rpx px-24rpx py-20rpx">
          <view class="text-30rpx text-[#333] font-semibold">
            群成员（{{ filteredMembers.length }}）
          </view>
          <wd-radio-group v-model="memberScope" type="button" size="small">
            <wd-radio value="current">
              当前成员
            </wd-radio>
            <wd-radio value="all">
              全部历史
            </wd-radio>
          </wd-radio-group>
        </view>
        <view v-if="filteredMembers.length === 0" class="px-24rpx pb-24rpx text-26rpx text-[#999]">
          暂无成员
        </view>
        <view
          v-for="member in filteredMembers"
          :key="member.userId"
          class="border-t border-t-[#f2f3f5] px-24rpx py-20rpx"
        >
          <view class="flex items-center gap-16rpx">
            <wd-img
              v-if="member.avatar"
              :src="member.avatar"
              width="64rpx"
              height="64rpx"
              mode="aspectFill"
              round
            />
            <view v-else class="h-64rpx w-64rpx flex items-center justify-center rounded-full bg-[#f0f2f5] text-22rpx text-[#bbb]">
              {{ (member.displayUserName || member.nickname || '?').slice(0, 1) }}
            </view>
            <view class="min-w-0 flex-1">
              <view class="line-clamp-1 text-28rpx text-[#333]">
                {{ member.displayUserName || member.nickname || `用户 ${member.userId}` }}
              </view>
              <view class="mt-2rpx text-22rpx text-[#999]">
                {{ member.nickname || `用户 ${member.userId}` }} · ID {{ member.userId }}
              </view>
            </view>
            <dict-tag v-if="member.role != null" :type="DICT_TYPE.IM_GROUP_MEMBER_ROLE" :value="member.role" />
          </view>
          <view class="grid grid-cols-2 ml-80rpx mt-14rpx gap-x-20rpx gap-y-10rpx text-23rpx text-[#777]">
            <view>
              状态：{{ member.quitTime || member.status === CommonStatusEnum.DISABLE ? '已退出' : '群内' }}
            </view>
            <view>
              免打扰：{{ member.silent ? '是' : '否' }}
            </view>
            <view class="col-span-2">
              加入时间：{{ formatDateTime(member.joinTime) || '-' }}
            </view>
            <view v-if="member.quitTime" class="col-span-2">
              退出时间：{{ formatDateTime(member.quitTime) || '-' }}
            </view>
            <view class="col-span-2">
              禁言至：{{ formatDateTime(member.muteEndTime) || '未禁言' }}
            </view>
            <view class="col-span-2">
              群备注：{{ member.groupRemark || '-' }}
            </view>
          </view>
        </view>
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['im:manager:message:query'])"
          class="flex-1" type="info" @click="handleViewChat"
        >
          查看对话
        </wd-button>
        <wd-button
          v-if="formData && !formData.banned && hasAccessByCodes(['im:manager:group:ban'])"
          class="flex-1" type="warning" @click="handleBan"
        >
          封禁
        </wd-button>
        <wd-button
          v-if="formData?.banned && hasAccessByCodes(['im:manager:group:ban'])"
          class="flex-1" type="success" :loading="processing" @click="handleUnban"
        >
          解封
        </wd-button>
        <wd-button
          v-if="formData && !formData.dissolvedTime && hasAccessByCodes(['im:manager:group:dissolve'])"
          class="flex-1" type="danger" :loading="processing" @click="handleDissolve"
        >
          解散
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerGroupMemberVO, ImManagerGroupVO } from '@/api/im/manager/group'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import {
  dissolveManagerGroup,
  getManagerGroup,
  getManagerGroupMemberList,
  unbanManagerGroup,
} from '@/api/im/manager/group'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | string
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
const formData = ref<ImManagerGroupVO>() // 详情数据
const members = ref<ImManagerGroupMemberVO[]>([]) // 群成员
const memberScope = ref<'current' | 'all'>('current') // 成员查看范围
const processing = ref(false) // 操作中状态
const filteredMembers = computed(() => memberScope.value === 'current'
  ? members.value.filter(item => !item.quitTime && item.status !== CommonStatusEnum.DISABLE)
  : members.value) // 当前展示成员

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/group/index')
}

/** 加载群详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const id = Number(props.id)
  formData.value = await getManagerGroup(id)
  members.value = await getManagerGroupMemberList(id)
}

/** 查看对话 */
function handleViewChat() {
  uni.navigateTo({
    url: `/pages-im/manager/message/group/index?groupId=${props.id}`,
  })
}

/** 封禁群 */
function handleBan() {
  uni.navigateTo({
    url: `/pages-im/manager/group/ban-form/index?id=${props.id}&name=${encodeURIComponent(formData.value?.name || '')}`,
  })
}

/** 解封群 */
async function handleUnban() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要解封该群吗？' })
  } catch {
    return
  }
  processing.value = true
  try {
    await unbanManagerGroup(Number(props.id))
    toast.success('解封成功')
    uni.$emit('im:manager:group:reload')
    await getDetail()
  } finally {
    processing.value = false
  }
}

/** 解散群 */
async function handleDissolve() {
  try {
    await dialog.confirm({ title: '提示', msg: `确定要解散“${formData.value?.name}”吗？` })
  } catch {
    return
  }
  processing.value = true
  try {
    await dissolveManagerGroup(Number(props.id))
    toast.success('解散成功')
    uni.$emit('im:manager:group:reload')
    delay(handleBack)
  } finally {
    processing.value = false
  }
}

/** 初始化（每次显示刷新，便于封禁返回后更新） */
onShow(() => {
  getDetail()
})
</script>
