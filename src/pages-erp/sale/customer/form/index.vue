<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入名称" clearable />
          </wd-form-item>
          <wd-form-item title="联系人" title-width="220rpx" prop="contact">
            <wd-input v-model="formData.contact" placeholder="请输入联系人" clearable />
          </wd-form-item>
          <wd-form-item title="手机号码" title-width="220rpx" prop="mobile">
            <wd-input v-model="formData.mobile" placeholder="请输入手机号码" clearable />
          </wd-form-item>
          <wd-form-item title="联系电话" title-width="220rpx" prop="telephone">
            <wd-input v-model="formData.telephone" placeholder="请输入联系电话" clearable />
          </wd-form-item>
          <wd-form-item title="电子邮箱" title-width="220rpx" prop="email">
            <wd-input v-model="formData.email" placeholder="请输入电子邮箱" clearable />
          </wd-form-item>
          <wd-form-item title="传真" title-width="220rpx" prop="fax">
            <wd-input v-model="formData.fax" placeholder="请输入传真" clearable />
          </wd-form-item>
          <wd-form-item title="开启状态" title-width="220rpx" prop="status" center>
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
            />
          </wd-form-item>
          <wd-form-item title="排序" title-width="220rpx" prop="sort" center>
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <wd-form-item title="纳税人识别号" title-width="220rpx" prop="taxNo">
            <wd-input v-model="formData.taxNo" placeholder="请输入纳税人识别号" clearable />
          </wd-form-item>
          <wd-form-item title="税率(%)" title-width="220rpx" prop="taxPercent" center>
            <wd-input-number :model-value="formData.taxPercent ?? ''" allow-null :min="0" :precision="2" @update:model-value="value => formData.taxPercent = toOptionalNumber(value)" />
          </wd-form-item>
          <wd-form-item title="开户行" title-width="220rpx" prop="bankName">
            <wd-input v-model="formData.bankName" placeholder="请输入开户行" clearable />
          </wd-form-item>
          <wd-form-item title="开户账号" title-width="220rpx" prop="bankAccount">
            <wd-input v-model="formData.bankAccount" placeholder="请输入开户账号" clearable />
          </wd-form-item>
          <wd-form-item title="开户地址" title-width="220rpx" prop="bankAddress">
            <wd-input v-model="formData.bankAddress" placeholder="请输入开户地址" clearable />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

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
import type { Customer } from '@/api/erp/sale/customer'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createCustomer, getCustomer, updateCustomer } from '@/api/erp/sale/customer'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'
import { toOptionalNumber } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑客户' : '新增客户')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Customer>({
  id: undefined,
  name: '',
  contact: '',
  mobile: '',
  telephone: '',
  email: '',
  fax: '',
  remark: '',
  status: CommonStatusEnum.ENABLE,
  sort: 0,
  taxNo: '',
  taxPercent: undefined,
  bankName: '',
  bankAccount: '',
  bankAddress: '',
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const formSchema = createFormSchema({
  name: [{ required: true, message: '名称不能为空' }],
  status: [{ required: true, message: '开启状态不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
  mobile: [{ type: 'mobile', message: '请输入正确的手机号码' }],
  email: [{ type: 'email', message: '请输入正确的电子邮箱' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/sale/customer/index')
}

/** 加载客户详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getCustomer(props.id)
  } finally {
    toast.close()
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
      await updateCustomer(formData.value)
      toast.success('修改成功')
    } else {
      await createCustomer(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:customer:reload')
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
