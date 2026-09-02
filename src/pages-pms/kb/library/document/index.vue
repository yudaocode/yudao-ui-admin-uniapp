<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="document?.title || '文档详情'" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="flex items-center gap-24rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <wd-icon
            v-if="document"
            :name="document.favoriteStatus ? 'star-fill' : 'star'"
            size="38rpx"
            :color="document.favoriteStatus ? '#fa8c16' : '#333'"
            @click="handleCollect"
          />
        </view>
      </template>
    </wd-navbar>

    <scroll-view v-if="document" scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx pb-200rpx">
        <!-- 文档信息 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-8rpx text-36rpx text-[#333] font-semibold leading-48rpx">
            {{ document.title }}
          </view>
          <view class="flex items-center gap-12rpx text-24rpx text-[#999]">
            <text v-if="document.creatorUserName">{{ document.creatorUserName }} 创建于</text>
            <text>{{ formatDate(document.createTime) }}</text>
            <wd-tag :type="document.status === PmsKnowledgeDocumentStatus.NORMAL ? 'success' : 'default'" plain>
              {{ getKnowledgeDocumentStatusName(document.status) }}
            </wd-tag>
          </view>
          <view v-if="labels.length" class="mt-16rpx flex flex-wrap gap-12rpx">
            <view
              v-for="label in labels"
              :key="label.id"
              class="rounded-4rpx px-12rpx py-2rpx text-24rpx"
              :style="{ color: label.color, border: `2rpx solid ${label.color}`, backgroundColor: `${label.color}14` }"
            >
              {{ label.name }}
            </view>
          </view>
        </view>

        <!-- 文档正文或文件预览 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <template v-if="document.type === PmsKnowledgeDocumentType.RICH_TEXT">
            <!-- 富文本消毒后渲染；纯文本（移动端自产）用 pre-wrap 保留换行 -->
            <rich-text v-if="document.content && isHtmlContent(document.content)" :nodes="sanitizeRichText(document.content)" />
            <view v-else-if="document.content" class="whitespace-pre-wrap break-all text-28rpx text-[#333]">
              {{ document.content }}
            </view>
            <view v-else class="text-28rpx text-[#999]">
              暂无内容
            </view>
          </template>
          <template v-else>
            <template v-if="document.content">
              <view class="mb-16rpx flex items-center gap-12rpx">
                <wd-tag type="default" plain>
                  {{ document.fileType || '文件' }}
                </wd-tag>
                <text v-if="document.fileSize !== undefined" class="text-24rpx text-[#999]">
                  {{ formatKnowledgeFileSize(document.fileSize) }}
                </text>
              </view>
              <wd-button block variant="plain" @click="handlePreview">
                在线预览文件
              </wd-button>
              <wd-button
                v-if="document.downloadStatus"
                class="mt-16rpx" block type="primary" variant="plain"
                @click="handleDownload"
              >
                下载文件
              </wd-button>
              <view v-else class="mt-12rpx text-24rpx text-[#999]">
                当前角色仅可在线预览
              </view>
            </template>
            <view v-else class="py-40rpx text-center text-28rpx text-[#999]">
              文件未上传
            </view>
          </template>
        </view>

        <!-- 点赞（仅富文本文档支持互动） -->
        <view v-if="document.type === PmsKnowledgeDocumentType.RICH_TEXT" class="mb-24rpx flex items-center gap-16rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="flex items-center gap-8rpx" @click="handleLike">
            <wd-icon
              :name="document.likeStatus ? 'thumb-up-fill' : 'thumb-up'"
              size="36rpx"
              :color="document.likeStatus ? '#1677ff' : '#999'"
            />
            <text class="text-26rpx" :class="document.likeStatus ? 'text-[#1677ff]' : 'text-[#999]'">
              {{ document.likeStatus ? '取消点赞' : '点赞' }}
            </text>
          </view>
          <text v-if="likeSummary" class="text-24rpx text-[#999]">{{ likeSummary }}</text>
          <view v-for="user in document.likeUsers.slice(0, 5)" :key="user.id" class="h-40rpx w-40rpx flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f7f8fa]">
            <wd-img v-if="user.avatar" :src="user.avatar" width="40rpx" height="40rpx" radius="50%" />
            <text v-else class="text-22rpx text-[#666]">{{ user.nickname?.slice(0, 1) || '-' }}</text>
          </view>
        </view>

        <!-- 文档评论 -->
        <view v-if="document.type === PmsKnowledgeDocumentType.RICH_TEXT" class="rounded-12rpx bg-[#f7f8fa] p-24rpx">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            评论
          </view>
          <DocumentComment :document-id="document.id" />
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作 -->
    <view v-if="document && (canEdit || moreActions.length)" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="canEdit && hasAccessByCodes(['pms:kb:library:update'])"
          type="primary" class="flex-1"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="canEdit && hasAccessByCodes(['pms:kb:library:update'])"
          class="flex-1"
          @click="sharePopupRef?.open(document.id)"
        >
          分享
        </wd-button>
        <wd-button v-if="moreActions.length" variant="plain" class="flex-1" @click="moreVisible = true">
          更多
        </wd-button>
      </view>
    </view>

    <!-- 更多操作 -->
    <wd-action-sheet
      v-model="moreVisible"
      :actions="moreActions"
      @select="handleMoreSelect"
    />

    <!-- 文档分享 -->
    <DocumentSharePopup ref="sharePopupRef" />
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeDocument } from '@/api/pms/kb/content/document'
import type { KnowledgeDocumentLabel } from '@/api/pms/kb/content/document/label'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteKnowledgeDocument, getKnowledgeDocument } from '@/api/pms/kb/content/document'
import { getKnowledgeDocumentLabelList } from '@/api/pms/kb/content/document/label'
import { createKnowledgeFavorite, deleteKnowledgeFavorite } from '@/api/pms/kb/interaction/favorite'
import { createKnowledgeDocumentLike, deleteKnowledgeDocumentLike } from '@/api/pms/kb/interaction/like'
import { useAccess } from '@/hooks/useAccess'
import {
  PmsKnowledgeContentLevel,
  PmsKnowledgeDocumentStatus,
  PmsKnowledgeDocumentType,
} from '@/pages-pms/kb/utils/constants'
import { formatKnowledgeFileSize, getKnowledgeDocumentStatusName } from '@/pages-pms/kb/utils/format'
import { canDeleteKnowledgeContent, canEditKnowledgeContent } from '@/pages-pms/kb/utils/permission'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { isHtmlContent, sanitizeRichText } from '@/utils/format'
import { openAttachment, openFile } from '@/utils/download'
import { useUserStore } from '@/store/user'
import DocumentComment from '../components/document-comment.vue'
import DocumentSharePopup from '../components/document-share-popup.vue'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const document = ref<KnowledgeDocument>() // 文档详情
const labelList = ref<KnowledgeDocumentLabel[]>([]) // 文档标签列表
const moreVisible = ref(false) // 更多操作弹窗显示状态
const sharePopupRef = ref<InstanceType<typeof DocumentSharePopup>>() // 分享弹窗引用

