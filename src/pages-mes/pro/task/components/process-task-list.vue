<template>
  <view class="mx-24rpx mt-24rpx">
    <view class="mb-16rpx flex items-center justify-between">
      <view>
        <view class="text-30rpx text-[#333] font-semibold">
          {{ process.processName || '未命名工序' }}
        </view>
        <view class="mt-4rpx text-24rpx text-[#999]">
          顺序 {{ process.sort }}，{{ process.checkFlag ? '质检工序' : '普通工序' }}
        </view>
      </view>
      <wd-button
        v-if="!readonly && hasAccessByCodes(['mes:pro-task:create'])"
        size="small"
        type="primary"
        @click="handleAdd"
      >
        新增任务
      </wd-button>
    </view>

    <view v-if="loading" class="rounded-12rpx bg-white py-40rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="rounded-12rpx bg-white py-40rpx text-center text-26rpx text-[#999]">
      暂无生产任务
    </view>
    <view v-else>
      <view v-for="item in list" :key="item.id" class="mb-16rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
        <view class="p-20rpx" @click="handleDetail(item)">
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-28rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ item.code || '-' }}
              </view>
            </view>
            <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_PRO_TASK_STATUS" :value="item.status" />
          </view>
          <view class="text-24rpx text-[#666] space-y-6rpx">
            <view>工作站：{{ item.workstationCode || '-' }} / {{ item.workstationName || '-' }}</view>
            <view>数量：{{ item.quantity ?? '-' }}，已生产：{{ item.producedQuantity ?? 0 }}</view>
            <view>开始：{{ formatDateTime(item.startTime) || '-' }}</view>
            <view>时长：{{ item.duration ?? '-' }} 工作日，预计完成：{{ formatDateTime(item.endTime) || '-' }}</view>
          </view>
          <view v-if="!readonly" class="mt-16rpx flex justify-end gap-12rpx">
            <wd-button v-if="hasAccessByCodes(['mes:pro-task:update'])" size="small" type="warning" variant="plain" @click.stop="handleEdit(item)">
              编辑
            </wd-button>
            <wd-button v-if="hasAccessByCodes(['mes:pro-task:delete'])" size="small" type="danger" variant="plain" @click.stop="handleDelete(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
      <wd-button v-if="hasMore" block size="small" :loading="loadingMore" variant="plain" @click="loadMore">
        加载更多
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProRouteProcess } from '@/api/mes/pro/route/process'
import type { ProTask } from '@/api/mes/pro/task'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { deleteTask, getTaskPage } from '@/api/mes/pro/task'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = withDefaults(defineProps<{
  workOrderId: number
  routeId: number
  itemId: number
  process: ProRouteProcess
  readonly?: boolean
}>(), {
  readonly: false,
})

const emit = defineEmits<{
  reload: []
}>()

const PAGE_SIZE = 10
const TASK_RELOAD_EVENT = 'mes:pro:task:reload'
const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const loadingMore = ref(false) // 加载更多状态
const list = ref<ProTask[]>([]) // 任务列表
const total = ref(0) // 任务总数
const pageNo = ref(1) // 当前页码
const hasMore = computed(() => list.value.length < total.value)

/** 查询任务列表 */
async function getList(currentPage = 1) {
  if (!props.workOrderId || !props.routeId || !props.process.processId) {
    list.value = []
    total.value = 0
    return
  }
  const firstPage = currentPage === 1
  if (firstPage) {
    loading.value = true
  } else {
    loadingMore.value = true
  }
  try {
    const data = await getTaskPage({
      workOrderId: props.workOrderId,
      routeId: props.routeId,
      processId: props.process.processId,
      pageNo: currentPage,
      pageSize: PAGE_SIZE,
    })
    pageNo.value = currentPage
    total.value = data.total
    list.value = firstPage ? data.list : [...list.value, ...data.list]
  } finally {
    if (firstPage) {
      loading.value = false
    } else {
      loadingMore.value = false
    }
  }
}

/** 加载更多 */
function loadMore() {
  if (!hasMore.value || loading.value || loadingMore.value) {
    return
  }
  getList(pageNo.value + 1)
}

/** 任务变更后刷新 */
function handleTaskReload() {
  getList()
}

/** 新增任务 */
function handleAdd() {
  const query = [
    `workOrderId=${props.workOrderId}`,
    `routeId=${props.routeId}`,
    `processId=${props.process.processId}`,
    `itemId=${props.itemId}`,
    props.process.colorCode ? `colorCode=${encodeURIComponent(props.process.colorCode)}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-mes/pro/task/form/index?${query}` })
}

/** 查看任务详情 */
function handleDetail(item: ProTask) {
  uni.navigateTo({ url: `/pages-mes/pro/task/form/index?id=${item.id}&readonly=true` })
}

/** 编辑任务 */
function handleEdit(item: ProTask) {
  uni.navigateTo({ url: `/pages-mes/pro/task/form/index?id=${item.id}` })
}

/** 删除任务 */
async function handleDelete(item: ProTask) {
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${item.code}」生产任务吗？` })
  } catch {
    return
  }
  await deleteTask(item.id)
  toast.success('删除成功')
  emit('reload')
}

/** 监听工序变化 */
watch(() => props.process.processId, () => getList())

/** 初始化 */
onMounted(() => {
  getList()
  uni.$on(TASK_RELOAD_EVENT, handleTaskReload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off(TASK_RELOAD_EVENT, handleTaskReload)
})
</script>
