<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="计划详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="标题" :value="formData?.title ?? '-'" />
        <wd-cell title="计划类型">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_PLAN_TYPE" :value="formData.type" />
        </wd-cell>
        <wd-cell title="计划状态">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_PLAN_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="标签" :value="formData?.label || '-'" />
        <wd-cell title="开始时间" :value="formatDateTime(formData?.startTime) || '-'" />
        <wd-cell title="结束时间" :value="formatDateTime(formData?.endTime) || '-'" />
        <wd-cell title="发布人" :value="formData?.userName || '-'" />
        <wd-cell title="部门" :value="formData?.deptName || '-'" />
        <wd-cell title="发布时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 计划内容 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          计划内容
        </view>
        <view v-if="formData?.content" class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.content }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无内容
        </view>
      </view>

      <!-- 计划总结 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          计划总结
        </view>
        <view v-if="formData?.summary" class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.summary }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无总结
        </view>
      </view>

      <!-- 计划点评 -->
      <view v-if="formData?.comment" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          计划点评
        </view>
        <view class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.comment }}
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

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['oa:plan:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:plan:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Plan } from '@/api/oa/plan'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deletePlan, getPlan } from '@/api/oa/plan'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'

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
const dialog = useDialog()
const toast = useToast()
const formData = ref<Plan>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载计划详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPlan(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 编辑计划 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/plan/form/index?id=${props.id}`,
  })
}

/** 删除计划 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该计划吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePlan(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:plan:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:plan:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:plan:reload', getDetail)
})
</script>
