<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="盘点方案详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <wd-cell-group border>
          <wd-cell title="方案编码" :value="formData?.code || '-'" />
          <wd-cell title="方案名称" :value="formData?.name || '-'" />
          <wd-cell title="盘点类型">
            <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_WM_STOCK_TAKING_TYPE" :value="formData.type" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="开始时间" :value="formatDateTime(formData?.startTime) || '-'" />
          <wd-cell title="结束时间" :value="formatDateTime(formData?.endTime) || '-'" />
          <wd-cell title="是否盲盘">
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(formData?.blindFlag))" />
          </wd-cell>
          <wd-cell title="冻结库存">
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(formData?.frozen))" />
          </wd-cell>
          <wd-cell title="状态">
            <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="备注" :value="formData?.remark || '-'" />
          <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        </wd-cell-group>

        <PlanParamList :plan-id="planId" readonly />
        <view class="h-180rpx" />
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="canOperate" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="canUpdate"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="canStatusChange"
          class="flex-1" type="success" :loading="statusLoading" @click="handleStatusChange"
        >
          {{ statusActionText }}
        </wd-button>
        <wd-button
          v-if="canDelete"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { StockTakingPlan } from '@/api/mes/wm/stocktaking/plan'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteStockTakingPlan, getStockTakingPlan, updateStockTakingPlanStatus } from '@/api/mes/wm/stocktaking/plan'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import PlanParamList from '../components/plan-param-list.vue'

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
const formData = ref<StockTakingPlan>() // 详情数据
const deleting = ref(false) // 删除状态
const statusLoading = ref(false) // 状态操作状态
const planId = computed(() => props.id ? Number(props.id) : undefined)
const canUpdate = computed(() => {
  return formData.value?.status === CommonStatusEnum.DISABLE && hasAccessByCodes(['mes:wm-stock-taking-plan:update'])
})
const canDelete = computed(() => {
  return formData.value?.status === CommonStatusEnum.DISABLE && hasAccessByCodes(['mes:wm-stock-taking-plan:delete'])
})
const canStatusChange = computed(() => Boolean(formData.value) && hasAccessByCodes(['mes:wm-stock-taking-plan:update']))
const canOperate = computed(() => canUpdate.value || canStatusChange.value || canDelete.value)
const statusActionText = computed(() => formData.value?.status === CommonStatusEnum.ENABLE ? '停用' : '启用')

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/stocktaking/plan/index')
}

/** 加载详情 */
async function getDetail() {
  if (!planId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getStockTakingPlan(planId.value)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  if (!planId.value) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/wm/stocktaking/plan/form/index?id=${planId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!planId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除盘点方案「${formData.value.name}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteStockTakingPlan(planId.value)
    toast.success('删除成功')
    uni.$emit('mes:wm:stocktaking:plan:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 修改状态 */
async function handleStatusChange() {
  if (!planId.value || !formData.value) {
    return
  }
  const newStatus = formData.value.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  const text = newStatus === CommonStatusEnum.ENABLE ? '启用' : '停用'
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认要${text}盘点方案「${formData.value.name}」吗？`,
    })
  } catch {
    return
  }
  statusLoading.value = true
  try {
    await updateStockTakingPlanStatus(planId.value, newStatus)
    toast.success(`${text}成功`)
    uni.$emit('mes:wm:stocktaking:plan:reload')
    await getDetail()
  } finally {
    statusLoading.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
