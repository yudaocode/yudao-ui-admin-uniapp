<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="指标名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入指标名称"
              :maxlength="100"
            />
          </wd-form-item>
          <wd-form-item title="指标编码" title-width="180rpx" prop="code">
            <wd-input
              v-model="formData.code"
              :disabled="!!id"
              clearable
              placeholder="请输入指标编码"
              :maxlength="64"
            />
          </wd-form-item>
          <wd-form-item title="取数报表" title-width="180rpx" prop="type" center>
            <wd-radio-group v-model="formData.type" type="button">
              <wd-radio
                v-for="option in getIntDictOptions(DICT_TYPE.FMS_FINANCE_INDICATOR_TYPE)"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="指标公式" title-width="180rpx" prop="formula">
            <wd-textarea
              v-model="formData.formula"
              clearable
              :rows="4"
              placeholder="例如：L1+L2-L3，或科目公式 JSON"
              :maxlength="2000"
              show-word-limit
            />
            <view class="mt-8rpx text-24rpx text-[#999]">
              支持报表行次公式（L1+L2-L3）或报表科目公式 JSON
            </view>
          </wd-form-item>
          <wd-form-item title="展示顺序" title-width="180rpx" prop="sort">
            <wd-input-number
              v-model="formData.sort"
              :min="0"
              :precision="0"
            />
          </wd-form-item>
          <wd-form-item title="状态" title-width="180rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { FinanceIndicator } from '@/api/fms/config/finance-indicator'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createFinanceIndicator,
  getFinanceIndicator,
  updateFinanceIndicator,
} from '@/api/fms/config/finance-indicator'
import { getIntDictOptions } from '@/hooks/useDict'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FmsFinanceIndicatorType } from '@/pages-fms/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
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
const getTitle = computed(() => props.id ? '编辑财务指标' : '新增财务指标')
const formLoading = ref(false) // 表单提交状态
const formData = ref<FinanceIndicator>({ // 表单数据
  id: undefined,
  accountSetId: 0,
  name: '',
  code: '',
  type: FmsFinanceIndicatorType.INCOME_STATEMENT,
  formula: 'L1',
  sort: 10,
  status: CommonStatusEnum.ENABLE,
})
const formSchema = createFormSchema({
  name: [{ required: true, message: '指标名称不能为空' }],
  code: [{ required: true, message: '指标编码不能为空' }],
  type: [{ required: true, message: '请选择取数报表' }],
  formula: [{ required: true, message: '指标公式不能为空' }],
  sort: [{ required: true, message: '展示顺序不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/finance-indicator/index')
}

/** 加载财务指标详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  formData.value = await getFinanceIndicator(accountSetId, Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateFinanceIndicator(formData.value)
      toast.success('修改成功')
    } else {
      await createFinanceIndicator(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('fms:config:finance-indicator:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  formData.value.accountSetId = fmsStore.accountSet?.id || 0
  await getDetail()
})
</script>
