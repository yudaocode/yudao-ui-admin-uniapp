<template>
  <view class="bg-white px-24rpx py-20rpx">
    <view class="mb-16rpx flex items-center justify-between gap-16rpx">
      <view class="min-w-0 flex-1">
        <view class="truncate text-30rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <view class="mt-4rpx text-22rpx text-[#999]">
          {{ rangeText }}
        </view>
      </view>
      <slot name="actions" />
    </view>

    <view v-if="rows.length === 0" class="rounded-10rpx bg-[#f7f8fa] py-48rpx text-center text-26rpx text-[#999]">
      暂无甘特任务
    </view>
    <view v-else class="overflow-hidden border border-[#eef0f3] rounded-12rpx">
      <view class="flex">
        <!-- 左侧任务列 -->
        <view class="w-224rpx shrink-0 border-r border-[#eef0f3]">
          <view class="h-74rpx flex items-center bg-[#f8fafc] px-18rpx text-22rpx text-[#667085] font-semibold">
            任务
          </view>
          <view
            v-for="row in displayRows"
            :key="row.id"
            class="h-88rpx flex items-center border-t border-[#f1f3f5] px-16rpx"
            :class="row.isProject ? 'bg-[#f8fafc]' : 'bg-white'"
            @click="handleRowClick(row)"
          >
            <view class="min-w-0" :style="{ paddingLeft: `${row.level * 20}rpx` }">
              <view class="truncate text-24rpx text-[#333] font-medium">
                {{ row.title }}
              </view>
              <view class="mt-4rpx truncate text-20rpx text-[#999]">
                {{ row.subtitle || '-' }}
              </view>
            </view>
          </view>
        </view>

        <!-- 右侧时间轴 -->
        <scroll-view scroll-x class="min-w-0 flex-1" scroll-with-animation>
          <view class="relative" :style="{ width: `${timelineWidth}rpx` }">
            <!-- 日期刻度 -->
            <view class="h-74rpx flex bg-[#f8fafc]">
              <view
                v-for="day in days"
                :key="day.value"
                class="h-74rpx flex shrink-0 flex-col items-center justify-center border-r border-[#eef0f3] text-[#475467]"
                :class="{ 'bg-[#fff7e6]': day.weekend, 'text-[#1677ff]': day.today }"
                :style="{ width: `${DAY_WIDTH}rpx` }"
              >
                <view class="text-22rpx font-medium">
                  {{ day.label }}
                </view>
                <view class="mt-2rpx text-18rpx text-[#999]">
                  {{ day.week }}
                </view>
              </view>
            </view>

            <!-- 甘特任务行 -->
            <view
              v-for="row in displayRows"
              :key="`${row.id}-timeline`"
              class="relative h-88rpx flex border-t border-[#f1f3f5]"
              :class="row.isProject ? 'bg-[#f8fafc]' : 'bg-white'"
            >
              <view
                v-for="day in days"
                :key="`${row.id}-${day.value}`"
                class="h-88rpx shrink-0 border-r border-[#f4f5f7]"
                :class="{ 'bg-[#fffaf0]': day.weekend }"
                :style="{ width: `${DAY_WIDTH}rpx` }"
              />
              <!-- 任务条 -->
              <view
                v-if="row.start && row.end"
                class="absolute flex items-center overflow-hidden rounded-full shadow-[0_6rpx_14rpx_rgba(22,119,255,0.16)]"
                :class="[
                  row.isProject ? 'top-32rpx h-24rpx opacity-[0.72]' : 'top-24rpx h-40rpx min-w-68rpx',
                  editable && row.isTask ? 'cursor-grab' : '',
                ]"
                :style="getBarStyle(row)"
                @click.stop="handleBarClick(row)"
                @touchstart.stop="handleDragStart(row, 'move', $event)"
                @touchmove.stop.prevent="handleDragMove"
                @touchend.stop="handleDragEnd"
                @touchcancel.stop="handleDragCancel"
                @mousedown.stop.prevent="handleMouseDown(row, 'move', $event)"
              >
                <view
                  v-if="!row.isProject"
                  class="absolute inset-y-0 left-0 bg-[rgba(255,255,255,0.24)]"
                  :style="{ width: `${Math.round((row.item.progress || 0) * 100)}%` }"
                />
                <view
                  v-if="editable && row.isTask"
                  class="absolute left-0 top-0 z-2 h-full w-28rpx"
                  @touchstart.stop="handleDragStart(row, 'resize-start', $event)"
                  @touchmove.stop.prevent="handleDragMove"
                  @touchend.stop="handleDragEnd"
                  @touchcancel.stop="handleDragCancel"
                  @mousedown.stop.prevent="handleMouseDown(row, 'resize-start', $event)"
                />
                <text class="relative z-1 truncate px-14rpx text-22rpx text-white">
                  {{ row.item.process || row.title }}
                </text>
                <view
                  v-if="editable && row.isTask"
                  class="absolute right-0 top-0 z-2 h-full w-28rpx"
                  @touchstart.stop="handleDragStart(row, 'resize-end', $event)"
                  @touchmove.stop.prevent="handleDragMove"
                  @touchend.stop="handleDragEnd"
                  @touchcancel.stop="handleDragCancel"
                  @mousedown.stop.prevent="handleMouseDown(row, 'resize-end', $event)"
                />
              </view>
            </view>

            <!-- 今日标记线 -->
            <view
              v-if="todayLeft >= 0"
              class="absolute bottom-0 top-0 w-3rpx bg-[#f04438] opacity-[0.72]"
              :style="{ left: `${todayLeft}rpx` }"
            />
          </view>
        </scroll-view>
      </view>
      <!-- 隐藏任务提示 -->
      <view v-if="hiddenCount > 0" class="border-t border-[#eef0f3] bg-[#fafafa] px-20rpx py-14rpx text-22rpx text-[#999]">
        还有 {{ hiddenCount }} 条任务，进入甘特编辑查看
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProTask, ProTaskGantt } from '@/api/mes/pro/task'
import dayjs from 'dayjs'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { BarcodeBizTypeEnum } from '@/utils/constants'
import { formatDate, formatDateTime, toTimestamp } from '@/utils/date'

