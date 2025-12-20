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
      <wd-form ref="formRef" :model="formData" :rules="formRules">
        <wd-cell-group border>
          <wd-cell title="短信类型" title-width="200rpx" prop="type" center>
            <wd-picker
              v-model="formData.type"
              :columns="templateTypeOptions"
              placeholder="请选择短信类型"
            />
          </wd-cell>
          <wd-input
            v-model="formData.name"
            label="模板名称"
            label-width="200rpx"
            prop="name"
            clearable
            placeholder="请输入模板名称"
          />
          <wd-input
            v-model="formData.code"
            label="模板编码"
            label-width="200rpx"
            prop="code"
            clearable
            placeholder="请输入模板编码"
          />
          <wd-cell title="短信渠道" title-width="200rpx" prop="channelId" center>
            <wd-picker
              v-model="formData.channelId"
              :columns="channelOptions"
              placeholder="请选择短信渠道"
            />
          </wd-cell>
          <wd-cell title="开启状态" title-width="200rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" shape="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <wd-textarea
            v-model="formData.content"
            label="模板内容"
            label-width="200rpx"
            prop="content"
            clearable
            placeholder="请输入模板内容"
            :rows="4"
          />
          <wd-input
            v-model="formData.apiTemplateId"
            label="API 模板编号"
            label-width="200rpx"
            prop="apiTemplateId"
            clearable
            placeholder="请输入短信 API 的模板编号"
          />
          <wd-textarea
            v-model="formData.remark"
            label="备注"
            label-width="200rpx"
            prop="remark"
            clearable
            placeholder="请输入备注"
          />
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
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
import type { SmsChannel } from '@/api/system/sms/channel'
import type { SmsTemplate } from '@/api/system/sms/template'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getSimpleSmsChannelList } from '@/api/system/sms/channel'
import { createSmsTemplate, getSmsTemplate, updateSmsTemplate } from '@/api/system/sms/template'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

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
const getTitle = computed(() => props.id ? '编辑短信模板' : '新增短信模板')
const formLoading = ref(false)
const formData = ref<SmsTemplate>({
  id: undefined,
  type: undefined,
  name: '',
  code: '',
  channelId: undefined,
  status: 0,
  content: '',
  apiTemplateId: '',
  remark: '',
})
const formRules = {
  type: [{ required: true, message: '短信类型不能为空' }],
  name: [{ required: true, message: '模板名称不能为空' }],
  code: [{ required: true, message: '模板编码不能为空' }],
  channelId: [{ required: true, message: '短信渠道不能为空' }],
  status: [{ required: true, message: '开启状态不能为空' }],
  content: [{ required: true, message: '模板内容不能为空' }],
  apiTemplateId: [{ required: true, message: 'API 模板编号不能为空' }],
}
const formRef = ref()

/** 短信渠道列表 */
const channelList = ref<SmsChannel[]>([])

/** 短信类型选项 */
const templateTypeOptions = computed(() => {
  return getIntDictOptions(DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE).map(item => ({
    value: item.value,
    label: item.label,
  }))
})

/** 短信渠道选项 */
const channelOptions = computed(() => {
  return channelList.value.map(item => ({
    value: item.id,
    label: item.signature,
  }))
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/sms/index')
}

/** 加载短信渠道列表 */
async function loadChannelList() {
  channelList.value = await getSimpleSmsChannelList()
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getSmsTemplate(props.id)
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
      await updateSmsTemplate(formData.value)
      toast.success('修改成功')
    } else {
      await createSmsTemplate(formData.value)
      toast.success('新增成功')
    }
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await loadChannelList()
  await getDetail()
})
</script>

<style lang="scss" scoped>
</style>
