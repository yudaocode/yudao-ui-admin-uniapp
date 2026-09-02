<template>
  <scroll-view scroll-y class="min-h-0 flex-1">
    <view class="p-24rpx pb-200rpx">
      <!-- 事项搜索 -->
      <!-- TODO @AI：这个宽度貌似不对？看看别的模块，有没类似的问题； -->
      <view class="mb-24rpx flex items-center gap-16rpx">
        <wd-search
          v-model="searchKeyword"
          placeholder="搜索事项"
          hide-cancel
          @search="getPlanningData"
          @clear="getPlanningData"
        />
      </view>

      <!-- Backlog 待规划 -->
      <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          Backlog 共 {{ unplannedWorkItems.length }} 个事项
        </view>
        <view v-if="!unplannedWorkItems.length" class="py-40rpx text-center text-28rpx text-[#999]">
          暂无待规划事项
        </view>
        <view class="planning-drop min-h-60rpx" data-iteration-id="">
          <view
            v-for="item in unplannedWorkItems"
            :key="item.id"
            class="mb-16rpx rounded-8rpx bg-[#f7f8fa] p-20rpx"
            :data-work-item-id="item.id"
          >
            <view class="mb-8rpx flex items-center justify-between gap-16rpx">
              <text class="min-w-0 flex-1 truncate text-28rpx text-[#1677ff]" @click="handleWorkItemDetail(item)">
                #{{ item.serialNumber }} {{ item.name }}
              </text>
              <wd-icon
                v-if="editable"
                name="more-vertical" size="32rpx" color="#666"
                @click.stop="handleWorkItemMore(item, undefined)"
              />
            </view>
            <view class="flex items-center gap-16rpx text-24rpx text-[#999]">
              <text :style="{ color: getPriorityColor(item.priority) }">{{ getPriorityName(item.priority) }}</text>
              <text>{{ item.statusName || '-' }}</text>
              <text>{{ item.assigneeUserName || '未分配' }}</text>
            </view>
          </view>
        </view>

        <!-- 快速创建待规划事项 -->
        <!-- TODO @AI：貌似目前的快速创建，都是平铺的会不会有点怪？？？ -->
        <view v-if="editable && hasAccessByCodes(['pms:pm:work-item:create'])" class="mt-8rpx flex items-center gap-12rpx">
          <view class="w-140rpx shrink-0" @click="backlogTypeVisible = true">
            <view class="flex items-center justify-center rounded-8rpx bg-[#f7f8fa] p-12rpx text-26rpx text-[#333]">
              {{ getWorkItemTypeName(backlogDraft.type) }}
              <wd-icon name="arrow-down" size="24rpx" />
            </view>
          </view>
          <wd-input
            v-model="backlogDraft.name"
            class="flex-1"
            placeholder="快速创建待规划事项"
            :maxlength="100"
          />
          <wd-button size="small" type="primary" :loading="creatingKey === 'backlog'" @click="createQuickWorkItem(backlogDraft)">
            创建
          </wd-button>
        </view>
      </view>

      <!-- 迭代规划 -->
      <view v-if="!iterationList.length" class="py-40rpx text-center text-28rpx text-[#999]">
        暂无可规划迭代
      </view>
      <view
        v-for="iteration in iterationList"
        :key="iteration.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-16rpx flex items-center justify-between gap-16rpx" @click="toggleIteration(iteration)">
          <view class="min-w-0 flex flex-1 items-center gap-12rpx">
            <wd-icon :name="iteration.expanded ? 'arrow-down' : 'arrow-right'" size="28rpx" color="#666" />
            <text class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">{{ iteration.name }}</text>
            <text class="shrink-0 text-24rpx text-[#999]">共 {{ iteration.list.length }} 个事项</text>
          </view>
          <view class="flex shrink-0 items-center gap-12rpx">
            <wd-tag :type="iteration.status === PmsIterationStatus.ACTIVE ? 'primary' : 'default'" plain>
              {{ getIterationStatusName(iteration.status) }}
            </wd-tag>
            <wd-icon
              v-if="editable"
              name="more-vertical" size="32rpx" color="#666"
              @click.stop="handleIterationMore(iteration)"
            />
          </view>
        </view>
        <view class="mb-12rpx text-24rpx text-[#999]">
          {{ formatDate(iteration.startTime) || '--' }} 至 {{ formatDate(iteration.endTime) || '--' }}
        </view>

        <template v-if="iteration.expanded">
          <view class="planning-drop min-h-60rpx" :data-iteration-id="iteration.id">
            <view
              v-for="item in iteration.list"
              :key="item.id"
              class="mb-16rpx rounded-8rpx bg-[#f7f8fa] p-20rpx"
              :data-work-item-id="item.id"
            >
              <view class="mb-8rpx flex items-center justify-between gap-16rpx">
                <text class="min-w-0 flex-1 truncate text-28rpx text-[#1677ff]" @click="handleWorkItemDetail(item)">
                  #{{ item.serialNumber }} {{ item.name }}
                </text>
                <wd-icon
                  v-if="editable"
                  name="more-vertical" size="32rpx" color="#666"
                  @click.stop="handleWorkItemMore(item, iteration)"
                />
              </view>
              <view class="flex items-center gap-16rpx text-24rpx text-[#999]">
                <text :style="{ color: getPriorityColor(item.priority) }">{{ getPriorityName(item.priority) }}</text>
                <text>{{ item.statusName || '-' }}</text>
                <text>{{ item.assigneeUserName || '未分配' }}</text>
              </view>
            </view>
          </view>
          <view v-if="!iteration.list.length" class="py-24rpx text-center text-26rpx text-[#999]">
            暂无事项
          </view>

          <!-- 快速创建迭代事项 -->
          <view v-if="editable && hasAccessByCodes(['pms:pm:work-item:create'])" class="mt-8rpx flex items-center gap-12rpx">
            <view class="w-140rpx shrink-0" @click="openIterationTypeSheet(iteration.id)">
              <view class="flex items-center justify-center rounded-8rpx bg-[#f7f8fa] p-12rpx text-26rpx text-[#333]">
                {{ getWorkItemTypeName(iterationDrafts[iteration.id]?.type || PmsWorkItemType.TASK) }}
                <wd-icon name="arrow-down" size="24rpx" />
              </view>
            </view>
            <wd-input
              v-model="iterationDrafts[iteration.id].name"
              class="flex-1"
              :placeholder="`在“${iteration.name}”中快速创建事项`"
              :maxlength="100"
            />
            <wd-button
              size="small" type="primary"
              :loading="creatingKey === `iteration-${iteration.id}`"
              @click="createQuickWorkItem(iterationDrafts[iteration.id], iteration.id)"
            >
              创建
            </wd-button>
          </view>
        </template>
      </view>

      <!-- 快速创建迭代 -->
      <!-- TODO @AI：貌似目前的快速创建，都是平铺的会不会有点怪？？？ -->
      <view v-if="editable && hasAccessByCodes(['pms:pm:iteration:create'])" class="flex items-center gap-12rpx">
        <wd-input
          v-model="quickIterationName"
          class="flex-1"
          placeholder="快速创建迭代"
          :maxlength="100"
        />
        <wd-button size="small" type="primary" :loading="creatingKey === 'iteration'" @click="createQuickIteration">
          创建迭代
        </wd-button>
      </view>
    </view>

    <!-- 更多操作：工作项 -->
    <wd-action-sheet
      v-model="workItemActionVisible"
      :actions="workItemActions"
      @select="handleWorkItemActionSelect"
    />

    <!-- 更多操作：迭代 -->
    <wd-action-sheet
      v-model="iterationActionVisible"
      :actions="iterationActions"
      @select="handleIterationActionSelect"
    />

    <!-- 规划到迭代 -->
    <wd-action-sheet
      v-model="moveVisible"
      :actions="moveActions"
      @select="handleMoveSelect"
    />

    <!-- 事项类型选择 -->
    <wd-action-sheet
      v-model="backlogTypeVisible"
      :actions="typeActions"
      @select="handleBacklogTypeSelect"
    />
    <wd-action-sheet
      v-model="iterationTypeVisible"
      :actions="typeActions"
      @select="handleIterationTypeSelect"
    />

    <!-- 开始迭代弹窗 -->
    <wd-popup v-model="startVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          开始迭代
        </view>
        <wd-cell-group border>
          <wd-cell title="开始时间" title-width="200rpx">
            <wd-datetime-picker v-model="startForm.startTime" type="datetime" placeholder="请选择开始时间" />
          </wd-cell>
          <wd-cell title="结束时间" title-width="200rpx">
            <wd-datetime-picker v-model="startForm.endTime" type="datetime" placeholder="请选择结束时间" />
          </wd-cell>
        </wd-cell-group>
        <view class="mt-32rpx flex gap-24rpx">
          <wd-button class="flex-1" variant="plain" @click="startVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="starting" @click="handleStartConfirm">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </scroll-view>
