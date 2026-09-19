<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="企业云盘"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 云盘概览 -->
    <Storage :storage="storage" />

    <!-- 范围页签 -->
    <wd-tabs v-model="tabIndex" @change="handleTabChange">
      <wd-tab
        v-for="tab in scopeTabs"
        :key="tab.value"
        :title="tab.title"
      />
    </wd-tabs>

    <!-- 搜索组件 -->
    <SearchForm :show-category="scope !== OA_FILE_SCOPE.RECYCLE" @search="handleQuery" @reset="handleReset" />

    <!-- 新建与上传 -->
    <view v-if="canCreate" class="flex gap-16rpx bg-white px-24rpx py-16rpx">
      <wd-button
        v-if="hasAccessByCodes(['oa:file:create'])"
        class="flex-1" variant="plain" @click="openNodeForm('create')"
      >
        新建文件夹
      </wd-button>
      <FileUpload
        v-if="hasAccessByCodes(['oa:file:create'])"
        class="flex-1"
        :parent-id="currentParentId"
        @success="handleSuccess"
      />
    </view>

    <!-- 目录面包屑 -->
    <view class="flex items-center gap-8rpx overflow-x-auto whitespace-nowrap bg-white px-24rpx py-12rpx text-26rpx">
      <template v-for="(item, index) in paths" :key="item.id">
        <text
          :class="index === paths.length - 1 ? 'text-[#333]' : 'text-[#1677ff]'"
          @click="handlePath(index)"
        >
          {{ item.name }}
        </text>
        <text v-if="index < paths.length - 1" class="text-[#999]">/</text>
      </template>
    </view>

    <!-- 文件列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="20"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无文件"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-16rpx flex items-center gap-16rpx rounded-12rpx bg-white p-24rpx"
          @click="handleOpen(item)"
        >
          <wd-icon
            :name="item.type === OA_FILE_NODE_TYPE.FOLDER ? 'folder' : 'file'"
            size="44rpx"
            :color="item.type === OA_FILE_NODE_TYPE.FOLDER ? '#e6a23c' : '#1677ff'"
          />
          <view class="min-w-0 flex-1">
            <view class="line-clamp-1 text-28rpx text-[#333]">
              {{ item.name }}
              <wd-icon v-if="item.favorite" name="star-fill" size="24rpx" color="#f7ba2a" />
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              <text v-if="item.type === OA_FILE_NODE_TYPE.FILE">{{ formatFileSize(item.size || 0) }} · </text>
              {{ formatDateTime(item.createTime) }}
            </view>
          </view>
          <!-- 回收站操作 -->
          <view v-if="scope === OA_FILE_SCOPE.RECYCLE" class="flex shrink-0 gap-12rpx" @click.stop>
            <wd-button
              v-if="hasAccessByCodes(['oa:file:delete'])"
              size="small" variant="plain" @click="handleRestore(item)"
            >
              恢复
            </wd-button>
            <wd-button
              v-if="hasAccessByCodes(['oa:file:delete'])"
              size="small" type="danger" variant="plain" @click="handleDelete(item)"
            >
              彻底删除
            </wd-button>
          </view>
          <wd-icon v-else name="more" size="36rpx" color="#999" @click.stop="handleMore(item)" />
        </view>
      </view>
    </z-paging>

    <!-- 更多操作 -->
    <wd-action-sheet
      v-model="moreVisible"
      :actions="moreActions"
      @select="handleMoreSelect"
    />

    <!-- 新建、重命名、移动及复制弹窗 -->
    <NodeForm ref="nodeFormRef" @success="handleSuccess" />
    <!-- 共享设置弹窗 -->
    <PermissionList ref="permissionRef" @success="handleSuccess" />
  </view>
</template>

