<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="folder?.title || '文件夹'" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="flex items-center gap-24rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <wd-icon
            v-if="folder"
            :name="folder.favoriteStatus ? 'star-fill' : 'star'"
            size="38rpx"
            :color="folder.favoriteStatus ? '#fa8c16' : '#333'"
            @click="handleCollect"
          />
          <wd-icon v-if="folder" name="more-vertical" size="38rpx" color="#333" @click="moreVisible = true" />
        </view>
      </template>
    </wd-navbar>

    <!-- 文件夹信息 -->
    <view v-if="folder" class="bg-white p-24rpx">
      <view class="text-26rpx text-[#999]">
        创建于 {{ formatDate(folder.createTime) || '-' }} · 子文件夹 {{ folder.childFolderCount ?? 0 }} 个 · 文档 {{ folder.documentCount ?? 0 }} 篇
      </view>
    </view>

    <!-- 文件夹直属内容 -->
    <view class="px-24rpx py-16rpx text-28rpx text-[#666] font-semibold">
      文件夹内容
    </view>
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="px-24rpx pb-200rpx">
        <view v-if="!children.length" class="py-80rpx text-center text-28rpx text-[#999]">
          该文件夹暂无内容
        </view>
        <view
          v-for="node in children"
          :key="node.key"
          class="mb-12rpx flex items-center gap-12rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleNodeTap(node)"
        >
          <wd-icon
            :name="node.kind === 'folder' ? 'folder' : node.type === PmsKnowledgeDocumentType.FILE ? 'file' : 'textarea'"
            size="32rpx"
            :color="node.kind === 'folder' ? '#fa8c16' : '#1677ff'"
            class="shrink-0"
          />
          <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">{{ node.label }}</text>
          <text class="shrink-0 text-24rpx text-[#999]">{{ getKnowledgeTreeNodeTypeName(node) }}</text>
          <wd-icon
            name="more-vertical" size="32rpx" color="#999"
            class="shrink-0"
            @click.stop="handleNodeMore(node)"
          />
        </view>
      </view>
    </scroll-view>

    <!-- 新建按钮 -->
    <wd-fab
      v-if="canCreate"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="createVisible = true"
    />

    <!-- 文件夹更多操作 -->
    <wd-action-sheet
      v-model="moreVisible"
      :actions="moreActions"
      @select="handleMoreSelect"
    />

    <!-- 新建命令 -->
    <wd-action-sheet
      v-model="createVisible"
      :actions="createActions"
      @select="handleCreateSelect"
    />

    <!-- 内容节点更多操作 -->
    <wd-action-sheet
      v-model="nodeActionVisible"
      :actions="nodeActions"
      @select="handleNodeActionSelect"
    />

    <!-- 文件夹表单 -->
    <FolderFormPopup ref="folderFormRef" @success="getPageData" />
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeFolder } from '@/api/pms/kb/content/folder'
import type { KnowledgeTreeNode } from '@/pages-pms/kb/utils/tree'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteKnowledgeFolder, getKnowledgeFolder, getKnowledgeTree } from '@/api/pms/kb/content/folder'
import { deleteKnowledgeDocument } from '@/api/pms/kb/content/document'
import { createKnowledgeFavorite, deleteKnowledgeFavorite } from '@/api/pms/kb/interaction/favorite'
import { useAccess } from '@/hooks/useAccess'
import { PmsKnowledgeDocumentType, PmsKnowledgeObjectType } from '@/pages-pms/kb/utils/constants'
import {
  canDeleteKnowledgeContent,
  canEditKnowledgeContent,
  canManageKnowledgeContent,
} from '@/pages-pms/kb/utils/permission'
import { buildDocumentNode, buildFolderNode, findTreeNode, getKnowledgeTreeNodeTypeName } from '@/pages-pms/kb/utils/tree'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import FolderFormPopup from '../components/folder-form-popup.vue'

