<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="发送模板消息"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group title="模板信息" value="固定参数" border>
          <wd-cell title="模板标题" :value="templateTitle || '-'" />
          <MpUserFormPicker
            v-model="formData.userId"
            :account-id="accountId"
            prop="userId"
          />
          <wd-cell v-if="templateContent" title="模板内容" layout="vertical" value-align="left">
            <view class="mt-12rpx whitespace-pre-wrap break-all text-26rpx text-[#666] leading-40rpx">
              {{ templateContent }}
            </view>
          </wd-cell>
        </wd-cell-group>

        <wd-cell-group title="模板数据" value="模板变量" border class="mt-24rpx">
          <wd-form-item
            v-for="param in templateParams"
            :key="param"
            :title="param"
            title-width="220rpx"
          >
            <wd-input v-model="paramValues[param]" clearable :placeholder="`请输入「${param}」的值`" />
          </wd-form-item>
          <wd-cell v-if="template && !templateParams.length" title="模板变量" value="该模板无需填写参数" />
        </wd-cell-group>

        <wd-cell-group title="跳转配置" value="固定参数，选填" border class="mt-24rpx">
          <wd-form-item title="跳转链接" title-width="220rpx" prop="url">
            <wd-input v-model="formData.url" clearable placeholder="请输入跳转链接" />
          </wd-form-item>
          <wd-form-item title="小程序 AppID" title-width="220rpx" prop="miniProgramAppId">
            <wd-input v-model="formData.miniProgramAppId" clearable placeholder="请输入小程序 AppID" />
          </wd-form-item>
          <wd-form-item title="页面路径" title-width="220rpx" prop="miniProgramPagePath">
            <wd-input v-model="formData.miniProgramPagePath" clearable placeholder="请输入小程序页面路径" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部发送按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="loading" @click="handleSubmit">
        发送
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MsgTemplate, MsgTemplateSend } from '@/api/mp/messageTemplate'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import { getMessageTemplate, sendMessageTemplate } from '@/api/mp/messageTemplate'
import MpUserFormPicker from '@/pages-mp/user/components/form-picker.vue'
import { delay, navigateBackPlus, normalizeEscapedNewlines } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
  accountId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const accountId = computed(() => props.accountId ? Number(props.accountId) : undefined)
const template = ref<MsgTemplate>() // 模板详情
const templateParams = ref<string[]>([]) // 模板变量名
const paramValues = reactive<Record<string, string>>({}) // 各参数填写值
const templateContent = computed(() => normalizeEscapedNewlines(template.value?.content || '')) // 模板内容展示文案
const templateTitle = computed(() => template.value?.title || '') // 模板标题展示文案
const loading = ref(false) // 发送状态
const formData = ref<MsgTemplateSend>({
  id: props.id ? Number(props.id) : undefined,
  userId: undefined!,
  data: {},
  url: '',
  miniProgramAppId: '',
  miniProgramPagePath: '',
}) // 表单数据
const formSchema = createFormSchema({
  userId: [{ required: true, message: '用户不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/message-template/index')
}

/** 解析模板变量 */
function parseTemplateParams(content: string) {
  const names = Array.from(content.matchAll(/\{\{\s*(\w+)\s*\.\s*DATA\s*\}\}/g), match => match[1])
  return Array.from(new Set(names))
}

/** 加载模板详情 */
async function loadTemplate() {
  if (!props.id) {
    return
  }
  const id = Number(props.id)
  template.value = await getMessageTemplate(id)
  const params = parseTemplateParams(normalizeEscapedNewlines(template.value.content || ''))
  templateParams.value = params
  params.forEach((param) => {
    paramValues[param] = paramValues[param] || ''
  })
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.id) {
    toast.show('缺少模板编号')
    return
  }

  const data: MsgTemplateSend = { ...formData.value, id: Number(props.id) }
  // 按模板参数构建微信 data：{ 参数名: 参数值 }
  data.data = Object.fromEntries(templateParams.value.map(param => [param, paramValues[param] || '']))
  if (data.miniProgramAppId && data.miniProgramPagePath) {
    data.miniprogram = JSON.stringify({
      appid: data.miniProgramAppId,
      pagepath: data.miniProgramPagePath,
    })
  }

  loading.value = true
  try {
    await sendMessageTemplate(data)
    toast.success('发送成功')
    delay(handleBack)
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  formData.value.id = props.id ? Number(props.id) : undefined
  loadTemplate()
})
</script>
