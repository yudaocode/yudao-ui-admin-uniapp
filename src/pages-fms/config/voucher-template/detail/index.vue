<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="凭证模板详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情信息 -->
    <view v-if="formData.id" class="p-24rpx">
      <wd-cell-group border>
        <wd-cell title="模板名称" :value="formData.name || '-'" />
        <wd-cell title="模板分类" :value="formData.categoryName || '-'" />
      </wd-cell-group>

      <!-- 模板分录 -->
      <view class="mt-24rpx">
        <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
          模板分录
        </view>
        <view
          v-for="(entry, index) in formData.entries"
          :key="index"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
            分录 {{ index + 1 }}
          </view>
          <view class="flex items-center justify-between gap-16rpx py-8rpx text-26rpx">
            <text class="flex-shrink-0 text-[#999]">摘要</text>
            <text class="min-w-0 flex-1 text-right text-[#333]">{{ entry.digest || '-' }}</text>
          </view>
          <view class="flex items-center justify-between gap-16rpx py-8rpx text-26rpx">
            <text class="flex-shrink-0 text-[#999]">会计科目</text>
            <text class="min-w-0 flex-1 text-right text-[#333]">{{ getSubjectLabel(entry.subjectId) }}</text>
          </view>
          <view v-if="entry.auxiliaries?.length" class="flex items-center justify-between gap-16rpx py-8rpx text-26rpx">
            <text class="flex-shrink-0 text-[#999]">辅助核算</text>
            <text class="min-w-0 flex-1 text-right text-[#333]">
              {{ entry.auxiliaries.map(item => item.name).join('、') }}
            </text>
          </view>
          <view class="flex items-center justify-between gap-16rpx py-8rpx text-26rpx">
            <text class="flex-shrink-0 text-[#999]">借方金额</text>
            <text class="min-w-0 flex-1 text-right text-[#333]">
              {{ entry.debitAmount != null ? formatFmsAmount(entry.debitAmount) : '-' }}
            </text>
          </view>
          <view class="flex items-center justify-between gap-16rpx py-8rpx text-26rpx">
            <text class="flex-shrink-0 text-[#999]">贷方金额</text>
            <text class="min-w-0 flex-1 text-right text-[#333]">
              {{ entry.creditAmount != null ? formatFmsAmount(entry.creditAmount) : '-' }}
            </text>
          </view>
          <view v-if="entry.quantity != null" class="flex items-center justify-between gap-16rpx py-8rpx text-26rpx">
            <text class="flex-shrink-0 text-[#999]">数量</text>
            <text class="min-w-0 flex-1 text-right text-[#333]">{{ formatFmsQuantity(entry.quantity) }}</text>
          </view>
          <view v-if="entry.unitPrice != null" class="flex items-center justify-between gap-16rpx py-8rpx text-26rpx">
            <text class="flex-shrink-0 text-[#999]">单价</text>
            <text class="min-w-0 flex-1 text-right text-[#333]">{{ formatFmsAmount(entry.unitPrice) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="formData.id && (canEdit || canDelete)" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canEdit" class="flex-1" type="primary" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Subject } from '@/api/fms/config/subject'
import type { VoucherTemplate } from '@/api/fms/config/voucher-template'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getSubjectList } from '@/api/fms/config/subject'
import { deleteVoucherTemplate, getVoucherTemplateList } from '@/api/fms/config/voucher-template'
import { useAccess } from '@/hooks/useAccess'
import { useFmsStore } from '@/pages-fms/store/fms'
import { formatFmsAmount, formatFmsQuantity } from '@/pages-fms/utils/format'
import { delay, navigateBackPlus } from '@/utils'

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
const formData = ref<VoucherTemplate>({} as VoucherTemplate) // 详情数据
const subjects = ref<Subject[]>([]) // 平铺科目列表，用于拼接分录科目名称
const deleting = ref(false) // 删除状态

const canEdit = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:voucher-template:update'])) // 仅账套可写且有权限时可编辑
const canDelete = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:voucher-template:delete'])) // 仅账套可写且有权限时可删除

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/voucher-template/index')
}

/** 获取科目展示名称（凭证模板分录只返回科目编号，需要科目列表拼接编码和名称） */
function getSubjectLabel(subjectId: number) {
  const subject = subjects.value.find(item => item.id === subjectId)
  return subject ? `${subject.code} ${subject.name}` : '-'
}

/** 加载模板详情（凭证模板无 /get 接口，从账套级列表中查找） */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const [list, subjectList] = await Promise.all([
    getVoucherTemplateList(accountSetId),
    getSubjectList(accountSetId),
  ])
  subjects.value = subjectList
  const template = list.find(item => item.id === Number(props.id))
  if (template) {
    formData.value = template
  }
}

/** 编辑凭证模板 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-fms/config/voucher-template/form/index?id=${props.id}` })
}

/** 删除凭证模板 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `是否确认删除凭证模板“${formData.value.name}”？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteVoucherTemplate(accountSetId, Number(props.id))
    toast.success('删除成功')
    uni.$emit('fms:config:voucher-template:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await getDetail()
})
</script>