const props = defineProps<{
  libraryId?: number | any
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
const folder = ref<KnowledgeFolder>() // 文件夹详情
const children = ref<KnowledgeTreeNode[]>([]) // 文件夹直属内容
const moreVisible = ref(false) // 文件夹更多操作弹窗显示状态
const createVisible = ref(false) // 新建命令弹窗显示状态
const nodeActionVisible = ref(false) // 内容节点更多操作弹窗显示状态
const currentNode = ref<KnowledgeTreeNode>() // 当前操作的内容节点
const folderFormRef = ref<InstanceType<typeof FolderFormPopup>>() // 文件夹表单引用

const folderId = computed(() => Number(props.id)) // 文件夹编号
const canManage = computed(() => canManageKnowledgeContent(folder.value?.currentUserLevel)) // 是否可管理协作权限和目录
const canCreate = computed(() =>
  Boolean(folder.value && canEditKnowledgeContent(folder.value.currentUserLevel)),
) // 是否可新建内容
const moreActions = computed(() => { // 文件夹更多操作项
  if (!folder.value) {
    return []
  }
  const actions: Array<{ name: string }> = []
  const canUpdate = hasAccessByCodes(['pms:kb:library:update'])
  if (canManage.value && canUpdate) {
    actions.push({ name: '协作权限' })
  }
  if (canUpdate && canEditKnowledgeContent(folder.value.currentUserLevel)) {
    actions.push({ name: '重命名' })
  }
  if (canManage.value && canUpdate) {
    actions.push({ name: '移动' })
  }
  if (hasAccessByCodes(['pms:kb:library:delete']) && canDeleteKnowledgeContent(folder.value.currentUserLevel)) {
    actions.push({ name: '删除' })
  }
  return actions
})
const createActions = [ // 新建命令
  { name: '新建文档' },
  { name: '新建文件夹' },
  { name: '上传文件' },
]
const nodeActions = computed(() => { // 内容节点更多操作项
  const node = currentNode.value
  if (!node) {
    return []
  }
  const actions: Array<{ name: string }> = []
  const canUpdate = hasAccessByCodes(['pms:kb:library:update'])
  if (canUpdate && canEditKnowledgeContent(node.currentUserLevel)) {
    actions.push({ name: node.kind === 'folder' ? '重命名' : '编辑' })
  }
  if (canUpdate && canManageKnowledgeContent(node.currentUserLevel)) {
    actions.push({ name: '移动' })
  }
  if (hasAccessByCodes(['pms:kb:library:delete']) && canDeleteKnowledgeContent(node.currentUserLevel)) {
    actions.push({ name: '删除' })
  }
  return actions
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询页面数据 */
async function getPageData() {
  const [folderData, tree] = await Promise.all([
    getKnowledgeFolder(folderId.value, true),
    getKnowledgeTree(Number(props.libraryId)),
  ])
  folder.value = folderData
  const treeData = [
    ...tree.folders.map(buildFolderNode),
    ...tree.documents.map(buildDocumentNode),
  ]
  children.value = findTreeNode(treeData, `folder-${folderId.value}`)?.children ?? []
}

/** 打开内容节点 */
function handleNodeTap(node: KnowledgeTreeNode) {
  if (node.kind === 'folder') {
    uni.navigateTo({ url: `/pages-pms/kb/library/folder/index?libraryId=${props.libraryId}&id=${node.entityId}` })
    return
  }
  uni.navigateTo({ url: `/pages-pms/kb/library/document/index?id=${node.entityId}` })
}

/** 关注或取消关注文件夹 */
async function handleCollect() {
  if (!folder.value) {
    return
  }
  if (folder.value.favoriteStatus) {
    await deleteKnowledgeFavorite(PmsKnowledgeObjectType.FOLDER, folder.value.id)
    toast.success('已取消关注')
  } else {
    await createKnowledgeFavorite({ type: PmsKnowledgeObjectType.FOLDER, entityId: folder.value.id })
    toast.success('关注成功')
  }
  folder.value.favoriteStatus = !folder.value.favoriteStatus
}

/** 文件夹更多操作选择 */
async function handleMoreSelect({ item: action }: { item: { name: string } }) {
  if (!folder.value) {
    return
  }
  if (action.name === '协作权限') {
    uni.navigateTo({ url: `/pages-pms/kb/library/permission/index?id=${folder.value.permissionId}` })
    return
  }
  if (action.name === '重命名') {
    folderFormRef.value?.open('update', folder.value.libraryId, folder.value.parentId, folder.value.id)
    return
  }
  if (action.name === '移动') {
    uni.navigateTo({ url: `/pages-pms/kb/library/move/index?kind=folder&id=${folder.value.id}` })
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确认删除文件夹“${folder.value.title}”及其全部内容吗？` })
    await deleteKnowledgeFolder(folder.value.id)
    toast.success('删除成功')
    uni.$emit('pms:kb:content:reload')
    handleBack()
  } catch {}
}

/** 新建命令选择 */
function handleCreateSelect({ item: action }: { item: { name: string } }) {
  if (action.name === '新建文档') {
    uni.navigateTo({ url: `/pages-pms/kb/library/document/form/index?libraryId=${props.libraryId}&folderId=${folderId.value}` })
    return
  }
  if (action.name === '新建文件夹') {
    folderFormRef.value?.open('create', Number(props.libraryId), folderId.value)
    return
  }
  uni.navigateTo({ url: `/pages-pms/kb/library/document/upload/index?libraryId=${props.libraryId}&folderId=${folderId.value}` })
}

/** 打开内容节点更多操作 */
function handleNodeMore(node: KnowledgeTreeNode) {
  currentNode.value = node
  nodeActionVisible.value = true
}

/** 内容节点更多操作选择 */
async function handleNodeActionSelect({ item: action }: { item: { name: string } }) {
  const node = currentNode.value
  if (!node) {
    return
  }
  if (action.name === '编辑' || action.name === '重命名') {
    if (node.kind === 'folder') {
      folderFormRef.value?.open('update', Number(props.libraryId), node.entityId === folderId.value ? 0 : folderId.value, node.entityId)
    } else {
      uni.navigateTo({ url: `/pages-pms/kb/library/document/form/index?id=${node.entityId}` })
    }
    return
  }
  if (action.name === '移动') {
    uni.navigateTo({ url: `/pages-pms/kb/library/move/index?kind=${node.kind}&id=${node.entityId}` })
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除${getKnowledgeTreeNodeTypeName(node)}“${node.label}”${node.kind === 'folder' ? '及其全部内容' : '及其子文档'}吗？`,
    })
  } catch {
    return
  }
  if (node.kind === 'folder') {
    await deleteKnowledgeFolder(node.entityId)
  } else {
    await deleteKnowledgeDocument(node.entityId)
  }
  toast.success('删除成功')
  await getPageData()
  uni.$emit('pms:kb:content:reload')
}

/** 初始化 */
onMounted(() => {
  getPageData()
  uni.$on('pms:kb:content:reload', getPageData)
})

/** 卸载 */
onUnload(() => {
  uni.$off('pms:kb:content:reload', getPageData)
})
</script>
