<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="配置名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入配置名称" clearable />
          </wd-form-item>
          <wd-form-item title="告警级别" title-width="220rpx" center prop="level">
            <wd-radio-group v-model="formData.level" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.IOT_ALERT_LEVEL)"
                :key="dict.value"
                :name="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="配置状态" title-width="220rpx" center prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :name="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <SceneRulePicker v-model="formData.sceneRuleIds" prop="sceneRuleIds" :columns="sceneRuleOptions" label-width="220rpx" />
          <UserPicker v-model="formData.receiveUserIds" label="接收用户" prop="receiveUserIds" label-width="220rpx" />
          <yd-form-picker
            v-model="formData.receiveTypes"
            label="接收类型"
            prop="receiveTypes"
            :dict-type="DICT_TYPE.IOT_ALERT_RECEIVE_TYPE"
            type="checkbox"
            filterable
            placeholder="请选择接收类型"
            label-width="220rpx"
          />
          <yd-form-picker
            v-if="formData.receiveTypes?.includes(IotAlertReceiveTypeEnum.SMS)"
            v-model="formData.smsTemplateCode"
            label="短信模板"
            prop="smsTemplateCode"
            :columns="smsTemplateOptions"
            label-key="name"
            value-key="code"
            placeholder="请选择短信模板"
            label-width="220rpx"
          />
          <yd-form-picker
            v-if="formData.receiveTypes?.includes(IotAlertReceiveTypeEnum.MAIL)"
            v-model="formData.mailTemplateCode"
            label="邮件模板"
            prop="mailTemplateCode"
            :columns="mailTemplateOptions"
            label-key="name"
            value-key="code"
            placeholder="请选择邮件模板"
            label-width="220rpx"
          />
          <yd-form-picker
            v-if="formData.receiveTypes?.includes(IotAlertReceiveTypeEnum.NOTIFY)"
            v-model="formData.notifyTemplateCode"
            label="站内信模板"
            prop="notifyTemplateCode"
            :columns="notifyTemplateOptions"
            label-key="name"
            value-key="code"
            placeholder="请选择站内信模板"
            label-width="220rpx"
          />
          <wd-form-item title="配置描述" title-width="220rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入配置描述" :maxlength="300" show-word-limit />
          </wd-form-item>
        </wd-cell-group>
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
import type { AlertConfig } from '@/api/iot/alert/config'
import type { IotSceneRule } from '@/api/iot/rule/scene'
import type { MailTemplate } from '@/api/system/mail/template'
import type { NotifyTemplate } from '@/api/system/notify/template'
import type { SmsTemplate } from '@/api/system/sms/template'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createAlertConfig, getAlertConfig, updateAlertConfig } from '@/api/iot/alert/config'
import { getSimpleRuleSceneList } from '@/api/iot/rule/scene'
import { getSimpleMailTemplateList } from '@/api/system/mail/template'
import { getSimpleNotifyTemplateList } from '@/api/system/notify/template'
import { getSimpleSmsTemplateList } from '@/api/system/sms/template'
import { getIntDictOptions } from '@/hooks/useDict'
import { UserPicker } from '@/components/system-select'
import SceneRulePicker from '@/pages-iot/rule/scene/components/scene-rule-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE, IotAlertReceiveTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑告警配置' : '新增告警配置')
const formLoading = ref(false) // 表单提交状态
const sceneRuleOptions = ref<IotSceneRule[]>([]) // 场景规则选项
const smsTemplateOptions = ref<SmsTemplate[]>([]) // 短信模板选项
const mailTemplateOptions = ref<MailTemplate[]>([]) // 邮件模板选项
const notifyTemplateOptions = ref<NotifyTemplate[]>([]) // 站内信模板选项
const formData = ref<AlertConfig>({
  id: undefined,
  name: '',
  description: '',
  level: undefined,
  status: CommonStatusEnum.ENABLE,
  sceneRuleIds: [],
  receiveUserIds: [],
  receiveTypes: [],
}) // 表单数据
const formSchema = createFormSchema(() => ({
  name: [{ required: true, message: '配置名称不能为空' }],
  level: [{ required: true, message: '告警级别不能为空' }],
  status: [{ required: true, message: '配置状态不能为空' }],
  sceneRuleIds: [{ required: true, message: '场景规则不能为空' }],
  receiveUserIds: [{ required: true, message: '接收用户不能为空' }],
  receiveTypes: [{ required: true, message: '接收类型不能为空' }],
  smsTemplateCode: [{ required: () => !!formData.value.receiveTypes?.includes(IotAlertReceiveTypeEnum.SMS), message: '短信模板不能为空' }],
  mailTemplateCode: [{ required: () => !!formData.value.receiveTypes?.includes(IotAlertReceiveTypeEnum.MAIL), message: '邮件模板不能为空' }],
  notifyTemplateCode: [{ required: () => !!formData.value.receiveTypes?.includes(IotAlertReceiveTypeEnum.NOTIFY), message: '站内信模板不能为空' }],
}))
const formRef = ref<FormInstance>() // 表单组件引用

/** 切换接收类型时清理无效模板 */
watch(() => formData.value.receiveTypes, (types) => {
  if (!types?.includes(IotAlertReceiveTypeEnum.SMS)) {
    formData.value.smsTemplateCode = undefined
  }
  if (!types?.includes(IotAlertReceiveTypeEnum.MAIL)) {
    formData.value.mailTemplateCode = undefined
  }
  if (!types?.includes(IotAlertReceiveTypeEnum.NOTIFY)) {
    formData.value.notifyTemplateCode = undefined
  }
}, { deep: true })

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/alert/config/index')
}

/** 加载告警配置详情 */
async function getDetail() {
  formData.value = await getAlertConfig(Number(props.id))
}

/** 加载表单选项 */
async function loadOptions() {
  const [sceneRules, smsTemplates, mailTemplates, notifyTemplates] = await Promise.all([
    getSimpleRuleSceneList(),
    getSimpleSmsTemplateList(),
    getSimpleMailTemplateList(),
    getSimpleNotifyTemplateList(),
  ])
  sceneRuleOptions.value = sceneRules
  smsTemplateOptions.value = smsTemplates
  mailTemplateOptions.value = mailTemplates
  notifyTemplateOptions.value = notifyTemplates
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
      await updateAlertConfig(formData.value)
      toast.success('修改成功')
    } else {
      await createAlertConfig(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('iot:alert-config:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await loadOptions()
  if (props.id) {
    await getDetail()
  }
})
</script>
