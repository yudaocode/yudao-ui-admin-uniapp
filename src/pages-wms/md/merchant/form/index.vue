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
          <wd-form-item title="企业编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-12rpx">
              <wd-input v-model="formData.code" class="flex-1" :maxlength="20" clearable placeholder="请输入企业编号" />
              <wd-button size="small" @click="formData.code = generateWmsCode('M')">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="企业名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" :maxlength="60" clearable placeholder="请输入企业名称" />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.type"
            label="企业类型"
            label-width="200rpx"
            prop="type"
            :dict-type="DICT_TYPE.WMS_MERCHANT_TYPE"
            placeholder="请选择企业类型"
          />
          <wd-form-item title="级别" title-width="200rpx">
            <wd-input v-model="formData.level" :maxlength="10" clearable placeholder="请输入级别" />
          </wd-form-item>
          <wd-form-item title="联系人" title-width="200rpx">
            <wd-input v-model="formData.contact" :maxlength="30" clearable placeholder="请输入联系人" />
          </wd-form-item>
          <wd-form-item title="手机号" title-width="200rpx" prop="mobile">
            <wd-input v-model="formData.mobile" :maxlength="13" clearable placeholder="请输入手机号" />
          </wd-form-item>
          <wd-form-item title="座机号" title-width="200rpx">
            <wd-input v-model="formData.telephone" :maxlength="13" clearable placeholder="请输入座机号" />
          </wd-form-item>
          <wd-form-item title="Email" title-width="200rpx" prop="email">
            <wd-input v-model="formData.email" :maxlength="50" clearable placeholder="请输入 Email" />
          </wd-form-item>
          <wd-form-item title="开户行" title-width="200rpx">
            <wd-input v-model="formData.bankName" :maxlength="255" clearable placeholder="请输入开户行" />
          </wd-form-item>
          <wd-form-item title="银行账户" title-width="200rpx">
            <wd-input v-model="formData.bankAccount" :maxlength="40" clearable placeholder="请输入银行账户" />
          </wd-form-item>
          <wd-form-item title="地址" title-width="200rpx">
            <wd-textarea v-model="formData.address" placeholder="请输入地址" :maxlength="200" clearable />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="255"
              show-word-limit
              clearable
            />
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
import type { Merchant } from '@/api/wms/md/merchant'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createMerchant, getMerchant, updateMerchant } from '@/api/wms/md/merchant'
import { generateWmsCode } from '@/pages-wms/utils/order'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const getTitle = computed(() => props.id ? '编辑往来企业' : '新增往来企业')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Merchant>({
  id: undefined,
  code: undefined,
  name: undefined,
  type: undefined,
  level: undefined,
  bankName: undefined,
  bankAccount: undefined,
  address: undefined,
  mobile: undefined,
  telephone: undefined,
  contact: undefined,
  email: undefined,
  remark: undefined,
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '企业编号不能为空' }],
  name: [{ required: true, message: '企业名称不能为空' }],
  type: [{ required: true, message: '企业类型不能为空' }],
  mobile: [{ type: 'mobile', message: '请输入正确的手机号码' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-wms/md/merchant/index')
}

/** 加载往来企业详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMerchant(Number(props.id))
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
      await updateMerchant(formData.value)
      toast.success('修改成功')
    } else {
      await createMerchant(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('wms:merchant:reload')
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
