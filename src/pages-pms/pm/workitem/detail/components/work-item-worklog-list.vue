<template>
  <view>
    <!-- 工时汇总 -->
    <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-28rpx text-[#666]">预估：{{ formatWorkHours(summary.estimatedHours) }}</text>
        <text class="text-28rpx text-[#666]">已登记：{{ formatWorkHours(summary.actualHours) }}</text>
        <text class="text-28rpx text-[#666]">剩余：{{ formatWorkHours(summary.remainingHours) }}</text>
      </view>
      <wd-button
        v-if="editable && hasAccessByCodes(['pms:pm:work-item:update'])"
        block type="primary" variant="plain"
        @click="handleAdd"
      >
        登记工时
      </wd-button>
    </view>

    <!-- 工时列表 -->
    <view v-if="!summary.records.length" class="py-60rpx text-center text-28rpx text-[#999]">
      暂无工时记录
    </view>
    <view
      v-for="item in summary.records"
      :key="item.id"
      class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
    >
      <view class="mb-8rpx flex items-center justify-between">
        <text class="text-28rpx text-[#333] font-semibold">
          投入 {{ formatWorkHours(item.actualHours) }} · 剩余 {{ formatWorkHours(item.remainingHours) }}
        </text>
        <text
          v-if="editable && hasAccessByCodes(['pms:pm:work-item:update'])"
          class="shrink-0 text-26rpx text-[#1677ff]"
          @click="handleEdit(item)"
        >
          编辑
        </text>
      </view>
      <view v-if="item.description" class="mb-8rpx text-26rpx text-[#666]">
        {{ item.description }}
      </view>
      <view class="text-24rpx text-[#999]">
        {{ item.creatorUserName || '-' }} 登记于 {{ formatDateTime(item.createTime) }}
      </view>
    </view>

    <!-- 工时登记表单 -->
    <wd-popup v-model="formVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ formData.id ? '编辑工时' : '登记工时' }}
        </view>
        <wd-cell-group border>
          <wd-cell title="投入工时" title-width="200rpx">
            <wd-input-number
              v-model="formData.actualHours"
              :min="1" :precision="1"
              @change="handleActualHoursChange"
            />
          </wd-cell>
          <wd-cell title="剩余工时" title-width="200rpx">
            <wd-input-number v-model="formData.remainingHours" :min="0" :precision="1" />
          </wd-cell>
        </wd-cell-group>
        <view class="mt-24rpx">
          <wd-textarea
            v-model="formData.description"
            placeholder="请输入本次工作内容"
            :maxlength="500"
            show-word-limit
          />
        </view>
        <view class="mt-32rpx flex gap-24rpx">
          <wd-button class="flex-1" variant="plain" @click="formVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { WorkItemWorkLog, WorkItemWorkLogSummary } from '@/api/pms/pm/workitem/worklog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createWorkItemWorkLog,
  getWorkItemWorkLog,
  getWorkItemWorkLogSummary,
  updateWorkItemWorkLog,
} from '@/api/pms/pm/workitem/worklog'
import { useAccess } from '@/hooks/useAccess'
import { formatWorkHours } from '@/pages-pms/pm/utils/format'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  workItemId: number
  editable: boolean
}>()
const emit = defineEmits<{ changed: [] }>() // 工时变化事件

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const summary = ref<WorkItemWorkLogSummary>({ actualHours: 0, records: [] }) // 工时汇总
const formVisible = ref(false) // 工时表单弹窗显示状态
const formLoading = ref(false) // 表单提交中
const currentRemainingHours = ref(0) // 打开表单时工作项的剩余工时
const formData = ref<Partial<WorkItemWorkLog>>({ actualHours: 1, remainingHours: 0, description: '' }) // 工时表单数据

/** 查询工时汇总 */
async function getSummary() {
  summary.value = await getWorkItemWorkLogSummary(props.workItemId)
}

/** 登记工时 */
function handleAdd() {
  formData.value = {
    workItemId: props.workItemId,
    actualHours: 1,
    remainingHours: Math.max((summary.value.remainingHours ?? 0) - 1, 0),
    description: '',
  }
  currentRemainingHours.value = summary.value.remainingHours ?? 0
  formVisible.value = true
}

/** 编辑工时 */
async function handleEdit(item: WorkItemWorkLog) {
  formData.value = await getWorkItemWorkLog(item.id!)
  formVisible.value = true
}

/** 根据投入工时建议剩余工时 */
function handleActualHoursChange() {
  if (formData.value.id) {
    return
  }
  formData.value.remainingHours = Math.max(currentRemainingHours.value - (formData.value.actualHours ?? 0), 0)
}

/** 提交工时表单 */
async function handleSubmit() {
  if (!formData.value.actualHours) {
    toast.warning('请输入投入工时')
    return
  }
  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateWorkItemWorkLog(formData.value as WorkItemWorkLog)
      toast.success('更新成功')
    } else {
      await createWorkItemWorkLog(formData.value as WorkItemWorkLog)
      toast.success('登记成功')
    }
    formVisible.value = false
    await getSummary()
    emit('changed')
  } finally {
    formLoading.value = false
  }
}

/** 工作项变化时刷新工时汇总 */
watch(() => props.workItemId, getSummary, { immediate: true })
</script>
