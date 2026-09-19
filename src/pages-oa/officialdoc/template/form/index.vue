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
          <wd-form-item title="模板名称" title-width="220rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              :maxlength="128"
              placeholder="请输入模板名称"
            />
          </wd-form-item>
          <wd-form-item title="红头名称" title-width="220rpx" prop="authorityName">
            <wd-input
              v-model="formData.authorityName"
              clearable
              :maxlength="255"
              placeholder="请输入红头名称"
            />
          </wd-form-item>
          <wd-form-item title="红头字号" title-width="220rpx" prop="fontSize">
            <wd-input-number
              v-model="formData.fontSize"
              :min="18"
              :max="72"
              :precision="0"
              placeholder="请输入红头字号"
            />
          </wd-form-item>
          <wd-form-item title="发文字号前缀" title-width="220rpx" prop="noPrefix">
            <wd-input
              v-model="formData.noPrefix"
              clearable
              :maxlength="64"
              placeholder="请输入发文字号前缀"
            />
          </wd-form-item>
          <wd-form-item title="印章图片" title-width="220rpx" prop="sealPicUrl">
            <yd-upload-img v-model="formData.sealPicUrl" directory="oa/officialdoc-template" />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.separatorType"
            label="分隔线类型"
            label-width="220rpx"
            prop="separatorType"
            :dict-type="DICT_TYPE.OA_OFFICIAL_DOC_SEPARATOR_TYPE"
            placeholder="请选择分隔线类型"
          />
          <wd-form-item title="状态" title-width="220rpx" prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio :value="0">
                正常
              </wd-radio>
              <wd-radio :value="1">
                停用
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="显示顺序" title-width="220rpx" prop="sort">
            <wd-input-number
              v-model="formData.sort"
              :min="0"
              :precision="0"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入备注"
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
import type { OfficialDocTemplate } from '@/api/oa/officialdoc/template'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createOfficialDocTemplate, getOfficialDocTemplate, updateOfficialDocTemplate } from '@/api/oa/officialdoc/template'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑套红模板' : '新增套红模板')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<OfficialDocTemplate>>({
  id: undefined,
  name: '',
  authorityName: '',
  fontSize: 36,
  noPrefix: '',
  sealPicUrl: '',
  separatorType: 0,
  status: 0,
  sort: 0,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '模板名称不能为空' }, { max: 128 }],
  authorityName: [{ required: true, message: '红头名称不能为空' }, { max: 255 }],
  fontSize: [{ required: true, message: '红头字号不能为空' }],
  noPrefix: [{ max: 64 }],
  separatorType: [{ required: true, message: '分隔线类型不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
  sort: [{ required: true, message: '显示顺序不能为空' }],
  remark: [{ max: 500 }],
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/officialdoc/template/index')
}

/** 加载模板详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getOfficialDocTemplate(Number(props.id))
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
      await updateOfficialDocTemplate(formData.value)
      toast.success('修改成功')
    } else {
      await createOfficialDocTemplate(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('oa:officialdoc-template:reload')
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
