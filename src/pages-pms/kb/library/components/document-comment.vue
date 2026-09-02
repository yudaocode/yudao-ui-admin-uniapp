<template>
  <view>
    <!-- 发表评论 -->
    <view class="mb-24rpx">
      <view
        v-if="!composing"
        class="rounded-12rpx bg-white p-24rpx text-26rpx text-[#999] shadow-sm"
        @click="composing = true"
      >
        写下你的评论…
      </view>
      <template v-else>
        <wd-textarea
          v-model="newContent"
          placeholder="请输入评论内容"
          :maxlength="2000"
          show-word-limit
          :focus="true"
        />
        <view class="mt-16rpx flex justify-end gap-16rpx">
          <wd-button size="small" variant="plain" @click="composing = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" :loading="submitting" @click="submitRootComment">
            发表评论
          </wd-button>
        </view>
      </template>
    </view>

    <!-- 评论列表 -->
    <view v-if="!comments.length" class="py-60rpx text-center text-28rpx text-[#999]">
      暂无评论
    </view>
    <view
      v-for="comment in comments"
      :key="comment.id"
      class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
    >
      <view class="mb-8rpx flex items-center gap-12rpx">
        <view class="h-48rpx w-48rpx flex shrink-0 items-center justify-center rounded-full bg-[#1677ff] text-24rpx text-white">
          {{ comment.userName?.slice(0, 1) || '-' }}
        </view>
        <text class="text-28rpx text-[#333] font-semibold">{{ comment.userName || '-' }}</text>
        <text class="text-24rpx text-[#999]">{{ formatDateTime(comment.createTime) }}</text>
      </view>
      <view class="whitespace-pre-wrap break-all text-28rpx text-[#333]">
        {{ comment.content }}
      </view>
      <view class="mt-12rpx flex items-center gap-24rpx">
        <text v-if="comment.userId === loginUserId" class="text-26rpx text-[#f5222d]" @click="handleDelete(comment)">
          删除
        </text>
        <text class="text-26rpx text-[#1677ff]" @click="startReply(comment, comment)">回复</text>
      </view>

      <!-- 评论回复 -->
      <view
        v-for="reply in comment.children"
        :key="reply.id"
        class="mt-16rpx rounded-8rpx bg-[#f7f8fa] p-20rpx"
      >
        <view class="mb-4rpx flex items-center gap-12rpx">
          <text class="text-26rpx text-[#333] font-semibold">{{ reply.userName || '-' }}</text>
          <text class="text-24rpx text-[#999]">{{ formatDateTime(reply.createTime) }}</text>
        </view>
        <view v-if="reply.replyUserName" class="mb-4rpx text-24rpx text-[#999]">
          回复 @{{ reply.replyUserName }}
        </view>
        <view class="whitespace-pre-wrap break-all text-28rpx text-[#333]">
          {{ reply.content }}
        </view>
        <view class="mt-8rpx flex items-center gap-24rpx">
          <text v-if="reply.userId === loginUserId" class="text-26rpx text-[#f5222d]" @click="handleDelete(reply)">
            删除
          </text>
          <text class="text-26rpx text-[#1677ff]" @click="startReply(comment, reply)">回复</text>
        </view>
      </view>

      <!-- 回复评论 -->
      <view v-if="replyMainId === comment.id" class="mt-16rpx">
        <wd-textarea v-model="replyContent" :placeholder="`回复 ${replyUserName}`" :maxlength="2000" />
        <view class="mt-12rpx flex justify-end gap-16rpx">
          <wd-button size="small" variant="plain" @click="cancelReply">
            取消
          </wd-button>
          <wd-button size="small" type="primary" :loading="submitting" @click="submitReply">
            回复
          </wd-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeDocumentComment } from '@/api/pms/kb/interaction/comment'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createKnowledgeDocumentComment,
  deleteKnowledgeDocumentComment,
  getKnowledgeDocumentCommentList,
} from '@/api/pms/kb/interaction/comment'
import { formatDateTime } from '@/utils/date'
import { useUserStore } from '@/store/user'

const props = defineProps<{
  documentId: number
}>()

const toast = useToast()
const dialog = useDialog()
const loginUserId = computed(() => useUserStore().userInfo.userId) // 当前登录用户编号
const submitting = ref(false) // 评论提交中
const composing = ref(false) // 是否展开评论输入区
const comments = ref<KnowledgeDocumentComment[]>([]) // 评论列表
const newContent = ref('') // 新评论内容
const replyMainId = ref<number>() // 当前回复的主评论编号
const replyUserId = ref<number>() // 当前回复对象用户编号
const replyUserName = ref('') // 当前回复对象姓名
const replyContent = ref('') // 回复内容

/** 查询评论列表 */
async function getList() {
  comments.value = await getKnowledgeDocumentCommentList(props.documentId)
}

/** 发表评论 */
async function submitRootComment() {
  if (!newContent.value.trim()) {
    toast.warning('请输入评论内容')
    return
  }
  submitting.value = true
  try {
    await createKnowledgeDocumentComment({ documentId: props.documentId, content: newContent.value })
    toast.success('评论成功')
    newContent.value = ''
    composing.value = false
    await getList()
  } finally {
    submitting.value = false
  }
}

/** 开始回复评论 */
function startReply(mainComment: KnowledgeDocumentComment, targetComment: KnowledgeDocumentComment) {
  replyMainId.value = mainComment.id
  replyUserId.value = targetComment.userId
  replyUserName.value = targetComment.userName || ''
  replyContent.value = ''
}

/** 取消回复评论 */
function cancelReply() {
  replyMainId.value = undefined
  replyUserId.value = undefined
  replyUserName.value = ''
  replyContent.value = ''
}

/** 提交评论回复 */
async function submitReply() {
  if (!replyContent.value.trim() || !replyMainId.value) {
    toast.warning('请输入回复内容')
    return
  }
  submitting.value = true
  try {
    await createKnowledgeDocumentComment({
      documentId: props.documentId,
      mainId: replyMainId.value,
      replyUserId: replyUserId.value,
      content: replyContent.value,
    })
    toast.success('回复成功')
    cancelReply()
    await getList()
  } finally {
    submitting.value = false
  }
}

/** 删除评论 */
async function handleDelete(comment: KnowledgeDocumentComment) {
  try {
    await dialog.confirm({ title: '提示', msg: '确认删除这条评论吗？' })
  } catch {
    return
  }
  await deleteKnowledgeDocumentComment(comment.id)
  toast.success('删除成功')
  await getList()
}

/** 文档变化时刷新评论 */
watch(() => props.documentId, getList, { immediate: true })
</script>
