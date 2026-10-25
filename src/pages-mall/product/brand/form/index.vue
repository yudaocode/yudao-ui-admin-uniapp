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
          <wd-form-item title="品牌名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入品牌名称" />
          </wd-form-item>
          <wd-form-item title="品牌图片" title-width="220rpx" prop="picUrl">
            <yd-upload-img v-model="formData.picUrl" />
          </wd-form-item>
          <wd-form-item title="品牌排序" title-width="220rpx" prop="sort">
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <wd-form-item title="品牌状态" title-width="220rpx" prop="status" center>
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
          <wd-form-item title="品牌描述" title-width="220rpx" prop="description">
            <wd-textarea v-model="formData.description" clearable :maxlength="500" placeholder="请输入品牌描述" />
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
import type { ProductBrand } from '@/api/mall/product/brand'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createProductBrand, getProductBrand, updateProductBrand } from '@/api/mall/product/brand'
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
const getTitle = computed(() => props.id ? '编辑品牌' : '新增品牌')
const formLoading = ref(false) // 表单提交状态
const formData = ref<ProductBrand>({
  id: undefined,
  name: '',
  picUrl: '',
  sort: 0,
  status: CommonStatusEnum.ENABLE,
  description: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '品牌名称不能为空' }],
  picUrl: [{ required: true, message: '品牌图片不能为空' }],
  sort: [{ required: true, message: '品牌排序不能为空' }],
  status: [{ required: true, message: '品牌状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/product/brand/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getProductBrand(props.id)
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
      await updateProductBrand(data)
      toast.success('修改成功')
    } else {
      await createProductBrand(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:product-brand:reload')
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
