<template>
  <view>
    <!-- 发表评论 -->
    <view v-if="editable" class="mb-24rpx">
      <view
        v-if="!composing"
        class="flex items-center gap-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        @click="composing = true"
      >
        <view class="h-48rpx w-48rpx flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1677ff] text-24rpx text-white">
          <wd-img v-if="loginAvatar" :src="loginAvatar" width="48rpx" height="48rpx" radius="50%" />
          <text v-else>{{ loginNickname.slice(0, 1) || '-' }}</text>
        </view>
        <text class="text-26rpx text-[#999]">写下你的评论…</text>
      </view>
      <template v-else>
        <view class="mb-12rpx flex items-center gap-12rpx">
          <view class="h-48rpx w-48rpx flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1677ff] text-24rpx text-white">
            <wd-img v-if="loginAvatar" :src="loginAvatar" width="48rpx" height="48rpx" radius="50%" />
            <text v-else>{{ loginNickname.slice(0, 1) || '-' }}</text>
          </view>
          <text class="text-26rpx text-[#666]">{{ loginNickname }}</text>
        </view>
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
    <view v-if="!commentList.length" class="py-60rpx text-center text-28rpx text-[#999]">
      暂无评论
    </view>
    <view
      v-for="comment in commentList"
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
      <view v-if="editingId === comment.id" class="mb-8rpx">
        <wd-textarea v-model="editingContent" :maxlength="2000" />
        <view class="mt-12rpx flex justify-end gap-16rpx">
          <wd-button size="small" variant="plain" @click="cancelEdit">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="submitEdit(comment)">
            保存
          </wd-button>
        </view>
      </view>
      <view v-else class="whitespace-pre-wrap break-all text-28rpx text-[#333]">
        {{ comment.content }}
      </view>
      <view v-if="editable" class="mt-12rpx flex items-center gap-24rpx">
        <template v-if="comment.userId === loginUserId && editingId !== comment.id">
          <text class="text-26rpx text-[#1677ff]" @click="startEdit(comment)">编辑</text>
          <text class="text-26rpx text-[#f5222d]" @click="handleDelete(comment)">删除</text>
        </template>
        <text class="text-26rpx text-[#1677ff]" @click="startReply(comment, comment)">回复</text>
      </view>

      <!-- 评论回复 -->
      <view
        v-for="reply in comment.children || []"
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
        <view v-if="editingId === reply.id">
          <wd-textarea v-model="editingContent" :maxlength="2000" />
          <view class="mt-12rpx flex justify-end gap-16rpx">
            <wd-button size="small" variant="plain" @click="cancelEdit">
              取消
            </wd-button>
            <wd-button size="small" type="primary" @click="submitEdit(reply)">
              保存
            </wd-button>
          </view>
        </view>
        <view v-else class="whitespace-pre-wrap break-all text-28rpx text-[#333]">
          {{ reply.content }}
        </view>
        <view v-if="editable" class="mt-8rpx flex items-center gap-24rpx">
          <template v-if="reply.userId === loginUserId && editingId !== reply.id">
            <text class="text-26rpx text-[#1677ff]" @click="startEdit(reply)">编辑</text>
            <text class="text-26rpx text-[#f5222d]" @click="handleDelete(reply)">删除</text>
          </template>
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
import type { WorkItemComment } from '@/api/pms/pm/workitem/comment'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createWorkItemComment,
  deleteWorkItemComment,
  getWorkItemCommentList,
  updateWorkItemComment,
} from '@/api/pms/pm/workitem/comment'
import { useUserStore } from '@/store/user'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  workItemId: number
  editable: boolean
}>()
const emit = defineEmits<{ changed: [] }>() // 评论变化事件

const toast = useToast()
const dialog = useDialog()
const loginUserId = computed(() => useUserStore().userInfo.userId) // 当前登录用户编号
const loginAvatar = computed(() => useUserStore().userInfo.avatar) // 当前登录用户头像
const loginNickname = computed(() => useUserStore().userInfo.nickname || '') // 当前登录用户昵称
const submitting = ref(false) // 评论提交中
const composing = ref(false) // 是否展开评论输入区
const commentList = ref<WorkItemComment[]>([]) // 评论列表
const newContent = ref('') // 新评论内容
const replyMainId = ref<number>() // 当前回复的主评论编号
const replyUserId = ref<number>() // 当前回复对象用户编号
const replyUserName = ref('') // 当前回复对象姓名
const replyContent = ref('') // 回复内容
const editingId = ref<number>() // 当前编辑的评论编号
const editingContent = ref('') // 编辑中的评论内容

/** 查询工作项评论列表 */
async function getList() {
  commentList.value = await getWorkItemCommentList(props.workItemId)
}

/** 发表评论 */
async function submitRootComment() {
  if (!newContent.value.trim()) {
    toast.warning('请输入评论内容')
    return
  }
  submitting.value = true
  try {
    await createWorkItemComment({ workItemId: props.workItemId, content: newContent.value })
    toast.success('评论成功')
    newContent.value = ''
    composing.value = false
    await getList()
    emit('changed')
  } finally {
    submitting.value = false
  }
}

/** 开始回复评论 */
function startReply(mainComment: WorkItemComment, targetComment: WorkItemComment) {
  replyMainId.value = mainComment.id
  replyUserId.value = targetComment.userId
  replyUserName.value = targetComment.userName || '-'
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
    await createWorkItemComment({
      workItemId: props.workItemId,
      mainId: replyMainId.value,
      replyUserId: replyUserId.value,
      content: replyContent.value,
    })
    toast.success('回复成功')
    cancelReply()
    await getList()
    emit('changed')
  } finally {
    submitting.value = false
  }
}

/** 开始编辑评论 */
function startEdit(comment: WorkItemComment) {
  editingId.value = comment.id
  editingContent.value = comment.content
}

/** 取消编辑评论 */
function cancelEdit() {
  editingId.value = undefined
  editingContent.value = ''
}

/** 提交评论修改 */
async function submitEdit(comment: WorkItemComment) {
  if (!editingContent.value.trim()) {
    toast.warning('请输入评论内容')
    return
  }
  await updateWorkItemComment({ id: comment.id, content: editingContent.value })
  toast.success('更新成功')
  cancelEdit()
  await getList()
  emit('changed')
}

/** 删除评论 */
async function handleDelete(comment: WorkItemComment) {
  try {
    await dialog.confirm({ title: '提示', msg: '确认删除这条评论吗？' })
  } catch {
    return
  }
  await deleteWorkItemComment(comment.id!)
  toast.success('删除成功')
  await getList()
  emit('changed')
}

/** 工作项变化时刷新评论 */
watch(() => props.workItemId, getList, { immediate: true })
</script>
