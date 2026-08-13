<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="开始记账"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="公司名称" :value="accountSet?.companyName || '-'" title-width="200rpx" />
          <wd-cell title="本位币" value="人民币（RMB）" title-width="200rpx" />
          <wd-form-item
            title="启用期间"
            title-width="200rpx"
            prop="startTime"
            is-link
            :value="startTimeText"
            placeholder="请选择启用期间"
            @click="startTimeVisible = true"
          />
          <wd-datetime-picker
            v-model="startTimePicker"
            v-model:visible="startTimeVisible"
            title="请选择启用期间"
            type="year-month"
            @confirm="handleStartTimeConfirm"
          />
          <yd-form-picker
            v-model="formData.standard"
            label="会计制度"
            label-width="200rpx"
            prop="standard"
            :columns="[...FmsAccountingStandardOptions]"
            placeholder="请选择会计制度"
          />
          <yd-form-picker
            v-model="formData.level"
            label="科目级次"
            label-width="200rpx"
            prop="level"
            :columns="levelOptions"
            placeholder="请选择科目级次"
          />
          <wd-form-item title="科目编码规则" title-width="200rpx" prop="subjectCodeRule">
            <wd-input
              v-model="formData.subjectCodeRule"
              clearable
              placeholder="例如：4-2-2-2"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.ledgerBalanceMode"
            label="余额方向"
            label-width="200rpx"
            prop="ledgerBalanceMode"
            :columns="[...FmsLedgerBalanceModeOptions]"
            placeholder="请选择账簿余额方向"
          />
        </wd-cell-group>
      </wd-form>

      <!-- 初始化提示 -->
      <view class="m-24rpx rounded-12rpx bg-[#e6f4ff] p-24rpx text-26rpx text-[#1677ff] leading-40rpx">
        初始化后将建立本位币、财务参数和默认凭证字，启用期间不可随意变更
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        开始记账
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AccountSet, AccountSetInitializeReq } from '@/api/fms/config/account-set'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { getAccountSet, initializeAccountSet } from '@/api/fms/config/account-set'
import { useFmsStore } from '@/pages-fms/store/fms'
import {
  FMS_DEFAULT_SUBJECT_CODE_RULE,
  FMS_DEFAULT_SUBJECT_LEVEL,
  FmsAccountingStandardOptions,
  FmsCurrencyCode,
  FmsLedgerBalanceMode,
  FmsLedgerBalanceModeOptions,
} from '@/pages-fms/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const fmsStore = useFmsStore()
const accountSet = ref<AccountSet>() // 当前账套
const formLoading = ref(false) // 表单提交状态
const startTimeVisible = ref(false) // 启用期间选择器显隐
const startTimePicker = ref<number | string>(dayjs().startOf('month').valueOf()) // 启用期间本地值
const formData = ref<AccountSetInitializeReq>({ // 表单数据
  accountSetId: 0,
  currencyCode: FmsCurrencyCode.RMB,
  startTime: dayjs().startOf('month').valueOf(),
  standard: FmsAccountingStandardOptions[0].value,
  level: FMS_DEFAULT_SUBJECT_LEVEL,
  subjectCodeRule: FMS_DEFAULT_SUBJECT_CODE_RULE,
  ledgerBalanceMode: FmsLedgerBalanceMode.SAME_AS_SUBJECT,
})
const levelOptions = Array.from({ length: 8 }, (_, index) => ({ // 科目级次选项（1-8 级）
  label: `${index + 1} 级`,
  value: index + 1,
}))
const startTimeText = computed(() => formatDate(formData.value.startTime, 'YYYY-MM') || '') // 启用期间展示文案
const formSchema = createFormSchema({
  startTime: [{ required: true, message: '启用期间不能为空' }],
  standard: [{ required: true, message: '会计制度不能为空' }],
  level: [{ required: true, message: '科目级次不能为空' }],
  subjectCodeRule: [
    { required: true, message: '科目编码规则不能为空' },
    { pattern: /^([2-5]-)*[2-5]$/, message: '各级编码长度必须为 2 至 5 位' },
  ],
  ledgerBalanceMode: [{ required: true, message: '余额方向不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/account-set/index')
}

/** 启用期间选择确认 */
function handleStartTimeConfirm() {
  formData.value.startTime = startTimePicker.value
    ? dayjs(Number(startTimePicker.value)).startOf('month').valueOf()
    : 0
}

/** 提交初始化 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    await initializeAccountSet(formData.value)
    toast.success('账套初始化成功')
    // 初始化后当前账套可能变为可用，强制刷新账套列表
    await fmsStore.loadAccountSetList(true)
    uni.$emit('fms:config:account-set:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  if (!props.id) {
    return
  }
  formData.value.accountSetId = Number(props.id)
  accountSet.value = await getAccountSet(Number(props.id))
})
</script>
