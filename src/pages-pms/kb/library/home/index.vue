<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="library?.name || '知识库'" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="flex items-center gap-24rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <wd-icon name="search-line" size="38rpx" color="#333" @click="handleSearch" />
          <wd-icon
            v-if="library"
            :name="library.favoriteStatus ? 'star-fill' : 'star'"
            size="38rpx"
            :color="library.favoriteStatus ? '#fa8c16' : '#333'"
            @click="handleCollect"
          />
          <wd-icon name="more-vertical" size="38rpx" color="#333" @click="moreVisible = true" />
        </view>
      </template>
    </wd-navbar>

    <!-- 知识库简介 -->
    <view v-if="library" class="bg-white p-24rpx">
      <view class="rounded-8rpx bg-[#f7f8fa] p-20rpx text-26rpx text-[#666] leading-40rpx">
        {{ library.description || '暂无简介' }}
      </view>
    </view>

    <!-- 内容页签 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" @change="handleTabChange">
        <wd-tab title="全部文档" />
        <wd-tab title="我关注的" />
      </wd-tabs>
    </view>

    <!-- 目录树 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx pb-200rpx">
        <template v-if="tabIndex === 0">
          <view v-if="!treeData.length" class="py-80rpx text-center text-28rpx text-[#999]">
            暂无目录或文档
          </view>
          <TreeNode
            v-for="node in treeData"
            :key="node.key"
            :node="node"
            :level="0"
            :expanded-keys="expandedKeys"
            :manageable="Boolean(tree?.writeStatus)"
            @select="handleNodeTap"
            @toggle="handleNodeToggle"
            @more="handleNodeMore"
          />
        </template>
        <template v-else>
          <view v-if="!favoriteNodes.length" class="py-80rpx text-center text-28rpx text-[#999]">
            暂无关注内容
          </view>
          <view
            v-for="node in favoriteNodes"
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
          </view>
        </template>
      </view>
    </scroll-view>

    <!-- 新建按钮 -->
    <wd-fab
      v-if="tree?.writeStatus"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="createVisible = true"
    />

    <!-- 知识库更多操作 -->
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

    <!-- 目录节点更多操作 -->
    <wd-action-sheet
      v-model="nodeActionVisible"
      :actions="nodeActions"
      @select="handleNodeActionSelect"
    />

    <!-- 文件夹表单 -->
    <FolderFormPopup ref="folderFormRef" @success="getTree" />
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeTree } from '@/api/pms/kb/content/folder'
import type { KnowledgeInteractionItem } from '@/api/pms/kb/interaction/favorite'
import type { KnowledgeLibrary } from '@/api/pms/kb/library'
import type { KnowledgeTreeNode } from '@/pages-pms/kb/utils/tree'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteKnowledgeFolder, getKnowledgeFolder, getKnowledgeTree } from '@/api/pms/kb/content/folder'
import { deleteKnowledgeDocument } from '@/api/pms/kb/content/document'
import { createKnowledgeFavorite, deleteKnowledgeFavorite, getKnowledgeFavoriteList } from '@/api/pms/kb/interaction/favorite'
import { getKnowledgeLibrary } from '@/api/pms/kb/library'
import { exitKnowledgeLibrary } from '@/api/pms/kb/library/member'
import { useAccess } from '@/hooks/useAccess'
import { PmsKnowledgeDocumentType, PmsKnowledgeObjectType, PmsKnowledgeRootId } from '@/pages-pms/kb/utils/constants'
import {
  canDeleteKnowledgeContent,
  canEditKnowledgeContent,
  canManageKnowledgeContent,
} from '@/pages-pms/kb/utils/permission'
import { buildDocumentNode, buildFolderNode, getKnowledgeTreeNodeTypeName } from '@/pages-pms/kb/utils/tree'
import { navigateBackPlus } from '@/utils'
import FolderFormPopup from '../components/folder-form-popup.vue'
import TreeNode from '../components/tree-node.vue'

