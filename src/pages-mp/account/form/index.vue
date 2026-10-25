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
          <wd-form-item title="名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入名称" />
          </wd-form-item>
          <wd-form-item title="微信号" title-width="220rpx" prop="account">
            <wd-input v-model="formData.account" clearable placeholder="请输入微信号" />
          </wd-form-item>
          <wd-form-item title="AppID" title-width="220rpx" prop="appId">
            <wd-input v-model="formData.appId" clearable placeholder="请输入公众号 AppID" />
          </wd-form-item>
          <wd-form-item title="AppSecret" title-width="220rpx" prop="appSecret">
            <wd-input v-model="formData.appSecret" clearable placeholder="请输入公众号 AppSecret" />
          </wd-form-item>
          <wd-form-item title="Token" title-width="220rpx" prop="token">
            <wd-input v-model="formData.token" clearable placeholder="请输入公众号 Token" />
          </wd-form-item>
          <wd-form-item title="加解密密钥" title-width="220rpx" prop="aesKey">
            <wd-input v-model="formData.aesKey" clearable placeholder="请输入消息加解密密钥" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" clearable placeholder="请输入备注" />
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
import type { Account } from '@/api/mp/account'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createAccount, getAccount, updateAccount } from '@/api/mp/account'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

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
const getTitle = computed(() => props.id ? '编辑公众号账号' : '新增公众号账号')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Account>({
  id: undefined,
  name: '',
  account: '',
  appId: '',
  appSecret: '',
  token: '',
  aesKey: '',
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '名称不能为空' }],
  account: [{ required: true, message: '微信号不能为空' }],
  appId: [{ required: true, message: '公众号 AppID 不能为空' }],
  appSecret: [{ required: true, message: '公众号 AppSecret 不能为空' }],
  token: [{ required: true, message: '公众号 Token 不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/account/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    formData.value = await getAccount(props.id)
  } catch {
    // 请求层已提示错误，保留默认表单
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
      await updateAccount({ ...formData.value, id: props.id })
      toast.success('修改成功')
    } else {
      await createAccount(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mp:account:reload')
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
