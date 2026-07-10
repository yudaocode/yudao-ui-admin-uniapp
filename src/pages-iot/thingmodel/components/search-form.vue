<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <ProductSearchPicker ref="productPickerRef" v-model="formData.productId" label="所属产品" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          功能标识
        </view>
        <wd-input v-model="formData.identifier" placeholder="请输入功能标识" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          功能名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入功能名称" clearable />
      </view>
      <yd-search-picker
        v-model="formData.type"
        label="功能类型"
        :dict-type="DICT_TYPE.IOT_THING_MODEL_TYPE"
        all-option
      />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import ProductSearchPicker from '@/pages-iot/product/product/components/product-search-picker.vue'

const props = defineProps<{ defaultProductId?: number | any }>()
const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()
const visible = ref(false) // 搜索弹窗显示状态
const productPickerRef = ref<InstanceType<typeof ProductSearchPicker>>() // 产品选择器
const defaultProductId = props.defaultProductId ? Number(props.defaultProductId) : undefined // 入口预置产品
const formData = reactive({
  productId: defaultProductId as number | undefined,
  identifier: undefined as string | undefined,
  name: undefined as string | undefined,
  type: -1,
}) // 搜索表单数据
const placeholder = computed(() => { // 搜索条件文案
  const conditions: string[] = []
  if (formData.productId) {
    conditions.push(`产品:${productPickerRef.value?.format(formData.productId) || formData.productId}`)
  }
  if (formData.identifier) {
    conditions.push(`标识:${formData.identifier}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.type !== -1) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.IOT_THING_MODEL_TYPE, formData.type)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索物模型'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    productId: formData.productId,
    identifier: formData.identifier || undefined,
    name: formData.name || undefined,
    type: formData.type === -1 ? undefined : formData.type,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.productId = defaultProductId
  formData.identifier = undefined
  formData.name = undefined
  formData.type = -1
  visible.value = false
  emit('reset')
}
</script>
