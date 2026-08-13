<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="财务参数"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="fmsStore.accountSet">
      <!-- 账套切换 -->
      <view class="p-24rpx pb-0">
        <AccountSetSwitch @change="reload" />
      </view>

      <!-- 表单区域 -->
      <view class="p-24rpx pb-160rpx">
        <view v-if="loading" class="py-80rpx text-center text-28rpx text-[#999]">
          加载中...
        </view>
        <template v-else>
          <!-- 缺少财务参数提示 -->
          <view
            v-if="!financeParameter"
            class="rounded-12rpx bg-[#e6f4ff] px-24rpx py-20rpx text-24rpx text-[#1677ff]"
          >
            {{ accountSetInfo?.initialized ? '当前账套缺少财务参数，请检查初始化数据' : '当前账套尚未初始化，请先完成账套初始化' }}
          </view>

          <wd-form ref="formRef" :model="formData" :schema="formSchema">
            <!-- 基础参数 -->
            <wd-cell-group title="基础参数" border>
              <wd-cell title="公司名称" :value="accountSetInfo?.companyName || '-'" />
              <wd-cell title="本位币" :value="currencyText" />
              <wd-cell title="启用期间" :value="formatFmsStartTime(accountSetInfo?.startTime) || '-'" />
              <wd-form-item title="会计制度" title-width="180rpx" prop="standard" vertical>
                <wd-radio-group
                  v-model="formData.standard"
                  type="button"
                  :disabled="!canUpdate"
                >
                  <wd-radio
                    v-for="item in FmsAccountingStandardOptions"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
            </wd-cell-group>

            <template v-if="financeParameter">
              <!-- 科目参数 -->
              <wd-cell-group title="科目参数" border class="mt-24rpx">
                <wd-form-item title="科目级次" title-width="180rpx" prop="level" vertical>
                  <wd-radio-group
                    v-model="formData.level"
                    type="button"
                    :disabled="!canUpdate"
                    @change="handleLevelChange"
                  >
                    <wd-radio v-for="level in levelOptions" :key="level" :value="level">
                      {{ level }} 级
                    </wd-radio>
                  </wd-radio-group>
                  <view class="mt-8rpx text-24rpx text-[#e6a23c]">
                    科目级次和编码长度调大后不能再调小，请谨慎操作
                  </view>
                </wd-form-item>
                <wd-form-item title="编码长度" title-width="180rpx" prop="subjectCodeRules" vertical>
                  <view class="flex flex-wrap items-center gap-12rpx">
                    <template v-for="(_, index) in formData.subjectCodeRules" :key="index">
                      <wd-input-number
                        v-model="formData.subjectCodeRules[index]"
                        :disabled="!canUpdate"
                        :min="getRuleMinimum(index)"
                        :max="FMS_SUBJECT_CODE_LENGTH_MAX"
                        :precision="0"
                      />
                      <text v-if="index < formData.subjectCodeRules.length - 1" class="text-28rpx text-[#999]">
                        -
                      </text>
                    </template>
                  </view>
                </wd-form-item>
              </wd-cell-group>

              <!-- 账簿 -->
              <wd-cell-group title="账簿" border class="mt-24rpx">
                <wd-form-item title="账簿余额方向" title-width="200rpx" vertical>
                  <wd-radio-group
                    v-model="formData.ledgerBalanceMode"
                    type="button"
                    :disabled="!canUpdate"
                  >
                    <wd-radio
                      v-for="item in FmsLedgerBalanceModeOptions"
                      :key="item.value"
                      :value="item.value"
                    >
                      {{ item.label }}
                    </wd-radio>
                  </wd-radio-group>
                </wd-form-item>
                <wd-form-item title="结账条件" title-width="200rpx">
                  <wd-checkbox v-model="formData.voucherReviewRequired" :disabled="!canUpdate">
                    凭证审核后才允许结账
                  </wd-checkbox>
                </wd-form-item>
              </wd-cell-group>
            </template>
          </wd-form>
        </template>
      </view>

      <!-- 底部保存按钮 -->
      <view v-if="canUpdate && financeParameter && !loading" class="yd-detail-footer">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </template>

    <!-- 无可用账套引导 -->
    <AccountSetGuide v-else-if="fmsStore.accountSetListLoaded" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AccountSet } from '@/api/fms/config/account-set'
import type { Currency } from '@/api/fms/config/currency'
import type { FinanceParameter } from '@/api/fms/config/finance-parameter'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getAccountSet } from '@/api/fms/config/account-set'
import { getCurrencySimpleList } from '@/api/fms/config/currency'
import { getFinanceParameter, updateFinanceParameter } from '@/api/fms/config/finance-parameter'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import {
  FMS_DEFAULT_SUBJECT_CODE_RULE,
  FMS_DEFAULT_SUBJECT_LEVEL,
  FMS_SUBJECT_CODE_LENGTH_MAX,
  FMS_SUBJECT_CODE_LENGTH_MIN,
  FMS_SUBJECT_LEVEL_MAX,
  FmsAccountingStandardOptions,
  FmsLedgerBalanceMode,
  FmsLedgerBalanceModeOptions,
} from '@/pages-fms/utils/constants'
import { formatFmsStartTime } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