<script lang="ts" setup>
import type { FileNode, FileStorage } from '@/api/oa/file'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createFileFavorite,
  deleteFileFavorite,
  deleteFileNode,
  getFileNode,
  getFileNodePage,
  getFileStorage,
  recycleFileNode,
  restoreFileNode,
} from '@/api/oa/file'
import { useAccess } from '@/hooks/useAccess'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { downloadBlobH5, formatFileSize, getFileNameFromUrl, openAttachment, staticUrl } from '@/utils/download'
import {
  OA_FILE_NODE_TYPE,
  OA_FILE_PARENT_ID_ROOT,
  OA_FILE_PERMISSION_LEVEL,
  OA_FILE_SCOPE,
} from '../utils/constants'
import FileUpload from './components/file-upload.vue'
import NodeForm from './components/node-form.vue'
import PermissionList from './components/permission-list.vue'
import SearchForm from './components/search-form.vue'
import Storage from './components/storage.vue'

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
const scopeTabs = [ // 文件范围页签
  { value: OA_FILE_SCOPE.MY, title: '我的文件' },
  { value: OA_FILE_SCOPE.SHARED, title: '共享文件' },
  { value: OA_FILE_SCOPE.FAVORITE, title: '我的收藏' },
  { value: OA_FILE_SCOPE.RECYCLE, title: '回收站' },
]
const tabIndex = ref(0) // 当前页签下标
const scope = ref<string>(OA_FILE_SCOPE.MY) // 当前文件范围
const storage = ref<FileStorage>() // 云盘概览
const list = ref<FileNode[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const currentParentId = ref<number>(OA_FILE_PARENT_ID_ROOT) // 当前目录
const currentLevel = ref<number>(OA_FILE_PERMISSION_LEVEL.MANAGE) // 当前目录权限
const paths = ref<{ id: number, name: string, level: number }[]>([{ id: OA_FILE_PARENT_ID_ROOT, name: '我的文件', level: OA_FILE_PERMISSION_LEVEL.MANAGE }]) // 面包屑
const moreVisible = ref(false) // 更多操作显示状态
const moreRow = ref<FileNode>() // 更多操作的当前行
const moreCommands = ref<string[]>([]) // 更多操作命令，与 moreActions 顺序一致
const nodeFormRef = ref<any>() // 节点表单引用
const permissionRef = ref<any>() // 共享设置引用
const canCreate = computed(() => // 回收站、分类筛选和只读目录下不可新建
  scope.value !== OA_FILE_SCOPE.RECYCLE
  && !queryParams.value.category
  && (currentParentId.value !== OA_FILE_PARENT_ID_ROOT
    ? currentLevel.value >= OA_FILE_PERMISSION_LEVEL.EDIT
    : scope.value === OA_FILE_SCOPE.MY))
const moreActions = computed(() => // 更多操作项，按当前行权限动态生成
  moreCommands.value.map(command => ({
    name: {
      favorite: moreRow.value?.favorite ? '取消收藏' : '收藏',
      download: '下载',
      share: '共享',
      rename: '重命名',
      copy: '复制',
      move: '移动',
      recycle: '删除',
    }[command],
  })))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询云盘概览 */
async function getStorage() {
  storage.value = await getFileStorage()
}

/** 查询文件列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    // 搜索或根目录收藏查询跨目录展示，否则只查询当前目录
    const parentId = queryParams.value.name
      || queryParams.value.category
      || queryParams.value.createTime
      || (scope.value === OA_FILE_SCOPE.FAVORITE && currentParentId.value === OA_FILE_PARENT_ID_ROOT)
      ? undefined
      : currentParentId.value
    const data = await getFileNodePage({
      ...queryParams.value,
      scope: scope.value,
      parentId,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 操作成功后刷新列表与概览 */
async function handleSuccess() {
  await Promise.all([pagingRef.value?.reload(), getStorage()])
}

/** 页签切换 */
function handleTabChange({ index }: { index: number }) {
  scope.value = scopeTabs[index]!.value
  currentParentId.value = OA_FILE_PARENT_ID_ROOT
  currentLevel.value = scope.value === OA_FILE_SCOPE.MY ? OA_FILE_PERMISSION_LEVEL.MANAGE : OA_FILE_PERMISSION_LEVEL.READ
  paths.value = [{
    id: OA_FILE_PARENT_ID_ROOT,
    name: scopeTabs[index]!.title,
    level: currentLevel.value,
  }]
  handleReset()
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 返回上级目录 */
function handlePath(index: number) {
  paths.value = paths.value.slice(0, index + 1)
  currentParentId.value = paths.value[index]!.id
  currentLevel.value = paths.value[index]!.level
  handleReset()
}

/** 判断本人节点 */
function isOwner(row: FileNode) {
  return row.creator === String(userStore.userInfo?.userId)
}

/** 打开文件或目录 */
function handleOpen(row: FileNode) {
  if (scope.value === OA_FILE_SCOPE.RECYCLE) {
    return
  }
  if (row.type === OA_FILE_NODE_TYPE.FILE) {
    handlePreview(row)
    return
  }
  currentParentId.value = row.id!
  currentLevel.value = row.level || OA_FILE_PERMISSION_LEVEL.READ
  paths.value.push({ id: row.id!, name: row.name, level: currentLevel.value })
  queryParams.value = {}
  pagingRef.value?.reload()
}

/** 预览文件：获得授权地址后打开，不能通过列表中的原始地址绕过后端校验 */
async function handlePreview(row: FileNode) {
  if ((row.level || 0) < OA_FILE_PERMISSION_LEVEL.DOWNLOAD) {
    toast.warning('当前仅具有查看文件信息的权限')
    return
  }
  const data = await getFileNode(row.id!)
  if (!data.url) {
    toast.warning('当前文件不可预览或下载')
    return
  }
  openAttachment(data.url)
}

/** 下载文件：获得授权地址后按云盘节点名保存 */
async function handleDownload(row: FileNode) {
  if ((row.level || 0) < OA_FILE_PERMISSION_LEVEL.DOWNLOAD) {
    toast.warning('当前仅具有查看文件信息的权限')
    return
  }
  const data = await getFileNode(row.id!)
  if (!data.url) {
    toast.warning('当前文件不可预览或下载')
    return
  }
  // #ifdef H5
  try {
    const response = await fetch(staticUrl(data.url))
    if (!response.ok) {
      toast.error('文件下载失败，请重试')
      return
    }
    downloadBlobH5(await response.blob(), data.name || getFileNameFromUrl(data.url))
  } catch {
    toast.error('文件下载失败，请重试')
  }
  // #endif
  // #ifndef H5
  openAttachment(data.url)
  // #endif
}

/** 打开更多操作 */
function handleMore(row: FileNode) {
  moreRow.value = row
  const commands: string[] = ['favorite']
  if (row.type === OA_FILE_NODE_TYPE.FILE && (row.level || 0) >= OA_FILE_PERMISSION_LEVEL.DOWNLOAD) {
    commands.push('download')
  }
  if ((row.level || 0) >= OA_FILE_PERMISSION_LEVEL.MANAGE && hasAccessByCodes(['oa:file:share'])) {
    commands.push('share')
  }
  if ((row.level || 0) >= OA_FILE_PERMISSION_LEVEL.EDIT && hasAccessByCodes(['oa:file:update'])) {
    commands.push('rename')
  }
  if ((row.level || 0) >= OA_FILE_PERMISSION_LEVEL.DOWNLOAD && hasAccessByCodes(['oa:file:create'])) {
    commands.push('copy')
  }
  if (isOwner(row) && hasAccessByCodes(['oa:file:update'])) {
    commands.push('move')
  }
  if (isOwner(row) && hasAccessByCodes(['oa:file:delete'])) {
    commands.push('recycle')
  }
  moreCommands.value = commands
  moreVisible.value = true
}

/** 执行更多操作 */
function handleMoreSelect({ index }: { index: number }) {
  const row = moreRow.value
  const command = moreCommands.value[index]
  if (!row || !command) {
    return
  }
  switch (command) {
    case 'favorite':
      handleFavorite(row)
      break
    case 'download':
      handleDownload(row)
      break
    case 'share':
      permissionRef.value?.open(row.id)
      break
    case 'rename':
      openNodeForm('rename', row)
      break
    case 'copy':
      openNodeForm('copy', row)
      break
    case 'move':
      openNodeForm('move', row)
      break
    case 'recycle':
      handleRecycle(row)
      break
  }
}

/** 打开节点表单 */
function openNodeForm(type: string, row?: FileNode) {
  nodeFormRef.value?.open(type, row?.parentId ?? currentParentId.value, row)
}

/** 收藏或取消收藏 */
async function handleFavorite(row: FileNode) {
  if (row.favorite) {
    await deleteFileFavorite(row.id!)
  } else {
    await createFileFavorite(row.id!)
  }
  await handleSuccess()
}

/** 移入回收站 */
async function handleRecycle(row: FileNode) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `是否将「${row.name}」移入回收站？`,
    })
  } catch {
    return
  }
  await recycleFileNode(row.id!)
  toast.success('已移入回收站')
  await handleSuccess()
}

/** 恢复节点 */
async function handleRestore(row: FileNode) {
  await restoreFileNode(row.id!)
  toast.success('恢复成功')
  await handleSuccess()
}

/** 彻底删除业务记录 */
async function handleDelete(row: FileNode) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `彻底删除「${row.name}」及其全部子文件后将无法恢复，是否继续？`,
    })
  } catch {
    return
  }
  await deleteFileNode(row.id!)
  toast.success('删除成功')
  await handleSuccess()
}

/** 初始化 */
onMounted(() => {
  getStorage()
  uni.$on('oa:file:reload', handleSuccess)
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:file:reload', handleSuccess)
})
</script>
