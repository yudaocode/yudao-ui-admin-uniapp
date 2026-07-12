<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 工作流表单 -->
    <view class="pb-160rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="流程标识" title-width="210rpx" prop="code">
            <wd-input v-model="formData.code" clearable placeholder="请输入流程标识" />
          </wd-form-item>
          <wd-form-item title="流程名称" title-width="210rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入流程名称" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="210rpx">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" clearable />
          </wd-form-item>
          <wd-form-item title="编排 JSON" title-width="210rpx" prop="graph">
            <wd-textarea
              v-model="formData.graph"
              placeholder="请输入工作流编排 JSON"
              :maxlength="8000"
              show-word-limit
              clearable
            />
          </wd-form-item>
          <wd-form-item title="状态" title-width="210rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Workflow } from '@/api/ai/workflow'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createWorkflow, getWorkflow, updateWorkflow } from '@/api/ai/workflow'
import { getIntDictOptions } from '@/hooks/useDict'
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
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<Workflow>(createDefaultForm()) // 表单数据
const formLoading = ref(false) // 表单提交状态
const getTitle = computed(() => props.id ? '编辑工作流' : '新增工作流')
const formSchema = createFormSchema({
  code: [{ required: true, message: '流程标识不能为空' }],
  name: [{ required: true, message: '流程名称不能为空' }],
  graph: [
    { required: true, message: '工作流编排不能为空' },
    {
      validator: (value) => {
        try {
          const graph = JSON.parse(String(value))
          return graph && typeof graph === 'object' && !Array.isArray(graph)
            ? true
            : '工作流编排必须是 JSON 对象'
        } catch {
          return '工作流编排必须是合法 JSON'
        }
      },
    },
  ],
  status: [{ required: true, message: '状态不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/workflow/index')
}

/** 加载工作流详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getWorkflow(Number(props.id))
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
      await updateWorkflow(formData.value)
      toast.success('修改成功')
    } else {
      await createWorkflow(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('ai:workflow:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 创建默认表单 */
function createDefaultForm(): Workflow {
  return {
    code: '',
    name: '',
    remark: '',
    graph: '{}',
    status: CommonStatusEnum.ENABLE,
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
