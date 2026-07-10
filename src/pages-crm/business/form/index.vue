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
          <wd-form-item title="商机名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入商机名称" clearable />
          </wd-form-item>
          <CustomerFormPicker
            v-model="formData.customerId"
            prop="customerId"
            :disabled="customerLocked"
          />
          <UserFormPicker v-model="formData.ownerUserId" label="负责人" prop="ownerUserId" placeholder="请选择负责人" :disabled="!!props.id" />
          <BusinessStatusTypeFormPicker
            v-model="formData.statusTypeId"
            prop="statusTypeId"
            :disabled="!!props.id"
            @change="handleStatusTypeChange"
          />
          <BusinessStatusFormPicker
            v-if="props.id"
            v-model="formData.statusId"
            prop="statusId"
            :status-type-id="formData.statusTypeId"
          />
          <wd-form-item title="预计成交日期" title-width="200rpx" prop="dealTime" is-link placeholder="请选择预计成交日期" :value="formatDate(formData.dealTime)" @click="pickerVisible.dealTime = true" />
          <wd-datetime-picker v-model="formData.dealTime" v-model:visible="pickerVisible.dealTime" title="请选择预计成交日期" type="date" />
          <wd-form-item title="整单折扣(%)" title-width="200rpx" prop="discountPercent">
            <wd-input-number v-model="formData.discountPercent" :min="0" :max="100" :precision="2" input-type="number" placeholder="请输入整单折扣(%)" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 产品清单 -->
      <CrmProductLines
        ref="productLinesRef"
        v-model="formData.products"
        price-prop="businessPrice"
        :discount-percent="Number(formData.discountPercent || 0)"
        @totals-change="(tp, t) => { formData.totalProductPrice = tp; formData.totalPrice = t }"
      />
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
import type { Business } from '@/api/crm/business'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createBusiness, getBusiness, updateBusiness } from '@/api/crm/business'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import CrmProductLines from '@/pages-crm/components/crm-product-lines.vue'
import CustomerFormPicker from '@/pages-crm/customer/components/customer-form-picker.vue'
import BusinessStatusFormPicker from '@/pages-crm/business/status/components/business-status-form-picker.vue'
import BusinessStatusTypeFormPicker from '@/pages-crm/business/status/components/business-status-type-form-picker.vue'
import { useUserStore } from '@/store/user'
import { currRoute, delay, navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const userStore = useUserStore()
const getTitle = computed(() => props.id ? '编辑商机' : '新增商机')
const formLoading = ref(false) // 表单提交状态
const customerLocked = ref(false) // 客户是否锁定（从客户/联系人详情带入时不可改，避免改客户产生跨客户关联）
const formData = ref<Business & Record<string, any>>({
  id: undefined,
  name: '',
  customerId: undefined,
  contactId: undefined,
  ownerUserId: undefined,
  statusTypeId: undefined,
  statusId: undefined,
  dealTime: undefined,
  discountPercent: 0,
  totalProductPrice: undefined,
  totalPrice: undefined,
  remark: '',
  products: [],
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const productLinesRef = ref<{ validate: (options?: { requireAtLeastOne?: boolean }) => string | null }>() // 产品清单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const formSchema = createFormSchema({
  name: [{ required: true, message: '商机名称不能为空' }],
  customerId: [{ required: true, message: '客户名称不能为空' }],
  ownerUserId: [{ required: true, message: '负责人不能为空' }],
  statusTypeId: [{ required: true, message: '商机状态组不能为空' }],
})

/** 商机状态组变化时清空商机阶段 */
function handleStatusTypeChange() {
  formData.value.statusId = undefined
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/business/index')
}

/** 应用页面预填参数 */
function applyQueryDefaults() {
  if (props.id) {
    return
  }
  const query = currRoute().query
  if (query.customerId) {
    formData.value.customerId = Number(query.customerId)
    customerLocked.value = true // 带入客户后锁定，避免改客户
  }
  // 从联系人详情「新增商机」进入时透传 contactId，提交时后端自动关联联系人；同时锁定客户避免跨客户关联
  if (query.contactId) {
    formData.value.contactId = Number(query.contactId)
    customerLocked.value = true
  }
}

/** 加载商机详情 */
async function getDetail() {
  if (!props.id) {
    // 新增时默认负责人为当前登录用户
    const userId = userStore.userInfo?.userId
    if (userId && userId !== -1) {
      formData.value.ownerUserId = userId
    }
    return
  }
  const data = await getBusiness(Number(props.id))
  formData.value = { ...data, products: Array.isArray(data.products) ? data.products : [] }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  const productError = productLinesRef.value?.validate({ requireAtLeastOne: true })
  if (productError) {
    toast.show(productError)
    return
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateBusiness(formData.value)
      toast.success('修改成功')
    } else {
      await createBusiness(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('crm:business:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  applyQueryDefaults()
  await getDetail()
})
</script>
