<template>
  <view class="h-full flex flex-col">
    <!-- 筛选与时间轴设置 -->
    <view class="bg-white p-24rpx pb-16rpx">
      <view class="mb-16rpx">
        <wd-search v-model="keyword" placeholder="搜索工作项" hide-cancel @search="buildRowCache" @clear="buildRowCache" />
      </view>
      <view class="flex items-center gap-16rpx">
        <view class="flex-1" @click="rangeVisible = true">
          <view class="flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-20rpx">
            <text class="text-26rpx" :class="dateRangeText ? 'text-[#333]' : 'text-[#999]'">
              {{ dateRangeText || '自定义时间轴范围' }}
            </text>
            <wd-icon name="arrow-right" size="28rpx" color="#666" />
          </view>
        </view>
        <view class="w-200rpx shrink-0" @click="viewModeVisible = true">
          <view class="flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-20rpx">
            <text class="text-26rpx text-[#333]">{{ viewModeLabel }}</text>
            <wd-icon name="arrow-right" size="28rpx" color="#666" />
          </view>
        </view>
        <wd-button size="small" variant="plain" @click="resetRange">
          重置
        </wd-button>
      </view>
    </view>

    <!-- 甘特图时间轴 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view v-if="!datedRows.length" class="py-80rpx text-center text-28rpx text-[#999]">
        暂无符合条件且已设置时间范围的工作项
      </view>
      <scroll-view v-else scroll-x :scroll-left="scrollLeft" class="gantt-scroll whitespace-nowrap">
        <view class="inline-block align-top" :style="{ width: `${leftWidth + timelineWidth}rpx` }">
          <!-- 表头 -->
          <view class="gantt-row flex" :style="{ width: `${leftWidth + timelineWidth}rpx` }">
            <view class="gantt-left flex shrink-0" :style="{ width: `${leftWidth}rpx` }">
              <text class="gantt-cell-name">名称</text>
              <text class="gantt-cell-date">开始日期</text>
              <text class="gantt-cell-date">结束日期</text>
            </view>
            <view class="relative flex-1" :style="{ width: `${timelineWidth}rpx`, height: '72rpx' }">
              <text
                v-for="tick in timelineTicks"
                :key="tick.time"
                class="absolute border-l b-[#f0f0f0] b-solid pl-8rpx text-22rpx text-[#999]"
                :style="{ left: `${tick.left}%` }"
              >
                {{ tick.label }}
              </text>
            </view>
          </view>
          <!-- 数据行 -->
          <view
            v-for="row in datedRows"
            :key="row.key"
            class="gantt-row flex"
            :class="{ 'bg-[#f7f8fa]': row.group }"
            :style="{ width: `${leftWidth + timelineWidth}rpx` }"
          >
            <view class="gantt-left flex shrink-0 bg-white" :class="{ '!bg-[#f7f8fa]': row.group }" :style="{ width: `${leftWidth}rpx` }">
              <view class="gantt-cell-name flex items-center" :style="{ paddingLeft: `${12 + row.depth * 24}rpx` }">
                <wd-icon
                  v-if="hasChildren(row.key)"
                  :name="collapsedKeys.has(row.key) ? 'arrow-right' : 'arrow-down'"
                  size="28rpx" color="#666"
                  class="mr-8rpx shrink-0"
                  @click.stop="toggleRow(row.key)"
                />
                <text
                  v-if="row.item"
                  class="truncate text-26rpx text-[#1677ff]"
                  @click="openWorkItem(row.item)"
                >
                  #{{ row.item.serialNumber }} {{ row.name }}
                </text>
                <text v-else class="truncate text-26rpx text-[#333] font-semibold">{{ row.name }}</text>
              </view>
              <text class="gantt-cell-date">{{ formatDate(row.startTime) }}</text>
              <text class="gantt-cell-date">{{ formatDate(row.endTime) }}</text>
            </view>
            <view class="gantt-timeline relative flex-1" :style="{ width: `${timelineWidth}rpx` }">
              <!-- 今日线 -->
              <view class="absolute top-0 z-1 h-full w-2rpx bg-[#f5222d]" :style="{ left: `${todayPosition}%` }" />
              <!-- 甘特条 -->
              <view
                class="absolute h-40rpx min-w-24rpx flex items-center justify-center overflow-hidden rounded-8rpx text-22rpx text-white"
                :class="row.group ? 'bg-[#52c41a] !h-32rpx' : 'bg-[#1677ff]'"
                :style="{ left: `${getBarLeft(row)}%`, width: `${getBarWidth(row)}%` }"
                @click="row.item && openWorkItem(row.item)"
              >
                <text>{{ row.group ? '' : `${row.progress}%` }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </scroll-view>

    <!-- 时间轴范围弹窗 -->
    <wd-popup v-model="rangeVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          时间轴范围
        </view>
        <yd-search-date-range v-model="dateRange" label="日期范围" />
        <view class="mt-32rpx flex gap-24rpx">
          <wd-button class="flex-1" variant="plain" @click="dateRange = [undefined, undefined]">
            清除
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="rangeVisible = false">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 视图模式弹窗 -->
    <wd-action-sheet
      v-model="viewModeVisible"
      :actions="viewModeActions"
      @select="handleViewModeSelect"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Iteration } from '@/api/pms/pm/iteration'