interface FinanceParameterFormData {
  standard: number // 会计制度
  level: number // 科目级次
  subjectCodeRules: number[] // 科目编码规则
  ledgerBalanceMode: number // 账簿余额方向模式
  voucherReviewRequired: boolean // 结账前是否要求凭证审核
}

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const fmsStore = useFmsStore()
const loading = ref(true) // 参数加载中
const formLoading = ref(false) // 表单提交状态
const accountSetInfo = ref<AccountSet>() // 账套信息
const currency = ref<Currency>() // 本位币信息
const financeParameter = ref<FinanceParameter>() // 财务参数
const originalLevel = ref(FMS_DEFAULT_SUBJECT_LEVEL) // 原科目级次
const originalRules = ref<number[]>(parseSubjectCodeRules(FMS_DEFAULT_SUBJECT_CODE_RULE)) // 原科目编码规则
const formData = ref<FinanceParameterFormData>(createDefaultFormData()) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用

/** 仅账套可写且有更新权限时可编辑保存 */
const canUpdate = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:finance-parameter:update']))

const currencyText = computed(() => (currency.value ? `${currency.value.code} ${currency.value.name}` : '-')) // 本位币展示文案

const levelOptions = computed(() => { // 科目级次选项：只能调大不能调小
  return Array.from(
    { length: FMS_SUBJECT_LEVEL_MAX - originalLevel.value + 1 },
    (_, index) => originalLevel.value + index,
  )
})

const formSchema = createFormSchema({
  standard: [{ required: true, message: '请选择会计制度' }],
  level: [{ required: true, message: '请选择科目级次' }],
  subjectCodeRules: [{ required: true, message: '请设置各级编码长度' }],
})

/** 创建默认表单数据 */
function createDefaultFormData(): FinanceParameterFormData {
  return {
    standard: FmsAccountingStandardOptions[0].value,
    level: FMS_DEFAULT_SUBJECT_LEVEL,
    subjectCodeRules: parseSubjectCodeRules(FMS_DEFAULT_SUBJECT_CODE_RULE),
    ledgerBalanceMode: FmsLedgerBalanceMode.SAME_AS_SUBJECT,
    voucherReviewRequired: true,
  }
}

/** 解析科目编码规则 */
function parseSubjectCodeRules(rule: string): number[] {
  return rule.split('-').map(Number)
}

/** 重置表单 */
function resetFormData() {
  originalLevel.value = FMS_DEFAULT_SUBJECT_LEVEL
  originalRules.value = parseSubjectCodeRules(FMS_DEFAULT_SUBJECT_CODE_RULE)
  formData.value = createDefaultFormData()
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 重新加载 */
function reload() {
  loadParameter()
}

/** 加载财务参数 */
async function loadParameter() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    accountSetInfo.value = undefined
    currency.value = undefined
    financeParameter.value = undefined
    loading.value = false
    return
  }
  loading.value = true
  try {
    // 查询账套、财务参数和币别
    const [accountSetData, parameterData, currencyList] = await Promise.all([
      getAccountSet(accountSetId),
      getFinanceParameter(accountSetId),
      getCurrencySimpleList(accountSetId),
    ])
    if (fmsStore.accountSet?.id !== accountSetId) {
      return // 返回时账套已切换，丢弃过期结果
    }

    // 更新基础参数展示数据
    accountSetInfo.value = accountSetData
    currency.value = currencyList.find(item => item.id === accountSetData.currencyId)
    financeParameter.value = parameterData || undefined

    // 回显财务参数
    if (!parameterData) {
      resetFormData()
      return
    }
    originalLevel.value = parameterData.level
    originalRules.value = parseSubjectCodeRules(parameterData.subjectCodeRule)
    formData.value = {
      standard: accountSetData.standard ?? FmsAccountingStandardOptions[0].value,
      level: parameterData.level,
      subjectCodeRules: [...originalRules.value],
      ledgerBalanceMode: parameterData.ledgerBalanceMode,
      voucherReviewRequired: parameterData.voucherReviewRequired,
    }
  } finally {
    if (fmsStore.accountSet?.id === accountSetId) {
      loading.value = false
    }
  }
}

/** 科目级次变更：同步调整编码长度数组 */
function handleLevelChange() {
  const level = formData.value.level
  while (formData.value.subjectCodeRules.length < level) {
    formData.value.subjectCodeRules.push(FMS_SUBJECT_CODE_LENGTH_MIN)
  }
  formData.value.subjectCodeRules.splice(level)
}

/** 获得编码长度最小值（不能小于原规则对应级次长度） */
function getRuleMinimum(index: number) {
  return originalRules.value[index] || FMS_SUBJECT_CODE_LENGTH_MIN
}

/** 提交表单 */
async function handleSubmit() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    await updateFinanceParameter({
      accountSetId,
      standard: formData.value.standard,
      level: formData.value.level,
      subjectCodeRule: formData.value.subjectCodeRules.join('-'),
      ledgerBalanceMode: formData.value.ledgerBalanceMode,
      voucherReviewRequired: formData.value.voucherReviewRequired,
    })
    toast.success('财务参数保存成功')
    await loadParameter()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await loadParameter()
})
</script>