</template>

<script lang="ts" setup>
import type { Iteration } from '@/api/pms/pm/iteration'
import type { WorkItem } from '@/api/pms/pm/workitem'
import { computed, reactive, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { completeIteration, createIteration, deleteIteration, getIterationPage, startIteration } from '@/api/pms/pm/iteration'
import {
  createWorkItem,
  getWorkItemPage,
  recycleWorkItem,
  updateWorkItemIteration,
  updateWorkItemPlanningSort,
} from '@/api/pms/pm/workitem'
import { useAccess } from '@/hooks/useAccess'
import {
  PmsIterationStatus,
  PmsProjectType,
  PmsWorkItemDefectType,
  PmsWorkItemPriority,
  PmsWorkItemType,
  PmsWorkItemTypeOptions,
} from '@/pages-pms/pm/utils/constants'
import {
  getIterationStatusName,
  getPriorityColor,
  getPriorityName,
  getWorkItemTypeName,
} from '@/pages-pms/pm/utils/format'
import { formatDate } from '@/utils/date'
import { getAllPageItems } from '@/utils/page'

interface PlanningIteration extends Iteration {
  expanded: boolean // 是否展开
  list: WorkItem[] // 迭代内工作项
}
interface QuickWorkItemDraft {
  name: string
  type: number
}

const props = defineProps<{
  projectId: number
  projectType: number
  editable: boolean
}>()

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const creatingKey = ref('') // 快速创建中的区域标识
const searchKeyword = ref('') // 事项搜索关键字
const workItemActionVisible = ref(false) // 工作项更多操作弹窗显示状态
const iterationActionVisible = ref(false) // 迭代更多操作弹窗显示状态
const moveVisible = ref(false) // 规划到迭代弹窗显示状态
const backlogTypeVisible = ref(false) // Backlog 事项类型弹窗显示状态
const iterationTypeVisible = ref(false) // 迭代事项类型弹窗显示状态
const startVisible = ref(false) // 开始迭代弹窗显示状态
const starting = ref(false) // 开始迭代提交中
const typeDraftIterationId = ref(0) // 正在选择事项类型的迭代编号
const currentWorkItem = ref<WorkItem>() // 当前操作的工作项
const currentIteration = ref<PlanningIteration>() // 当前操作的迭代
const iterationList = ref<PlanningIteration[]>([]) // 规划中的迭代列表
const unplannedWorkItems = ref<WorkItem[]>([]) // 待规划工作项列表
const backlogDraft = reactive<QuickWorkItemDraft>({ name: '', type: PmsWorkItemType.TASK }) // Backlog 快速创建草稿
const iterationDrafts = reactive<Record<number, QuickWorkItemDraft>>({}) // 各迭代快速创建草稿
const quickIterationName = ref('') // 快速创建迭代名称
const startForm = reactive({
  startTime: '' as number | '',
  endTime: '' as number | '',
}) // 开始迭代表单

const planningSaving = ref(false) // 拖拽规划保存中
let planningSortables: Array<{ destroy: () => void }> = [] // 规划拖拽实例

const typeActions = computed(() => // 事项类型操作项：通用项目只有任务
  PmsWorkItemTypeOptions
    .filter(item => props.projectType === PmsProjectType.AGILE || item.value === PmsWorkItemType.TASK)
    .map(item => ({ name: item.label })),
)
const moveActions = computed(() => { // 规划目标操作项：待规划 + 进行中/未开始的迭代
  const actions: Array<{ name: string }> = []
  if (currentWorkItem.value && currentIteration.value) {
    actions.push({ name: '移回待规划' })
  }
  iterationList.value
    .filter(item => item.id !== currentIteration.value?.id)
    .forEach(item => actions.push({ name: item.name }))
  return actions
})
const workItemActions = computed(() => { // 工作项更多操作项
  const actions: Array<{ name: string }> = []
  if (hasAccessByCodes(['pms:pm:work-item:update'])) {
    actions.push({ name: '编辑事项' })
    if (iterationList.value.length > 0 || currentIteration.value) {
      actions.push({ name: currentIteration.value ? '移动到其他迭代' : '规划到迭代' })
    }
  }
  if (hasAccessByCodes(['pms:pm:work-item:update'])) {
    actions.push({ name: '移入回收站' })
  }
  return actions
})
const iterationActions = computed(() => { // 迭代更多操作项
  const item = currentIteration.value
  if (!item) {
    return []
  }
  const actions: Array<{ name: string }> = []
  if (item.status === PmsIterationStatus.PLANNED && hasAccessByCodes(['pms:pm:iteration:update'])) {
    actions.push({ name: '开始迭代' })
  }
  if (item.status === PmsIterationStatus.ACTIVE && hasAccessByCodes(['pms:pm:iteration:update'])) {
    actions.push({ name: '完成迭代' })
  }
  if (hasAccessByCodes(['pms:pm:iteration:update'])) {
    actions.push({ name: '编辑迭代' })
  }
  if (hasAccessByCodes(['pms:pm:iteration:delete'])) {
    actions.push({ name: '删除迭代' })
  }
  return actions
})

/** 查询迭代规划数据 */
async function getPlanningData() {
  const keyword = searchKeyword.value.trim() || undefined
  const [plannedIterations, activeIterations, fetchedUnplannedWorkItems] = await Promise.all([
    getIterationList(PmsIterationStatus.PLANNED),
    getIterationList(PmsIterationStatus.ACTIVE),
    getWorkItemList({ unplannedOnly: true, name: keyword }),
  ])
  // 逐个加载迭代内工作项，并初始化快速创建草稿
  const projectIterations = [...activeIterations, ...plannedIterations]
  const expandedIds = new Set(iterationList.value.filter(item => item.expanded).map(item => item.id))
  iterationList.value = await Promise.all(
    projectIterations.map(async (iteration) => {
      const iterationId = iteration.id!
      iterationDrafts[iterationId] ||= { name: '', type: PmsWorkItemType.TASK }
      return {
        ...iteration,
        expanded: expandedIds.has(iterationId),
        list: await getWorkItemList({ iterationId, name: keyword }),
      }
    }),
  )
  unplannedWorkItems.value = fetchedUnplannedWorkItems
  await nextTick()
  initPlanningSortable()
}

/** 查询指定状态的迭代列表 */
async function getIterationList(status: number) {
  return getAllPageItems((pageNo, pageSize) =>
    getIterationPage({ pageNo, pageSize, projectId: props.projectId, status }))
}

/** 查询规划视图的工作项列表 */
async function getWorkItemList(params: { iterationId?: number, unplannedOnly?: boolean, name?: string }) {
  return getAllPageItems((pageNo, pageSize) =>
    getWorkItemPage({ ...params, planningOnly: true, projectId: props.projectId, pageNo, pageSize }))
}

/** 收集投放区当前工作项编号顺序 */
function collectPlanningIds(el: Element) {
  return Array.from(el.querySelectorAll('[data-work-item-id]')).map(node => Number((node as HTMLElement).dataset.workItemId))
}

/** 初始化规划拖拽（仅 H5；小程序/App 保留操作菜单移动） */
async function initPlanningSortable() {
  planningSortables.forEach(instance => instance.destroy())
  planningSortables = []
  // #ifdef H5
  if (!props.editable || searchKeyword.value.trim()) {
    return
  }
  const Sortable = (await import('sortablejs')).default
  document.querySelectorAll('.planning-drop').forEach((el) => {
    planningSortables.push(Sortable.create(el as HTMLElement, {
      group: 'pms-planning',
      animation: 150,
      delay: 120,
      disabled: planningSaving.value,
      onEnd: (event) => {
        void handlePlanningDragEnd(event)
      },
    }))
  })
  // #endif
}

/** 规划拖拽结束：跨区域变更所属迭代并持久化目标区域顺序 */
async function handlePlanningDragEnd(event: { item: HTMLElement, from: Element, to: Element, oldIndex?: number, newIndex?: number }) {
  if (planningSaving.value || (event.oldIndex === event.newIndex && event.from === event.to)) {
    return
  }
  const workItemId = Number(event.item.dataset.workItemId)
  const rawIterationId = (event.to as HTMLElement).dataset.iterationId
  const targetIterationId = rawIterationId ? Number(rawIterationId) : undefined
  if (!workItemId) {
    return
  }
  planningSaving.value = true
  try {
    if (event.from !== event.to) {
      await updateWorkItemIteration(workItemId, targetIterationId)
    }
    await updateWorkItemPlanningSort(props.projectId, targetIterationId, collectPlanningIds(event.to))
    toast.success(targetIterationId ? '已规划到迭代' : '已移回待规划')
  } finally {
    await getPlanningData()
    planningSaving.value = false
  }
}

/** 展开或折叠迭代 */
function toggleIteration(iteration: PlanningIteration) {
  iteration.expanded = !iteration.expanded
}

/** 查看工作项详情 */
function handleWorkItemDetail(item: WorkItem) {
  uni.navigateTo({ url: `/pages-pms/pm/workitem/detail/index?id=${item.id}` })
}

/** 打开工作项更多操作 */
function handleWorkItemMore(item: WorkItem, iteration: PlanningIteration | undefined) {
  currentWorkItem.value = item
  currentIteration.value = iteration
  workItemActionVisible.value = true
}

/** 工作项更多操作选择 */
async function handleWorkItemActionSelect({ item: action }: { item: { name: string } }) {
  const item = currentWorkItem.value
  if (!item?.id) {
    return
  }
  if (action.name === '编辑事项') {
    uni.navigateTo({ url: `/pages-pms/pm/workitem/form/index?id=${item.id}` })
    return
  }
  if (action.name === '规划到迭代' || action.name === '移动到其他迭代') {
    moveVisible.value = true
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确认将事项“${item.name}”移入回收站吗？` })
    await recycleWorkItem(item.id)
    toast.success('已移入回收站')
    await getPlanningData()
  } catch {}
}

/** 规划工作项到迭代 */
async function handleMoveSelect({ index }: { index: number }) {
  const item = currentWorkItem.value
  if (!item?.id) {
    return
  }
  const targets: Array<{ id?: number, name: string }> = []
  if (currentIteration.value) {
    targets.push({ id: undefined, name: '移回待规划' })
  }
  iterationList.value
    .filter(iteration => iteration.id !== currentIteration.value?.id)
    .forEach(iteration => targets.push({ id: iteration.id, name: iteration.name }))
  const target = targets[index]
  if (!target) {
    return
  }
  await updateWorkItemIteration(item.id, target.id)
  // 同步持久化目标区域的规划顺序：移动到末尾（对齐 PC 拖入末尾的语义）
  const targetItems = target.id === undefined
    ? unplannedWorkItems.value
    : iterationList.value.find(iteration => iteration.id === target.id)?.list
  if (targetItems) {
    await updateWorkItemPlanningSort(
      props.projectId,
      target.id,
      [...targetItems.map(targetItem => targetItem.id!).filter(id => id !== item.id), item.id],
    )
  }
  toast.success(target.id ? `已规划到“${target.name}”` : '已移回待规划')
  await getPlanningData()
}

/** 打开迭代更多操作 */
function handleIterationMore(iteration: PlanningIteration) {
  currentIteration.value = iteration
  iterationActionVisible.value = true
}

/** 迭代更多操作选择 */
async function handleIterationActionSelect({ item: action }: { item: { name: string } }) {
  const iteration = currentIteration.value
  if (!iteration?.id) {
    return
  }
  if (action.name === '开始迭代') {
    startForm.startTime = iteration.startTime ? Number(iteration.startTime) : ''
    startForm.endTime = iteration.endTime ? Number(iteration.endTime) : ''
    startVisible.value = true
    return
  }
  if (action.name === '编辑迭代') {
    uni.navigateTo({ url: `/pages-pms/pm/iteration/form/index?id=${iteration.id}&projectId=${props.projectId}` })
    return
  }
  try {
    if (action.name === '完成迭代') {
      await dialog.confirm({ title: '提示', msg: `确认完成迭代“${iteration.name}”吗？` })
      await completeIteration(iteration.id)
      toast.success('迭代已完成')
    } else if (action.name === '删除迭代') {
      await dialog.confirm({ title: '提示', msg: `确认删除迭代“${iteration.name}”吗？` })
      await deleteIteration(iteration.id)
      toast.success('删除成功')
    }
    await getPlanningData()
  } catch {}
}

/** 确认开始迭代 */
async function handleStartConfirm() {
  const iteration = currentIteration.value
  if (!iteration?.id) {
    return
  }
  if (!startForm.startTime || !startForm.endTime) {
    toast.warning('迭代周期不能为空')
    return
  }
  starting.value = true
  try {
    await startIteration({
      id: iteration.id,
      startTime: Number(startForm.startTime),
      endTime: Number(startForm.endTime),
    })
    toast.success('迭代已开始')
    startVisible.value = false
    await getPlanningData()
  } finally {
    starting.value = false
  }
}

/** 打开迭代事项类型选择 */
function openIterationTypeSheet(iterationId: number) {
  typeDraftIterationId.value = iterationId
  iterationTypeVisible.value = true
}

/** Backlog 事项类型选择 */
function handleBacklogTypeSelect({ index }: { index: number }) {
  const option = PmsWorkItemTypeOptions
    .filter(item => props.projectType === PmsProjectType.AGILE || item.value === PmsWorkItemType.TASK)[index]
  if (option) {
    backlogDraft.type = option.value
  }
}

/** 迭代事项类型选择 */
function handleIterationTypeSelect({ index }: { index: number }) {
  const option = PmsWorkItemTypeOptions
    .filter(item => props.projectType === PmsProjectType.AGILE || item.value === PmsWorkItemType.TASK)[index]
  if (option && iterationDrafts[typeDraftIterationId.value]) {
    iterationDrafts[typeDraftIterationId.value].type = option.value
  }
}

/** 快速创建工作项 */
async function createQuickWorkItem(draft: QuickWorkItemDraft, iterationId?: number) {
  const name = draft.name.trim()
  if (!name) {
    toast.warning('请输入事项标题')
    return
  }
  creatingKey.value = iterationId ? `iteration-${iterationId}` : 'backlog'
  try {
    await createWorkItem({
      projectId: props.projectId,
      type: draft.type,
      name,
      priority: PmsWorkItemPriority.MEDIUM,
      memberUserIds: [],
      defectType: draft.type === PmsWorkItemType.DEFECT ? PmsWorkItemDefectType.FUNCTION : undefined,
      iterationId,
      fileUrls: [],
      labelIds: [],
    })
    draft.name = ''
    toast.success('事项创建成功')
    await getPlanningData()
  } finally {
    creatingKey.value = ''
  }
}

/** 快速创建迭代 */
async function createQuickIteration() {
  const name = quickIterationName.value.trim()
  if (!name) {
    toast.warning('请输入迭代名称')
    return
  }
  creatingKey.value = 'iteration'
  try {
    await createIteration({ projectId: props.projectId, name })
    quickIterationName.value = ''
    toast.success('迭代创建成功')
    await getPlanningData()
  } finally {
    creatingKey.value = ''
  }
}

defineExpose({ reload: getPlanningData })

/** 初始化 */
onMounted(() => {
  getPlanningData()
  uni.$on('pms:pm:workitem:reload', getPlanningData)
  uni.$on('pms:pm:iteration:reload', getPlanningData)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('pms:pm:workitem:reload', getPlanningData)
  uni.$off('pms:pm:iteration:reload', getPlanningData)
  planningSortables.forEach(instance => instance.destroy())
  planningSortables = []
})
</script>
