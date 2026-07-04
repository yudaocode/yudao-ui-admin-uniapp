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
          名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          分类
        </view>
        <yd-tree-select
          v-model="formData.categoryId"
          :data="categoryTree"
          title="分类"
          placeholder="请选择分类"
        />
      </view>
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
import type { ProductCategory } from '@/api/erp/product/category'
import { computed, onMounted, reactive, ref } from 'vue'
import { getProductCategorySimpleList } from '@/api/erp/product/category'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { handleTree } from '@/utils/tree'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const categoryTree = ref<ProductCategory[]>([]) // 产品分类树
const formData = reactive({
  name: undefined as string | undefined,
  categoryId: undefined as number | undefined,
}) // 搜索表单数据
const categoryName = computed(() => findCategoryName(categoryTree.value, formData.categoryId))

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (categoryName.value) {
    conditions.push(`分类:${categoryName.value}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索产品'
})

/** 查找分类名称 */
function findCategoryName(list: ProductCategory[], id?: number): string {
  if (!id) {
    return ''
  }
  for (const item of list) {
    if (item.id === id) {
      return item.name || ''
    }
    const childName = findCategoryName((item.children || []) as ProductCategory[], id)
    if (childName) {
      return childName
    }
  }
  return ''
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.categoryId = undefined
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(async () => {
  categoryTree.value = handleTree(await getProductCategorySimpleList())
})
</script>