import type { WorkItem } from '@/api/pms/pm/workitem'
import { computed, reactive, ref } from 'vue'
import { getIterationPage } from '@/api/pms/pm/iteration'
import { getWorkItemPage } from '@/api/pms/pm/workitem'
import { PmsProjectType } from '@/pages-pms/pm/utils/constants'
import { formatDate } from '@/utils/date'
import { getAllPageItems } from '@/utils/page'
import dayjs from 'dayjs'

interface GanttRow {
  key: string
  name: string
  startTime: number
  endTime: number
  progress: number
  depth: number
  group: boolean
  parentKey?: string
  item?: WorkItem
}

const props = defineProps<{
  projectId: number
  projectType: number
  editable: boolean
}>()

type ViewMode = 'Day' | 'Week' | 'Month' | 'Year'

const items = ref<WorkItem[]>([]) // 工作项列表
const iterationList = ref<Iteration[]>([]) // 项目迭代列表
const keyword = ref('') // 搜索关键词
const dateRange = ref<[number | undefined, number | undefined]>([undefined, undefined]) // 时间轴日期范围
const viewMode = ref<ViewMode>('Day') // 时间轴视图模式
const rangeVisible = ref(false) // 时间轴范围弹窗显示状态
const viewModeVisible = ref(false) // 视图模式弹窗显示状态
const collapsedKeys = reactive(new Set<string>()) // 已折叠的迭代或父事项
const rowCache = ref<GanttRow[]>([]) // 甘特图行缓存（关键词变化时重建）

const leftWidth = 520 // 左侧名称/日期列宽度（rpx）
const viewModeOptions = [ // 甘特图视图模式选项
  { label: '日视图', value: 'Day' },
  { label: '周视图', value: 'Week' },
  { label: '月视图', value: 'Month' },
  { label: '年视图', value: 'Year' },
] as const
const timelineUnitMap = { Day: 'day', Week: 'week', Month: 'month', Year: 'year' } as const // 甘特图时间单位映射

