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
          <wd-form-item title="币别编码" title-width="180rpx" prop="code">
            <wd-input
              v-model="formData.code"
              :disabled="formData.standard"
              clearable
              placeholder="请输入币别编码，如 USD"
              :maxlength="64"
            />
          </wd-form-item>
          <wd-form-item title="币别名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入币别名称"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item title="汇率" title-width="180rpx" prop="exchangeRate">
            <wd-input-number
              v-model="formData.exchangeRate"
              :disabled="formData.standard"
              :min="0.000001"
              :max="999999999999"
              :precision="6"
            />
            <view class="mt-8rpx text-24rpx text-[#999]">
              {{ formData.standard ? '本位币汇率固定为 1' : '按 1 单位外币折算本位币填写' }}
            </view>
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
import type { Currency } from '@/api/fms/config/currency'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createCurrency,
  getCurrencyList,
  updateCurrency,
} from '@/api/fms/config/currency'
import { useFmsStore } from '@/pages-fms/store/fms'
import { delay, navigateBackPlus } from '@/utils'
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
const getTitle = computed(() => props.id ? '编辑币别' : '新增币别')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Currency>({ // 表单数据
  id: undefined,
  accountSetId: 0,
  code: '',
  name: '',
  exchangeRate: 1,
  standard: false,
})
const formSchema = createFormSchema({
  code: [
    { required: true, message: '币别编码不能为空' },
    { pattern: /^[a-z]\w*$/i, message: '币别编码必须以字母开头，只能包含字母、数字和下划线' },
  ],
  name: [{ required: true, message: '币别名称不能为空' }],
  exchangeRate: [{ required: true, message: '汇率不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/currency/index')
}

/** 加载币别详情（币别无 /get 接口，从账套级列表中查找） */
async function getDetail() {
  if (!props.id) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const list = await getCurrencyList(accountSetId)
  const currency = list.find(item => item.id === Number(props.id))
  if (currency) {
    formData.value = currency
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    formData.value.code = formData.value.code.toUpperCase()
    if (props.id) {
      await updateCurrency(formData.value)
      toast.success('修改成功')
    } else {
      await createCurrency(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('fms:config:currency:reload')
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
