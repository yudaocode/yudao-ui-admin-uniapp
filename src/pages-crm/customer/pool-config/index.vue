<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="客户公海规则"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="公海规则" title-width="220rpx" prop="enabled" center>
            <wd-switch v-model="formData.enabled" @change="handleEnabledChange" />
          </wd-form-item>
          <template v-if="formData.enabled">
            <wd-form-item title="不跟进天数" title-width="220rpx" prop="contactExpireDays">
              <wd-input-number v-model="formData.contactExpireDays" :min="0" :precision="0" />
            </wd-form-item>
            <wd-form-item title="未成交天数" title-width="220rpx" prop="dealExpireDays">
              <wd-input-number v-model="formData.dealExpireDays" :min="0" :precision="0" />
            </wd-form-item>
            <wd-form-item title="提前提醒" title-width="220rpx" prop="notifyEnabled" center>
              <wd-switch v-model="formData.notifyEnabled" @change="handleNotifyChange" />
            </wd-form-item>
            <wd-form-item
              v-if="formData.notifyEnabled"
              title="提醒天数"
              title-width="220rpx"
              prop="notifyDays"
            >
              <wd-input-number v-model="formData.notifyDays" :min="0" :precision="0" />
            </wd-form-item>
          </template>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view v-if="hasAccessByCodes(['crm:customer-pool-config:update'])" class="yd-detail-footer">
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
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { CustomerPoolConfig } from '@/api/crm/customer/poolConfig'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getCustomerPoolConfig, saveCustomerPoolConfig } from '@/api/crm/customer/poolConfig'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { hasAccessByCodes } = useAccess()
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<CustomerPoolConfig>({
  enabled: false,
  notifyEnabled: false,
}) // 表单数据
const formSchema = createFormSchema({
  enabled: [{ required: true, message: '请选择是否启用公海规则' }],
  contactExpireDays: [{ required: model => !!model?.enabled, message: '不跟进天数不能为空' }, { validator: value => value === undefined || value === null || value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0), message: '天数必须为非负整数' }],
  dealExpireDays: [{ required: model => !!model?.enabled, message: '未成交天数不能为空' }, { validator: value => value === undefined || value === null || value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0), message: '天数必须为非负整数' }],
  notifyDays: [{ required: model => !!model?.enabled && !!model?.notifyEnabled, message: '提前提醒天数不能为空' }, { validator: value => value === undefined || value === null || value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0), message: '天数必须为非负整数' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 切换公海规则 */
function handleEnabledChange() {
  if (!formData.value.enabled) {
    formData.value.contactExpireDays = undefined
    formData.value.dealExpireDays = undefined
    formData.value.notifyEnabled = false
    formData.value.notifyDays = undefined
  }
}

/** 切换提前提醒 */
function handleNotifyChange() {
  if (!formData.value.notifyEnabled) {
    formData.value.notifyDays = undefined
  }
}

/** 加载配置 */
async function getConfig() {
  formLoading.value = true
  try {
    const data = await getCustomerPoolConfig()
    if (data) {
      formData.value = {
        enabled: false,
        notifyEnabled: false,
        ...data,
      }
    }
  } finally {
    formLoading.value = false
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
    await saveCustomerPoolConfig({ ...formData.value })
    toast.success('保存成功')
    await getConfig()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getConfig()
})
</script>
