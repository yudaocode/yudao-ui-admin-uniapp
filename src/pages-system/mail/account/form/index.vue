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
          <wd-input
            v-model="formData.mail"
            label="邮箱"
            label-width="220rpx"
            prop="mail"
            clearable
            placeholder="请输入邮箱"
          />
          <wd-input
            v-model="formData.username"
            label="用户名"
            label-width="220rpx"
            prop="username"
            clearable
            placeholder="请输入用户名"
          />
          <wd-input
            v-model="formData.password"
            label="密码"
            label-width="220rpx"
            prop="password"
            clearable
            placeholder="请输入密码"
            show-password
          />
          <wd-input
            v-model="formData.host"
            label="SMTP 服务器域名"
            label-width="220rpx"
            prop="host"
            clearable
            placeholder="请输入 SMTP 服务器域名"
          />
          <wd-cell title="SMTP 服务器端口" title-width="220rpx" prop="port" center>
            <wd-input-number v-model="formData.port" :min="0" :max="65535" />
          </wd-cell>
          <wd-cell title="是否开启 SSL" title-width="220rpx" prop="sslEnable" center>
            <wd-radio-group v-model="formData.sslEnable" shape="button">
              <wd-radio
                v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
                :key="String(dict.value)"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <wd-cell title="是否开启 STARTTLS" title-width="220rpx" prop="starttlsEnable" center>
            <wd-radio-group v-model="formData.starttlsEnable" shape="button">
              <wd-radio
                v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
                :key="String(dict.value)"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <!-- TODO @芋艿： -->
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
import type { MailAccount } from '@/api/system/mail/account'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createMailAccount, getMailAccount, updateMailAccount } from '@/api/system/mail/account'
import { getBoolDictOptions } from '@/hooks/useDict'
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
const getTitle = computed(() => props.id ? '编辑邮箱账号' : '新增邮箱账号')
const formLoading = ref(false)
const formData = ref<MailAccount>({
  id: undefined,
  mail: '',
  username: '',
  password: '',
  host: '',
  port: 25,
  sslEnable: true,
  starttlsEnable: false,
})
const formRules = {
  mail: [{ required: true, message: '邮箱不能为空' }],
  username: [{ required: true, message: '用户名不能为空' }],
  password: [{ required: true, message: '密码不能为空' }],
  host: [{ required: true, message: 'SMTP 服务器域名不能为空' }],
  port: [{ required: true, message: 'SMTP 服务器端口不能为空' }],
  sslEnable: [{ required: true, message: '是否开启 SSL 不能为空' }],
  starttlsEnable: [{ required: true, message: '是否开启 STARTTLS 不能为空' }],
}
const formRef = ref()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/mail/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMailAccount(props.id)
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
      await updateMailAccount(formData.value)
      toast.success('修改成功')
    } else {
      await createMailAccount(formData.value)
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
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
