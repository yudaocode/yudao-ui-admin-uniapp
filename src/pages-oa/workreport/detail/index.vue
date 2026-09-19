<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="汇报详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="汇报标题" :value="formData?.title ?? '-'" />
        <wd-cell title="汇报编号" :value="formData?.no || '-'" />
        <wd-cell title="汇报类型">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_WORK_REPORT_TYPE" :value="formData.type" />
        </wd-cell>
        <wd-cell title="汇报状态">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_WORK_REPORT_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="汇报周期" :value="`${formatDate(formData?.startTime)} ~ ${formatDate(formData?.endTime)}`" />
        <wd-cell
          v-if="formData?.periodKey && formData.type !== OA_WORK_REPORT_TYPE.DAILY"
          :title="formData.type === OA_WORK_REPORT_TYPE.WEEKLY ? '周次' : '月份'"
          :value="formData.periodKey"
        />
        <wd-cell title="汇报人" :value="formData?.userName || '-'" />
        <wd-cell title="部门" :value="formData?.deptName || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell v-if="formData?.remark" title="备注" :value="formData.remark" />
      </wd-cell-group>

      <!-- 工作总结 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          工作总结
        </view>
        <view v-if="formData?.summary" class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.summary }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无总结
        </view>
      </view>

      <!-- 已完成工作 -->
      <view v-if="formData?.workItems?.length" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-26rpx text-[#999]">
          已完成工作（{{ formData.workItems.length }}）
        </view>
        <view
          v-for="(item, index) in formData.workItems"
          :key="index"
          class="border-0 border-b border-[#f5f5f5] border-solid py-16rpx last:border-b-0"
        >
          <view class="mb-8rpx whitespace-pre-wrap text-28rpx text-[#333]">
            {{ index + 1 }}. {{ item.content }}
          </view>
          <wd-progress :percentage="item.progress" :pivot-text="`${item.progress}%`" />
        </view>
      </view>

      <!-- 工作计划 -->
      <view v-if="formData?.planItems?.length" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-26rpx text-[#999]">
          工作计划（{{ formData.planItems.length }}）
        </view>
        <view
          v-for="(item, index) in formData.planItems"
          :key="index"
          class="border-0 border-b border-[#f5f5f5] border-solid py-16rpx text-28rpx text-[#333] last:border-b-0"
        >
          <view class="whitespace-pre-wrap">
            {{ index + 1 }}. {{ item.content }}
          </view>
        </view>
      </view>

      <!-- 计划补充说明 -->
      <view v-if="formData?.plan" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          工作计划补充说明
        </view>
        <view class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.plan }}
        </view>
      </view>

      <!-- 问题与协调事项 -->
      <view v-if="formData?.problem" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          问题与协调事项
        </view>
        <view class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.problem }}
        </view>
      </view>

      <!-- 附件 -->
      <view v-if="formData?.fileUrls?.length" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
          附件（{{ formData.fileUrls.length }}）
        </view>
        <view
          v-for="(url, index) in formData.fileUrls"
          :key="index"
          class="mb-12rpx flex items-center gap-12rpx text-26rpx text-[#1677ff]"
          @click="openAttachment(url)"
        >
          <wd-icon name="link" size="26rpx" />
          <text class="line-clamp-1">{{ getFileName(url) }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮：草稿可编辑/提交/删除，已提交可取消提交 -->
    <view v-if="isOwner" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="isDraft">
          <wd-button
            v-if="hasAccessByCodes(['oa:work-report:update'])"
            class="flex-1" type="primary" :loading="submitting" @click="handleSubmit"
          >
            提交
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:work-report:update'])"
            class="flex-1" type="warning" @click="handleEdit"
          >
            编辑
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:work-report:delete'])"
            class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
          >
            删除
          </wd-button>
        </template>
        <wd-button
          v-else-if="hasAccessByCodes(['oa:work-report:update'])"
          class="flex-1" type="warning" :loading="submitting" @click="handleCancel"
        >
          取消提交
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WorkReport } from '@/api/oa/workreport'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  cancelWorkReport,
  deleteWorkReport,
  getWorkReport,
  submitWorkReport,
} from '@/api/oa/workreport'
import { useAccess } from '@/hooks/useAccess'
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'
import { OA_WORK_REPORT_STATUS, OA_WORK_REPORT_TYPE } from '../../utils/constants'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const userStore = useUserStore()
const dialog = useDialog()
const toast = useToast()
const formData = ref<WorkReport>() // 详情数据
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const isDraft = computed(() => formData.value?.status === OA_WORK_REPORT_STATUS.DRAFT) // 草稿状态
const isOwner = computed(() => formData.value?.userId === userStore.userInfo.userId) // 当前用户是否汇报人

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载汇报详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getWorkReport(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 编辑汇报 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/workreport/form/index?id=${props.id}`,
  })
}

/** 删除汇报 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该汇报吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteWorkReport(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:work-report:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交汇报 */
async function handleSubmit() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要提交该汇报吗？提交后不可编辑。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitWorkReport(Number(props.id))
    toast.success('提交成功')
    uni.$emit('oa:work-report:reload')
  } finally {
    submitting.value = false
  }
}

/** 取消提交汇报 */
async function handleCancel() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要取消提交该汇报吗？取消后回到草稿状态。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await cancelWorkReport(Number(props.id))
    toast.success('取消成功')
    uni.$emit('oa:work-report:reload')
  } finally {
    submitting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:work-report:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:work-report:reload', getDetail)
})
</script>
