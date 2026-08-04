<template>
  <view>
    <!-- 评分配置 -->
    <wd-cell-group border title="评分配置">
      <yd-form-picker
        v-model="model.scoreCalculation"
        label="总分计算"
        label-width="200rpx"
        :prop="`${propPrefix}scoreCalculation`"
        :columns="scoreCalculationColumns"
        placeholder="请选择总分计算"
        :disabled="disabled"
      />
      <yd-form-picker
        v-model="model.upperLimitType"
        label="评分上限类型"
        label-width="200rpx"
        :prop="`${propPrefix}upperLimitType`"
        :columns="upperLimitTypeColumns"
        placeholder="请选择评分上限类型"
        :disabled="disabled"
      />
      <wd-form-item
        title="评分上限"
        title-width="200rpx"
        :prop="`${propPrefix}upperLimitScore`"
      >
        <wd-input-number
          v-model="model.upperLimitScore"
          :min="0"
          :precision="2"
          :disabled="disabled"
        />
      </wd-form-item>
    </wd-cell-group>

    <view class="mx-24rpx mt-16rpx rounded-12rpx bg-[#e6f4ff] px-24rpx py-20rpx text-24rpx text-[#1677ff]">
      总分 = 评分 × 维度权重 × 指标权重，再累加；维度权重合计须为 100%，不可编辑维度的指标权重合计须为 100%，可编辑维度不可超过 100%。
    </view>

    <!-- 考核维度 -->
    <view v-if="showDimensions" class="mt-24rpx">
      <view class="mb-16rpx flex items-center justify-between px-24rpx">
        <view>
          <text class="text-30rpx text-[#333] font-semibold">考核维度</text>
          <text class="ml-16rpx text-24rpx text-[#999]">
            权重合计：
            <text :class="dimensionWeightClass">
              {{ model.dimensions?.length ? `${dimensionWeightTotal}%` : '--' }}
            </text>
          </text>
        </view>
        <wd-button
          v-if="!disabled"
          size="small"
          type="primary"
          @click="openDimensionForm()"
        >
          新增维度
        </wd-button>
      </view>

      <view
        v-if="!model.dimensions?.length"
        class="mx-24rpx rounded-12rpx bg-white py-60rpx text-center text-28rpx text-[#999] shadow-sm"
      >
        暂无考核维度
      </view>

      <view
        v-for="(dimension, dimensionIndex) in model.dimensions"
        :key="dimensionIndex"
        class="mx-24rpx mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
      >
        <view class="border-b border-[#f0f0f0] px-24rpx py-20rpx">
          <view class="mb-8rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="mb-8rpx text-30rpx text-[#333] font-semibold">
                {{ dimension.name }}
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
            <view v-if="!disabled" class="flex shrink-0 gap-8rpx">
              <wd-button size="small" type="primary" variant="text" @click="openDimensionForm(dimensionIndex)">
                编辑
              </wd-button>
              <wd-button size="small" type="danger" variant="text" @click="removeDimension(dimensionIndex)">
                删除
              </wd-button>
            </view>
          </view>
        </view>

        <view class="px-24rpx py-16rpx">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="text-24rpx text-[#999]">
              指标权重合计：
              <text :class="isHundred(getQuotaWeightTotal(dimension)) ? 'text-[#52c41a]' : 'text-[#ff4d4f]'">
                {{ getQuotaWeightTotal(dimension) }}%
              </text>
            </text>
            <wd-button
              v-if="!disabled"
              size="small"
              @click="openQuotaForm(dimensionIndex)"
            >
              新增指标
            </wd-button>
          </view>

          <view
            v-if="!dimension.quotas?.length"
            class="py-24rpx text-center text-26rpx text-[#999]"
          >
            暂无考核指标
          </view>
          <view
            v-for="(quota, quotaIndex) in dimension.quotas"
            :key="quotaIndex"
            class="mb-16rpx rounded-8rpx bg-[#f8f8f8] p-20rpx"
          >
            <view class="mb-8rpx flex items-start justify-between gap-12rpx">
              <text class="min-w-0 flex-1 text-28rpx text-[#333] font-medium">
                {{ quota.name || '未命名指标' }}
              </text>
              <view v-if="!disabled" class="flex shrink-0 gap-8rpx">
                <wd-button
                  size="small"
                  type="primary"
                  variant="text"
                  @click="openQuotaForm(dimensionIndex, quotaIndex)"
                >
                  编辑
                </wd-button>
                <wd-button
                  size="small"
                  type="danger"
                  variant="text"
                  @click="removeQuota(dimensionIndex, quotaIndex)"
                >
                  删除
                </wd-button>
              </view>
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

    <DimensionForm ref="dimensionFormRef" @confirm="handleDimensionConfirm" />
    <QuotaForm ref="quotaFormRef" @confirm="handleQuotaConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { AssessmentConfig, AssessmentDimension, AssessmentQuota } from '@/api/hrm/performance/assessment'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getIntDictOptions } from '@/hooks/useDict'
import {
  HrmPerformanceQuotaScoreType,
  HrmPerformanceUpperLimitType,
} from '@/pages-hrm/utils/constants'
import { formatHrmPerformanceQuotaType } from '@/pages-hrm/utils/format'
import {
  getDimensionWeightTotal,
  getQuotaWeightTotal,
  isHundred,
  validateAssessmentConfig,
} from '@/pages-hrm/utils/performance'
import { DICT_TYPE } from '@/utils/constants'
import DimensionForm from './dimension-form.vue'
import QuotaForm from './quota-form.vue'

const props = withDefaults(defineProps<{
  disabled?: boolean
  propPrefix?: string
  showDimensions?: boolean
}>(), {
  disabled: false,
  propPrefix: '',
  showDimensions: true,
})

const toast = useToast()
const model = defineModel<AssessmentConfig>({ required: true }) // 考核配置
const dimensionFormRef = ref<InstanceType<typeof DimensionForm>>() // 维度表单
const quotaFormRef = ref<InstanceType<typeof QuotaForm>>() // 指标表单
const currentDimensionIndex = ref<number>() // 当前维度下标
const currentQuotaIndex = ref<number>() // 当前指标下标

const scoreCalculationColumns = computed(() => // 总分计算选项
  getIntDictOptions(DICT_TYPE.HRM_PERFORMANCE_SCORE_CALCULATION),
)
const upperLimitTypeColumns = [ // 评分上限类型选项
  { label: '统一上限', value: HrmPerformanceUpperLimitType.UNIFIED },
]
const dimensionWeightTotal = computed(() => getDimensionWeightTotal(model.value.dimensions))
const dimensionWeightClass = computed(() => {
  if (!model.value.dimensions?.length) {
    return 'text-[#999]'
  }
  return isHundred(dimensionWeightTotal.value) ? 'text-[#52c41a]' : 'text-[#ff4d4f]'
})

/** 校验考核配置 */
function validate() {
  const errorMessage = validateAssessmentConfig(model.value)
  if (errorMessage) {
    toast.warning(errorMessage)
    return false
  }
  return true
}
defineExpose({ validate })

/** 格式化评分方式 */
function formatScoreType(scoreType?: number) {
  return scoreType === HrmPerformanceQuotaScoreType.DIRECT_INPUT ? '直接输入' : '-'
}

/** 打开维度表单 */
function openDimensionForm(index?: number) {
  currentDimensionIndex.value = index
  dimensionFormRef.value?.open(
    index === undefined ? undefined : model.value.dimensions?.[index],
  )
}

/** 保存维度 */
function handleDimensionConfirm(dimension: AssessmentDimension) {
  model.value.dimensions ||= []
  if (currentDimensionIndex.value === undefined) {
    model.value.dimensions.push(dimension)
    return
  }
  model.value.dimensions.splice(currentDimensionIndex.value, 1, dimension)
}

/** 删除维度 */
function removeDimension(index: number) {
  model.value.dimensions?.splice(index, 1)
}

/** 打开指标表单 */
function openQuotaForm(dimensionIndex: number, quotaIndex?: number) {
  currentDimensionIndex.value = dimensionIndex
  currentQuotaIndex.value = quotaIndex
  const quota = quotaIndex === undefined
    ? undefined
    : model.value.dimensions?.[dimensionIndex]?.quotas?.[quotaIndex]
  quotaFormRef.value?.open(quota)
}

/** 保存指标 */
function handleQuotaConfirm(quota: AssessmentQuota) {
  const dimensionIndex = currentDimensionIndex.value
  if (dimensionIndex === undefined) {
    return
  }
  const dimension = model.value.dimensions?.[dimensionIndex]
  if (!dimension) {
    return
  }
  dimension.quotas ||= []
  if (currentQuotaIndex.value === undefined) {
    dimension.quotas.push(quota)
    return
  }
  dimension.quotas.splice(currentQuotaIndex.value, 1, quota)
}

/** 删除指标 */
function removeQuota(dimensionIndex: number, quotaIndex: number) {
  model.value.dimensions?.[dimensionIndex]?.quotas?.splice(quotaIndex, 1)
}
</script>
