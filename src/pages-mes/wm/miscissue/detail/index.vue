<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 其他出库详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="出库单编号" :value="formData?.code || '-'" />
        <wd-cell title="出库单名称" :value="formData?.name || '-'" />
        <wd-cell title="业务类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_WM_MISC_ISSUE_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="来源单据类型" :value="formData?.sourceDocType || '-'" />
        <wd-cell title="来源单据编号" :value="formData?.sourceDocCode || '-'" />
        <wd-cell title="出库日期" :value="formatDateTime(formData?.issueDate) || '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_WM_MISC_ISSUE_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <MiscIssueLineList v-if="props.id" :issue-id="Number(props.id)" readonly />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canUpdatePrepare" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canSubmitPrepare" class="flex-1" type="warning" :loading="submitting" @click="handleSubmitIssue">
          提交
        </wd-button>
        <wd-button v-if="canFinishApproved" class="flex-1" type="success" @click="handleFinish">
          执行出库
        </wd-button>
        <wd-button v-if="canDeletePrepare" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
        <wd-button v-if="canCancelApproved" class="flex-1" type="danger" :loading="canceling" @click="handleCancelIssue">
          取消
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmMiscIssue } from '@/api/mes/wm/miscissue'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { cancelMiscIssue, deleteMiscIssue, getMiscIssue, submitMiscIssue } from '@/api/mes/wm/miscissue'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmMiscIssueStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import MiscIssueLineList from '../components/misc-issue-line-list.vue'

const props = defineProps<{
  id?: number | string
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
const formData = ref<WmMiscIssue>() // 详情数据
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canceling = ref(false) // 取消状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-misc-issue:update'])
  && formData.value?.status === MesWmMiscIssueStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-misc-issue:delete'])
  && formData.value?.status === MesWmMiscIssueStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:wm-misc-issue:update'])
  && formData.value?.status === MesWmMiscIssueStatusEnum.PREPARE
))
const canFinishApproved = computed(() => (
  hasAccessByCodes(['mes:wm-misc-issue:finish'])
  && formData.value?.status === MesWmMiscIssueStatusEnum.APPROVED
))
const canCancelApproved = computed(() => (
  hasAccessByCodes(['mes:wm-misc-issue:update'])
  && formData.value?.status === MesWmMiscIssueStatusEnum.APPROVED
))
const hasFooter = computed(() => (
  canUpdatePrepare.value
  || canDeletePrepare.value
  || canSubmitPrepare.value
  || canFinishApproved.value
  || canCancelApproved.value
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/miscissue/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getMiscIssue(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-mes/wm/miscissue/form/index?id=${props.id}`,
  })
}

/** 执行出库 */
function handleFinish() {
  uni.navigateTo({
    url: `/pages-mes/wm/miscissue/form/index?id=${props.id}&mode=finish`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!props.id || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${formData.value.code || formData.value.name || formData.value.id}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteMiscIssue(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:wm:miscissue:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交杂项出库单 */
async function handleSubmitIssue() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该杂项出库单？提交前请确认已维护出库物料，提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitMiscIssue(Number(props.id))
    toast.success('提交成功')
    uni.$emit('mes:wm:miscissue:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 取消杂项出库单 */
async function handleCancelIssue() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该杂项出库单？取消后不可恢复。',
    })
  } catch {
    return
  }
  canceling.value = true
  try {
    await cancelMiscIssue(Number(props.id))
    toast.success('取消成功')
    uni.$emit('mes:wm:miscissue:reload')
    await getDetail()
  } finally {
    canceling.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
