<template>
  <view class="yd-page-container pb-200rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="文件管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 技能信息 -->
    <view class="bg-white px-24rpx pt-20rpx">
      <view class="break-all text-28rpx text-[#333] font-semibold">
        技能：{{ skill?.name || '-' }}
      </view>
      <view class="mt-8rpx text-22rpx text-[#999] leading-32rpx">
        仅 SKILL.md 与 scripts/、reference/ 固定，其余可自由扩展
      </view>
    </view>

    <!-- 面包屑导航 -->
    <view class="bg-white px-24rpx py-16rpx">
      <scroll-view scroll-x class="whitespace-nowrap">
        <view class="inline-flex items-center">
          <text
            class="text-28rpx"
            :class="currentParentId !== 0 ? 'text-[#1890ff]' : 'text-[#333]'"
            @click="currentParentId = 0"
          >
            根目录
          </text>
          <template v-for="(item, index) in breadcrumbList" :key="item.id">
            <wd-icon name="arrow-right" size="12px" color="#999" custom-class="mx-8rpx" />
            <text
              class="text-28rpx"
              :class="index < breadcrumbList.length - 1 ? 'text-[#1890ff]' : 'text-[#333]'"
              @click="currentParentId = item.id"
            >
              {{ item.name }}
            </text>
          </template>
        </view>
      </scroll-view>
    </view>

    <!-- 文件列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in currentList"
        :key="item.id"
        class="mb-20rpx flex items-center gap-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        @click="handleOpen(item)"
      >
        <view
          class="h-64rpx w-64rpx flex shrink-0 items-center justify-center rounded-8rpx"
          :class="isDirectory(item) ? 'bg-[#fff7e6]' : 'bg-[#e6f4ff]'"
        >
          <wd-icon :name="isDirectory(item) ? 'folder' : 'file'" size="36rpx" :color="isDirectory(item) ? '#faad14' : '#1677ff'" />
        </view>
        <view class="min-w-0 flex-1">
          <view class="flex items-center gap-8rpx">
            <text class="min-w-0 truncate text-30rpx text-[#333] font-medium">{{ item.name }}</text>
            <wd-icon v-if="item.locked" name="lock" size="28rpx" color="#faad14" />
          </view>
          <view class="mt-6rpx text-22rpx text-[#999]">
            {{ getNodeMeta(item) }}
          </view>
        </view>
        <view
          v-if="getNodeActions(item).length > 1"
          class="shrink-0 px-8rpx py-8rpx"
          @click.stop="handleMore(item)"
        >
          <wd-icon name="more" size="40rpx" color="#999" />
        </view>
        <wd-icon v-else-if="isDirectory(item)" name="arrow-right" size="30rpx" color="#bbb" />
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && currentList.length === 0" class="py-100rpx text-center">
        <wd-empty icon="content" tip="当前目录为空" />
      </view>
    </view>

    <!-- 底部新建按钮 -->
    <view v-if="hasAccessByCodes(['ai:skill:update'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" variant="plain" @click="handleCreate(false)">
          新建文件
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleCreate(true)">
          新建目录
        </wd-button>
      </view>
    </view>

    <!-- 节点操作 -->
    <wd-action-sheet
      v-model="actionVisible"
      :title="selectedNode?.name"
      :actions="selectedNode ? getNodeActions(selectedNode) : []"
      cancel-text="取消"
      @select="handleAction"
    />

    <!-- 移动目录选择 -->
    <DirectoryPicker v-model="moveVisible" :files="list" :node="selectedNode" @confirm="handleMove" />
  </view>
</template>

<script lang="ts" setup>
import type { Skill, SkillFile } from '@/api/ai/skill'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import {
  createSkillFile,
  deleteSkillFile,
  getSkill,
  getSkillFileList,
  moveSkillFile,
  renameSkillFile,
} from '@/api/ai/skill'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { AiSkillFileTypeEnum } from '@/utils/constants'
import { formatFileSize } from '@/utils/download'
import DirectoryPicker from './components/directory-picker.vue'