const labels = computed(() => { // 当前文档标签
  const labelIds = new Set(document.value?.labelIds ?? [])
  return labelList.value.filter(item => labelIds.has(item.id))
})
const canEdit = computed(() => canEditKnowledgeContent(document.value?.currentUserLevel)) // 是否可编辑文档
const canManage = computed(() => document.value?.currentUserLevel === PmsKnowledgeContentLevel.MANAGE) // 是否可管理协作权限
const moreActions = computed(() => { // 更多操作项
  if (!document.value) {
    return []
  }
  const actions: Array<{ name: string }> = []
  // 文档支持树形层级：可编辑时提供新建子文档/上传子文件（parentId 为当前文档）
  if (canEdit.value && hasAccessByCodes(['pms:kb:library:update'])) {
    actions.push({ name: '新建子文档' }, { name: '上传子文件' })
  }
  if (canManage.value && hasAccessByCodes(['pms:kb:library:update'])) {
    actions.push({ name: '协作权限' }, { name: '移动' })
  }
  if (hasAccessByCodes(['pms:kb:library:delete']) && canDeleteKnowledgeContent(document.value.currentUserLevel)) {
    actions.push({ name: '删除' })
  }
  return actions
})
const likeSummary = computed(() => { // 点赞摘要文案
  if (!document.value) {
    return ''
  }
  const likeUsers = document.value.likeUsers.filter(user => user.nickname)
  const loginUserId = useUserStore().userInfo.userId
  if (document.value.likeStatus) {
    const otherCount = likeUsers.filter(user => user.id !== loginUserId).length
    return otherCount > 0 ? `您和其他 ${otherCount} 人` : '您赞了该文档'
  }
  return likeUsers.length > 0 ? `${likeUsers.length} 人赞了该文档` : ''
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const [documentData, labels] = await Promise.all([
    getKnowledgeDocument(Number(props.id), true),
    getKnowledgeDocumentLabelList(),
  ])
  document.value = documentData
  labelList.value = labels
}

/** 关注或取消关注文档 */
async function handleCollect() {
  if (!document.value) {
    return
  }
  if (document.value.favoriteStatus) {
    await deleteKnowledgeFavorite(document.value.type, document.value.id)
    toast.success('已取消关注')
  } else {
    await createKnowledgeFavorite({ type: document.value.type, entityId: document.value.id })
    toast.success('关注成功')
  }
  document.value.favoriteStatus = !document.value.favoriteStatus
}

/** 点赞或取消点赞文档 */
async function handleLike() {
  if (!document.value) {
    return
  }
  if (document.value.likeStatus) {
    await deleteKnowledgeDocumentLike(document.value.id)
  } else {
    await createKnowledgeDocumentLike(document.value.id)
  }
  document.value = await getKnowledgeDocument(document.value.id)
}

/** 在线预览文件 */
function handlePreview() {
  if (!document.value) {
    return
  }
  openFile(document.value.previewUrl || document.value.content)
}

/** 下载文件 */
function handleDownload() {
  if (!document.value) {
    return
  }
  openAttachment(document.value.content)
}

/** 编辑文档 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-pms/kb/library/document/form/index?id=${document.value?.id}` })
}

/** 更多操作选择 */
async function handleMoreSelect({ item: action }: { item: { name: string } }) {
  if (!document.value) {
    return
  }
  // 新建子内容：以当前文档为父级（parentId），落在同一知识库、不归属文件夹
  if (action.name === '新建子文档') {
    uni.navigateTo({ url: `/pages-pms/kb/library/document/form/index?libraryId=${document.value.libraryId}&parentId=${document.value.id}` })
    return
  }
  if (action.name === '上传子文件') {
    uni.navigateTo({ url: `/pages-pms/kb/library/document/upload/index?libraryId=${document.value.libraryId}&parentId=${document.value.id}` })
    return
  }
  if (action.name === '协作权限') {
    uni.navigateTo({ url: `/pages-pms/kb/library/permission/index?id=${document.value.permissionId}` })
    return
  }
  if (action.name === '移动') {
    uni.navigateTo({ url: `/pages-pms/kb/library/move/index?kind=document&id=${document.value.id}` })
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确认删除文档“${document.value.title}”及其子文档吗？` })
    await deleteKnowledgeDocument(document.value.id)
    toast.success('删除成功')
    uni.$emit('pms:kb:content:reload')
    handleBack()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('pms:kb:document:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('pms:kb:document:reload', getDetail)
})
</script>
