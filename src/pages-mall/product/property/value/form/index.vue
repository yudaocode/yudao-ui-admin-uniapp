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
          <PropertyFormPicker v-model="formData.propertyId" prop="propertyId" :disabled="propertyLocked" />
          <wd-form-item title="属性值" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入属性值" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" clearable :maxlength="500" placeholder="请输入备注" />
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
import type { ProductPropertyValue } from '@/api/mall/product/property'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createProductPropertyValue,
  getProductPropertyValue,
  updateProductPropertyValue,
} from '@/api/mall/product/property'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import PropertyFormPicker from '../components/property-form-picker.vue'

const props = defineProps<{
  id?: number | any
  propertyId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑属性值' : '新增属性值')
const formLoading = ref(false) // 表单提交状态
const lockedPropertyId = props.propertyId != null && props.propertyId !== '' ? Number(props.propertyId) : undefined // 从属性列表新增进入时，经路由透传并锁定，不允许自由选择
const propertyLocked = computed(() => !props.id && lockedPropertyId != null)
const formData = ref<ProductPropertyValue>({
  id: undefined,
  propertyId: lockedPropertyId,
  name: '',
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  propertyId: [{ required: true, message: '所属属性不能为空' }],
  name: [{ required: true, message: '属性值不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/product/property/value/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getProductPropertyValue(Number(props.id))
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
      await updateProductPropertyValue(data)
      toast.success('修改成功')
    } else {
      await createProductPropertyValue(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:product-property-value:reload')
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
