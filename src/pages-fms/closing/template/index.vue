<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="结账模板"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="fmsStore.accountSet">
      <!-- 账套切换 -->
      <view class="p-24rpx pb-0">
        <AccountSetSwitch @change="getList" />
      </view>

      <!-- 模板分类 -->
      <view class="mb-24rpx bg-white">
        <wd-tabs v-model="category">
          <wd-tab
            v-for="item in FmsClosingTemplateCategoryOptions"
            :key="item.value"
            :title="item.label"
            :name="item.value"
          />
        </wd-tabs>
      </view>

      <!-- 结账模板列表（只读） -->
      <view class="px-24rpx pb-24rpx">
        <view
          v-for="item in filteredList"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <wd-tag v-if="item.periodEnd" type="warning" plain>
              期末结转
            </wd-tag>
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">来源科目：</text>{{ formatSubject(item.subjectId) || '使用模板时补充' }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">取数规则：</text>{{ formatFormulaRule(item.formulaRule) }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">时间类型：</text>{{ formatTimeType(item.timeType) }}
          </view>
          <!-- 分录规则 -->
          <view class="mt-16rpx border-0 border-t border-[#f0f0f0] border-solid pt-16rpx">
            <view
              v-for="(rule, index) in item.subjects || []"
              :key="index"
              class="mb-8rpx flex items-center justify-between text-26rpx text-[#666]"
            >
              <view class="min-w-0 flex-1 truncate">
                {{ rule.digest || '-' }}（{{ formatSubject(rule.subjectId, rule.subjectCode) || '-' }}）
              </view>
              <view class="flex-shrink-0 text-[#999]">
                {{ rule.direction === FmsDebitCreditDirection.DEBIT ? '借' : '贷' }} {{ rule.amountRatio }}%
              </view>
            </view>
          </view>
        </view>
        <view v-if="!filteredList.length" class="py-96rpx text-center text-28rpx text-[#999]">
          暂无结账模板
        </view>
      </view>
    </template>

    <!-- 无可用账套引导 -->
    <AccountSetGuide v-else-if="fmsStore.accountSetListLoaded" />
  </view>
</template>

<script lang="ts" setup>
import type { ClosingTemplate } from '@/api/fms/closing/template'
import type { Subject } from '@/api/fms/config/subject'
import { getClosingTemplateList } from '@/api/fms/closing/template'
import { getSubjectList } from '@/api/fms/config/subject'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import {
  FmsBalanceFormulaRuleOptions,
  FmsClosingTemplateCategory,
  FmsClosingTemplateCategoryOptions,
  FmsClosingTimeTypeOptions,
  FmsDebitCreditDirection,
} from '@/pages-fms/utils/constants'
import { formatFmsSubjectDisplay } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const fmsStore = useFmsStore()
const list = ref<ClosingTemplate[]>([]) // 列表数据
const subjects = ref<Subject[]>([]) // 科目列表，用于分录规则展示科目名称
const category = ref<number>(FmsClosingTemplateCategory.DAILY_EXPENSE) // 当前模板分类

const filteredList = computed(() => // 当前分类的模板列表
  list.value.filter(item => item.category === category.value),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 格式化取数规则 */
function formatFormulaRule(value?: number): string {
  return FmsBalanceFormulaRuleOptions.find(item => item.value === value)?.label || '-'
}

/** 格式化取数时间类型 */
function formatTimeType(value?: number): string {
  return FmsClosingTimeTypeOptions.find(item => item.value === value)?.label || '-'
}

/** 格式化科目展示（编码 + 名称，未匹配时回退编码快照） */
function formatSubject(subjectId?: number, subjectCode?: string): string {
  const subject = subjects.value.find(item => item.id === subjectId)
  if (subject) {
    return formatFmsSubjectDisplay(subject.code, subject.name)
  }
  return subjectCode || ''
}

/** 查询结账模板列表 */
async function getList() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    list.value = []
    return
  }
  const [templateList, subjectList] = await Promise.all([
    getClosingTemplateList(accountSetId),
    getSubjectList(accountSetId),
  ])
  list.value = templateList
  subjects.value = subjectList
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await getList()
})
</script>
