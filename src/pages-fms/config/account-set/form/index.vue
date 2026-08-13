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
        <wd-cell-group title="基本信息" border>
          <wd-form-item title="公司编码" title-width="200rpx" prop="companyCode">
            <wd-input v-model="formData.companyCode" clearable placeholder="请输入公司编码" :maxlength="64" />
          </wd-form-item>
          <wd-form-item title="公司名称" title-width="200rpx" prop="companyName">
            <wd-input v-model="formData.companyName" clearable placeholder="请输入公司名称" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="公司简介" title-width="200rpx" prop="companyProfile">
            <wd-textarea
              v-model="formData.companyProfile"
              clearable
              placeholder="请输入公司简介"
              :maxlength="500"
              show-word-limit
            />
          </wd-form-item>
          <wd-form-item title="所在行业" title-width="200rpx" prop="industry">
            <wd-input v-model="formData.industry" clearable placeholder="请输入所在行业" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="所在地" title-width="200rpx" prop="location">
            <wd-input v-model="formData.location" clearable placeholder="请输入所在地" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="法人代表" title-width="200rpx" prop="legalRepresentative">
            <wd-input
              v-model="formData.legalRepresentative"
              clearable
              placeholder="请输入法人代表"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item title="法人身份证号" title-width="200rpx" prop="legalRepresentativeIdNumber">
            <wd-input
              v-model="formData.legalRepresentativeIdNumber"
              clearable
              placeholder="请输入法人身份证号"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item title="营业执照号" title-width="200rpx" prop="businessLicenseNumber">
            <wd-input
              v-model="formData.businessLicenseNumber"
              clearable
              placeholder="请输入营业执照号"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item title="组织机构代码" title-width="200rpx" prop="organizationCode">
            <wd-input
              v-model="formData.organizationCode"
              clearable
              placeholder="请输入组织机构代码"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="请输入备注"
              :maxlength="500"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>

        <wd-cell-group title="联系方式" border>
          <wd-form-item title="联系人" title-width="200rpx" prop="contactName">
            <wd-input v-model="formData.contactName" clearable placeholder="请输入联系人" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="办公电话" title-width="200rpx" prop="officeTelephone">
            <wd-input v-model="formData.officeTelephone" clearable placeholder="请输入办公电话" :maxlength="32" />
          </wd-form-item>
          <wd-form-item title="手机号码" title-width="200rpx" prop="mobile">
            <wd-input v-model="formData.mobile" clearable placeholder="请输入手机号码" :maxlength="32" />
          </wd-form-item>
          <wd-form-item title="传真号码" title-width="200rpx" prop="faxNumber">
            <wd-input v-model="formData.faxNumber" clearable placeholder="请输入传真号码" :maxlength="32" />
          </wd-form-item>
          <wd-form-item title="QQ 号码" title-width="200rpx" prop="qqNumber">
            <wd-input v-model="formData.qqNumber" clearable placeholder="请输入 QQ 号码" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="邮箱" title-width="200rpx" prop="email">
            <wd-input v-model="formData.email" clearable placeholder="请输入邮箱" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="其他" title-width="200rpx" prop="otherContact">
            <wd-input v-model="formData.otherContact" clearable placeholder="请输入其他联系方式" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="详细地址" title-width="200rpx" prop="address">
            <wd-input v-model="formData.address" clearable placeholder="请输入详细地址" :maxlength="255" />
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
import type { AccountSet } from '@/api/fms/config/account-set'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createAccountSet,
  getAccountSet,
  updateAccountSet,
} from '@/api/fms/config/account-set'
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
const getTitle = computed(() => props.id ? '编辑账套' : '新增账套')
const formLoading = ref(false) // 表单提交状态
const formData = ref<AccountSet>({ // 表单数据
  id: undefined,
  companyCode: '',
  companyName: '',
  companyProfile: '',
  industry: '',
  location: '',
  legalRepresentative: '',
  legalRepresentativeIdNumber: '',
  businessLicenseNumber: '',
  organizationCode: '',
  remark: '',
  contactName: '',
  officeTelephone: '',
  mobile: '',
  faxNumber: '',
  qqNumber: '',
  email: '',
  otherContact: '',
  address: '',
})
const formSchema = createFormSchema({
  companyCode: [{ required: true, message: '公司编码不能为空' }],
  companyName: [{ required: true, message: '公司名称不能为空' }],
  email: [{ type: 'email', message: '邮箱格式不正确' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/account-set/index')
}

/** 加载账套详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getAccountSet(Number(props.id))
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
      await updateAccountSet(formData.value)
      toast.success('修改成功')
    } else {
      await createAccountSet(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('fms:config:account-set:reload')
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
