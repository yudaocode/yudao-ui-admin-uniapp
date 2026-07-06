<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="检测项编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" :maxlength="64" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="检测项名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入检测项名称" :maxlength="100" clearable />
          </wd-form-item>
          <yd-form-picker v-model="formData.type" label="检测项类型" label-width="220rpx" prop="type" :dict-type="DICT_TYPE.MES_INDICATOR_TYPE" placeholder="请选择检测项类型" />
          <wd-form-item title="检测工具" title-width="220rpx" prop="tool">
            <wd-input v-model="formData.tool" placeholder="请输入检测工具" :maxlength="100" clearable />
          </wd-form-item>
          <yd-form-picker v-model="formData.resultType" label="结果值类型" label-width="220rpx" prop="resultType" :dict-type="DICT_TYPE.MES_QC_RESULT_TYPE" placeholder="请选择结果值类型" @confirm="handleResultTypeChange" />
          <yd-form-picker
            v-if="formData.resultType === MesQcResultValueTypeEnum.FILE"
            v-model="formData.resultSpecification"
            label="文件类型"
            label-width="220rpx"
            prop="resultSpecification"
            :columns="fileTypeOptions"
            placeholder="请选择文件类型"
          />
          <wd-form-item
            v-else-if="formData.resultType === MesQcResultValueTypeEnum.DICT"
            title="字典类型"
            title-width="220rpx"
            prop="resultSpecification"
          >
            <wd-input v-model="formData.resultSpecification" placeholder="请输入字典类型" clearable />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="250" show-word-limit clearable />
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
import type { QcIndicator } from '@/api/mes/qc/indicator'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createIndicator, getIndicator, updateIndicator } from '@/api/mes/qc/indicator'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesQcResultValueTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑质检指标' : '新增质检指标')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<QcIndicator>({
  code: '',
  name: '',
}) // 表单数据
const needResultSpecification = computed(() => { // 当前结果值类型是否需要属性
  return formData.value.resultType === MesQcResultValueTypeEnum.FILE
    || formData.value.resultType === MesQcResultValueTypeEnum.DICT
})
const formSchema = createFormSchema({
  code: [
    { required: true, message: '检测项编码不能为空' },
    { max: 64, message: '检测项编码长度不能超过 64 个字符' },
  ],
  name: [
    { required: true, message: '检测项名称不能为空' },
    { max: 100, message: '检测项名称长度不能超过 100 个字符' },
  ],
  type: [{ required: true, message: '检测项类型不能为空' }],
  resultType: [{ required: true, message: '结果值类型不能为空' }],
  resultSpecification: [{
    required: () => needResultSpecification.value,
    message: '结果值属性不能为空',
  }],
  remark: [{ max: 250, message: '备注长度不能超过 250 个字符' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const fileTypeOptions = [ // 文件结果类型选项
  { label: '图片/照片', value: 'IMG' },
  { label: '文件', value: 'FILE' },
]

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/indicator/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getIndicator(Number(props.id))
}

/** 生成检测项编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.QC_INDICATOR_CODE)
    toast.success('生成成功')
  } finally {
    codeLoading.value = false
  }
}

/** 结果值类型变更 */
function handleResultTypeChange() {
  formData.value.resultSpecification = undefined
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data: QcIndicator = {
      ...formData.value,
      resultSpecification: needResultSpecification.value ? formData.value.resultSpecification : undefined,
    }
    if (props.id) {
      await updateIndicator(data)
      toast.success('修改成功')
    } else {
      await createIndicator(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:qc:indicator:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await getDetail()
})
</script>