const allDatedItems = computed(() => items.value.filter(item => item.startTime && item.endTime)) // 已设置时间范围的工作项
const visibleRows = computed(() => {
  const rowMap = new Map(rowCache.value.map(row => [row.key, row]))
  return rowCache.value.filter((row) => {
    let parentKey = row.parentKey
    while (parentKey) {
      if (collapsedKeys.has(parentKey)) {
        return false
      }
      parentKey = rowMap.get(parentKey)?.parentKey
    }
    return true
  })
}) // 展开状态下的可见行
const beginTime = computed(() =>
  dateRange.value[0]
    ? dayjs(dateRange.value[0]).startOf('day').valueOf()
    : Math.min(...rowCache.value.map(row => row.startTime)),
) // 时间轴开始时间
const endTime = computed(() =>
  dateRange.value[1]
    ? dayjs(dateRange.value[1]).endOf('day').valueOf()
    : Math.max(...rowCache.value.map(row => row.endTime)),
) // 时间轴结束时间
const datedRows = computed(() =>
  visibleRows.value.filter(row => row.endTime >= beginTime.value && row.startTime <= endTime.value),
) // 时间范围内的展示行
const totalDuration = computed(() => Math.max(1, endTime.value - beginTime.value)) // 时间轴总时长
const timelineUnit = computed(() => timelineUnitMap[viewMode.value]) // 时间轴刻度单位
const timelineWidth = computed(() => {
  const unitCount = Math.max(1, dayjs(endTime.value).diff(dayjs(beginTime.value), timelineUnit.value) + 1)
  const unitWidth = { Day: 88, Week: 152, Month: 192, Year: 256 }[viewMode.value]
  return Math.max(620, Math.min(12000, unitCount * unitWidth))
}) // 时间轴宽度（rpx）
const timelineTicks = computed(() => {
  const ticks: Array<{ time: number, label: string, left: number }> = []
  const unit = timelineUnit.value
  const format = { Day: 'MM-DD', Week: 'MM-DD', Month: 'YYYY-MM', Year: 'YYYY' }[viewMode.value]
  let currentTime = dayjs(beginTime.value).startOf(unit)
  let guard = 0
  while (currentTime.valueOf() <= endTime.value && guard < 160) {
    ticks.push({
      time: currentTime.valueOf(),
      label: currentTime.format(format),
      left: ((currentTime.valueOf() - beginTime.value) / totalDuration.value) * 100,
    })
    currentTime = currentTime.add(1, unit)
    guard += 1
  }
  return ticks
}) // 时间轴刻度
const todayPosition = computed(() =>
  Math.min(100, Math.max(0, ((dayjs().valueOf() - beginTime.value) / totalDuration.value) * 100)),
) // 今天所在位置百分比
const scrollLeft = computed(() => 0) // 横向滚动位置（保留初始定位）
const dateRangeText = computed(() =>
  dateRange.value[0] && dateRange.value[1]
    ? `${formatDate(dateRange.value[0])} ~ ${formatDate(dateRange.value[1])}`
    : '',
) // 时间轴范围文案
const viewModeLabel = computed(() => viewModeOptions.find(item => item.value === viewMode.value)?.label) // 视图模式文案
const viewModeActions = computed(() => viewModeOptions.map(item => ({ name: item.label }))) // 视图模式操作项

/** 查询甘特图数据 */
async function getGanttData() {
  const [workItems, projectIterations] = await Promise.all([
    getAllPageItems((pageNo, pageSize) =>
      getWorkItemPage({ pageNo, pageSize, projectId: props.projectId })),
    props.projectType === PmsProjectType.AGILE
      ? getAllPageItems((pageNo, pageSize) =>
          getIterationPage({ pageNo, pageSize, projectId: props.projectId }))
      : Promise.resolve([] as Iteration[]),
  ])
  items.value = workItems
  iterationList.value = projectIterations
  resetRange()
  buildRowCache()
}

/** 重建甘特图行缓存 */
function buildRowCache() {
  rowCache.value = buildRows()
}

/** 构建甘特图行 */
function buildRows() {
  const searchKeyword = keyword.value.trim()
  if (props.projectType !== PmsProjectType.AGILE) {
    return buildItemRows(
      allDatedItems.value.filter(item => !searchKeyword || item.name.includes(searchKeyword)),
      0,
    )
  }
  const result: GanttRow[] = []
  iterationList.value.forEach((iteration) => {
    const iterationMatched = !searchKeyword || iteration.name.includes(searchKeyword)
    const iterationItems = allDatedItems.value.filter(
      item => item.iterationId === iteration.id && (iterationMatched || item.name.includes(searchKeyword)),
    )
    if (iterationItems.length === 0) {
      return
    }
    // 迭代缺少日期时，使用其下已有日期事项推导分组范围，避免整组事项被隐藏
    const iterationStartTime = iteration.startTime
      ? Number(iteration.startTime)
      : Math.min(...iterationItems.map(item => Number(item.startTime)))
    const iterationEndTime = iteration.endTime
      ? Number(iteration.endTime)
      : Math.max(...iterationItems.map(item => Number(item.endTime)))
    result.push({
      key: `iteration-${iteration.id}`,
      name: iteration.name,
      startTime: iterationStartTime,
      endTime: iterationEndTime,
      progress: 0,
      depth: 0,
      group: true,
    })
    result.push(...buildItemRows(iterationItems, 1, `iteration-${iteration.id}`))
  })
  const unplannedItems = allDatedItems.value.filter(
    item => !item.iterationId && (!searchKeyword || item.name.includes(searchKeyword)),
  )
  if (unplannedItems.length) {
    result.push({
      key: 'iteration-unplanned',
      name: '未规划事项',
      startTime: Math.min(...unplannedItems.map(item => Number(item.startTime))),
      endTime: Math.max(...unplannedItems.map(item => Number(item.endTime))),
      progress: 0,
      depth: 0,
      group: true,
    })
    result.push(...buildItemRows(unplannedItems, 1, 'iteration-unplanned'))
  }
  return result
}

