<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="凭证详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <!-- 头部摘要 -->
      <view v-if="formData.id" class="bg-white px-24rpx py-24rpx">
        <view class="mb-16rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1 truncate text-36rpx text-[#333] font-semibold">
            {{ formData.voucherWordName || '-' }}-{{ formData.voucherNumber }}
          </view>
          <wd-tag v-if="formData.closingGenerated" type="info" plain>
            结账生成
          </wd-tag>
          <wd-tag v-else-if="formData.status === FmsVoucherStatus.APPROVED" type="success" plain>
            已审核
          </wd-tag>
          <wd-tag v-else type="warning" plain>
            待审核
          </wd-tag>
        </view>
        <view class="mb-8rpx text-26rpx text-[#999]">
          凭证日期：{{ formatDate(formData.voucherTime) || '-' }}
        </view>
        <view class="text-26rpx text-[#666]">
          合计金额：{{ formatFmsAmount(formData.total) }}
        </view>
      </view>

      <template v-if="formData.id">
        <!-- 凭证信息 -->
        <wd-cell-group border title="凭证信息">
          <wd-cell title="凭证字" :value="formData.voucherWordName || '-'" />
          <wd-cell title="凭证号" :value="formData.voucherNumber != null ? String(formData.voucherNumber) : '-'" />
          <wd-cell title="凭证日期" :value="formatDate(formData.voucherTime) || '-'" />
          <wd-cell title="附单据张数" :value="formData.attachmentCount != null ? `${formData.attachmentCount} 张` : '-'" />
          <wd-cell title="借方合计" :value="formatFmsAmount(formData.debitAmount)" />
          <wd-cell title="贷方合计" :value="formatFmsAmount(formData.creditAmount)" />
          <wd-cell title="合计金额" :value="formatFmsAmount(formData.total)" />
          <wd-cell title="审核状态">
            <wd-tag v-if="formData.closingGenerated" type="info" plain>
              结账生成
            </wd-tag>
            <wd-tag v-else-if="formData.status === FmsVoucherStatus.APPROVED" type="success" plain>
              已审核
            </wd-tag>
            <wd-tag v-else type="warning" plain>
              待审核
            </wd-tag>
          </wd-cell>
          <wd-cell title="制单人" :value="formData.creatorUserName || '-'" />
          <wd-cell title="审核人" :value="formData.reviewerUserName || '-'" />
          <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
        </wd-cell-group>

        <!-- 凭证分录 -->
        <view class="mt-24rpx px-24rpx">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            凭证分录
          </view>
          <view
            v-for="(entry, index) in formData.entries || []"
            :key="entry.id || index"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
              {{ entry.digest || '-' }}
            </view>
            <view class="mb-12rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">科目：</text>
              {{ formatFmsSubjectDisplay(entry.subjectCode, entry.subjectName, (entry.auxiliaries || []).map(item => item.name)) || '-' }}
            </view>
            <view v-if="entry.quantity != null" class="mb-12rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">数量：</text>{{ formatFmsQuantity(entry.quantity) }}
              <text class="mx-16rpx text-[#999]">单价：</text>{{ formatFmsAmount(entry.unitPrice) }}
            </view>
            <view class="flex items-center justify-between text-26rpx text-[#666]">
              <text><text class="mr-8rpx text-[#999]">借方：</text>{{ formatFmsAmount(entry.debitAmount) }}</text>
              <text><text class="mr-8rpx text-[#999]">贷方：</text>{{ formatFmsAmount(entry.creditAmount) }}</text>
            </view>
          </view>
        </view>

        <!-- 凭证附件 -->
        <view class="mt-8rpx px-24rpx pb-24rpx">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            凭证附件（{{ (formData.attachmentUrls || []).length }}）
          </view>
          <view v-if="!(formData.attachmentUrls || []).length" class="rounded-12rpx bg-white py-48rpx text-center text-28rpx text-[#999] shadow-sm">
            暂无附件
          </view>
          <view v-else class="rounded-12rpx bg-white p-24rpx shadow-sm">
            <view v-if="imageAttachments.length" class="flex flex-wrap gap-16rpx">
              <wd-img
                v-for="(url, index) in imageAttachments"
                :key="`${url}-${index}`"
                :src="staticUrl(url)"
                width="160rpx"
                height="160rpx"
                radius="12rpx"
                mode="aspectFill"
                @click="openAttachment(url)"
              />
            </view>
            <view
              v-for="(url, index) in fileAttachments"
              :key="`${url}-${index}`"
              class="flex items-center justify-between py-12rpx"
              @click="openAttachment(url)"
            >
              <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">
                {{ getFileNameFromUrl(url) || `附件 ${index + 1}` }}
              </text>
              <text class="ml-16rpx shrink-0 text-28rpx text-[#1677ff]">
                查看
              </text>
            </view>
          </view>
        </view>
      </template>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="formData.id && (canEdit || canReview || canCancelReview || canDelete)" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canEdit" class="flex-1" type="primary" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canReview" class="flex-1" type="success" :loading="reviewing" @click="handleReview(true)">
          审核
        </wd-button>
        <wd-button v-if="canCancelReview" class="flex-1" type="warning" :loading="reviewing" @click="handleReview(false)">
          反审核
        </wd-button>
        <wd-button v-if="canDelete" class="flex-1" type="error" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Voucher } from '@/api/fms/voucher'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  cancelReviewVoucher,
  deleteVoucher,
  getVoucher,
  reviewVoucher,
} from '@/api/fms/voucher'
import { useAccess } from '@/hooks/useAccess'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FmsVoucherStatus } from '@/pages-fms/utils/constants'
import { formatFmsAmount, formatFmsQuantity, formatFmsSubjectDisplay } from '@/pages-fms/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate, formatDateTime } from '@/utils/date'
import { getFileNameFromUrl, isImageFile, openAttachment, staticUrl } from '@/utils/download'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const fmsStore = useFmsStore()
const formData = ref<Voucher>({} as Voucher) // 详情数据
const reviewing = ref(false) // 审核状态
const deleting = ref(false) // 删除状态

