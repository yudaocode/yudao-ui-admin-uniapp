<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="`移动${isFolder ? '文件夹' : '文档'}`"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <wd-cell-group border>
        <wd-cell title="当前内容" title-width="220rpx" :value="contentTitle" />
        <LibraryFormPicker
          v-model="formData.targetLibraryId"
          label="目标知识库"
          prop="targetLibraryId"
          @change="handleLibraryChange"
        />
        <wd-cell title="目标位置" title-width="220rpx" is-link :value="targetLabel" placeholder="请选择目标位置" @click="targetVisible = true" />
      </wd-cell-group>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="loading" @click="handleSubmit">
        确定
      </wd-button>
    </view>

    <!-- 目标位置选择 -->
    <wd-popup v-model="targetVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="flex flex-col" :style="{ maxHeight: '70vh' }">
        <view class="p-32rpx pb-16rpx text-center text-32rpx text-[#333] font-semibold">
          选择目标位置
        </view>
        <scroll-view scroll-y class="min-h-0 flex-1 px-32rpx">
          <view
            v-for="option in targetOptions"
            :key="option.value"
            class="flex items-center gap-12rpx py-20rpx"
            :class="option.disabled ? 'opacity-40' : ''"
            :style="{ paddingLeft: `${option.depth * 32}rpx` }"
            @click="handleTargetSelect(option)"
          >
            <wd-icon
              :name="option.kind === 'folder' ? 'folder' : option.kind === 'root' ? 'book' : 'textarea'"
              size="32rpx"
              :color="option.kind === 'document' ? '#1677ff' : '#fa8c16'"
            />
            <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">{{ option.label }}</text>
            <wd-icon v-if="formData.targetKey === option.value" name="check" size="32rpx" color="#1677ff" />
          </view>
          <wd-empty v-if="!targetOptions.length" description="暂无可移动位置" />
        </scroll-view>
        <view class="p-32rpx pt-16rpx">
          <wd-button block variant="plain" @click="targetVisible = false">
            取消
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeDocument, KnowledgeDocumentTreeNode } from '@/api/pms/kb/content/document'
import type { KnowledgeFolder, KnowledgeFolderTreeNode, KnowledgeTree } from '@/api/pms/kb/content/folder'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getKnowledgeDocument, moveKnowledgeDocument } from '@/api/pms/kb/content/document'
import { getKnowledgeFolder, getKnowledgeTree, moveKnowledgeFolder } from '@/api/pms/kb/content/folder'
import { PmsKnowledgeRootId } from '@/pages-pms/kb/utils/constants'
import { canManageKnowledgeContent } from '@/pages-pms/kb/utils/permission'
import { navigateBackPlus } from '@/utils'
import LibraryFormPicker from '../components/library-form-picker.vue'

interface TargetOption {
  value: string // 选项标识
  label: string // 选项名称
  kind: 'root' | 'folder' | 'document' // 位置类型
  entityId: number // 对象编号
  folderId: number // 所属文件夹编号
  depth: number // 缩进层级
  disabled?: boolean // 是否不可选择
}

