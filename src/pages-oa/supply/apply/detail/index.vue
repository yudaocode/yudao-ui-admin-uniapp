<template>
  <view class="yd-page-container pb-160rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="领用申请详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="单据编号" :value="formData?.no ?? '-'" />
        <wd-cell title="单据状态">
          <text v-if="formData?.status === OA_APPLY_STATUS.NOT_START" class="text-28rpx text-[#999]">未提交</text>
          <dict-tag v-else-if="formData" :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="领用日期" :value="formatDate(formData?.applyTime) || '-'" />
        <wd-cell title="使用类型">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_SUPPLY_USE_TYPE" :value="formData.useType" />
        </wd-cell>
        <wd-cell title="领取方式">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_SUPPLY_PICKUP_METHOD" :value="formData.pickupMethod" />
        </wd-cell>
        <wd-cell title="申请人" :value="formData?.creatorName || '-'" />
        <wd-cell title="申请部门" :value="formData?.deptName || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 申请事由 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-26rpx text-[#999]">
          申请事由
        </view>
        <view v-if="formData?.reason" class="whitespace-pre-wrap text-28rpx text-[#333]">
          {{ formData.reason }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无事由
        </view>
      </view>

      <!-- 领用明细 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
          领用明细（{{ formData?.items?.length ?? 0 }}）
        </view>
        <view v-if="!formData?.items?.length" class="py-16rpx text-26rpx text-[#999]">
          暂无领用明细
        </view>
        <view
          v-for="row in formData?.items"
          :key="row.id"
          class="mb-16rpx rounded-12rpx bg-[#f7f8fa] p-24rpx"
        >
          <view class="mb-12rpx flex items-center justify-between gap-12rpx">
            <text class="line-clamp-1 min-w-0 flex-1 text-30rpx text-[#333] font-semibold">{{ row.itemName || '-' }}</text>
            <dict-tag :type="DICT_TYPE.OA_SUPPLY_ITEM_STATUS" :value="row.status" />
          </view>
          <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
            <text v-if="row.model" class="mr-16rpx">{{ row.model }}</text>
            <text v-if="row.unit" class="mr-16rpx">单位：{{ row.unit }}</text>
            <dict-tag :type="DICT_TYPE.OA_SUPPLY_MANAGE_TYPE" :value="row.manageType" />
          </view>
          <view class="text-26rpx text-[#666]">
            申请 {{ row.applyQuantity ?? 0 }} · 实发 {{ row.issuedQuantity ?? 0 }} · 已归还 {{ row.returnedQuantity ?? 0 }}
          </view>
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
    <view v-if="formData?.processInstanceId || (showActions)" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="canRework">
          <wd-button
            v-if="hasAccessByCodes(['oa:supply-apply:update'])"
            class="flex-1" type="warning" @click="handleEdit"
          >
            编辑
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:supply-apply:delete'])"
            class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
          >
            删除
          </wd-button>
          <wd-button
            v-if="hasAccessByCodes(['oa:supply-apply:create'])"
            class="flex-1" type="primary" :loading="submitting" @click="handleSubmitApply"
          >
            提交审批
          </wd-button>
        </template>
        <wd-button
          v-if="formData?.status === BPM_STATUS.RUNNING && hasAccessByCodes(['oa:supply-apply:update'])"
          class="flex-1" type="danger" :loading="cancelling" @click="handleCancel"
        >
          取消申请
        </wd-button>
        <wd-button
          v-if="formData?.processInstanceId"
          class="flex-1" type="primary" @click="handleViewProcess"
        >
          审批进度
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SupplyApply } from '@/api/oa/supply-apply'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { cancelSupplyApply, deleteSupplyApply, getSupplyApply, submitSupplyApply } from '@/api/oa/supply-apply'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'
import { OA_APPLY_STATUS } from '../../../utils/constants'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

/** BPM 流程实例状态：与字典 bpm_process_instance_status 一致 */
const BPM_STATUS = { RUNNING: 1 } as const

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<SupplyApply>() // 详情数据
const submitting = ref(false) // 提交审批状态
const deleting = ref(false) // 删除状态
const cancelling = ref(false) // 取消申请状态
const canRework = computed(() => // 草稿、审批不通过、已取消可返工
  ([OA_APPLY_STATUS.NOT_START, OA_APPLY_STATUS.REJECT, OA_APPLY_STATUS.CANCEL] as number[]).includes(formData.value?.status ?? 0))
const showActions = computed(() =>
  canRework.value || formData.value?.status === BPM_STATUS.RUNNING)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载领用申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getSupplyApply(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 编辑领用申请 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/supply/apply/form/index?id=${props.id}`,
  })
}

/** 删除领用申请草稿 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该领用申请吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteSupplyApply(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:supply-apply:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交审批 */
async function handleSubmitApply() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要提交审批吗？',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitSupplyApply(Number(props.id))
    toast.success('提交成功')
    uni.$emit('oa:supply-apply:reload')
    delay(handleBack)
  } finally {
    submitting.value = false
  }
}

/** 取消申请 */
async function handleCancel() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要取消该领用申请吗？',
    })
  } catch {
    return
  }
  cancelling.value = true
  try {
    await cancelSupplyApply(Number(props.id))
    toast.success('取消成功')
    uni.$emit('oa:supply-apply:reload')
    getDetail()
  } finally {
    cancelling.value = false
  }
}

/** 查看审批进度 */
function handleViewProcess() {
  uni.navigateTo({
    url: `/pages-bpm/processInstance/detail/index?id=${formData.value?.processInstanceId}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:supply-apply:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:supply-apply:reload', getDetail)
})
</script>
