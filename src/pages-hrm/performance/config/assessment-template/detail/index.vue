<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="考核指标模板详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="pb-160rpx">
      <wd-cell-group border title="基本信息">
        <wd-cell title="模板编号" :value="formData.id != null ? String(formData.id) : '-'" />
        <wd-cell title="考核模板名称" :value="formData.name || '-'" />
        <wd-cell title="考核指标说明" :value="formData.illustrate || '-'" />
        <wd-cell title="创建人" :value="formData.creatorName || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
        <wd-cell title="最近更新" :value="formatDateTime(formData.updateTime) || '-'" />
      </wd-cell-group>

      <wd-cell-group border title="评分配置">
        <wd-cell title="总分计算">
          <dict-tag
            v-if="formData.scoreCalculation != null"
            :type="DICT_TYPE.HRM_PERFORMANCE_SCORE_CALCULATION"
            :value="formData.scoreCalculation"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="评分上限类型">
          <dict-tag
            v-if="formData.upperLimitType != null"
            :type="DICT_TYPE.HRM_PERFORMANCE_UPPER_LIMIT_TYPE"
            :value="formData.upperLimitType"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="评分上限" :value="formData.upperLimitScore != null ? String(formData.upperLimitScore) : '-'" />
        <wd-cell title="维度数量" :value="String(formData.dimensionCount ?? formData.dimensions?.length ?? 0)" />
        <wd-cell title="指标数量" :value="String(formData.quotaCount ?? quotaCount)" />
      </wd-cell-group>

      <!-- 考核维度列表 -->
      <view class="mt-24rpx px-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          考核维度
        </view>
        <view
          v-if="!formData.dimensions?.length"
          class="rounded-12rpx bg-white py-60rpx text-center text-28rpx text-[#999] shadow-sm"
        >
          暂无考核维度
        </view>
        <view
          v-for="(dimension, dimensionIndex) in formData.dimensions"
          :key="dimensionIndex"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="border-b border-[#f0f0f0] px-24rpx py-20rpx">
            <view class="mb-8rpx text-30rpx text-[#333] font-semibold">
              {{ dimension.name || '-' }}
            </view>
            <view class="flex flex-wrap items-center gap-12rpx text-24rpx text-[#666]">
              <text>{{ formatHrmPerformanceQuotaType(dimension.quotaType) }}</text>
              <text>权重 {{ dimension.weight || 0 }}%</text>
              <text v-if="dimension.allowEdit" class="text-[#52c41a]">允许员工填写</text>
            </view>
            <view v-if="dimension.remark" class="mt-8rpx text-24rpx text-[#999]">
              {{ dimension.remark }}
            </view>
          </view>
          <view class="px-24rpx py-16rpx">
            <view
              v-if="!dimension.quotas?.length"
              class="py-24rpx text-center text-26rpx text-[#999]"
            >
              暂无考核指标
            </view>
            <view
              v-for="(quota, quotaIndex) in dimension.quotas"
              :key="quotaIndex"
              class="mb-16rpx rounded-8rpx bg-[#f8f8f8] p-20rpx last:mb-0"
            >
              <view class="mb-8rpx text-28rpx text-[#333] font-medium">
                {{ quota.name || '-' }}
              </view>
              <view class="text-24rpx text-[#666]">
                权重 {{ quota.weight || 0 }}% · {{ formatScoreType(quota.scoreType) }}
              </view>
              <view v-if="quota.illustrate" class="mt-8rpx text-24rpx text-[#999]">
                说明：{{ quota.illustrate }}
              </view>
              <view v-if="quota.standard" class="mt-8rpx text-24rpx text-[#999]">
                标准：{{ quota.standard }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['hrm:performance:assessment-template:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['hrm:performance:assessment-template:delete'])"
          class="flex-1"
          type="danger"
          :loading="deleting"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AssessmentTemplate } from '@/api/hrm/performance/config/assessment-template'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  deletePerformanceAssessmentTemplate,
  getPerformanceAssessmentTemplate,
} from '@/api/hrm/performance/config/assessment-template'
import { useAccess } from '@/hooks/useAccess'
import {
  HrmPerformanceQuotaScoreType,
  HrmPerformanceScoreCalculation,
  HrmPerformanceUpperLimitType,
} from '@/pages-hrm/utils/constants'
import { formatHrmPerformanceQuotaType } from '@/pages-hrm/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

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
const formData = ref<AssessmentTemplate>({ // 详情数据
  name: '',
  scoreCalculation: HrmPerformanceScoreCalculation.WEIGHTED,
  upperLimitType: HrmPerformanceUpperLimitType.UNIFIED,
  upperLimitScore: 100,
  dimensions: [],
})
const deleting = ref(false) // 删除中
const quotaCount = computed(() => { // 指标数量兜底
  return (formData.value.dimensions || []).reduce(
    (total, dimension) => total + (dimension.quotas?.length || 0),
    0,
  )
})
const hasFooter = computed(() => { // 底部操作区
  return hasAccessByCodes([
    'hrm:performance:assessment-template:update',
    'hrm:performance:assessment-template:delete',
  ])
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/performance/config/assessment-template/index')
}

/** 格式化评分方式 */
function formatScoreType(scoreType?: number) {
  return scoreType === HrmPerformanceQuotaScoreType.DIRECT_INPUT ? '直接输入' : '-'
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getPerformanceAssessmentTemplate(Number(props.id))
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-hrm/performance/config/assessment-template/form/index?id=${props.id}`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除考核指标模板「${formData.value.name}」吗？`,
    })
  } catch {
    return
  }

  deleting.value = true
  try {
    await deletePerformanceAssessmentTemplate(Number(props.id))
    toast.success('删除成功')
    uni.$emit('hrm:performance:assessment-template:reload')
    delay(handleBack)
  } catch {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:performance:assessment-template:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:performance:assessment-template:reload', getDetail)
})
</script>
