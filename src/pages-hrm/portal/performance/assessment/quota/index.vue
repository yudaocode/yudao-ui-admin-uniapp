<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="制定绩效指标"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
      <view v-if="loading && !detail.id" class="py-64rpx text-center text-26rpx text-[#999]">
        <wd-loading size="32rpx" />
        <view class="mt-12rpx">
          正在加载指标
        </view>
      </view>

      <view v-else class="pb-160rpx">
        <view class="bg-white px-24rpx py-24rpx">
          <view class="mb-8rpx text-34rpx text-[#333] font-semibold">
            {{ detail.employeeName || '-' }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#999]">
            {{ detail.name || '-' }}
          </view>
          <dict-tag
            v-if="detail.stageType != null"
            :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
            :value="detail.stageType"
          />
        </view>

        <view
          v-if="detail.targetConfirmationResult === HrmPerformanceConfirmationResult.REJECT"
          class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] px-24rpx py-20rpx text-26rpx text-[#fa8c16]"
        >
          目标已退回：{{ detail.targetConfirmationComment || '请调整后重新提交' }}
        </view>

        <view
          v-for="group in dimensionGroups"
          :key="group.key"
          class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="text-30rpx text-[#333] font-semibold">
                {{ group.name }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                维度权重 {{ group.weight }}% · 指标权重
                <text :class="weightTotal(group) === 100 ? 'text-[#52c41a]' : 'text-[#ff4d4f]'">
                  {{ weightTotal(group) }}%
                </text>
              </view>
            </view>
            <wd-button
              v-if="group.allowEdit"
              size="small"
              type="primary"
              variant="plain"
              :disabled="detail.stageType !== HrmPerformanceStageType.FILL_QUOTA"
              @click="addQuota(group)"
            >
              新增指标
            </wd-button>
          </view>

          <view
            v-for="(quota, index) in group.quotas"
            :key="quota.id || `${group.key}-${index}`"
            class="mb-20rpx rounded-8rpx bg-[#f7f8fa] p-20rpx"
          >
            <view class="mb-12rpx flex items-center justify-between gap-12rpx">
              <text class="text-26rpx text-[#333] font-semibold">
                指标 {{ index + 1 }}
              </text>
              <view class="flex items-center gap-12rpx">
                <wd-tag v-if="quota.preset" type="primary" plain>
                  预置
                </wd-tag>
                <wd-button
                  v-if="!quota.preset"
                  size="small"
                  type="error"
                  variant="text"
                  @click="removeQuota(quota)"
                >
                  删除
                </wd-button>
              </view>
            </view>
            <view v-if="!quota.preset" class="mb-16rpx">
              <view class="mb-8rpx text-24rpx text-[#999]">
                指标名称
              </view>
              <wd-input
                v-model="quota.name"
                clearable
                placeholder="请输入指标名称"
                :maxlength="255"
              />
            </view>
            <view v-else class="mb-12rpx text-26rpx text-[#666]">
              指标名称：{{ quota.name || '-' }}
            </view>
            <view v-if="!quota.preset" class="mb-16rpx">
              <view class="mb-8rpx text-24rpx text-[#999]">
                指标说明
              </view>
              <wd-textarea
                v-model="quota.description"
                clearable
                placeholder="请输入指标说明"
                :maxlength="1000"
              />
            </view>
            <view v-else class="mb-12rpx text-26rpx text-[#666]">
              指标说明：{{ quota.description || '-' }}
            </view>
            <view v-if="!quota.preset" class="mb-16rpx">
              <view class="mb-8rpx text-24rpx text-[#999]">
                考核标准
              </view>
              <wd-textarea
                v-model="quota.standard"
                clearable
                placeholder="请输入考核标准"
                :maxlength="1000"
              />
            </view>
            <view v-else class="mb-12rpx text-26rpx text-[#666]">
              考核标准：{{ quota.standard || '-' }}
            </view>
            <view v-if="!quota.preset">
              <view class="mb-8rpx text-24rpx text-[#999]">
                指标权重
              </view>
              <wd-input-number
                v-model="quota.weight"
                :min="0.01"
                :max="100"
                :precision="2"
                allow-null
              />
            </view>
            <view v-else class="text-26rpx text-[#666]">
              指标权重：{{ quota.weight || 0 }}%
            </view>
          </view>
        </view>

        <view v-if="!dimensionGroups.length" class="py-80rpx text-center text-28rpx text-[#999]">
          暂无可填写指标
        </view>
      </view>

      <view class="yd-detail-footer">
        <view class="yd-detail-footer-actions">
          <wd-button
            class="flex-1"
            type="primary"
            :loading="submitting"
            :disabled="detail.stageType !== HrmPerformanceStageType.FILL_QUOTA"
            @click="handleSubmit"
          >
            提交指标
          </wd-button>
        </view>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type {
  PerformanceAssessmentQuota,
  PortalPerformanceAssessment,
} from '@/api/hrm/portal/performance/assessment'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  fillPortalPerformanceAssessmentQuota,
  getPortalPerformanceAssessment,
} from '@/api/hrm/portal/performance/assessment'
import {
  HrmPerformanceConfirmationResult,
  HrmPerformanceQuotaScoreType,
  HrmPerformanceStageType,
} from '@/pages-hrm/utils/constants'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

interface DimensionGroup {
  key: string
  dimensionId?: number
  name: string
  weight: number
  allowEdit?: boolean
  quotas: PerformanceAssessmentQuota[]
}

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const accessible = ref(false) // 是否可访问
const loading = ref(false) // 加载中
const submitting = ref(false) // 提交中
const detail = ref<PortalPerformanceAssessment>({}) // 详情数据

const dimensionGroups = computed(() => {
  const groups = new Map<string, DimensionGroup>()
  for (const dimension of detail.value.dimensions || []) {
    const key = dimension.id !== undefined ? String(dimension.id) : dimension.name || 'default'
    groups.set(key, {
      key,
      dimensionId: dimension.id,
      name: dimension.name || '未命名维度',
      weight: Number(dimension.weight || 0),
      allowEdit: dimension.allowEdit,
      quotas: [],
    })
  }
  for (const quota of detail.value.quotas || []) {
    const key = quota.dimensionId ? String(quota.dimensionId) : quota.dimensionName || 'default'
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        dimensionId: quota.dimensionId,
        name: quota.dimensionName || '未命名维度',
        weight: Number(quota.dimensionWeight || 0),
        allowEdit: quota.allowEdit,
        quotas: [],
      })
    }
    groups.get(key)?.quotas.push(quota)
  }
  return Array.from(groups.values())
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 计算指标权重合计 */
function weightTotal(group: DimensionGroup) {
  return Number(
    group.quotas.reduce((total, quota) => total + Number(quota.weight || 0), 0).toFixed(2),
  )
}

