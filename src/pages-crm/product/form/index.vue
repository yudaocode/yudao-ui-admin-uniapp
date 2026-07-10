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
          <wd-form-item title="产品名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入产品名称" clearable />
          </wd-form-item>
          <wd-form-item title="产品编码" title-width="200rpx" prop="no">
            <wd-input v-model="formData.no" placeholder="请输入产品编码" clearable />
          </wd-form-item>
          <UserFormPicker v-model="formData.ownerUserId" label="负责人" prop="ownerUserId" placeholder="请选择负责人" :disabled="!!props.id" />
          <ProductCategoryFormPicker v-model="formData.categoryId" prop="categoryId" />
          <yd-form-picker v-model="formData.unit" label="产品单位" prop="unit" :dict-type="DICT_TYPE.CRM_PRODUCT_UNIT" placeholder="请选择产品单位" />
          <wd-form-item title="价格" title-width="200rpx" prop="price">
            <wd-input-number v-model="formData.price" :min="0" :precision="2" input-type="number" allow-null placeholder="请输入价格" />
          </wd-form-item>
          <yd-form-picker v-model="formData.status" label="上架状态" prop="status" :dict-type="DICT_TYPE.CRM_PRODUCT_STATUS" placeholder="请选择上架状态" />
          <wd-form-item title="产品描述" title-width="200rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入产品描述" :maxlength="200" show-word-limit clearable />
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
import type { Product } from '@/api/crm/product'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createProduct, getProduct, updateProduct } from '@/api/crm/product'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { useUserStore } from '@/store/user'
import { currRoute, delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import ProductCategoryFormPicker from '@/pages-crm/product/category/components/product-category-form-picker.vue'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const userStore = useUserStore()
const getTitle = computed(() => props.id ? '编辑产品' : '新增产品')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Product>({
  id: undefined,
  name: '',
  no: '',
  ownerUserId: undefined,
  categoryId: undefined,
  unit: undefined,
  price: undefined,
  status: undefined,
  description: '',
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const formSchema = createFormSchema({
  name: [{ required: true, message: '产品名称不能为空' }],
  no: [{ required: true, message: '产品编码不能为空' }],
  ownerUserId: [{ required: true, message: '负责人不能为空' }],
  categoryId: [{ required: true, message: '产品分类不能为空' }],
  price: [{ required: true, message: '价格不能为空' }],
  status: [{ required: true, message: '上架状态不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/product/index')
}

/** 应用页面预填参数 */
function applyQueryDefaults() {
  if (props.id) {
    return
  }
  const query = currRoute().query
  const numericProps = ['categoryId', 'unit', 'price', 'status', 'ownerUserId']
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return
    }
    ;(formData.value as Record<string, any>)[key] = numericProps.includes(key) ? Number(value) : value
  })
}

/** 加载产品详情 */
async function getDetail() {
  if (!props.id) {
    // 新增时默认负责人为当前登录用户
    const userId = userStore.userInfo?.userId
    if (userId && userId !== -1 && !formData.value.ownerUserId) {
      formData.value.ownerUserId = userId
    }
    return
  }
  formData.value = await getProduct(Number(props.id))
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
      await updateProduct(formData.value)
      toast.success('修改成功')
    } else {
      await createProduct(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('crm:product:reload')
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
