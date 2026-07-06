<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="项目编码" title-width="200rpx" prop="code">
            <wd-input
              v-model="formData.code"
              clearable
              placeholder="请输入或点击生成"
            >
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="项目名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入项目名称"
            />
          </wd-form-item>
          <yd-form-picker v-model="formData.type" label="项目类型" label-width="200rpx" prop="type" :dict-type="DICT_TYPE.MES_DV_SUBJECT_TYPE" placeholder="请选择项目类型" />
          <wd-form-item title="项目内容" title-width="200rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              placeholder="请输入项目内容"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
          <wd-form-item title="标准" title-width="200rpx" prop="standard">
            <wd-textarea
              v-model="formData.standard"
              placeholder="请输入标准"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
          <yd-form-picker v-model="formData.status" label="状态" label-width="200rpx" prop="status" :dict-type="DICT_TYPE.COMMON_STATUS" placeholder="请选择状态" />
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
import type { DvSubject } from '@/api/mes/dv/subject'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createSubject, getSubject, updateSubject } from '@/api/mes/dv/subject'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode } from '@/utils/constants'
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
const getTitle = computed(() => props.id ? '编辑点检项目' : '新增点检项目')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<DvSubject>({
  code: '',
  name: '',
  type: undefined,
  content: '',
  standard: '',
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '项目编码不能为空' }],
  type: [{ required: true, message: '项目类型不能为空' }],
  content: [{ required: true, message: '项目内容不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/subject/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getSubject(Number(props.id))
}

/** 生成项目编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.DV_SUBJECT_CODE)
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
      await updateSubject(formData.value)
      toast.success('修改成功')
    } else {
      await createSubject(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:dv:subject:reload')
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