/** 新增指标 */
function addQuota(group: DimensionGroup) {
  const remainingWeight = Math.max(0, Number((100 - weightTotal(group)).toFixed(2)))
  detail.value.quotas ||= []
  detail.value.quotas.push({
    dimensionId: group.dimensionId,
    preset: false,
    name: '',
    description: '',
    standard: '',
    weight: remainingWeight || undefined,
    scoreType: HrmPerformanceQuotaScoreType.DIRECT_INPUT,
  })
}

/** 删除指标 */
function removeQuota(quota: PerformanceAssessmentQuota) {
  const index = detail.value.quotas?.indexOf(quota) ?? -1
  if (index >= 0) {
    detail.value.quotas?.splice(index, 1)
  }
}

/** 校验绩效指标 */
function validateQuota() {
  for (const group of dimensionGroups.value) {
    if (weightTotal(group) !== 100) {
      toast.error(`${group.name}的指标权重合计必须等于 100%`)
      return false
    }
    const customQuotas = group.quotas.filter(quota => !quota.preset)
    if (
      customQuotas.some(
        quota => !quota.name?.trim() || !quota.standard?.trim() || !quota.weight || quota.weight <= 0,
      )
    ) {
      toast.error(`请完整填写${group.name}的新增指标`)
      return false
    }
    const names = group.quotas.map(quota => quota.name?.trim()).filter(Boolean)
    if (new Set(names).size !== names.length) {
      toast.error(`${group.name}存在重复指标名称`)
      return false
    }
  }
  return dimensionGroups.value.length > 0
}

/** 提交绩效指标 */
async function handleSubmit() {
  if (!detail.value.id || !validateQuota()) {
    return
  }
  submitting.value = true
  try {
    await fillPortalPerformanceAssessmentQuota({
      assessmentId: detail.value.id,
      quotas: (detail.value.quotas || []).map(quota => ({
        id: quota.id,
        dimensionId: quota.dimensionId,
        name: quota.name,
        description: quota.description,
        standard: quota.standard,
        weight: quota.weight,
        scoreType: quota.scoreType,
        targetValue: quota.targetValue,
        actualValue: quota.actualValue,
        selfScore: quota.selfScore,
        reviewerScore: quota.reviewerScore,
        finalScore: quota.finalScore,
        comment: quota.comment,
        sort: quota.sort,
      })),
    })
    toast.success('绩效指标已提交')
    navigateBackPlus()
  } finally {
    submitting.value = false
  }
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  loading.value = true
  try {
    detail.value = await getPortalPerformanceAssessment(Number(props.id))
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  accessible.value = await checkHrmPortalAccess()
  if (!accessible.value) {
    return
  }
  await getDetail()
})
</script>
