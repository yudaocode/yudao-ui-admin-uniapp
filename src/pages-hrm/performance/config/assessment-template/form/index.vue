<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border title="基本信息">
          <wd-form-item title="考核模板名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入考核模板名称"
              :maxlength="50"
            />
          </wd-form-item>
          <wd-form-item title="考核指标说明" title-width="200rpx" prop="illustrate" vertical>
            <wd-textarea
              v-model="formData.illustrate"
              clearable
              placeholder="请输入考核指标说明"
              :maxlength="200"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>

        <AssessmentConfigEditor ref="configEditorRef" v-model="formData" />
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
import type { AssessmentTemplate } from '@/api/hrm/performance/config/assessment-template'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPerformanceAssessmentTemplate,
  getPerformanceAssessmentTemplate,
  updatePerformanceAssessmentTemplate,
} from '@/api/hrm/performance/config/assessment-template'
import {
  HrmPerformanceScoreCalculation,
  HrmPerformanceUpperLimitType,
} from '@/pages-hrm/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import AssessmentConfigEditor from '../components/assessment-config-editor.vue'

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
const getTitle = computed(() => props.id ? '编辑考核指标模板' : '新增考核指标模板')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const configEditorRef = ref<InstanceType<typeof AssessmentConfigEditor>>() // 配置编辑器
const formData = ref<AssessmentTemplate>(createDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '考核模板名称不能为空' }],
  scoreCalculation: [{ required: true, message: '总分计算不能为空' }],
  upperLimitType: [{ required: true, message: '评分上限类型不能为空' }],
  upperLimitScore: [{ required: true, message: '评分上限不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/performance/config/assessment-template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getPerformanceAssessmentTemplate(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!configEditorRef.value?.validate()) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updatePerformanceAssessmentTemplate(formData.value)
      toast.success('修改成功')
    } else {
      await createPerformanceAssessmentTemplate(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('hrm:performance:assessment-template:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 创建默认表单数据 */
function createDefaultFormData(): AssessmentTemplate {
  return {
    id: undefined,
    name: '',
    illustrate: '',
    scoreCalculation: HrmPerformanceScoreCalculation.WEIGHTED,
    upperLimitType: HrmPerformanceUpperLimitType.UNIFIED,
    upperLimitScore: 100,
    dimensions: [],
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
