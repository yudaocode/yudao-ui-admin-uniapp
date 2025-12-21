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
            v-model="formData.clientId"
            label="客户端编号"
            label-width="220rpx"
            prop="clientId"
            clearable
            placeholder="请输入客户端编号"
          />
          <wd-input
            v-model="formData.secret"
            label="客户端密钥"
            label-width="220rpx"
            prop="secret"
            clearable
            placeholder="请输入客户端密钥"
          />
          <wd-input
            v-model="formData.name"
            label="应用名"
            label-width="220rpx"
            prop="name"
            clearable
            placeholder="请输入应用名"
          />
          <wd-textarea
            v-model="formData.description"
            label="应用描述"
            label-width="220rpx"
            prop="description"
            clearable
            placeholder="请输入应用描述"
          />
          <wd-cell title="状态" title-width="220rpx" prop="status" center>
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
          <wd-input
            v-model="formData.accessTokenValiditySeconds"
            label="访问令牌有效期"
            label-width="220rpx"
            prop="accessTokenValiditySeconds"
            type="number"
            clearable
            placeholder="请输入访问令牌有效期（秒）"
          />
          <wd-input
            v-model="formData.refreshTokenValiditySeconds"
            label="刷新令牌有效期"
            label-width="220rpx"
            prop="refreshTokenValiditySeconds"
            type="number"
            clearable
            placeholder="请输入刷新令牌有效期（秒）"
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
import type { OAuth2Client } from '@/api/system/oauth2/client'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createOAuth2Client, getOAuth2Client, updateOAuth2Client } from '@/api/system/oauth2/client'
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
const getTitle = computed(() => props.id ? '编辑应用' : '新增应用')
const formLoading = ref(false)
const formData = ref<OAuth2Client>({
  id: undefined,
  clientId: '',
  secret: '',
  name: '',
  logo: '',
  description: '',
  status: 0,
  accessTokenValiditySeconds: 1800,
  refreshTokenValiditySeconds: 43200,
  redirectUris: [],
  autoApprove: false,
  authorizedGrantTypes: [],
  scopes: [],
  authorities: [],
  resourceIds: [],
  additionalInformation: '',
})
const formRules = {
  clientId: [{ required: true, message: '客户端编号不能为空' }],
  secret: [{ required: true, message: '客户端密钥不能为空' }],
  name: [{ required: true, message: '应用名不能为空' }],
  accessTokenValiditySeconds: [{ required: true, message: '访问令牌有效期不能为空' }],
  refreshTokenValiditySeconds: [{ required: true, message: '刷新令牌有效期不能为空' }],
}
const formRef = ref()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/oauth2/index')
}

/** 加载应用详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getOAuth2Client(props.id)
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
      await updateOAuth2Client(formData.value)
      toast.success('修改成功')
    } else {
      await createOAuth2Client(formData.value)
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