type DragMode = 'move' | 'resize-start' | 'resize-end'

interface DraftRange {
  startDate: string
  endDate: string
  duration: number
}

interface GanttRow {
  id: string
  item: ProTaskGantt
  title: string
  subtitle?: string
  level: number
  start?: dayjs.Dayjs
  end?: dayjs.Dayjs
  isTask: boolean
  isProject: boolean
}

interface DragState {
  row: GanttRow
  mode: DragMode
  startX: number
  startDate: dayjs.Dayjs
  endDate: dayjs.Dayjs
  moved: boolean
}

const props = withDefaults(defineProps<{
  title?: string
  tasks?: ProTaskGantt[]
  editable?: boolean
  maxRows?: number
}>(), {
  title: '排产甘特图',
  tasks: () => [],
  editable: false,
  maxRows: 0,
})

const emit = defineEmits<{
  'task-click': [item: ProTaskGantt]
  'task-update': [change: ProTask]
}>()

const DAY_WIDTH = 112
const LEFT_WIDTH = 224
const MIN_DURATION_HOURS = 8
const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']
const draftRanges = ref(new Map<string, DraftRange>()) // 拖拽中的临时时间
const dragging = ref<DragState>() // 当前拖拽状态
const suppressClickUntil = ref(0) // 拖拽后短暂屏蔽点击
const systemWidth = ref(getWindowWidth()) // 屏幕宽度
const dayWidthPx = computed(() => DAY_WIDTH * systemWidth.value / 750)
const rangeStart = computed(() => getRangeStart())
const rangeEnd = computed(() => getRangeEnd())
const rangeText = computed(() => `${formatDate(rangeStart.value.toDate(), 'MM/DD')} - ${formatDate(rangeEnd.value.toDate(), 'MM/DD')}`)
const todayLeft = computed(() => {
  const today = dayjs().startOf('day')
  if (today.isBefore(rangeStart.value) || today.isAfter(rangeEnd.value)) {
    return -1
  }
  return Math.round(today.diff(rangeStart.value, 'hour', true) / 24 * DAY_WIDTH)
})
const days = computed(() => {
  const list = []
  const total = rangeEnd.value.diff(rangeStart.value, 'day') + 1
  for (let i = 0; i < total; i += 1) {
    const date = rangeStart.value.add(i, 'day')
    const weekday = date.day()
    list.push({
      value: date.format('YYYY-MM-DD'),
      label: date.format('MM/DD'),
      week: `周${weekdayLabels[weekday]}`,
      weekend: weekday === 0 || weekday === 6,
      today: date.isSame(dayjs(), 'day'),
    })
  }
  return list
})
const timelineWidth = computed(() => Math.max(days.value.length * DAY_WIDTH, 750 - LEFT_WIDTH))
const rows = computed<GanttRow[]>(() => {
  const tasks = props.tasks || []
  const projects = tasks.filter(item => item.type === BarcodeBizTypeEnum.WORKORDER)
  const taskRows = tasks.filter(item => item.type === BarcodeBizTypeEnum.TASK)

  // 先按父工单分组，优先还原后端返回的工单-任务层级
  const byParent = new Map<string, ProTaskGantt[]>()
  taskRows.forEach((item) => {
    const key = String(item.parent || '')
    byParent.set(key, [...(byParent.get(key) || []), item])
  })

  // 没有工单项目行时，直接按任务平铺展示
  if (projects.length === 0) {
    return taskRows.map(item => createRow(item, 0)).filter(row => row.start && row.end)
  }

  const result: GanttRow[] = []
  const usedTaskIds = new Set<string>()
  projects.forEach((project) => {
    // 项目行下挂任务行；没有有效项目时间时，只展示可用的子任务
    const children = byParent.get(String(project.id)) || []
    const childRows = children.map(task => createRow(task, 1)).filter(row => row.start && row.end)
    const projectRow = createRow(project, 0, children)
    children.forEach(task => usedTaskIds.add(String(task.id)))
    if (!projectRow.start || !projectRow.end) {
      if (childRows.length > 0) {
        result.push(...childRows)
      }
      return
    }
    result.push(projectRow)
    childRows.forEach((task) => {
      usedTaskIds.add(String(task.id))
      result.push(task)
    })
  })

  // 补齐未挂到任何工单下的任务，避免后端 parent 异常时整行丢失
  taskRows
    .filter(item => !usedTaskIds.has(String(item.id)))
    .map(item => createRow(item, 0))
    .filter(row => row.start && row.end)
    .forEach(row => result.push(row))
  return result
})
const displayRows = computed(() => props.maxRows > 0 ? rows.value.slice(0, props.maxRows) : rows.value)
const hiddenCount = computed(() => Math.max(0, rows.value.length - displayRows.value.length))