/** 递归构建工作项层级行 */
function buildItemRows(source: WorkItem[], baseDepth: number, parentGroupKey?: string) {
  const result: GanttRow[] = []
  const idSet = new Set(source.map(item => item.id))
  const appendChildren = (parentId: number | undefined, depth: number, parentKey?: string) => {
    source
      .filter(item => (parentId ? item.parentId === parentId : !item.parentId || !idSet.has(item.parentId)))
      .forEach((item) => {
        result.push({
          key: `item-${item.id}`,
          name: item.name,
          startTime: Number(item.startTime),
          endTime: Number(item.endTime),
          progress: item.progress ?? 0,
          depth,
          group: false,
          parentKey,
          item,
        })
        appendChildren(item.id, depth + 1, `item-${item.id}`)
      })
  }
  appendChildren(undefined, baseDepth, parentGroupKey)
  return result
}

/** 判断甘特图行是否存在子行 */
function hasChildren(key: string) {
  return rowCache.value.some(row => row.parentKey === key)
}

/** 折叠或展开甘特图行 */
function toggleRow(key: string) {
  if (collapsedKeys.has(key)) {
    collapsedKeys.delete(key)
  } else {
    collapsedKeys.add(key)
  }
}

/** 重置时间轴范围 */
function resetRange() {
  dateRange.value = [undefined, undefined]
  buildRowCache()
}

/** 获得甘特条左偏移百分比 */
function getBarLeft(row: GanttRow) {
  return Math.max(0, ((row.startTime - beginTime.value) / totalDuration.value) * 100)
}

/** 获得甘特条可见宽度百分比 */
function getBarWidth(row: GanttRow) {
  const visibleStart = Math.max(row.startTime, beginTime.value)
  const visibleEnd = Math.min(row.endTime, endTime.value)
  return Math.max(1.5, ((visibleEnd - visibleStart) / totalDuration.value) * 100)
}

/** 选择视图模式 */
function handleViewModeSelect({ index }: { index: number }) {
  viewMode.value = viewModeOptions[index].value as ViewMode
}

/** 打开工作项详情 */
function openWorkItem(item: WorkItem) {
  uni.navigateTo({ url: `/pages-pms/pm/workitem/detail/index?id=${item.id}` })
}

defineExpose({ reload: getGanttData })

/** 初始化 */
onMounted(() => {
  getGanttData()
  uni.$on('pms:pm:workitem:reload', getGanttData)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('pms:pm:workitem:reload', getGanttData)
})
</script>

<style lang="scss" scoped>
.gantt-scroll {
  width: 100%;
}

.gantt-row {
  border-bottom: 2rpx solid #f0f0f0;
  background: #fff;
}

.gantt-left {
  position: sticky;
  left: 0;
  z-index: 2;
  border-right: 2rpx solid #f0f0f0;
}

.gantt-cell-name {
  width: 260rpx;
  padding: 20rpx 16rpx;
  font-size: 26rpx;
  color: #333;
  overflow: hidden;
}

.gantt-cell-date {
  width: 130rpx;
  padding: 20rpx 8rpx;
  font-size: 22rpx;
  color: #666;
  border-left: 2rpx solid #f0f0f0;
}

.gantt-timeline {
  height: 88rpx;
  background-image: linear-gradient(to right, #f7f7f7 2rpx, transparent 2rpx);
  background-size: 10% 100%;
}
</style>
