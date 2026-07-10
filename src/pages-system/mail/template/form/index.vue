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
          <wd-form-item title="模板名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入模板名称"
            />
          </wd-form-item>
          <wd-form-item title="模板编码" title-width="200rpx" prop="code">
            <wd-input
              v-model="formData.code"
              clearable
              placeholder="请输入模板编码"
            />
          </wd-form-item>
          <MailAccountFormPicker v-model="formData.accountId" prop="accountId" />
          <wd-form-item title="发送人名称" title-width="200rpx">
            <wd-input
              v-model="formData.nickname"
              clearable
              placeholder="请输入发送人名称"
            />
          </wd-form-item>
          <wd-form-item title="模板标题" title-width="200rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              placeholder="请输入模板标题"
            />
          </wd-form-item>
          <wd-form-item title="模板内容" title-width="200rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              clearable
              placeholder="请输入模板内容"
              :rows="4"
            />
          </wd-form-item>
          <wd-form-item title="开启状态" title-width="200rpx" prop="status" center>
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
          <wd-form-item title="备注" title-width="200rpx">
            <wd-textarea
              v-model="formData.remark"
              clearable
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
import type { MailTemplate } from '@/api/system/mail/template'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createMailTemplate, getMailTemplate, updateMailTemplate } from '@/api/system/mail/template'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import MailAccountFormPicker from '../../account/components/form-picker.vue'

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
const getTitle = computed(() => props.id ? '编辑邮件模板' : '新增邮件模板')
const formLoading = ref(false) // 表单提交状态
const formData = ref<MailTemplate>({
  id: undefined,
  name: '',
  code: '',
  accountId: undefined,
  nickname: '',
  title: '',
  content: '',
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '模板名称不能为空' }],
  code: [{ required: true, message: '模板编码不能为空' }],
  accountId: [{ required: true, message: '邮箱账号不能为空' }],
  title: [{ required: true, message: '模板标题不能为空' }],
  content: [{ required: true, message: '模板内容不能为空' }],
  status: [{ required: true, message: '开启状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/mail/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMailTemplate(props.id)
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
      await updateMailTemplate(formData.value)
      toast.success('修改成功')
    } else {
      await createMailTemplate(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('system:mail-template:reload')
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
