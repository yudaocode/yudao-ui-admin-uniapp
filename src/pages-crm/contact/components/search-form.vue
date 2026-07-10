<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          联系人姓名
        </view>
        <wd-input v-model="formData.name" placeholder="请输入联系人姓名" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          手机
        </view>
        <wd-input v-model="formData.mobile" placeholder="请输入手机" clearable />
      </view>
      <CustomerSearchPicker ref="customerPickerRef" v-model="formData.customerId" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          电话
        </view>
        <wd-input v-model="formData.telephone" placeholder="请输入电话" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          邮箱
        </view>
        <wd-input v-model="formData.email" placeholder="请输入邮箱" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          微信
        </view>
        <wd-input v-model="formData.wechat" placeholder="请输入微信" clearable />
      </view>
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import CustomerSearchPicker from '@/pages-crm/customer/components/customer-search-picker.vue'

const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Record<string, any>>({
  name: undefined,
  mobile: undefined,
  customerId: undefined,
  telephone: undefined,
  email: undefined,
  wechat: undefined,
}) // 搜索表单数据
const customerPickerRef = ref<InstanceType<typeof CustomerSearchPicker>>() // 客户选择器
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`姓名:${formData.name}`)
  }
  if (formData.mobile) {
    conditions.push(`手机:${formData.mobile}`)
  }
  if (formData.customerId) {
    conditions.push(`客户:${customerPickerRef.value?.format(formData.customerId) || formData.customerId}`)
  }
  if (formData.telephone) {
    conditions.push(`电话:${formData.telephone}`)
  }
  if (formData.email) {
    conditions.push(`邮箱:${formData.email}`)
  }
  if (formData.wechat) {
    conditions.push(`微信:${formData.wechat}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索联系人'
}) // 搜索框占位：回显已选条件

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name,
    mobile: formData.mobile,
    customerId: formData.customerId,
    telephone: formData.telephone,
    email: formData.email,
    wechat: formData.wechat,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.mobile = undefined
  formData.customerId = undefined
  formData.telephone = undefined
  formData.email = undefined
  formData.wechat = undefined
  visible.value = false
  emit('reset')
}
</script>