const props = defineProps<{
  kind?: string // 内容类型：folder 文件夹；document 文档
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const loading = ref(false) // 提交中
const contentTitle = ref('') // 内容标题
const sourceLibraryId = ref(0) // 源知识库编号
const sourceParentId = ref(0) // 源父文件夹或父文档编号
const sourceFolderId = ref(0) // 源文档所属文件夹编号
const targetTree = ref<KnowledgeTree>() // 目标知识库目录树
const targetVisible = ref(false) // 目标位置弹窗显示状态
const formData = reactive({
  targetLibraryId: undefined as number | undefined,
  targetKey: '',
}) // 表单数据

const isFolder = computed(() => props.kind === 'folder') // 是否移动文件夹
const targetOptions = computed<TargetOption[]>(() => {
  if (!targetTree.value) {
    return []
  }
  const root: TargetOption = {
    value: 'root',
    label: '知识库根目录',
    kind: 'root',
    entityId: PmsKnowledgeRootId,
    folderId: PmsKnowledgeRootId,
    depth: 0,
    disabled: !targetTree.value.manageStatus,
  }
  return [
    root,
    ...flattenFolderOptions(targetTree.value.folders, 1),
    ...(isFolder.value ? [] : flattenDocumentOptions(targetTree.value.documents, PmsKnowledgeRootId, 1)),
  ]
}) // 目标位置选项
const targetLabel = computed(() =>
  targetOptions.value.find(item => item.value === formData.targetKey)?.label || '',
) // 目标位置文案

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 展开文件夹选项 */
function flattenFolderOptions(folders: KnowledgeFolderTreeNode[], depth: number): TargetOption[] {
  const result: TargetOption[] = []
  for (const folder of folders) {
    const isSourceOrDescendant = isFolder.value
      && formData.targetLibraryId === sourceLibraryId.value
      && isSourceFolderOrDescendant(folder.id)
    result.push({
      value: `folder-${folder.id}`,
      label: folder.title,
      kind: 'folder',
      entityId: folder.id,
      folderId: folder.id,
      depth,
      disabled: !canManageKnowledgeContent(folder.currentUserLevel) || isSourceOrDescendant,
    })
    result.push(...flattenFolderOptions(folder.children, depth + 1))
    if (!isFolder.value) {
      result.push(...flattenDocumentOptions(folder.documents, folder.id, depth + 1))
    }
  }
  return result
}

/** 展开文档选项 */
function flattenDocumentOptions(documents: KnowledgeDocumentTreeNode[], folderId: number, depth: number): TargetOption[] {
  const result: TargetOption[] = []
  for (const document of documents) {
    const isSourceOrDescendant = formData.targetLibraryId === sourceLibraryId.value
      && isSourceDocumentOrDescendant(document.id)
    result.push({
      value: `document-${document.id}`,
      label: document.title,
      kind: 'document',
      entityId: document.id,
      folderId,
      depth,
      disabled: !canManageKnowledgeContent(document.currentUserLevel) || isSourceOrDescendant,
    })
    result.push(...flattenDocumentOptions(document.children, folderId, depth + 1))
  }
  return result
}

/** 判断目录树是否包含文件夹 */
function containsFolder(folder: KnowledgeFolderTreeNode, id: number): boolean {
  return folder.id === id || folder.children.some(child => containsFolder(child, id))
}

/** 查找文件夹 */
function findFolder(folders: KnowledgeFolderTreeNode[], id: number): KnowledgeFolderTreeNode | undefined {
  for (const folder of folders) {
    if (folder.id === id) {
      return folder
    }
    const child = findFolder(folder.children, id)
    if (child) {
      return child
    }
  }
  return undefined
}

/** 判断是否为源文件夹或其子文件夹 */
function isSourceFolderOrDescendant(targetId: number) {
  const sourceFolder = findFolder(targetTree.value?.folders || [], Number(props.id))
  return sourceFolder ? containsFolder(sourceFolder, targetId) : false
}

/** 判断目录树是否包含文档 */
function containsDocument(document: KnowledgeDocumentTreeNode, id: number): boolean {
  return document.id === id || document.children.some(child => containsDocument(child, id))
}

/** 收集文件夹中的文档 */
function collectFolderDocuments(folder: KnowledgeFolderTreeNode): KnowledgeDocumentTreeNode[] {
  return [...folder.documents, ...folder.children.flatMap(collectFolderDocuments)]
}

/** 判断是否为源文档或其子文档 */
function isSourceDocumentOrDescendant(targetId: number) {
  const documents = [
    ...(targetTree.value?.documents || []),
    ...(targetTree.value?.folders.flatMap(folder => collectFolderDocuments(folder)) || []),
  ]
  const sourceDocument = findDocument(documents, Number(props.id))
  return sourceDocument ? containsDocument(sourceDocument, targetId) : false
}

/** 查找文档 */
function findDocument(documents: KnowledgeDocumentTreeNode[], id: number): KnowledgeDocumentTreeNode | undefined {
  for (const document of documents) {
    if (document.id === id) {
      return document
    }
    const child = findDocument(document.children, id)
    if (child) {
      return child
    }
  }
  return undefined
}

/** 加载目标目录树 */
async function loadTargetTree() {
  formData.targetKey = ''
  if (!formData.targetLibraryId) {
    targetTree.value = undefined
    return
  }
  targetTree.value = await getKnowledgeTree(formData.targetLibraryId)
}

/** 切换目标知识库 */
function handleLibraryChange() {
  loadTargetTree()
}

/** 选择目标位置 */
function handleTargetSelect(option: TargetOption) {
  if (option.disabled) {
    toast.warning('当前账号不能移动到该位置')
    return
  }
  formData.targetKey = option.value
  targetVisible.value = false
}

/** 提交表单 */
async function handleSubmit() {
  const target = targetOptions.value.find(item => item.value === formData.targetKey)
  if (!formData.targetLibraryId) {
    toast.warning('请选择目标知识库')
    return
  }
  if (!target) {
    toast.warning('请选择目标位置')
    return
  }

  loading.value = true
  try {
    const contentId = Number(props.id)
    if (isFolder.value) {
      if (formData.targetLibraryId === sourceLibraryId.value && target.entityId === sourceParentId.value) {
        toast.warning('内容已在当前目录')
        return
      }
      await moveKnowledgeFolder({
        id: contentId,
        targetLibraryId: formData.targetLibraryId,
        targetParentId: target.entityId,
      })
    } else {
      const targetFolderId = target.kind === 'folder' ? target.entityId : target.folderId
      const targetParentId = target.kind === 'document' ? target.entityId : PmsKnowledgeRootId
      if (
        formData.targetLibraryId === sourceLibraryId.value
        && targetFolderId === sourceFolderId.value
        && targetParentId === sourceParentId.value
      ) {
        toast.warning('内容已在当前目录')
        return
      }
      await moveKnowledgeDocument({
        id: contentId,
        targetLibraryId: formData.targetLibraryId,
        targetFolderId,
        targetParentId,
      })
    }
    toast.success('移动成功')
    uni.$emit('pms:kb:content:reload')
    navigateBackPlus('/pages-pms/kb/library/index')
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  if (!props.id) {
    return
  }
  let content: KnowledgeFolder | KnowledgeDocument
  if (isFolder.value) {
    content = await getKnowledgeFolder(Number(props.id))
    sourceFolderId.value = PmsKnowledgeRootId
  } else {
    content = await getKnowledgeDocument(Number(props.id))
    sourceFolderId.value = (content as KnowledgeDocument).folderId
  }
  contentTitle.value = content.title
  sourceLibraryId.value = content.libraryId
  sourceParentId.value = content.parentId
  formData.targetLibraryId = content.libraryId
  await loadTargetTree()
})
</script>
