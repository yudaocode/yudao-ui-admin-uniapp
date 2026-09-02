<template>
  <view class="h-full flex flex-col">
    <!-- 搜索组件 -->
    <view class="bg-white px-24rpx pb-16rpx">
      <view @click="searchVisible = true">
        <wd-search :placeholder="searchPlaceholder" hide-cancel disabled />
      </view>
    </view>

    <!-- 迭代列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :refresher-enabled="true"
      empty-view-text="暂无迭代"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              #{{ item.id }} {{ item.name }}
            </view>
            <view class="flex shrink-0 items-center gap-12rpx">
              <wd-tag :type="item.status === PmsIterationStatus.ACTIVE ? 'primary' : item.status === PmsIterationStatus.COMPLETED ? 'success' : 'default'" plain>
                {{ getIterationStatusName(item.status) }}
              </wd-tag>
              <wd-icon
                v-if="editable"
                name="more-vertical" size="36rpx" color="#666"
                @click.stop="handleMore(item)"
              />
            </view>
          </view>
          <view class="mb-12rpx flex items-center gap-16rpx">
            <wd-progress class="flex-1" :percentage="item.progress || 0" hide-text />
            <text class="shrink-0 text-24rpx text-[#999]">{{ item.progress ?? 0 }}%</text>
          </view>
          <view class="flex items-center justify-between text-28rpx text-[#666]">
            <text class="min-w-0 flex-1 truncate">负责人：{{ item.ownerUserName || '未设置' }}</text>
            <text class="shrink-0 text-[#999]">
              {{ formatDate(item.startTime) || '?' }} ~ {{ formatDate(item.endTime) || '?' }}
            </text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新建按钮 -->
    <wd-fab
      v-if="editable && hasAccessByCodes(['pms:pm:iteration:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />

    <!-- 搜索弹窗 -->
    <wd-popup
      v-model="searchVisible"
      position="top"
      :custom-style="getTopPopupStyle()"
      :modal-style="getTopPopupModalStyle()"
      @close="searchVisible = false"
    >
      <view class="yd-search-form-container">
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">
            迭代名称
          </view>
          <wd-input v-model="searchData.name" placeholder="搜索迭代" clearable />
        </view>
        <yd-search-picker
          v-model="searchData.status"
          label="迭代状态"
          :columns="statusOptions"
          all-option
          all-label="全部状态"
        />
        <view class="yd-search-form-actions">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 更多操作 -->
    <wd-action-sheet
      v-model="actionVisible"
      :actions="actionList"
      @select="handleActionSelect"
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
  </view>
</template>

<script lang="ts" setup>
import type { Iteration } from '@/api/pms/pm/iteration'
import { computed, reactive, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  completeIteration,
  deleteIteration,
  getIterationPage,
  startIteration,
} from '@/api/pms/pm/iteration'
import { useAccess } from '@/hooks/useAccess'
import { PmsIterationStatus } from '@/pages-pms/pm/utils/constants'
import { getIterationStatusName } from '@/pages-pms/pm/utils/format'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate, toTimestamp } from '@/utils/date'

const props = defineProps<{
  projectId: number
  editable: boolean // 是否允许编辑项目业务数据
}>()

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<Iteration[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const searchVisible = ref(false) // 搜索弹窗显示状态
const actionVisible = ref(false) // 更多操作弹窗显示状态
const startVisible = ref(false) // 开始迭代弹窗显示状态
const starting = ref(false) // 开始迭代提交中
const currentItem = ref<Iteration>() // 当前操作的迭代
const searchData = reactive({
  name: undefined as string | undefined,
  status: undefined as number | undefined,
}) // 搜索表单数据
const startForm = reactive({
  startTime: '' as number | '',
  endTime: '' as number | '',
}) // 开始迭代表单

const statusOptions = [ // 迭代状态选项
  { label: '未开始', value: PmsIterationStatus.PLANNED },
  { label: '进行中', value: PmsIterationStatus.ACTIVE },
  { label: '已完成', value: PmsIterationStatus.COMPLETED },
]
const searchPlaceholder = computed(() => { // 搜索条件 placeholder 拼接
  const conditions: string[] = []
  if (searchData.name) {
    conditions.push(`名称:${searchData.name}`)
  }
  if (searchData.status !== undefined) {
    conditions.push(`状态:${getIterationStatusName(searchData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索迭代'
})
const actionList = computed(() => { // 当前迭代的更多操作项
  const item = currentItem.value
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

/** 查询迭代分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getIterationPage({
      pageNo,
      pageSize,
      projectId: props.projectId,
      name: searchData.name || undefined,
      status: searchData.status,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  searchVisible.value = false
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  searchData.name = undefined
  searchData.status = undefined
  searchVisible.value = false
  pagingRef.value?.reload()
}

/** 查看迭代详情 */
function handleDetail(item: Iteration) {
  uni.navigateTo({ url: `/pages-pms/pm/iteration/detail/index?id=${item.id}` })
}

/** 新建迭代 */
function handleAdd() {
  uni.navigateTo({ url: `/pages-pms/pm/iteration/form/index?projectId=${props.projectId}` })
}

/** 打开更多操作 */
function handleMore(item: Iteration) {
  currentItem.value = item
  actionVisible.value = true
}

/** 更多操作选择 */
async function handleActionSelect({ item: action }: { item: { name: string } }) {
  const item = currentItem.value
  if (!item?.id) {
    return
  }
  if (action.name === '开始迭代') {
    startForm.startTime = item.startTime ? toTimestamp(item.startTime) : ''
    startForm.endTime = item.endTime ? toTimestamp(item.endTime) : ''
    startVisible.value = true
    return
  }
  if (action.name === '编辑迭代') {
    uni.navigateTo({ url: `/pages-pms/pm/iteration/form/index?id=${item.id}&projectId=${props.projectId}` })
    return
  }
  try {
    if (action.name === '完成迭代') {
      await dialog.confirm({ title: '提示', msg: `确认完成迭代“${item.name}”吗？` })
      await completeIteration(item.id)
      toast.success('迭代已完成')
    } else if (action.name === '删除迭代') {
      await dialog.confirm({ title: '提示', msg: `确认删除迭代“${item.name}”吗？` })
      await deleteIteration(item.id)
      toast.success('删除成功')
    }
    pagingRef.value?.reload()
  } catch {}
}

/** 确认开始迭代 */
async function handleStartConfirm() {
  const item = currentItem.value
  if (!item?.id) {
    return
  }
  if (!startForm.startTime || !startForm.endTime) {
    toast.warning('迭代周期不能为空')
    return
  }
  starting.value = true
  try {
    await startIteration({
      id: item.id,
      startTime: Number(startForm.startTime),
      endTime: Number(startForm.endTime),
    })
    toast.success('迭代已开始')
    startVisible.value = false
    pagingRef.value?.reload()
  } finally {
    starting.value = false
  }
}

defineExpose({ reload: () => pagingRef.value?.reload() })

/** 初始化 */
onMounted(() => {
  uni.$on('pms:pm:iteration:reload', handleReload)
})

/** 重新加载 */
function handleReload() {
  pagingRef.value?.reload()
}

/** 卸载 */
onUnmounted(() => {
  uni.$off('pms:pm:iteration:reload', handleReload)
})
</script>
