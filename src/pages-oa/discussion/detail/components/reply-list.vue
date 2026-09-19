<template>
  <view class="mt-24rpx overflow-hidden rounded-20rpx bg-white">
    <!-- 回复标题和筛选 -->
    <view class="px-28rpx pt-28rpx">
      <view class="mb-24rpx flex items-center justify-between">
        <view class="flex items-center gap-12rpx">
          <text class="text-30rpx text-[#1f2937] font-semibold">回复</text>
          <text class="rounded-8rpx bg-[#f3f5f8] px-12rpx py-2rpx text-24rpx text-[#64748b]">{{ detail.replyCount || 0 }}</text>
        </view>
        <view class="flex items-center gap-6rpx py-8rpx text-24rpx text-[#64748b]" @click="handleSortToggle">
          <wd-icon :name="sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'" size="24rpx" />
          <text>{{ sortOrder === 'asc' ? '时间正序' : '时间倒序' }}</text>
        </view>
      </view>
      <view class="max-w-640rpx flex gap-8rpx rounded-14rpx bg-[#f3f5f8] p-6rpx">
        <view
          v-for="scope in replyScopes"
          :key="scope.value"
          class="flex-1 rounded-10rpx py-14rpx text-center text-26rpx"
          :class="replyScope === scope.value ? 'bg-white text-[#1677ff] font-medium shadow-sm' : 'text-[#64748b]'"
          @click="handleScopeChange(scope.value)"
        >
          {{ scope.label }}
        </view>
      </view>
    </view>

    <!-- 发表主回复 -->
    <view class="px-28rpx py-24rpx">
      <view
        v-if="!composing"
        class="flex items-center gap-12rpx rounded-12rpx bg-[#f7f8fa] px-20rpx py-20rpx text-26rpx text-[#94a3b8]"
        @click="focusReply"
      >
        <wd-icon name="edit" size="28rpx" />
        <text>写下你的回复…</text>
      </view>
      <template v-else>
        <wd-textarea
          v-model="replyContent"
          placeholder="分享你的看法，参与讨论"
          :maxlength="2000"
          show-word-limit
          :focus="mainReplyFocus"
          @blur="mainReplyFocus = false"
        />
        <view class="mt-12rpx flex justify-end gap-16rpx">
          <wd-button size="small" variant="plain" :disabled="submitLoading" @click="handleCancelMainReply">
            取消
          </wd-button>
          <wd-button
            size="small"
            type="primary"
            :loading="submitLoading"
            :disabled="!replyContent.trim()"
            @click="submitReply()"
          >
            发表回复
          </wd-button>
        </view>
      </template>
    </view>

    <!-- 主回复按楼层分页，固定高度内滚动并点击加载更多 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      height="640rpx"
      :default-page-size="10"
      :refresher-enabled="false"
      :inside-more="true"
      :to-bottom-loading-more-enabled="false"
      loading-more-default-text="点击加载更多"
      loading-more-no-more-text="没有更多回复了"
      empty-view-text="暂无回复"
      @query="queryList"
    >
      <view
        v-for="(reply, index) in list"
        :key="reply.id"
        class="border-0 border-t border-[#f1f3f6] border-solid px-28rpx py-28rpx"
      >
        <view class="flex items-center gap-12rpx">
          <view class="h-60rpx w-60rpx flex shrink-0 items-center justify-center rounded-full bg-[#edf4ff] text-26rpx text-[#4380d9] font-medium">
            {{ reply.userName?.charAt(0) }}
          </view>
          <view class="min-w-0 flex-1">
            <view class="flex items-center gap-8rpx">
              <text class="text-28rpx text-[#333] font-medium">{{ reply.userName }}</text>
              <text v-if="reply.userId === detail.userId" class="rounded-6rpx bg-[#edf4ff] px-8rpx py-2rpx text-20rpx text-[#4380d9]">
                楼主
              </text>
            </view>
            <view class="mt-4rpx text-22rpx text-[#94a3b8]">
              {{ formatDateTime(reply.createTime) }}
            </view>
          </view>
          <text class="shrink-0 text-22rpx text-[#999]">{{ floorNumber(index) }} 楼</text>
        </view>
        <view class="my-20rpx whitespace-pre-wrap break-words text-28rpx text-[#334155] leading-relaxed">
          {{ reply.content }}
        </view>
        <!-- 楼层操作 -->
        <view class="flex flex-wrap items-center gap-24rpx text-24rpx text-[#64748b]">
          <view class="flex items-center gap-6rpx" @click="handleReply(reply)">
            <wd-icon name="message" size="26rpx" />
            <text>回复</text>
          </view>
          <view class="flex items-center gap-6rpx" :class="{ 'text-[#1677ff]': reply.liked }" @click="handleReplyLike(reply)">
            <wd-icon :name="reply.liked ? 'thumb-up-fill' : 'thumb-up'" size="26rpx" />
            <text>{{ reply.liked ? '已赞' : '点赞' }} {{ reply.likeCount || 0 }}</text>
          </view>
          <text
            v-if="getChildReplies(reply).length"
            class="text-[#1677ff]"
            @click="toggleExpand(reply.id!)"
          >
            {{ expandedMap[reply.id!] ? '收起评论' : '展开评论' }}（{{ getChildReplies(reply).length }}）
          </text>
          <text
            v-if="detail.userId === currentUserId || isSuperAdmin"
            class="ml-auto text-[#94a3b8]"
            @click="handleDeleteReply(reply.id!)"
          >
            删除
          </text>
        </view>
        <!-- 点赞摘要，点击展开完整名单 -->
        <view
          v-if="reply.likeUserNames?.length"
          class="mt-8rpx text-24rpx text-[#999]"
          @click="handleShowLikers(reply)"
        >
          {{ reply.likeUserNames.slice(0, 3).join('、') }}<text v-if="(reply.likeCount || 0) > 3"> 等 {{ reply.likeCount }} 人觉得很赞</text><text v-else> 觉得很赞</text>
        </view>
        <!-- 楼层内评论 -->
        <view
          v-if="expandedMap[reply.id!] && getChildReplies(reply).length"
          class="mt-20rpx rounded-12rpx bg-[#f7f8fa] px-20rpx py-4rpx"
        >
          <view
            v-for="child in getChildReplies(reply)"
            :key="child.id"
            class="border-0 border-t border-[#f5f5f5] border-solid py-12rpx"
          >
            <view class="flex items-start gap-8rpx">
              <view class="h-32rpx w-32rpx flex shrink-0 items-center justify-center rounded-full bg-[#8cbcff] text-20rpx text-white">
                {{ child.userName?.charAt(0) }}
              </view>
              <view class="min-w-0 flex-1 break-words text-26rpx leading-normal">
                <text class="text-[#1677ff]">{{ child.userName }}</text>
                <text v-if="child.replyUserName" class="text-[#999]"> 回复 @{{ child.replyUserName }}</text>
                <text class="text-[#333]">：{{ child.content }}</text>
              </view>
            </view>
            <view class="mt-4rpx flex items-center gap-16rpx pl-40rpx text-22rpx text-[#999]">
              <text>{{ formatDateTime(child.createTime) }}</text>
              <text class="text-[#1677ff]" @click="handleReply(child)">回复</text>
              <text
                v-if="detail.userId === currentUserId || isSuperAdmin"
                class="text-[#f5222d]"
                @click="handleDeleteReply(child.id!)"
              >
                删除
              </text>
            </view>
          </view>
        </view>
        <!-- 在所选楼层内回复 -->
        <view v-if="replyTarget && replyRootId === reply.id" class="mt-12rpx">
          <wd-textarea
            v-model="inlineContent"
            :placeholder="`回复 ${replyTarget.userName}`"
            :maxlength="255"
            show-word-limit
          />
          <view class="mt-8rpx flex justify-end gap-16rpx">
            <wd-button size="small" variant="plain" :disabled="submitLoading" @click="handleCancelReply">
              取消
            </wd-button>
            <wd-button
              size="small"
              type="primary"
              :loading="submitLoading"
              :disabled="!inlineContent.trim()"
              @click="submitReply(replyTarget)"
            >
              发表回复
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 点赞人名单弹窗 -->
    <wd-popup v-model="likePopupVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-32rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          点赞人
        </view>
        <view class="break-words text-28rpx text-[#666] leading-relaxed">
          {{ currentLikers.join('、') }}
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { Discussion, DiscussionReply } from '@/api/oa/discussion'
import { computed, nextTick, reactive, ref, toRef } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createDiscussionLike, createDiscussionReply, deleteDiscussionLike, deleteDiscussionReply, getDiscussionReplyPage } from '@/api/oa/discussion'
import { useUserStore } from '@/store/user'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  detail: Discussion
}>()

