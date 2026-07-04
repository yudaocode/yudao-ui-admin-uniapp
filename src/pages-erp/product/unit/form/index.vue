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
          <wd-form-item title="单位名字" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入单位名字"
            />
          </wd-form-item>
          <wd-form-item title="单位状态" title-width="200rpx" prop="status" center>
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
            />
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
import type { ProductUnit } from '@/api/erp/product/unit'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createProductUnit, getProductUnit, updateProductUnit } from '@/api/erp/product/unit'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑产品单位' : '新增产品单位')
const formLoading = ref(false) // 表单提交状态
const formData = ref<ProductUnit>({
  id: undefined,
  name: '',
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const formSchema = createFormSchema({
  name: [{ required: true, message: '单位名字不能为空' }],
  status: [{ required: true, message: '单位状态不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/product/unit/index')
}

/** 加载产品单位详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getProductUnit(props.id)
  } finally {
    toast.close()
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
    if (props.id) {
      await updateProductUnit(formData.value)
      toast.success('修改成功')
    } else {
      await createProductUnit(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:product-unit:reload')
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
