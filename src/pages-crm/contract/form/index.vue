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
          <wd-form-item v-if="props.id" title="合同编号" title-width="200rpx" prop="no" :value="formData.no || '-'" />
          <wd-form-item title="合同名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入合同名称" clearable />
          </wd-form-item>
          <CustomerFormPicker
            v-model="formData.customerId"
            prop="customerId"
            @change="handleCustomerChange"
          />
          <BusinessFormPicker
            v-model="formData.businessId"
            prop="businessId"
            :customer-id="formData.customerId"
            @change="handleBusinessChange"
          />
          <UserFormPicker v-model="formData.ownerUserId" label="负责人" prop="ownerUserId" placeholder="请选择负责人" :disabled="!!props.id" />
          <wd-form-item title="下单日期" title-width="200rpx" prop="orderDate" is-link placeholder="请选择下单日期" :value="formatDate(formData.orderDate)" @click="pickerVisible.orderDate = true" />
          <wd-datetime-picker v-model="formData.orderDate" v-model:visible="pickerVisible.orderDate" title="请选择下单日期" type="date" />
          <wd-form-item title="开始时间" title-width="200rpx" prop="startTime" is-link placeholder="请选择开始时间" :value="formatDate(formData.startTime)" @click="pickerVisible.startTime = true" />
          <wd-datetime-picker v-model="formData.startTime" v-model:visible="pickerVisible.startTime" title="请选择开始时间" type="date" />
          <wd-form-item title="结束时间" title-width="200rpx" prop="endTime" is-link placeholder="请选择结束时间" :value="formatDate(formData.endTime)" @click="pickerVisible.endTime = true" />
          <wd-datetime-picker v-model="formData.endTime" v-model:visible="pickerVisible.endTime" title="请选择结束时间" type="date" />
          <UserFormPicker v-model="formData.signUserId" label="公司签约人" prop="signUserId" placeholder="请选择公司签约人" />
          <ContactFormPicker
            v-model="formData.signContactId"
            label="客户签约人"
            prop="signContactId"
            placeholder="请选择客户签约人"
            :customer-id="formData.customerId"
          />
          <wd-form-item title="整单折扣(%)" title-width="200rpx" prop="discountPercent">
            <wd-input-number v-model="formData.discountPercent" :min="0" :max="100" :precision="2" input-type="number" placeholder="请输入整单折扣(%)" />
          </wd-form-item>
          <wd-form-item title="折扣后金额" title-width="200rpx" prop="totalPrice" :value="formatMoney(formData.totalPrice)" />
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 产品清单 -->
      <CrmProductLines
        ref="productLinesRef"
        v-model="formData.products"
        price-prop="contractPrice"
        :discount-percent="Number(formData.discountPercent || 0)"
        @totals-change="handleProductTotalsChange"
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
import type { Contract } from '@/api/crm/contract'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getBusiness } from '@/api/crm/business'
import { createContract, getContract, updateContract } from '@/api/crm/contract'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { useUserStore } from '@/store/user'
import { currRoute, delay, navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { formatMoney } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'
import BusinessFormPicker from '@/pages-crm/business/components/business-form-picker.vue'
import CrmProductLines from '@/pages-crm/components/crm-product-lines.vue'
import ContactFormPicker from '@/pages-crm/contact/components/contact-form-picker.vue'
import CustomerFormPicker from '@/pages-crm/customer/components/customer-form-picker.vue'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const userStore = useUserStore()
const getTitle = computed(() => props.id ? '编辑合同' : '新增合同')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Contract>({
  id: undefined,
  name: '',
  no: '',
  customerId: undefined,
  businessId: undefined,
  businessName: '',
  ownerUserId: undefined,
  orderDate: undefined,
  startTime: undefined,
  endTime: undefined,
  signUserId: undefined,
  signContactId: undefined,
  totalProductPrice: undefined,
  totalPrice: undefined,
  discountPercent: 0,
  remark: '',
  products: [],
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const productLinesRef = ref<{ validate: (options?: { requireAtLeastOne?: boolean }) => string | null }>() // 产品清单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const formSchema = createFormSchema({
  name: [{ required: true, message: '合同名称不能为空' }],
  customerId: [{ required: true, message: '客户名称不能为空' }],
  ownerUserId: [{ required: true, message: '负责人不能为空' }],
  orderDate: [{ required: true, message: '下单日期不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/contract/index')
}

/** 客户变更后清空商机、客户签约人 */
function handleCustomerChange() {
  formData.value.businessId = undefined
  formData.value.signContactId = undefined
}

/** 商机变更后回填产品清单（商机产品的「商机价」即合同的「合同价」） */
async function handleBusinessChange(business?: Business) {
  if (!business?.id) {
    return
  }
  const detail = await getBusiness(business.id)
  formData.value.businessName = detail.name
  const products = Array.isArray(detail.products) ? detail.products : []
  formData.value.products = products.map((item: Record<string, any>) => ({ ...item, id: undefined, contractPrice: item.businessPrice }))
}

/** 产品清单金额变化 */
function handleProductTotalsChange(totalProductPrice: number, totalPrice: number) {
  formData.value.totalProductPrice = totalProductPrice
  formData.value.totalPrice = totalPrice
}

/** 应用页面预填参数 */
function applyQueryDefaults() {
  if (props.id) {
    return
  }
  const query = currRoute().query
  if (query.customerId) {
    formData.value.customerId = Number(query.customerId)
  }
  if (query.businessId) {
    formData.value.businessId = Number(query.businessId)
  }
}

/** 加载合同详情 */
async function getDetail() {
  if (!props.id) {
    // 新增时默认负责人为当前登录用户
    const userId = userStore.userInfo?.userId
    if (userId && userId !== -1) {
      formData.value.ownerUserId = userId
    }
    return
  }
  const data = await getContract(Number(props.id))
  formData.value = { ...formData.value, ...data }
  if (!Array.isArray(formData.value.products)) {
    formData.value.products = []
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  const productError = productLinesRef.value?.validate()
  if (productError) {
    toast.show(productError)
    return
  }
  // 整单折扣可被清空（clearable），提交前兜底为 0，避免空值触发后端 @NotNull 校验
  formData.value.discountPercent = Number(formData.value.discountPercent) || 0
  formLoading.value = true
  try {
    if (props.id) {
      await updateContract(formData.value)
      toast.success('修改成功')
    } else {
      await createContract(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('crm:contract:reload')
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