const emit = defineEmits<{
  success: []
}>()

const dialog = useDialog()
const toast = useToast()
const detail = toRef(props, 'detail') // 讨论详情
const userStore = useUserStore()
const currentUserId = computed(() => userStore.userInfo?.userId) // 当前用户编号
const isSuperAdmin = computed(() => userStore.roles.includes('super_admin')) // 是否为超级管理员
const list = ref<DiscussionReply[]>([]) // 回复列表
const pagingRef = ref<any>() // 分页组件引用
const composing = ref(false) // 是否展开主回复输入区
const replyContent = ref('') // 主回复内容
const inlineContent = ref('') // 楼层内回复内容
const submitLoading = ref(false) // 回复提交状态
const replyTarget = ref<DiscussionReply>() // 被回复对象
const replyRootId = ref<number>() // 被回复对象所属楼层
const expandedMap = reactive<Record<number, boolean>>({}) // 楼层评论展开状态，默认收起
const replyScope = ref('all') // 回复查看范围
const replyScopes = [ // 回复范围选项
  { value: 'all', label: '全部回复' },
  { value: 'owner', label: '只看楼主' },
  { value: 'mine', label: '只看我的' },
]
const sortOrder = ref<'asc' | 'desc'>('asc') // 回复时间排序
const queryParams = ref<Record<string, any>>({}) // 回复查询参数
const likePopupVisible = ref(false) // 点赞人名单弹窗状态
const currentLikers = ref<string[]>([]) // 当前查看的点赞人名单
const mainReplyFocus = ref(false) // 主回复输入框聚焦状态

