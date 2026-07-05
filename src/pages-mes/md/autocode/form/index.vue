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
          <wd-form-item title="规则编码" title-width="200rpx" prop="code">
            <wd-input
              v-model="formData.code"
              clearable
              placeholder="请输入规则编码"
            />
          </wd-form-item>
          <wd-form-item title="规则名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入规则名称"
            />
          </wd-form-item>
          <wd-form-item title="规则描述" title-width="200rpx" prop="description">
            <wd-textarea
              v-model="formData.description"
              placeholder="请输入规则描述"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
          <wd-form-item title="最大长度" title-width="200rpx" prop="maxLength" center>
            <wd-input-number
              :model-value="formData.maxLength ?? ''"
              allow-null
              :min="1"
              :max="100"
              :precision="0"
              @update:model-value="value => formData.maxLength = toFiniteNumber(value)"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.padded"
            label="是否补齐"
            label-width="200rpx"
            prop="padded"
            :columns="paddedOptions"
            placeholder="请选择是否补齐"
          />
          <wd-form-item v-if="formData.padded" title="补齐字符" title-width="200rpx" prop="paddedChar">
            <wd-input
              v-model="formData.paddedChar"
              clearable
              placeholder="请输入补齐字符"
              :maxlength="1"
            />
          </wd-form-item>
          <yd-form-picker
            v-if="formData.padded"
            v-model="formData.paddedMethod"
            label="补齐方式"
            label-width="200rpx"
            prop="paddedMethod"
            :dict-type="DICT_TYPE.MES_MD_AUTO_CODE_PADDED_METHOD"
            placeholder="请选择补齐方式"
          />
          <yd-form-picker
            v-model="formData.status"
            label="状态"
            label-width="200rpx"
            prop="status"
            :dict-type="DICT_TYPE.COMMON_STATUS"
            placeholder="请选择状态"
          />
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="h-160rpx" />
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AutoCodeRule } from '@/api/mes/md/autocode/rule'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createAutoCodeRule, getAutoCodeRule, updateAutoCodeRule } from '@/api/mes/md/autocode/rule'
import { getBoolDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { toFiniteNumber } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'

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
const getTitle = computed(() => props.id ? '编辑编码规则' : '新增编码规则')
const formLoading = ref(false) // 表单提交状态
const formData = ref<AutoCodeRule>(createDefaultFormData()) // 表单数据
const paddedOptions = getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING) // 是否补齐选项

/** 创建默认表单数据 */
function createDefaultFormData(): AutoCodeRule {
  return {
    id: undefined,
    code: '',
    name: '',
    description: '',
    maxLength: undefined,
    padded: false,
    paddedChar: undefined,
    paddedMethod: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: '',
  }
}

const formSchema = createFormSchema({
  code: [{ required: true, message: '规则编码不能为空' }],
  name: [{ required: true, message: '规则名称不能为空' }],
  maxLength: [
    { required: true, message: '最大长度不能为空' },
    { validator: value => (Number(value) >= 1 && Number(value) <= 100) || '最大长度必须在 1 到 100 之间' },
  ],
  padded: [{ required: true, message: '是否补齐不能为空' }],
  paddedChar: [{ required: () => formData.value.padded === true, message: '补齐字符不能为空' }],
  paddedMethod: [{ required: () => formData.value.padded === true, message: '补齐方式不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/autocode/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getAutoCodeRule(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      paddedChar: formData.value.padded ? formData.value.paddedChar : undefined,
      paddedMethod: formData.value.padded ? formData.value.paddedMethod : undefined,
    }
    if (props.id) {
      await updateAutoCodeRule(data)
      toast.success('修改成功')
    } else {
      await createAutoCodeRule(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:md:autocode:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
