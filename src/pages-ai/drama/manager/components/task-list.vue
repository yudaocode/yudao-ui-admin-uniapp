<template>
  <!-- 搜索组件 -->
  <TaskSearchForm :models="modelList" @search="handleQuery" @reset="handleReset" />

  <!-- 任务列表 -->
  <z-paging
    ref="pagingRef"
    v-model="list"
    :fixed="false"
    class="min-h-0 flex-1"
    :default-page-size="10"
    :refresher-enabled="true"
    :inside-more="true"
    :loading-more-default-as-loading="true"
    empty-view-text="暂无生成任务"
    @query="queryList"
  >
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="`${item.type}-${item.id}`"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex flex-1 flex-wrap items-center gap-8rpx">
            <dict-tag :type="DICT_TYPE.AI_DRAMA_TASK_TYPE" :value="item.type" />
            <text class="min-w-0 break-all text-28rpx text-[#333] font-semibold">{{ item.title || `#${item.id}` }}</text>
          </view>
          <view class="flex shrink-0 items-center gap-8rpx">
            <dict-tag :type="DICT_TYPE.AI_DRAMA_STATUS" :value="item.status" />
            <wd-tag v-if="item.timeout" type="danger">
              超时
            </wd-tag>
          </view>
        </view>
        <view class="mt-12rpx text-24rpx text-[#999] leading-40rpx">
          <view>项目：{{ item.projectName || '-' }}（{{ item.projectId }}）</view>
          <view>用户：{{ item.userNickname || '-' }}</view>
          <view>模型：{{ getModelName(item.modelId) }}</view>
          <view v-if="item.taskId" class="break-all">
            服务商任务：{{ item.taskId }}
          </view>
        </view>
        <view v-if="item.prompt" class="line-clamp-3 mt-8rpx break-all text-24rpx text-[#666]">
          提示词：{{ item.prompt }}
        </view>
        <view v-if="item.status === AiDramaStatusEnum.FAIL" class="line-clamp-3 mt-8rpx break-all text-24rpx text-[#f5222d]">
          失败原因：{{ item.errorMessage || '-' }}
        </view>
        <view class="mt-12rpx flex items-center justify-between gap-16rpx text-22rpx text-[#999]">
          <text>#{{ item.id }} · {{ formatDateTime(item.updateTime) || '-' }}</text>
          <text v-if="item.resultUrl" class="text-[#1677ff]" @click="openAttachment(item.resultUrl)">
            查看结果
          </text>
        </view>

        <!-- 操作 -->
        <view
          v-if="hasAccessByCodes(['ai:drama:task']) && (item.status === AiDramaStatusEnum.FAIL || isSyncable(item) || isAiDramaRunning(item.status))"
          class="mt-16rpx flex flex-wrap items-center justify-end gap-16rpx"
        >
          <wd-button
            v-if="item.status === AiDramaStatusEnum.FAIL"
            size="small"
            type="primary"
            variant="plain"
            @click="handleAction('resubmit', item)"
          >
            重新提交
          </wd-button>
          <wd-button
            v-if="isSyncable(item)"
            size="small"
            type="primary"
            variant="plain"
            @click="handleAction('sync', item)"
          >
            同步状态
          </wd-button>
          <wd-button
            v-if="isAiDramaRunning(item.status)"
            size="small"
            type="danger"
            variant="plain"
            @click="handleAction('updateFail', item)"
          >
            标记失败
          </wd-button>
        </view>
      </view>
    </view>
  </z-paging>
</template>

<script lang="ts" setup>
import type { DramaTask } from '@/api/ai/drama/task'
import type { AiModel } from '@/api/ai/model/model'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getDramaTaskPage, resubmitDramaTask, syncDramaTask, updateDramaTaskFail } from '@/api/ai/drama/task'
import { getModelSimpleList } from '@/api/ai/model/model'
import { useAccess } from '@/hooks/useAccess'
import { AiDramaStatusEnum, AiDramaTaskTypeEnum, DICT_TYPE, isAiDramaRunning } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'
import TaskSearchForm from './task-search-form.vue'

const actions = { // 任务操作：重新提交、同步状态、标记失败
  resubmit: { text: '重新提交', api: resubmitDramaTask },
  sync: { text: '同步状态', api: syncDramaTask },
  updateFail: { text: '标记失败', api: updateDramaTaskFail },
}

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<DramaTask[]>([]) // 任务列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const modelList = ref<AiModel[]>([]) // 模型选项：搜索与展示模型名

/** 获得模型名称 */
function getModelName(modelId?: number) {
  if (!modelId) {
    return '-'
  }
  return modelList.value.find(item => item.id === modelId)?.name || modelId
}

/** 是否可同步：生成中、转存中的镜头视频 */
function isSyncable(item: DramaTask) {
  return item.type === AiDramaTaskTypeEnum.STORYBOARD
    && (item.status === AiDramaStatusEnum.IN_PROGRESS || item.status === AiDramaStatusEnum.SAVING)
}

/** 查询任务列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getDramaTaskPage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 任务操作：成片合成没有保存原来的镜头选择、画幅、旁白、水印，重新提交时明确告知 */
async function handleAction(action: keyof typeof actions, item: DramaTask) {
  const { text, api } = actions[action]
  const tip = action === 'resubmit' && item.type === AiDramaTaskTypeEnum.COMPOSE
    ? '将使用全部已完成的镜头、项目画幅与转场重新合成，不含旁白和水印，可能与原合成不同。'
    : ''
  try {
    await dialog.confirm({
      title: '提示',
      msg: `${tip}确认要“${text}”该任务吗？`,
    })
  } catch {
    return
  }
  await api({ type: item.type, id: item.id })
  toast.success(`${text}成功`)
  reload()
}

/** 初始化模型选项 */
onMounted(async () => {
  modelList.value = await getModelSimpleList().catch(() => [])
})
</script>
