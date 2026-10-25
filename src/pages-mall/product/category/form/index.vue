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
          <yd-form-picker
            v-model="formData.parentId"
            label="上级分类"
            label-width="220rpx"
            prop="parentId"
            :columns="parentOptions"
            label-key="name"
            value-key="id"
          />
          <wd-form-item title="分类名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入分类名称" />
          </wd-form-item>
          <wd-form-item title="分类图片" title-width="220rpx" prop="picUrl">
            <yd-upload-img v-model="formData.picUrl" />
          </wd-form-item>
          <wd-form-item title="分类排序" title-width="220rpx" prop="sort">
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <wd-form-item title="开启状态" title-width="220rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

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
import type { ProductCategory } from '@/api/mall/product/category'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createProductCategory, getProductCategory, getProductCategoryList, updateProductCategory } from '@/api/mall/product/category'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
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
const getTitle = computed(() => props.id ? '编辑分类' : '新增分类')
const formLoading = ref(false) // 表单提交状态
const parentOptions = ref<{ id?: number, name: string }[]>([]) // 上级分类选项（顶级分类 + 一级分类）
const formData = ref<ProductCategory>({
  id: undefined,
  parentId: 0,
  name: '',
  picUrl: '',
  sort: 0,
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  parentId: [{ required: true, message: '上级分类不能为空' }],
  name: [{ required: true, message: '分类名称不能为空' }],
  picUrl: [{ required: true, message: '分类图片不能为空' }],
  sort: [{ required: true, message: '分类排序不能为空' }],
  status: [{ required: true, message: '开启状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/product/category/index')
}

/** 加载上级分类选项：顶级分类 + 一级分类 */
async function loadOptions() {
  const list = await getProductCategoryList({ parentId: 0 })
  parentOptions.value = [{ id: 0, name: '顶级分类' }, ...list]
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getProductCategory(props.id)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (props.id) {
      await updateProductCategory(data)
      toast.success('修改成功')
    } else {
      await createProductCategory(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:product-category:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
