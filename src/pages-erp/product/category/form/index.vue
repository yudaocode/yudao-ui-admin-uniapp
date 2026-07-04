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
          <yd-tree-select
            v-model="formData.parentId"
            :data="categoryTree"
            label="父级分类"
            prop="parentId"
            label-width="220rpx"
            placeholder="请选择父级分类"
          />
          <wd-form-item title="分类名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入分类名称" clearable />
          </wd-form-item>
          <wd-form-item title="分类编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入分类编码" clearable />
          </wd-form-item>
          <wd-form-item title="排序" title-width="220rpx" prop="sort" center>
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <wd-form-item title="状态" title-width="220rpx" prop="status" center>
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
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
import type { ProductCategory } from '@/api/erp/product/category'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createProductCategory, getProductCategory, getProductCategoryList, updateProductCategory } from '@/api/erp/product/category'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'
import { handleTree } from '@/utils/tree'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number, parentId?: number }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑产品分类' : '新增产品分类')
const formLoading = ref(false) // 表单提交状态

/** 创建默认表单数据 */
function createDefaultFormData(): ProductCategory {
  return {
    id: undefined,
    parentId: 0,
    name: '',
    code: '',
    sort: 0,
    status: CommonStatusEnum.ENABLE,
  }
}

const formData = ref<ProductCategory>(createDefaultFormData()) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const categoryTree = ref<ProductCategory[]>([]) // 产品分类树
const formSchema = createFormSchema({
  parentId: [{ required: true, message: '父级分类不能为空' }],
  name: [{ required: true, message: '分类名称不能为空' }],
  code: [{ required: true, message: '分类编码不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})

/** 重置表单数据 */
function resetFormData() {
  formData.value = createDefaultFormData()
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/product/category/index')
}

/** 加载分类树 */
async function loadCategoryTree() {
  const categoryList = await getProductCategoryList()
  categoryTree.value = [
    {
      id: 0,
      name: '顶级产品分类',
      children: handleTree(categoryList || []),
    },
  ]
}

/** 应用页面预填参数 */
function applyQueryDefaults() {
  if (props.id) {
    return
  }
  if (props.parentId !== undefined) {
    formData.value.parentId = props.parentId
  }
}

/** 加载产品分类详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getProductCategory(props.id)
  } finally {
    toast.close()
  }
}

/** 加载当前页面数据 */
async function loadPageData() {
  resetFormData()
  applyQueryDefaults()
  await getDetail()
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
    uni.$emit('erp:product-category:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await loadCategoryTree()
  await loadPageData()
})
</script>
