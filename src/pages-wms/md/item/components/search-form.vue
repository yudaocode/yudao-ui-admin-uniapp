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
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          商品名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入商品名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          商品编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入商品编号" clearable />
      </view>
      <ItemCategorySearchPicker ref="categoryPickerRef" v-model="formData.categoryId" label="商品分类" placeholder="请选择商品分类" />
      <ItemBrandSearchPicker ref="brandPickerRef" v-model="formData.brandId" label="商品品牌" placeholder="请选择商品品牌" />
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
import ItemBrandSearchPicker from '@/pages-wms/md/item/brand/components/item-brand-search-picker.vue'
import ItemCategorySearchPicker from '@/pages-wms/md/item/category/components/item-category-search-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const categoryPickerRef = ref<InstanceType<typeof ItemCategorySearchPicker>>()
const brandPickerRef = ref<InstanceType<typeof ItemBrandSearchPicker>>()
const formData = reactive({
  name: undefined as string | undefined,
  code: undefined as string | undefined,
  categoryId: undefined as number | undefined,
  brandId: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.categoryId) {
    conditions.push(`分类:${categoryPickerRef.value?.format(formData.categoryId) || formData.categoryId}`)
  }
  if (formData.brandId) {
    conditions.push(`品牌:${brandPickerRef.value?.format(formData.brandId) || formData.brandId}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索商品'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.code = undefined
  formData.categoryId = undefined
  formData.brandId = undefined
  visible.value = false
  emit('reset')
}
</script>