/** 获取窗口宽度 */
function getWindowWidth() {
  try {
    return uni.getSystemInfoSync().windowWidth || 375
  } catch {
    return 375
  }
}

/** 解析日期 */
function parseDate(value?: ProTaskGantt['startDate']) {
  if (!value) {
    return undefined
  }
  const timestamp = toTimestamp(value)
  const date = dayjs(timestamp)
  return date.isValid() ? date : undefined
}

/** 获取任务草稿 */
function getDraft(item: ProTaskGantt) {
  return draftRanges.value.get(String(item.id))
}

/** 获取任务开始时间 */
function getItemStart(item: ProTaskGantt) {
  const draft = getDraft(item)
  return parseDate(draft?.startDate || item.startDate)
}

/** 获取任务结束时间 */
function getItemEnd(item: ProTaskGantt, start?: dayjs.Dayjs) {
  const draft = getDraft(item)
  const end = parseDate(draft?.endDate || item.endDate)
  if (end) {
    return end
  }
  if (start && item.duration) {
    return start.add(Number(item.duration) * MIN_DURATION_HOURS, 'hour')
  }
  return undefined
}

/** 创建甘特行 */
function createRow(item: ProTaskGantt, level: number, children: ProTaskGantt[] = []): GanttRow {
  const isTask = item.type === BarcodeBizTypeEnum.TASK
  const isProject = item.type === BarcodeBizTypeEnum.WORKORDER
  let start = getItemStart(item)
  let end = getItemEnd(item, start)

  // 工单行没有自身时间时，用子任务最早开始、最晚结束推导项目跨度
  if (isProject && (!start || !end) && children.length > 0) {
    const ranges = children
      .map((child) => {
        const childStart = getItemStart(child)
        return {
          start: childStart,
          end: getItemEnd(child, childStart),
        }
      })
      .filter(item => item.start && item.end) as Array<{ start: dayjs.Dayjs, end: dayjs.Dayjs }>
    if (ranges.length > 0) {
      start = ranges.reduce((min, item) => item.start.isBefore(min) ? item.start : min, ranges[0].start)
      end = ranges.reduce((max, item) => item.end.isAfter(max) ? item.end : max, ranges[0].end)
    }
  }
  return {
    id: String(item.id),
    item,
    title: item.text || '-',
    subtitle: isProject ? '生产工单' : item.workstation || item.process || item.product,
    level,
    start,
    end,
    isTask,
    isProject,
  }
}

/** 获取甘特开始日期 */
function getRangeStart() {
  const starts = rows.value.map(item => item.start).filter(Boolean) as dayjs.Dayjs[]
  if (starts.length === 0) {
    return dayjs().startOf('day')
  }
  return starts.reduce((min, item) => item.isBefore(min) ? item : min, starts[0]).startOf('day').subtract(1, 'day')
}

/** 获取甘特结束日期 */
function getRangeEnd() {
  const ends = rows.value.map(item => item.end).filter(Boolean) as dayjs.Dayjs[]
  const minEnd = rangeStart.value.add(6, 'day')
  if (ends.length === 0) {
    return minEnd
  }
  const maxEnd = ends.reduce((max, item) => item.isAfter(max) ? item : max, ends[0]).startOf('day').add(1, 'day')
  return maxEnd.isBefore(minEnd) ? minEnd : maxEnd
}