const props = defineProps<{
  libraryId?: number | any
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
const library = ref<KnowledgeLibrary>() // 知识库详情
const tree = ref<KnowledgeTree>() // 目录树
const tabIndex = ref(0) // 当前内容页签下标
const expandedKeys = ref<Set<string>>(new Set()) // 已展开节点标识
const favoriteItems = ref<KnowledgeInteractionItem[]>([]) // 当前知识库关注内容
const moreVisible = ref(false) // 知识库更多操作弹窗显示状态
const createVisible = ref(false) // 新建命令弹窗显示状态
const nodeActionVisible = ref(false) // 目录节点更多操作弹窗显示状态
const currentNode = ref<KnowledgeTreeNode>() // 当前操作的目录节点
const folderFormRef = ref<InstanceType<typeof FolderFormPopup>>() // 文件夹表单引用

const libraryId = computed(() => Number(props.libraryId)) // 知识库编号
const treeData = computed<KnowledgeTreeNode[]>(() => {
  if (!tree.value) {
    return []
  }
  return [
    ...tree.value.folders.map(buildFolderNode),
    ...tree.value.documents.map(buildDocumentNode),
  ]
}) // 目录树节点
const favoriteNodes = computed<KnowledgeTreeNode[]>(() =>
  favoriteItems.value
    .filter(item => item.type !== PmsKnowledgeObjectType.LIBRARY)
    .map(item => ({
      key: `${item.type === PmsKnowledgeObjectType.FOLDER ? 'folder' : 'document'}-${item.entityId}`,
      entityId: item.entityId,
      kind: item.type === PmsKnowledgeObjectType.FOLDER ? 'folder' : 'document',
      label: item.name,
      type: item.type,
      children: [],
    })),
) // 关注内容节点
const moreActions = computed(() => { // 知识库更多操作项
  if (!library.value) {
    return []
  }
  const actions: Array<{ name: string }> = []
  if (library.value.writeStatus && library.value.adminStatus && hasAccessByCodes(['pms:kb:library:update'])) {
    actions.push({ name: '成员管理' })
  }
  if (library.value.writeStatus && hasAccessByCodes(['pms:kb:library:delete'])) {
    actions.push({ name: '回收站' })
  }
  if (library.value.exitStatus) {
    actions.push({ name: '退出知识库' })
  }
  return actions
})
const createActions = [ // 新建命令
  { name: '新建文档' },
  { name: '新建文件夹' },
  { name: '上传文件' },
]
const nodeActions = computed(() => { // 目录节点更多操作项
  const node = currentNode.value
  if (!node) {
    return []
  }
  const actions: Array<{ name: string }> = []
  const canUpdate = hasAccessByCodes(['pms:kb:library:update'])
  const canDelete = hasAccessByCodes(['pms:kb:library:delete'])
  if (node.kind === 'folder' && canEditKnowledgeContent(node.currentUserLevel)) {
    actions.push({ name: '新建文档' }, { name: '新建文件夹' }, { name: '上传文件' })
  }
  if (canUpdate && canEditKnowledgeContent(node.currentUserLevel)) {
    actions.push({ name: '重命名' })
  }
  if (canUpdate && canManageKnowledgeContent(node.currentUserLevel)) {
    actions.push({ name: '移动' })
  }
  if (canDelete && canDeleteKnowledgeContent(node.currentUserLevel)) {
    actions.push({ name: '删除' })
  }
  return actions
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-pms/kb/library/index')
}

/** 查询页面数据 */
async function getPageData() {
  const [libraryData, treeDataValue] = await Promise.all([
    getKnowledgeLibrary(libraryId.value),
    getKnowledgeTree(libraryId.value),
  ])
  library.value = libraryData
  tree.value = treeDataValue
}

/** 查询目录树 */
async function getTree() {
  tree.value = await getKnowledgeTree(libraryId.value)
}

/** 查询当前知识库的关注内容 */
async function getFavoriteItems() {
  favoriteItems.value = await getKnowledgeFavoriteList(libraryId.value)
}

/** 切换内容页签 */
function handleTabChange() {
  if (tabIndex.value === 1) {
    getFavoriteItems()
  }
}

/** 打开目录节点 */
function handleNodeTap(node: KnowledgeTreeNode) {
  if (node.kind === 'folder') {
    uni.navigateTo({ url: `/pages-pms/kb/library/folder/index?libraryId=${libraryId.value}&id=${node.entityId}` })
    return
  }
  uni.navigateTo({ url: `/pages-pms/kb/library/document/index?id=${node.entityId}` })
}

/** 展开或折叠目录节点 */
function handleNodeToggle(key: string) {
  if (expandedKeys.value.has(key)) {
    expandedKeys.value.delete(key)
  } else {
    expandedKeys.value.add(key)
  }
  expandedKeys.value = new Set(expandedKeys.value)
}

/** 打开目录节点更多操作 */
function handleNodeMore(node: KnowledgeTreeNode) {
  currentNode.value = node
  nodeActionVisible.value = true
}

/** 目录节点更多操作选择 */
async function handleNodeActionSelect({ item: action }: { item: { name: string } }) {
  const node = currentNode.value
  if (!node) {
    return
  }
  if (action.name === '新建文档') {
    uni.navigateTo({ url: `/pages-pms/kb/library/document/form/index?libraryId=${libraryId.value}&folderId=${node.entityId}` })
    return
  }
  if (action.name === '新建文件夹') {
    folderFormRef.value?.open('create', libraryId.value, node.entityId)
    return
  }
  if (action.name === '上传文件') {
    uni.navigateTo({ url: `/pages-pms/kb/library/document/upload/index?libraryId=${libraryId.value}&folderId=${node.entityId}` })
    return
  }
  if (action.name === '移动') {
    uni.navigateTo({ url: `/pages-pms/kb/library/move/index?kind=${node.kind}&id=${node.entityId}` })
    return
  }
  if (action.name === '重命名') {
    if (node.kind === 'folder') {
      const folder = await getKnowledgeFolder(node.entityId)
      folderFormRef.value?.open('update', libraryId.value, folder.parentId, folder.id)
    } else {
      uni.navigateTo({ url: `/pages-pms/kb/library/document/form/index?id=${node.entityId}` })
    }
    return
  }
  // 删除目录节点
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
  await getTree()
}

/** 新建命令选择 */
function handleCreateSelect({ item: action }: { item: { name: string } }) {
  if (action.name === '新建文档') {
    uni.navigateTo({ url: `/pages-pms/kb/library/document/form/index?libraryId=${libraryId.value}` })
    return
  }
  if (action.name === '新建文件夹') {
    folderFormRef.value?.open('create', libraryId.value, PmsKnowledgeRootId)
    return
  }
  uni.navigateTo({ url: `/pages-pms/kb/library/document/upload/index?libraryId=${libraryId.value}` })
}

/** 搜索当前知识库文档 */
function handleSearch() {
  uni.navigateTo({ url: `/pages-pms/kb/search/index?libraryId=${libraryId.value}` })
}

/** 关注或取消关注知识库 */
async function handleCollect() {
  if (!library.value) {
    return
  }
  if (library.value.favoriteStatus) {
    await deleteKnowledgeFavorite(PmsKnowledgeObjectType.LIBRARY, library.value.id)
    toast.success('已取消关注')
  } else {
    await createKnowledgeFavorite({ type: PmsKnowledgeObjectType.LIBRARY, entityId: library.value.id })
    toast.success('关注成功')
  }
  library.value.favoriteStatus = !library.value.favoriteStatus
}

/** 知识库更多操作选择 */
async function handleMoreSelect({ item: action }: { item: { name: string } }) {
  if (!library.value) {
    return
  }
  if (action.name === '成员管理') {
    uni.navigateTo({ url: `/pages-pms/kb/library/member/index?libraryId=${libraryId.value}` })
    return
  }
  if (action.name === '回收站') {
    uni.navigateTo({ url: `/pages-pms/kb/recycle/index?libraryId=${libraryId.value}&tab=content` })
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确认退出知识库“${library.value.name}”吗？退出后将无法访问私有内容。` })
    await exitKnowledgeLibrary(libraryId.value)
    toast.success('已退出知识库')
    uni.$emit('pms:kb:library:reload')
    handleBack()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getPageData()
  uni.$on('pms:kb:content:reload', getTree)
})

/** 卸载 */
onUnload(() => {
  uni.$off('pms:kb:content:reload', getTree)
})
</script>
