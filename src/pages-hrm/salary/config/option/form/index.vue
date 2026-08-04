<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="新增薪资项"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="工资项分类" :value="categoryName || '-'" />
          <wd-form-item title="工资项名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入工资项名称"
              :maxlength="64"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="180rpx" prop="remark" vertical>
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="请输入备注"
              :maxlength="255"
              :show-word-limit="true"
            />
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
import type { SalaryOptionReq } from '@/api/hrm/salary/config/option'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createSalaryOption,
  getSalaryOptionList,
} from '@/api/hrm/salary/config/option'
import { HrmSalaryOptionCategoryCode } from '@/pages-hrm/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  parentCode?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formLoading = ref(false) // 表单提交状态
const categoryName = ref('') // 分类名称
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<SalaryOptionReq>({ // 表单数据
  parentCode: undefined,
  name: '',
  remark: '',
})

const formSchema = createFormSchema({
  name: [{ required: true, message: '工资项名称不能为空' }],
})

const parentCodeValue = computed(() => { // 分类编码
  return props.parentCode ? Number(props.parentCode) : undefined
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/salary/config/option/index')
}

/** 加载分类名称 */
async function loadCategory() {
  if (!parentCodeValue.value) {
    toast.warning('参数错误，工资项分类不能为空！')
    delay(handleBack)
    return
  }
  formData.value.parentCode = parentCodeValue.value
  const options = await getSalaryOptionList()
  const category = options.find(
    item =>
      item.code === parentCodeValue.value
      && item.parentCode === HrmSalaryOptionCategoryCode.ROOT
      && !item.systemFlag
      && item.enabled,
  )
  if (!category) {
    toast.warning('工资项分类不存在或未启用')
    delay(handleBack)
    return
  }
  categoryName.value = category.name
}

/** 提交表单 */
async function handleSubmit() {
  if (!formData.value.parentCode) {
    toast.warning('工资项分类不能为空')
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    await createSalaryOption(formData.value)
    toast.success('创建成功')
    uni.$emit('hrm:salary:option:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadCategory()
})
</script>
