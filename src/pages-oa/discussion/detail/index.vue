<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="讨论详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view v-if="formData" class="p-24rpx">
      <!-- 主题正文 -->
      <view class="rounded-20rpx bg-white p-28rpx">
        <view class="mb-24rpx break-words text-38rpx text-[#1f2937] font-semibold leading-snug">
          {{ formData.title }}
        </view>
        <view class="flex items-center gap-12rpx">
          <view class="h-64rpx w-64rpx flex shrink-0 items-center justify-center rounded-full bg-[#edf4ff] text-28rpx text-[#4380d9] font-medium">
            {{ formData.userName?.charAt(0) }}
          </view>
          <view>
            <view class="text-28rpx text-[#333]">
              {{ formData.userName }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#94a3b8]">
              {{ formatDateTime(formData.createTime) }}
            </view>
          </view>
        </view>
        <view class="my-28rpx h-1rpx bg-[#f1f3f6]" />
        <!-- 正文：PC 富文本内容净化展示，移动端纯文本直接展示 -->
        <rich-text
          v-if="isHtmlContent(formData.content)"
          :nodes="sanitizeRichText(formData.content || '')"
        />
        <view v-else class="whitespace-pre-wrap break-words text-28rpx text-[#334155] leading-relaxed">
          {{ formData.content }}
        </view>
        <!-- 附件 -->
        <view v-if="formData.fileUrls?.length" class="mt-16rpx border-t border-[#f0f0f0] border-t-solid pt-16rpx">
          <view class="mb-12rpx text-28rpx text-[#333] font-medium">
            附件
          </view>
          <view
            v-for="(url, index) in formData.fileUrls"
            :key="url"
            class="mb-8rpx flex items-center gap-8rpx text-26rpx text-[#1677ff]"
            @click="openAttachment(url)"
          >
            <wd-icon name="attach" size="26rpx" />
            <text class="line-clamp-1">附件 {{ index + 1 }}：{{ getFileName(url) }}</text>
          </view>
        </view>
        <!-- 点赞统计 -->
        <view class="mt-28rpx flex flex-wrap items-center gap-28rpx border-t border-[#f1f3f6] border-t-solid pt-24rpx text-24rpx text-[#64748b]">
          <view class="flex items-center gap-8rpx text-[#1677ff]" @click="replyListRef?.focusReply()">
            <wd-icon name="message" size="28rpx" />
            <text>回复 {{ formData.replyCount || 0 }}</text>
          </view>
          <view class="flex items-center gap-8rpx">
            <wd-icon name="eye" size="28rpx" />
            <text>浏览 {{ formData.visitCount || 0 }}</text>
          </view>
          <view class="ml-auto flex items-center gap-8rpx" :class="{ 'text-[#1677ff]': formData.liked }" @click="handleDiscussionLike">
            <wd-icon :name="formData.liked ? 'thumb-up-fill' : 'thumb-up'" size="28rpx" />
            <text>{{ formData.liked ? '已赞' : '点赞' }} {{ formData.likeCount || 0 }}</text>
          </view>
        </view>
        <!-- 点赞人摘要，点击展开完整名单 -->
        <view
          v-if="formData.likeUserNames?.length"
          class="mt-16rpx text-22rpx text-[#94a3b8]"
          @click="handleShowLikers"
        >
          {{ formData.likeUserNames.slice(0, 3).join('、') }}<text v-if="(formData.likeCount || 0) > 3"> 等 {{ formData.likeCount }} 人觉得很赞</text><text v-else> 觉得很赞</text>
        </view>
      </view>

      <!-- 投票 -->
      <VotePanel
        v-if="formData.type === OA_DISCUSSION_TYPE.VOTE && formData.voteOptions?.length"
        :detail="formData"
        @success="getDetail()"
      />

      <!-- 讨论楼层 -->
      <ReplyList
        ref="replyListRef"
        :key="formData.id"
        :detail="formData"
        @success="getDetail()"
      />
    </view>

    <!-- 底部操作按钮（讨论管理场景） -->
    <view v-if="canEdit || canDelete" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="canEdit"
          class="flex-1" type="warning" @click="handleEdit"
        >
          修改
        </wd-button>
        <wd-button
          v-if="canDelete"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
    <!-- 点赞人名单弹窗 -->
    <wd-popup v-model="likePopupVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-32rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          点赞人
        </view>
        <view class="break-words text-28rpx text-[#666] leading-relaxed">
          {{ (formData?.likeUserNames || []).join('、') }}
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { Discussion } from '@/api/oa/discussion'
import { onShow } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createDiscussionLike, deleteDiscussion, deleteDiscussionLike, getDiscussion } from '@/api/oa/discussion'
import { useAccess } from '@/hooks/useAccess'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'
import { isHtmlContent, sanitizeRichText } from '@/utils/format'
import { OA_DISCUSSION_TYPE } from '../../utils/constants'
import ReplyList from './components/reply-list.vue'
import VotePanel from './components/vote-panel.vue'

const props = defineProps<{
  id?: string
  scene?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const userStore = useUserStore() // 用户信息 Store
const dialog = useDialog()
const toast = useToast()
const formData = ref<Discussion>() // 详情数据
const likeLoading = ref(false) // 点赞提交中
const deleting = ref(false) // 删除状态
const replyListRef = ref<any>() // 回复楼层引用
const likePopupVisible = ref(false) // 点赞人名单弹窗状态
const isManageScene = computed(() => props.scene === 'manage') // 是否讨论管理场景
const isOwner = computed(() => formData.value?.userId === Number(userStore.userInfo?.userId)) // 是否本人发布
const isSuperAdmin = computed(() => userStore.roles?.includes('super_admin')) // 是否为超级管理员
const canEdit = computed(() => isManageScene.value && isOwner.value && hasAccessByCodes(['oa:discussion:update'])) // 仅本人发布可修改
const canDelete = computed(() =>
  isManageScene.value && (isOwner.value || isSuperAdmin.value) && hasAccessByCodes(['oa:discussion:delete'])) // 本人或超管可删除

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(props.scene === 'manage' ? '/pages-oa/discussion/manage/index' : '/pages-oa/discussion/list/index')
}

/** 查看点赞人名单 */
function handleShowLikers() {
  likePopupVisible.value = true
}

/** 加载讨论详情，visit 为 true 时记录本次访问 */
async function getDetail(visit = false) {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getDiscussion(Number(props.id), visit)
}

/** 点赞或取消点赞 */
async function handleDiscussionLike() {
  if (!formData.value?.id || likeLoading.value) {
    return
  }
  likeLoading.value = true
  try {
    if (formData.value.liked) {
      await deleteDiscussionLike(formData.value.id)
    } else {
      await createDiscussionLike(formData.value.id)
    }
    await getDetail()
  } finally {
    likeLoading.value = false
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 修改讨论 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/discussion/form/index?id=${props.id}`,
  })
}

/** 删除讨论 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该讨论吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteDiscussion(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:discussion:reload')
    handleBack()
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail(true)
})

// 从编辑页返回时刷新详情（首次 onShow 在 onMounted 前触发，跳过避免重复请求）
let firstShow = true
onShow(() => {
  if (firstShow) {
    firstShow = false
    return
  }
  getDetail()
})
</script>
