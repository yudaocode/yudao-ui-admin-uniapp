<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="方案详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情信息 -->
    <view v-if="formData.id" class="p-24rpx">
      <wd-cell-group title="基本信息" border>
        <wd-cell title="方案名称" :value="formData.name || '-'" />
        <wd-cell title="方案类型" :value="formatClosingType(formData.type)" />
        <wd-cell title="期末结转" :value="formData.periodEnd ? '是' : '否'" />
        <wd-cell title="待结转金额" :value="formatFmsAmount(formData.balance)" />
        <wd-cell title="已生成凭证" :value="`${formData.voucherIds?.length || 0} 张`" />
      </wd-cell-group>

      <!-- 取数设置（常规结账方案） -->
      <wd-cell-group v-if="formData.type === FmsClosingType.REGULAR" title="取数设置" border>
        <wd-cell title="来源科目" :value="formatSubject(formData.subjectId) || '-'" />
        <wd-cell title="取数规则" :value="formatFormulaRule(formData.formulaRule)" />
        <wd-cell title="时间类型" :value="formatTimeType(formData.timeType)" />
        <wd-cell title="凭证字" :value="formatVoucherWord(formData.voucherWordId) || '-'" />
      </wd-cell-group>

      <!-- 结转损益设置 -->
      <wd-cell-group v-if="formData.type === FmsClosingType.PROFIT_LOSS" title="结转损益设置" border>
        <wd-cell title="凭证摘要" :value="formData.digest || '-'" />
        <wd-cell title="凭证分类" :value="formatVoucherType(formData.voucherType)" />
        <wd-cell title="凭证字" :value="formatVoucherWord(formData.voucherWordId) || '-'" />
        <wd-cell title="“以前年度损益调整”科目" :value="formatSubject(formData.priorYearAdjustmentSubjectId) || '-'" />
        <wd-cell title="“以前年度损益调整”结转科目" :value="formatSubject(formData.adjustmentClosingSubjectId) || '-'" />
        <wd-cell title="其他损益结转科目" :value="formatSubject(formData.otherClosingSubjectId) || '-'" />
        <wd-cell title="按余额反向结转" :value="formData.reverseBalance ? '是' : '否'" />
        <wd-cell title="结转日期" :value="formData.closingDay ? `每月 ${formData.closingDay} 日` : '-'" />
      </wd-cell-group>

      <!-- 凭证分录规则 -->
      <view class="mt-24rpx">
        <view class="mb-16rpx px-8rpx text-30rpx text-[#333] font-semibold">
          凭证分录规则
        </view>
        <view
          v-for="(rule, index) in formData.subjects || []"
          :key="index"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-semibold">
              {{ rule.digest || '-' }}
            </view>
            <wd-tag :type="rule.direction === FmsDebitCreditDirection.DEBIT ? 'primary' : 'warning'" plain>
              {{ rule.direction === FmsDebitCreditDirection.DEBIT ? '借' : '贷' }}
            </wd-tag>
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">科目：</text>{{ formatSubject(rule.subjectId, rule.subjectCode) || '-' }}
          </view>
          <view class="text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">金额比例：</text>{{ rule.amountRatio }}%
          </view>
        </view>
        <view v-if="!formData.subjects?.length" class="py-48rpx text-center text-26rpx text-[#999]">
          暂无分录规则
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ClosingScheme } from '@/api/fms/closing/scheme'
import type { Subject } from '@/api/fms/config/subject'
import type { VoucherWord } from '@/api/fms/config/voucher-word'
import { getClosingSchemeList } from '@/api/fms/closing/scheme'
import { getSubjectList } from '@/api/fms/config/subject'
import { getVoucherWordSimpleList } from '@/api/fms/config/voucher-word'
import { useFmsStore } from '@/pages-fms/store/fms'
import {
  FmsBalanceFormulaRuleOptions,
  FmsClosingTimeTypeOptions,
  FmsClosingType,
  FmsClosingVoucherTypeOptions,
  FmsDebitCreditDirection,
} from '@/pages-fms/utils/constants'
import { formatFmsAmount, formatFmsSubjectDisplay } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'

const props = defineProps<{
  id?: number | any
  month?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const fmsStore = useFmsStore()
const formData = ref<ClosingScheme>({} as ClosingScheme) // 详情数据
const subjects = ref<Subject[]>([]) // 科目列表，用于分录规则展示科目名称
const voucherWords = ref<VoucherWord[]>([]) // 凭证字列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/closing/scheme/index')
}

/** 格式化方案类型 */
function formatClosingType(value?: number): string {
  const labels: Record<number, string> = { // 方案类型文案，常量文件暂无类型选项
    [FmsClosingType.REGULAR]: '常规结账',
    [FmsClosingType.PROFIT_LOSS]: '结转损益',
    [FmsClosingType.UNPAID_VAT]: '结转未交增值税',
    [FmsClosingType.LOCAL_TAX]: '计提地方税金',
    [FmsClosingType.INCOME_TAX]: '计提所得税',
  }
  return (value && labels[value]) || '-'
}

/** 格式化取数规则 */
function formatFormulaRule(value?: number): string {
  return FmsBalanceFormulaRuleOptions.find(item => item.value === value)?.label || '-'
}

/** 格式化取数时间类型 */
function formatTimeType(value?: number): string {
  return FmsClosingTimeTypeOptions.find(item => item.value === value)?.label || '-'
}

/** 格式化结转凭证类型 */
function formatVoucherType(value?: number): string {
  return FmsClosingVoucherTypeOptions.find(item => item.value === value)?.label || '-'
}

/** 格式化科目展示（编码 + 名称，未匹配时回退编码快照） */
function formatSubject(subjectId?: number, subjectCode?: string): string {
  const subject = subjects.value.find(item => item.id === subjectId)
  if (subject) {
    return formatFmsSubjectDisplay(subject.code, subject.name)
  }
  return subjectCode || ''
}

/** 格式化凭证字 */
function formatVoucherWord(voucherWordId?: number): string {
  return voucherWords.value.find(item => item.id === voucherWordId)?.name || ''
}

/** 加载方案详情（方案无 /get 接口，从当前期间方案列表中查找） */
async function getDetail() {
  const accountSetId = fmsStore.accountSet?.id
  if (!props.id || !props.month || !accountSetId) {
    return
  }
  const [list, subjectList, wordList] = await Promise.all([
    getClosingSchemeList({ accountSetId, month: props.month }),
    getSubjectList(accountSetId),
    getVoucherWordSimpleList(accountSetId),
  ])
  subjects.value = subjectList
  voucherWords.value = wordList
  const scheme = list.find(item => item.id === Number(props.id))
  if (scheme) {
    formData.value = scheme
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await getDetail()
})
</script>
