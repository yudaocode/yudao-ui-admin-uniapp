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
          <wd-form-item title="分类名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入分类名称" clearable />
          </wd-form-item>
          <ProductCategoryFormPicker v-model="formData.parentId" label="父级分类" prop="parentId" placeholder="请选择父级分类" include-root />
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
import type { ProductCategory } from '@/api/crm/product/category'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createProductCategory, getProductCategory, updateProductCategory } from '@/api/crm/product/category'
import { currRoute, delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import ProductCategoryFormPicker from '../components/product-category-form-picker.vue'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑产品分类' : '新增产品分类')
const formLoading = ref(false) // 表单提交状态
const formData = ref<ProductCategory>({ name: '', parentId: 0 }) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const formSchema = createFormSchema({
  name: [{ required: true, message: '分类名称不能为空' }],
  parentId: [{ required: true, message: '父级分类不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/product/category/index')
}

/** 应用页面预填参数 */
function applyQueryDefaults() {
  if (props.id) {
    return
  }
  const query = currRoute().query
  if (query.parentId !== undefined && query.parentId !== '') {
    formData.value.parentId = Number(query.parentId)
  }
}

/** 加载产品分类详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getProductCategory(Number(props.id))
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
      await updateProductCategory(formData.value)
      toast.success('修改成功')
    } else {
      await createProductCategory(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('crm:productCategory:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  applyQueryDefaults()
  getDetail()
})
</script>
