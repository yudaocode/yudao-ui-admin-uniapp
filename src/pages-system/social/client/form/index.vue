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
            v-model="formData.name"
            label="应用名"
            label-width="200rpx"
            prop="name"
            clearable
            placeholder="请输入应用名"
          />
          <wd-cell title="社交平台" title-width="200rpx" prop="socialType" center>
            <wd-picker
              v-model="formData.socialType"
              :columns="getIntDictOptions(DICT_TYPE.SYSTEM_SOCIAL_TYPE)"
              label-key="label"
              value-key="value"
              placeholder="请选择社交平台"
            />
          </wd-cell>
          <wd-cell title="用户类型" title-width="200rpx" prop="userType" center>
            <wd-radio-group v-model="formData.userType" shape="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.USER_TYPE)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <wd-input
            v-model="formData.clientId"
            label="客户端编号"
            label-width="200rpx"
            prop="clientId"
            clearable
            placeholder="请输入客户端编号，对应各平台的 appKey"
          />
          <wd-input
            v-model="formData.clientSecret"
            label="客户端密钥"
            label-width="200rpx"
            prop="clientSecret"
            clearable
            placeholder="请输入客户端密钥，对应各平台的 appSecret"
          />
          <wd-input
            v-model="formData.agentId"
            label="agentId"
            label-width="200rpx"
            prop="agentId"
            clearable
            placeholder="授权方的网页应用 ID，有则填"
          />
          <wd-cell title="状态" title-width="200rpx" prop="status" center>
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
import type { SocialClient } from '@/api/system/social/client'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createSocialClient, getSocialClient, updateSocialClient } from '@/api/system/social/client'
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
const getTitle = computed(() => props.id ? '编辑社交客户端' : '新增社交客户端')
const formLoading = ref(false)
const formData = ref<SocialClient>({
  id: undefined,
  name: '',
  socialType: 0,
  userType: 1,
  clientId: '',
  clientSecret: '',
  agentId: '',
  status: 0,
})
const formRules = {
  name: [{ required: true, message: '应用名不能为空' }],
  socialType: [{ required: true, message: '社交平台不能为空' }],
  userType: [{ required: true, message: '用户类型不能为空' }],
  clientId: [{ required: true, message: '客户端编号不能为空' }],
  clientSecret: [{ required: true, message: '客户端密钥不能为空' }],
}
const formRef = ref()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/social/index')
}

/** 加载社交客户端详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getSocialClient(props.id)
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
      await updateSocialClient(formData.value)
      toast.success('修改成功')
    } else {
      await createSocialClient(formData.value)
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
