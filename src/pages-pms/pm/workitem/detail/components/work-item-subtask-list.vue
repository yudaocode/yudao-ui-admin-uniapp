<template>
  <view>
    <!-- 快速创建 -->
    <view
      v-if="editable && !composing"
      class="mb-24rpx rounded-12rpx bg-white p-24rpx text-26rpx text-[#999] shadow-sm"
      @click="composing = true"
    >
      添加子工作项…
    </view>
    <view v-else-if="editable" class="mb-24rpx">
      <view class="flex items-center gap-16rpx">
        <wd-input
          v-model="newSubtaskName"
          class="flex-1"
          placeholder="输入子工作项标题"
          :maxlength="100"
          clearable
        />
        <wd-button size="small" type="primary" :loading="creating" @click="handleCreate">
          添加
        </wd-button>
      </view>
      <view class="mt-12rpx text-right">
        <text class="text-26rpx text-[#999]" @click="composing = false">取消</text>
      </view>
    </view>

    <!-- 子工作项列表 -->
    <view v-if="!subtaskList.length" class="py-60rpx text-center text-28rpx text-[#999]">
      暂无子工作项
    </view>
    <view
      v-for="item in subtaskList"
      :key="item.id"
      class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
    >
      <view class="mb-8rpx flex items-center gap-16rpx">
        <wd-checkbox
          :model-value="item.status === PmsWorkItemStatusType.COMPLETED"
          :disabled="!editable || statusSavingId === item.id"
          @change="handleStatusChange(item, $event)"
        />
        <view v-if="editingId === item.id" class="min-w-0 flex flex-1 items-center gap-12rpx">
          <wd-input v-model="editingName" class="flex-1" :maxlength="100" />
          <text class="shrink-0 text-26rpx text-[#1677ff]" @click="handleRename(item)">保存</text>
          <text class="shrink-0 text-26rpx text-[#999]" @click="editingId = undefined">取消</text>
        </view>
        <text v-else class="min-w-0 flex-1 truncate text-28rpx text-[#333]">
          {{ item.name }}
        </text>
      </view>
      <view class="flex items-center justify-between pl-56rpx text-26rpx text-[#666]">
        <text>状态：{{ item.statusName || '-' }} · 负责人：{{ item.assigneeUserName || '未分配' }}</text>
        <view v-if="editable" class="flex shrink-0 gap-16rpx">
          <text class="text-[#1677ff]" @click="startRename(item)">改名</text>
          <text class="text-[#f5222d]" @click="handleRecycle(item)">删除</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WorkItem } from '@/api/pms/pm/workitem'
import type { WorkItemStatus } from '@/api/pms/pm/workitem/status'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createWorkItem,
  getWorkItemPage,
  recycleWorkItem,
  updateWorkItemName,
  updateWorkItemStatus,
} from '@/api/pms/pm/workitem'
import { getWorkItemStatusList } from '@/api/pms/pm/workitem/status'
import { PmsWorkItemLifecycleStatus, PmsWorkItemStatusType } from '@/pages-pms/pm/utils/constants'
import { getAllPageItems } from '@/utils/page'

const props = defineProps<{
  parentWorkItem: WorkItem
  editable: boolean
}>()
const emit = defineEmits<{ changed: [] }>() // 子工作项变化事件

const toast = useToast()
const dialog = useDialog()
const creating = ref(false) // 子工作项创建中
const composing = ref(false) // 是否展开快速创建输入区
const statusSavingId = ref<number>() // 正在更新状态的子工作项编号
const subtaskList = ref<WorkItem[]>([]) // 子工作项列表
const statusList = ref<WorkItemStatus[]>([]) // 工作项状态列表
const newSubtaskName = ref('') // 新子工作项标题
const editingId = ref<number>() // 正在改名的子工作项编号
const editingName = ref('') // 正在编辑的子工作项标题

/** 查询子工作项列表 */
async function getList() {
  const params = {
    projectId: props.parentWorkItem.projectId,
    type: props.parentWorkItem.type,
    lifecycleStatus: PmsWorkItemLifecycleStatus.ACTIVE,
    parentId: props.parentWorkItem.id,
  }
  const [items, statuses] = await Promise.all([
    getAllPageItems((pageNo, pageSize) => getWorkItemPage({ ...params, pageNo, pageSize })),
    getWorkItemStatusList(props.parentWorkItem.projectId, props.parentWorkItem.type),
  ])
  subtaskList.value = items
  statusList.value = statuses
}

/** 创建子工作项 */
async function handleCreate() {
  const name = newSubtaskName.value.trim()
  if (!name) {
    toast.warning('请输入子工作项标题')
    return
  }
  // 继承父工作项的核心属性
  creating.value = true
  try {
    await createWorkItem({
      projectId: props.parentWorkItem.projectId,
      type: props.parentWorkItem.type,
      name,
      priority: props.parentWorkItem.priority,
      assigneeUserId: props.parentWorkItem.assigneeUserId,
      memberUserIds: props.parentWorkItem.memberUserIds,
      iterationId: props.parentWorkItem.iterationId,
      parentId: props.parentWorkItem.id,
      relatedRequirementId: props.parentWorkItem.relatedRequirementId,
      defectType: props.parentWorkItem.defectType,
      progress: 0,
      fileUrls: [],
      labelIds: [],
    })
    newSubtaskName.value = ''
    composing.value = false
    toast.success('子工作项创建成功')
    await getList()
    emit('changed')
  } finally {
    creating.value = false
  }
}

/** 开始重命名 */
function startRename(item: WorkItem) {
  editingId.value = item.id
  editingName.value = item.name
}

/** 提交重命名 */
async function handleRename(item: WorkItem) {
  const name = editingName.value.trim()
  if (!name) {
    toast.warning('请输入子工作项标题')
    return
  }
  await updateWorkItemName(item.id!, name)
  editingId.value = undefined
  toast.success('子工作项名称已更新')
  await getList()
  emit('changed')
}

/** 切换完成状态：勾选后流转到对应语义状态 */
async function handleStatusChange(item: WorkItem, checked: boolean) {
  const targetType = checked ? PmsWorkItemStatusType.COMPLETED : PmsWorkItemStatusType.PENDING
  const targetStatus = statusList.value.find(status => status.statusType === targetType)
  if (!targetStatus) {
    toast.warning(checked ? '请先配置已完成状态' : '请先配置未开始状态')
    return
  }
  statusSavingId.value = item.id
  try {
    await updateWorkItemStatus(item.id!, targetStatus.id)
    await getList()
    emit('changed')
  } finally {
    statusSavingId.value = undefined
  }
}

/** 移入回收站 */
async function handleRecycle(item: WorkItem) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认删除子工作项“${item.name}”吗？删除后可在回收站恢复。` })
  } catch {
    return
  }
  await recycleWorkItem(item.id!)
  toast.success('子工作项已移入回收站')
  await getList()
  emit('changed')
}

/** 父工作项变化时刷新子工作项 */
watch(() => props.parentWorkItem.id, getList, { immediate: true })
</script>
