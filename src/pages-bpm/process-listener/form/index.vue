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
          <wd-form-item title="监听器名字" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入监听器名字"
            />
          </wd-form-item>
          <wd-form-item title="监听器状态" title-width="180rpx" prop="status" center>
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
          <wd-form-item title="监听器类型" title-width="180rpx" prop="type" center>
            <wd-radio-group v-model="formData.type" type="button" @change="handleTypeChange">
              <wd-radio
                v-for="dict in getStrDictOptions(DICT_TYPE.BPM_PROCESS_LISTENER_TYPE)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="监听事件" title-width="180rpx" prop="event" center>
            <wd-radio-group v-model="formData.event" type="button">
              <wd-radio
                v-for="option in eventOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="值类型" title-width="180rpx" prop="valueType" center>
            <wd-radio-group v-model="formData.valueType" type="button" @change="handleValueTypeChange">
              <wd-radio
                v-for="dict in getStrDictOptions(DICT_TYPE.BPM_PROCESS_LISTENER_VALUE_TYPE)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item :title="valueLabel" title-width="180rpx" prop="value">
            <wd-input
              v-model="formData.value"
              clearable
              :placeholder="valuePlaceholder"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProcessListener } from '@/api/bpm/process-listener'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createProcessListener, getProcessListener, updateProcessListener } from '@/api/bpm/process-listener'
import { getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { BPM_PROCESS_LISTENER_EXECUTION_EVENT_OPTIONS, BPM_PROCESS_LISTENER_TASK_EVENT_OPTIONS, CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
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
const getTitle = computed(() => props.id ? '编辑流程监听器' : '新增流程监听器')
const formLoading = ref(false) // 表单提交状态
const formData = ref<ProcessListener>({
  id: undefined,
  name: '',
  type: '',
  status: CommonStatusEnum.ENABLE,
  event: '',
  valueType: '',
  value: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '监听器名字不能为空' }],
  type: [{ required: true, message: '监听器类型不能为空' }],
  status: [{ required: true, message: '监听器状态不能为空' }],
  event: [{ required: true, message: '监听事件不能为空' }],
  valueType: [{ required: true, message: '值类型不能为空' }],
  value: [{ required: true, message: '值不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 根据类型获取事件选项 */
const eventOptions = computed(() => {
  return formData.value.type === 'execution' ? BPM_PROCESS_LISTENER_EXECUTION_EVENT_OPTIONS : BPM_PROCESS_LISTENER_TASK_EVENT_OPTIONS
})

/** 值标签 */
const valueLabel = computed(() => {
  return formData.value.valueType === 'class' ? '类路径' : '表达式'
})

/** 值占位符 */
const valuePlaceholder = computed(() => {
  return formData.value.valueType === 'class' ? '请输入类路径' : '请输入表达式'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-bpm/process-listener/index')
}

/** 类型变更时清空事件 */
function handleTypeChange() {
  formData.value.event = ''
}

/** 值类型变更时清空值 */
function handleValueTypeChange() {
  formData.value.value = ''
}

/** 加载流程监听器详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getProcessListener(props.id)
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
      await updateProcessListener(formData.value)
      toast.success('修改成功')
    } else {
      await createProcessListener(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('bpm:process-listener:reload')
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