const props = defineProps<{
  skillId?: number | any
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
const skill = ref<Skill>() // 技能信息
const loading = ref(false) // 列表加载状态
const list = ref<SkillFile[]>([]) // 技能的全部节点（扁平）
const currentParentId = ref(0) // 当前目录编号，根目录为 0
const selectedNode = ref<SkillFile>() // 当前操作的节点
const actionVisible = ref(false) // 节点操作面板显示状态
const moveVisible = ref(false) // 移动目录弹窗显示状态

const nodeMap = computed(() => new Map(list.value.map(item => [item.id, item]))) // 节点编号 -> 节点
const currentList = computed(() => { // 当前目录的节点：目录在前，文件在后
  const children = list.value.filter(item => item.parentId === currentParentId.value)
  return [
    ...children.filter(item => isDirectory(item)),
    ...children.filter(item => !isDirectory(item)),
  ]
})
const breadcrumbList = computed(() => { // 根目录到当前目录的路径
  const result: SkillFile[] = []
  let node = nodeMap.value.get(currentParentId.value)
  while (node) {
    result.unshift(node)
    node = nodeMap.value.get(node.parentId)
  }
  return result
})

/** 当前目录被删除或移走后，回到根目录 */
watch(list, () => {
  if (currentParentId.value !== 0 && !nodeMap.value.has(currentParentId.value)) {
    currentParentId.value = 0
  }
})

/** 是否为目录 */
function isDirectory(item: SkillFile) {
  return item.type === AiSkillFileTypeEnum.DIRECTORY
}

/** 节点的辅助信息：目录显示子项数，文件显示大小 */
function getNodeMeta(item: SkillFile) {
  if (isDirectory(item)) {
    const count = list.value.filter(child => child.parentId === item.id).length
    return `${count} 项`
  }
  return [item.fileType, item.size ? formatFileSize(item.size) : '0 B'].filter(Boolean).join(' · ')
}

/** 节点的操作项：固定节点只能打开 */
function getNodeActions(item: SkillFile) {
  const actions = [{ name: isDirectory(item) ? '打开目录' : '打开编辑', value: 'open' }]
  if (item.locked) {
    return actions
  }
  if (hasAccessByCodes(['ai:skill:update'])) {
    actions.push({ name: '重命名', value: 'rename' }, { name: '移动', value: 'move' })
  }
  if (hasAccessByCodes(['ai:skill:delete'])) {
    actions.push({ name: '删除', value: 'delete', color: '#f5222d' } as any)
  }
  return actions
}

/** 返回上一级目录或上一页 */
function handleBack() {
  if (currentParentId.value !== 0) {
    currentParentId.value = nodeMap.value.get(currentParentId.value)?.parentId ?? 0
    return
  }
  navigateBackPlus('/pages-ai/skill/index')
}

/** 加载技能信息 */
async function getSkillInfo() {
  skill.value = await getSkill(Number(props.skillId))
}

/** 查询文件列表 */
async function getList() {
  loading.value = true
  try {
    list.value = await getSkillFileList(Number(props.skillId))
  } finally {
    loading.value = false
  }
}

/** 文件变更后刷新：本页列表，以及技能列表、详情中的文件数和描述 */
async function refresh() {
  await getList()
  uni.$emit('ai:skill:reload')
}

/** 打开节点：目录进入下一级，文件进入编辑 */
function handleOpen(item: SkillFile) {
  if (isDirectory(item)) {
    currentParentId.value = item.id
    return
  }
  uni.navigateTo({
    url: `/pages-ai/skill/file/editor/index?id=${item.id}`,
  })
}

/** 打开节点操作 */
function handleMore(item: SkillFile) {
  selectedNode.value = item
  actionVisible.value = true
}

/** 节点操作 */
function handleAction({ item }: { item: { value: string } }) {
  const node = selectedNode.value
  if (!node) {
    return
  }
  if (item.value === 'open') {
    handleOpen(node)
  } else if (item.value === 'rename') {
    handleRename(node)
  } else if (item.value === 'move') {
    moveVisible.value = true
  } else if (item.value === 'delete') {
    handleDelete(node)
  }
}

/** 新建文件或目录：创建在当前目录 */
async function handleCreate(directory: boolean) {
  let value: string | number | undefined
  try {
    const result = await dialog.prompt({
      title: directory ? '新建目录' : '新建文件',
      msg: directory ? '' : '支持 md、txt、json、yaml、yml、csv 文件',
      inputProps: { placeholder: directory ? '请输入目录名称' : '请输入文件名，如 guide.md' },
      inputPattern: /\S/,
      inputError: '名称不能为空',
    })
    value = result.value
  } catch {
    return
  }
  await createSkillFile({
    skillId: Number(props.skillId),
    parentId: currentParentId.value,
    name: String(value || '').trim(),
    type: directory ? AiSkillFileTypeEnum.DIRECTORY : AiSkillFileTypeEnum.FILE,
  })
  toast.success('新增成功')
  await refresh()
}

/** 重命名 */
async function handleRename(node: SkillFile) {
  let value: string | number | undefined
  try {
    const result = await dialog.prompt({
      title: '重命名',
      inputValue: node.name,
      inputProps: { placeholder: '请输入新的名称' },
      inputPattern: /\S/,
      inputError: '名称不能为空',
    })
    value = result.value
  } catch {
    return
  }
  const name = String(value || '').trim()
  if (name === node.name) {
    return
  }
  await renameSkillFile({ id: node.id, name })
  toast.success('修改成功')
  await refresh()
}

/** 移动到目标目录 */
async function handleMove(parentId: number) {
  const node = selectedNode.value
  if (!node || parentId === node.parentId) {
    return
  }
  await moveSkillFile({ id: node.id, parentId })
  toast.success('移动成功')
  await refresh()
}

/** 删除 */
async function handleDelete(node: SkillFile) {
  const directory = isDirectory(node)
  try {
    await dialog.confirm({
      title: '提示',
      msg: directory
        ? `确定要删除目录【${node.name}】吗？目录下的全部内容将一并删除`
        : `确定要删除文件【${node.name}】吗？`,
    })
  } catch {
    return
  }
  await deleteSkillFile(node.id)
  toast.success('删除成功')
  await refresh()
}

/** 初始化 */
onMounted(() => {
  if (!props.skillId) {
    return
  }
  getSkillInfo()
  getList()
  uni.$on('ai:skill-file:reload', getList)
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:skill-file:reload', getList)
})
</script>
