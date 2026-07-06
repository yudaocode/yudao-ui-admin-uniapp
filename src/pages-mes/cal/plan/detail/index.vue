<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="排班计划详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabType" shrink>
        <wd-tab title="基本信息" name="basic" />
        <wd-tab title="班次" name="shifts" />
        <wd-tab title="班组" name="teams" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <scroll-view v-if="tabType === 'basic'" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="计划编码" :value="formData?.code || '-'" />
        <wd-cell title="计划名称" :value="formData?.name || '-'" />
        <wd-cell title="班组类型">
          <dict-tag v-if="formData?.calendarType != null" :type="DICT_TYPE.MES_CAL_CALENDAR_TYPE" :value="formData.calendarType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="开始日期" :value="formatDate(formData?.startDate) || '-'" />
        <wd-cell title="结束日期" :value="formatDate(formData?.endDate) || '-'" />
        <wd-cell title="轮班方式">
          <dict-tag v-if="formData?.shiftType != null" :type="DICT_TYPE.MES_CAL_SHIFT_TYPE" :value="formData.shiftType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="倒班方式">
          <dict-tag v-if="formData?.shiftMethod != null" :type="DICT_TYPE.MES_CAL_SHIFT_METHOD" :value="formData.shiftMethod" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="倒班天数" :value="formData?.shiftCount ? `${formData.shiftCount} 天` : '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_CAL_PLAN_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <view class="h-180rpx" />
    </scroll-view>

    <!-- 班次 -->
    <scroll-view v-if="tabType === 'shifts' && props.id" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <PlanShiftList :plan-id="Number(props.id)" :editable="false" :show-title="false" />
      <view class="h-48rpx" />
    </scroll-view>

    <!-- 班组 -->
    <scroll-view v-if="tabType === 'teams' && props.id" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <PlanTeamList :plan-id="Number(props.id)" :editable="false" :show-title="false" />
      <view class="h-48rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view
      v-if="tabType === 'basic' && isPrepare && (hasAccessByCodes(['mes:cal-plan:update']) || hasAccessByCodes(['mes:cal-plan:delete']))"
      class="yd-detail-footer"
    >
      <view class="yd-detail-footer-actions">
        <wd-button v-if="isPrepare && hasAccessByCodes(['mes:cal-plan:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="isPrepare && hasAccessByCodes(['mes:cal-plan:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { CalPlan } from '@/api/mes/cal/plan'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deletePlan, getPlan } from '@/api/mes/cal/plan'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesCalPlanStatusEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import PlanShiftList from '../components/plan-shift-list.vue'
import PlanTeamList from '../components/plan-team-list.vue'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<CalPlan>() // 详情数据
const deleting = ref(false) // 删除状态
const tabType = ref('basic') // 当前 tab 类型
const isPrepare = computed(() => formData.value?.status === MesCalPlanStatusEnum.PREPARE)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/cal/plan/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPlan(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/cal/plan/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除确认',
      msg: `确定要删除「${formData.value?.name || formData.value?.code || props.id}」排班计划吗？删除后会级联清理班次和计划班组关联。`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePlan(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:cal:plan:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})

/** 监听计划编号变化 */
watch(() => props.id, () => {
  getDetail()
})
</script>
