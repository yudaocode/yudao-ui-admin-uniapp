<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 点检方案详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="方案编码" :value="formData?.code || '-'" />
        <wd-cell title="方案名称" :value="formData?.name || '-'" />
        <wd-cell title="方案类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_DV_SUBJECT_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="周期数量" :value="formData?.cycleCount != null ? String(formData.cycleCount) : '-'" />
        <wd-cell title="周期类型">
          <dict-tag v-if="formData?.cycleType != null" :type="DICT_TYPE.MES_DV_CYCLE_TYPE" :value="formData.cycleType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="开始日期" :value="formatDate(formData?.startDate) || '-'" />
        <wd-cell title="结束日期" :value="formatDate(formData?.endDate) || '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_DV_CHECK_PLAN_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>
      <MachineryList v-if="props.id" :plan-id="Number(props.id)" readonly />
      <SubjectList v-if="props.id" :plan-id="Number(props.id)" :type="formData?.type" readonly />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="canUpdatePrepare"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="canDeletePrepare"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
        <wd-button
          v-if="canEnable"
          class="flex-1" type="success" @click="handleEnable"
        >
          启用
        </wd-button>
        <wd-button
          v-if="canDisable"
          class="flex-1" type="warning" @click="handleDisable"
        >
          停用
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DvCheckPlan } from '@/api/mes/dv/checkplan'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteCheckPlan, disableCheckPlan, enableCheckPlan, getCheckPlan } from '@/api/mes/dv/checkplan'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesDvCheckPlanStatusEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import MachineryList from '../components/machinery-list.vue'
import SubjectList from '../components/subject-list.vue'

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
const formData = ref<DvCheckPlan>() // 详情数据
const deleting = ref(false) // 删除状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:dv-check-plan:update'])
  && formData.value?.status === MesDvCheckPlanStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:dv-check-plan:delete'])
  && formData.value?.status === MesDvCheckPlanStatusEnum.PREPARE
))
const canEnable = computed(() => (
  hasAccessByCodes(['mes:dv-check-plan:update'])
  && formData.value?.status === MesDvCheckPlanStatusEnum.PREPARE
))
const canDisable = computed(() => (
  hasAccessByCodes(['mes:dv-check-plan:update'])
  && formData.value?.status === MesDvCheckPlanStatusEnum.ENABLED
))
const hasFooter = computed(() => (
  canUpdatePrepare.value || canDeletePrepare.value || canEnable.value || canDisable.value
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/checkplan/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getCheckPlan(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 刷新详情 */
function reloadDetail() {
  if (deleting.value) {
    return
  }
  getDetail()
}

/** 编辑 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/dv/checkplan/form/index?id=${props.id}`,
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
      msg: `确定要删除「${formData.value.name || formData.value.code}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteCheckPlan(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:dv:checkplan:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 启用 */
async function handleEnable() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认启用该点检保养方案？启用后将不可修改或删除。',
    })
  } catch {
    return
  }
  await enableCheckPlan(Number(props.id))
  toast.success('启用成功')
  await getDetail()
  uni.$emit('mes:dv:checkplan:reload')
}

/** 停用 */
async function handleDisable() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认停用该点检保养方案？',
    })
  } catch {
    return
  }
  await disableCheckPlan(Number(props.id))
  toast.success('停用成功')
  await getDetail()
  uni.$emit('mes:dv:checkplan:reload')
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:dv:checkplan:reload', reloadDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:dv:checkplan:reload', reloadDetail)
})
</script>
