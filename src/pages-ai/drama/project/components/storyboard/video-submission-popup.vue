<template>
  <!-- 镜头视频提交记录弹窗：提交结果未知时确认任务编号或确认失败，可恢复提交前的视频 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="max-height: 88vh; border-radius: 32rpx 32rpx 0 0; background-color: #f5f5f5;"
  >
    <view class="pb-24rpx pt-24rpx">
      <view class="mb-12rpx flex items-center justify-between px-24rpx">
        <text class="text-32rpx text-[#222] font-semibold">提交记录 · 镜 {{ storyboard.sceneNo }}</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <view class="px-24rpx pb-12rpx text-22rpx text-[#999]">
        提交结果未知（超时、网络中断）时，服务商可能已创建任务并计费：请到服务商控制台核对，有任务时填写任务编号，没有时确认失败后再重新生成
      </view>
      <view v-if="loading" class="py-60rpx text-center">
        <wd-loading />
      </view>
      <view v-else-if="!list.length" class="py-60rpx text-center text-26rpx text-[#999]">
        暂无提交记录
      </view>
      <scroll-view v-else scroll-y class="max-h-[64vh]">
        <view class="px-24rpx">
          <view v-for="item in list" :key="item.id" class="mb-16rpx rounded-12rpx bg-white p-20rpx">
            <view class="flex items-center justify-between gap-12rpx">
              <text class="text-24rpx text-[#999]">{{ formatDateTime(item.createTime) || '-' }}</text>
              <wd-tag v-if="isUnknown(item)" type="warning">
                结果未知
              </wd-tag>
              <dict-tag v-else :type="DICT_TYPE.AI_DRAMA_STATUS" :value="item.status" />
            </view>
            <view class="mt-8rpx break-all text-24rpx text-[#666]">
              模型：{{ item.model || '-' }}
            </view>
            <view v-if="item.taskId" class="mt-4rpx break-all text-22rpx text-[#999]">
              任务编号：{{ item.taskId }}
            </view>
            <video v-if="item.videoUrl" :src="item.videoUrl" controls object-fit="contain" class="mt-12rpx h-300rpx w-full rounded-8rpx bg-black" />
            <view v-if="item.errorMessage" class="mt-8rpx break-all text-24rpx text-[#f5222d]">
              {{ item.errorMessage }}
            </view>
            <template v-if="item.previousVideo?.videoUrl">
              <view class="mt-12rpx text-24rpx text-[#999]">
                提交前的视频
              </view>
              <video :src="item.previousVideo.videoUrl" controls object-fit="contain" class="mt-8rpx h-300rpx w-full rounded-8rpx bg-black" />
            </template>
            <view class="mt-12rpx flex flex-wrap justify-end gap-12rpx">
              <template v-if="isUnknown(item)">
                <wd-button size="small" type="primary" variant="plain" @click="handleResolve(item)">
                  填写任务编号
                </wd-button>
                <wd-button size="small" type="danger" variant="plain" @click="handleConfirmFail(item)">
                  确认失败
                </wd-button>
              </template>
              <wd-button
                v-if="item.status === AiDramaStatusEnum.SUCCESS && item.videoUrl && item.videoUrl !== storyboard.videoUrl"
                size="small"
                type="primary"
                variant="plain"
                :disabled="isAiDramaRunning(storyboard.videoStatus)"
                @click="handleUse(item, false)"
              >
                使用此视频
              </wd-button>
              <wd-button
                v-if="item.previousVideo?.videoUrl && item.previousVideo.videoUrl !== storyboard.videoUrl"
                size="small"
                type="primary"
                variant="plain"
                :disabled="isAiDramaRunning(storyboard.videoStatus)"
                @click="handleUse(item, true)"
              >
                恢复提交前
              </wd-button>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { DramaStoryboard, DramaVideoSubmission } from '@/api/ai/drama/storyboard'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref, watch } from 'vue'
import { applyDramaVideoSubmission, confirmDramaVideoSubmissionFail, getDramaVideoSubmissionList, resolveDramaVideoSubmission } from '@/api/ai/drama/storyboard'
import { AiDramaStatusEnum, DICT_TYPE, isAiDramaRunning } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  storyboard: DramaStoryboard // 镜头
}>()

const emit = defineEmits<{
  success: [] // 镜头视频有变化，需要刷新
}>()

const visible = defineModel<boolean>({ default: false }) // 弹窗显示状态
const toast = useToast()
const dialog = useDialog()
const loading = ref(false) // 加载状态
const list = ref<DramaVideoSubmission[]>([]) // 提交记录

/** 提交结果未知：待处理，且没有服务商任务编号 */
function isUnknown(item: DramaVideoSubmission) {
  return item.status === AiDramaStatusEnum.PENDING && !item.taskId
}

/** 加载提交记录 */
async function getList() {
  loading.value = true
  try {
    list.value = await getDramaVideoSubmissionList(props.storyboard.id)
  } finally {
    loading.value = false
  }
}

/** 刷新：同时通知单镜页刷新镜头 */
async function refresh() {
  emit('success')
  await getList()
}

/** 填写任务编号：改为生成中，稍后自动查询结果 */
async function handleResolve(item: DramaVideoSubmission) {
  let value: string | number | undefined
  try {
    const result = await dialog.prompt({
      title: '填写任务编号',
      inputProps: { placeholder: '请输入在服务商控制台核对到的任务编号' },
    })
    value = result.value
  } catch {
    return
  }
  const taskId = String(value || '').trim()
  if (!taskId) {
    toast.warning('任务编号不能为空')
    return
  }
  await resolveDramaVideoSubmission({ id: item.id, taskId })
  toast.success('已改为生成中，稍后自动查询结果')
  await refresh()
}

/** 确认失败：已核对服务商没有创建该任务，确认后可重新生成 */
async function handleConfirmFail(item: DramaVideoSubmission) {
  try {
    await dialog.confirm({ title: '提示', msg: '确认已核对服务商没有创建该任务？确认后可重新生成' })
  } catch {
    return
  }
  await confirmDramaVideoSubmissionFail(item.id)
  toast.success('已确认失败')
  await refresh()
}

/** 使用此视频、恢复提交前的视频 */
async function handleUse(item: DramaVideoSubmission, previous: boolean) {
  try {
    await dialog.confirm({ title: '提示', msg: previous ? '恢复为这次提交前的视频？' : '使用这次提交生成的视频？' })
  } catch {
    return
  }
  await applyDramaVideoSubmission(item.id, previous)
  toast.success('已更新镜头视频')
  visible.value = false
  emit('success')
}

/** 打开时加载提交记录 */
watch(visible, (value) => {
  if (value) {
    list.value = []
    getList()
  }
})
</script>