/** 展开并聚焦主回复输入框，供详情页「回复」入口调用 */
async function focusReply() {
  composing.value = true
  await nextTick()
  mainReplyFocus.value = true
}
defineExpose({ focusReply }) // 提供正文区回复入口

/** 收起主回复输入区，保留未提交的内容 */
function handleCancelMainReply() {
  composing.value = false
  mainReplyFocus.value = false
}

/** 楼层编号：移动端列表累加分页，按当前展示位置编号，不叠加页偏移 */
function floorNumber(index: number) {
  return index + 1
}

/** 查询回复列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.detail.id) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const userId = replyScope.value === 'owner'
      ? detail.value.userId
      : replyScope.value === 'mine'
        ? currentUserId.value
        : undefined
    const data = await getDiscussionReplyPage({
      ...queryParams.value,
      discussionId: props.detail.id,
      userId,
      pageNo,
      pageSize,
    }, sortOrder.value)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 回复查看范围切换 */
function handleScopeChange(scope: string) {
  if (replyScope.value === scope) {
    return
  }
  replyScope.value = scope
  reload()
}

/** 回复时间排序切换 */
function handleSortToggle() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  reload()
}

/** 展开或收起楼层评论 */
function toggleExpand(id: number) {
  expandedMap[id] = !expandedMap[id]
}

/** 获得楼层内的回复，保持父子关系顺序 */
function getChildReplies(reply: DiscussionReply): DiscussionReply[] {
  return (reply.children || []).flatMap(child => [child, ...getChildReplies(child)])
}

/** 设置回复对象 */
function handleReply(reply: DiscussionReply) {
  replyRootId.value = findRootId(reply)
  inlineContent.value = ''
  replyTarget.value = reply
}

/** 定位被回复对象所属楼层 */
function findRootId(reply: DiscussionReply) {
  if (list.value.some(item => item.id === reply.id)) {
    return reply.id!
  }
  const root = list.value.find(item => getChildReplies(item).some(child => child.id === reply.id))
  return root?.id
}

/** 取消楼层内回复 */
function handleCancelReply() {
  replyTarget.value = undefined
  replyRootId.value = undefined
  inlineContent.value = ''
}

/** 点赞或取消点赞主回复 */
async function handleReplyLike(reply: DiscussionReply) {
  if (reply.liked) {
    await deleteDiscussionLike(undefined, reply.id)
  } else {
    await createDiscussionLike(undefined, reply.id)
  }
  reload()
}

/** 查看点赞人名单 */
function handleShowLikers(reply: DiscussionReply) {
  currentLikers.value = reply.likeUserNames || []
  likePopupVisible.value = true
}

/** 发表主回复或楼层内回复 */
async function submitReply(target?: DiscussionReply) {
  if (submitLoading.value) {
    return
  }
  submitLoading.value = true
  try {
    await createDiscussionReply({
      discussionId: detail.value.id!,
      parentId: target?.id || 0,
      content: target ? inlineContent.value : replyContent.value,
    })
    toast.success('回复成功')
    if (target) {
      // 发表成功后展开所属楼层，便于查看刚提交的评论
      if (replyRootId.value) {
        expandedMap[replyRootId.value] = true
      }
      handleCancelReply()
    } else {
      replyContent.value = ''
      handleCancelMainReply()
    }
    reload()
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

/** 删除回复及其子回复 */
async function handleDeleteReply(id: number) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该回复吗？',
    })
  } catch {
    return
  }
  await deleteDiscussionReply(id)
  toast.success('删除成功')
  handleCancelReply()
  // 删空当前页且非首页时回退一页，否则仅刷新已加载页，保留浏览位置
  if (list.value.length === 1 && (pagingRef.value?.pageNo || 1) > 1) {
    pagingRef.value?.refreshToPage(pagingRef.value.pageNo - 1)
  } else {
    pagingRef.value?.refresh()
  }
  emit('success')
}
</script>
