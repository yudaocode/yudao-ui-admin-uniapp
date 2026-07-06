<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="缺陷编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="缺陷描述" title-width="220rpx" prop="name">
            <wd-textarea v-model="formData.name" placeholder="请输入缺陷描述" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
          <yd-form-picker v-model="formData.type" label="检测项类型" label-width="220rpx" prop="type" :dict-type="DICT_TYPE.MES_INDICATOR_TYPE" placeholder="请选择检测项类型" />
          <yd-form-picker v-model="formData.level" label="缺陷等级" label-width="220rpx" prop="level" :dict-type="DICT_TYPE.MES_DEFECT_LEVEL" placeholder="请选择缺陷等级" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="h-160rpx" />
    </scroll-view>

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
import type { QcDefect } from '@/api/mes/qc/defect'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createDefect, getDefect, updateDefect } from '@/api/mes/qc/defect'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑缺陷类型' : '新增缺陷类型')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<QcDefect>({
  code: '',
  name: '',
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '缺陷编码不能为空' }],
  name: [{ required: true, message: '缺陷描述不能为空' }],
  type: [{ required: true, message: '检测项类型不能为空' }],
  level: [{ required: true, message: '缺陷等级不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/defect/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getDefect(Number(props.id))
}

/** 生成缺陷编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.QC_DEFECT_CODE)
    toast.success('生成成功')
  } finally {
    codeLoading.value = false
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
    if (props.id) {
      await updateDefect(formData.value)
      toast.success('修改成功')
    } else {
      await createDefect(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:qc:defect:reload')
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