/** 获取任务条样式 */
function getBarStyle(row: GanttRow) {
  if (!row.start || !row.end) {
    return {}
  }
  const left = Math.max(0, row.start.diff(rangeStart.value, 'hour', true) / 24 * DAY_WIDTH)
  const width = Math.max(64, row.end.diff(row.start, 'hour', true) / 24 * DAY_WIDTH)
  return {
    left: `${Math.round(left)}rpx`,
    width: `${Math.round(width)}rpx`,
    backgroundColor: row.isProject ? '#667085' : row.item.color || '#1677ff',
  }
}

/** 获取指针横坐标 */
function getClientX(event: TouchEvent | MouseEvent) {
  if ('touches' in event && event.touches?.[0]) {
    return event.touches[0].clientX
  }
  if ('changedTouches' in event && event.changedTouches?.[0]) {
    return event.changedTouches[0].clientX
  }
  return 'clientX' in event ? event.clientX : undefined
}

/** 开始拖拽 */
function handleDragStart(row: GanttRow, mode: DragMode, event: TouchEvent | MouseEvent) {
  if (!props.editable || !row.isTask || !row.start || !row.end || !row.item.originalId) {
    return
  }
  const clientX = getClientX(event)
  if (clientX == null) {
    return
  }
  dragging.value = {
    row,
    mode,
    startX: clientX,
    startDate: row.start,
    endDate: row.end,
    moved: false,
  }
}

/** 鼠标开始拖拽 */
function handleMouseDown(row: GanttRow, mode: DragMode, event: MouseEvent) {
  handleDragStart(row, mode, event)
  if (typeof document === 'undefined') {
    return
  }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

/** 鼠标拖拽 */
function handleMouseMove(event: MouseEvent) {
  handleDragMove(event)
}

/** 鼠标结束拖拽 */
function handleMouseUp() {
  handleDragEnd()
  removeMouseListeners()
}

/** 移除鼠标事件 */
function removeMouseListeners() {
  if (typeof document === 'undefined') {
    return
  }
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

/** 拖拽移动 */
function handleDragMove(event: TouchEvent | MouseEvent) {
  const state = dragging.value
  if (!state) {
    return
  }
  const clientX = getClientX(event)
  if (clientX == null) {
    return
  }
  const delta = clientX - state.startX
  if (Math.abs(delta) > 4) {
    state.moved = true
  }
  const deltaDays = Math.round(delta / dayWidthPx.value)
  const range = getNextRange(state, deltaDays)
  setDraftRange(state.row.item, range.start, range.end)
}

/** 计算拖拽后的时间范围 */
function getNextRange(state: DragState, deltaDays: number) {
  if (state.mode === 'move') {
    return {
      start: state.startDate.add(deltaDays, 'day'),
      end: state.endDate.add(deltaDays, 'day'),
    }
  }
  if (state.mode === 'resize-start') {
    const maxStart = state.endDate.subtract(MIN_DURATION_HOURS, 'hour')
    const start = state.startDate.add(deltaDays, 'day')
    return {
      start: start.isAfter(maxStart) ? maxStart : start,
      end: state.endDate,
    }
  }
  const minEnd = state.startDate.add(MIN_DURATION_HOURS, 'hour')
  const end = state.endDate.add(deltaDays, 'day')
  return {
    start: state.startDate,
    end: end.isBefore(minEnd) ? minEnd : end,
  }
}

/** 更新临时范围 */
function setDraftRange(item: ProTaskGantt, start: dayjs.Dayjs, end: dayjs.Dayjs) {
  const next = new Map(draftRanges.value)
  next.set(String(item.id), {
    startDate: formatDateTime(start),
    endDate: formatDateTime(end),
    duration: Math.max(1, Math.ceil(end.diff(start, 'hour', true) / MIN_DURATION_HOURS)),
  })
  draftRanges.value = next
}

/** 结束拖拽 */
function handleDragEnd() {
  const state = dragging.value
  if (!state) {
    return
  }
  if (state.moved) {
    suppressClickUntil.value = Date.now() + 300
    const draft = getDraft(state.row.item)
    if (draft && state.row.item.originalId) {
      emit('task-update', {
        id: state.row.item.originalId,
        startTime: draft.startDate,
        endTime: draft.endDate,
        duration: draft.duration,
      })
    }
  }
  dragging.value = undefined
}

/** 取消拖拽 */
function handleDragCancel() {
  dragging.value = undefined
}

/** 点击任务条 */
function handleBarClick(row: GanttRow) {
  if (Date.now() < suppressClickUntil.value) {
    return
  }
  emit('task-click', row.item)
}

/** 点击任务行 */
function handleRowClick(row: GanttRow) {
  emit('task-click', row.item)
}

watch(
  () => props.tasks,
  () => {
    draftRanges.value = new Map()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  removeMouseListeners()
})
</script>
