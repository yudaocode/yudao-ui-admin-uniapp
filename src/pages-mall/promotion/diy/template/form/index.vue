<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="模板名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入模板名称" />
          </wd-form-item>
          <wd-form-item title="预览图" title-width="200rpx" prop="previewPicUrls">
            <yd-upload-imgs v-model="formData.previewPicUrls" :limit="9" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea v-model="formData.remark" clearable :maxlength="500" placeholder="请输入备注" />
          </wd-form-item>
          <wd-form-item v-if="isEdit" title="装修属性" title-width="200rpx" prop="property">
            <wd-textarea
              v-model="formData.property"
              clearable
              placeholder="请输入装修属性 JSON"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 装修属性说明 -->
      <view class="px-24rpx py-18rpx text-24rpx text-[#999]">
        移动端仅维护模板基础信息与 JSON 装修属性，可视化拖拽装修请前往 PC 端。
      </view>
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
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPromotionDiyTemplate,
  getPromotionDiyTemplate,
  getPromotionDiyTemplateProperty,
  updatePromotionDiyTemplate,
  updatePromotionDiyTemplateProperty,
} from '@/api/mall/promotion/diy/template'
import { delay, navigateBackPlus } from '@/utils'
import { formatJson } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'

interface DiyTemplateFormData {
  id?: number
  name?: string
  remark?: string
  previewPicUrls?: string[]
  property?: string // 装修属性 JSON 文本（编辑时维护）
}

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
const isEdit = computed(() => !!props.id)
const getTitle = computed(() => props.id ? '编辑装修模板' : '新增装修模板')
const formLoading = ref(false) // 表单提交状态
const formData = ref<DiyTemplateFormData>({
  id: undefined,
  name: '',
  remark: '',
  previewPicUrls: [],
  property: '{}',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '模板名称不能为空' }],
  property: [{ validator: validateProperty }], // 装修属性仅编辑时显示，需为合法 JSON
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 校验装修属性 JSON */
function validateProperty(value: string) {
  if (!isEdit.value || !value?.trim()) {
    return Promise.resolve()
  }
  try {
    JSON.parse(value)
    return Promise.resolve()
  } catch {
    return Promise.reject(new Error('装修属性需为合法 JSON'))
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/diy/template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const detail = await getPromotionDiyTemplate(Number(props.id))
  const property = await getPromotionDiyTemplateProperty(Number(props.id))
  formData.value = {
    id: Number(props.id),
    name: detail.name,
    remark: detail.remark,
    previewPicUrls: detail.previewPicUrls || [],
    property: formatJson(property.property ?? detail.property, '{}'),
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
    const baseData = {
      id: formData.value.id,
      name: formData.value.name,
      remark: formData.value.remark,
      previewPicUrls: formData.value.previewPicUrls || [],
    }
    if (props.id) {
      await updatePromotionDiyTemplate(baseData)
      // 装修属性走独立接口更新
      await updatePromotionDiyTemplateProperty({
        id: formData.value.id,
        property: formData.value.property?.trim() || '{}',
      })
      toast.success('修改成功')
    } else {
      await createPromotionDiyTemplate(baseData)
      toast.success('新增成功')
    }
    uni.$emit('mall:promotion-diy-template:reload')
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