/** 图片附件（后端仅允许图片类型，兜底拆分非图片文件） */
const imageAttachments = computed(() => (formData.value.attachmentUrls || []).filter(url => isImageFile(url)))
const fileAttachments = computed(() => (formData.value.attachmentUrls || []).filter(url => !isImageFile(url)))

/** 结账生成凭证不允许编辑 */
const canEdit = computed(() =>
  fmsStore.isAccountSetWritable
  && !formData.value.closingGenerated
  && hasAccessByCodes(['fms:voucher:update']),
)
/** 仅待审核凭证可审核 */
const canReview = computed(() =>
  fmsStore.isAccountSetWritable
  && !formData.value.closingGenerated
  && formData.value.status === FmsVoucherStatus.PENDING_REVIEW
  && hasAccessByCodes(['fms:voucher:review']),
)
/** 仅已审核凭证可反审核 */
const canCancelReview = computed(() =>
  fmsStore.isAccountSetWritable
  && !formData.value.closingGenerated
  && formData.value.status === FmsVoucherStatus.APPROVED
  && hasAccessByCodes(['fms:voucher:review']),
)
/** 已审核和结账生成凭证不允许删除 */
const canDelete = computed(() =>
  fmsStore.isAccountSetWritable
  && !formData.value.closingGenerated
  && formData.value.status !== FmsVoucherStatus.APPROVED
  && hasAccessByCodes(['fms:voucher:delete']),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/voucher/list/index')
}

/** 加载凭证详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  await fmsStore.loadAccountSetList()
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  formData.value = await getVoucher(accountSetId, Number(props.id))
}

/** 编辑凭证 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-fms/voucher/create/index?id=${props.id}` })
}

/** 审核或反审核凭证 */
async function handleReview(approve: boolean) {
  const accountSetId = fmsStore.accountSet?.id
  if (!props.id || !accountSetId) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: approve ? '确认审核该凭证吗？' : '确认反审核该凭证吗？',
    })
  } catch {
    return
  }
  reviewing.value = true
  try {
    if (approve) {
      await reviewVoucher(accountSetId, [Number(props.id)])
    } else {
      await cancelReviewVoucher(accountSetId, [Number(props.id)])
    }
    toast.success('操作成功')
    uni.$emit('fms:voucher:reload')
    await getDetail()
  } finally {
    reviewing.value = false
  }
}

/** 删除凭证 */
async function handleDelete() {
  const accountSetId = fmsStore.accountSet?.id
  if (!props.id || !accountSetId) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除凭证“${formData.value.voucherWordName || ''}-${formData.value.voucherNumber}”吗？删除后会产生断号`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteVoucher(accountSetId, Number(props.id))
    toast.success('删除成功')
    uni.$emit('fms:voucher:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 / 编辑返回后刷新 */
onShow(() => {
  getDetail()
})
</script>
