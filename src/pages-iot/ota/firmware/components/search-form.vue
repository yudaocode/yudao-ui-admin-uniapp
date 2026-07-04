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
          固件名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入固件名称" clearable />
      </view>
      <yd-search-picker
        v-model="formData.productId"
        label="所属产品"
        :columns="productOptions"
        label-key="name"
        value-key="id"
        placeholder="请选择产品"
      />
      <yd-search-date-range v-model="formData.createTime" label="创建时间" />
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
import type { Product } from '@/api/iot/product/product'
import { computed, onMounted, reactive, ref } from 'vue'
import { getSimpleProductList } from '@/api/iot/product/product'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const productOptions = ref<Product[]>([]) // 产品选项
const formData = reactive({
  name: undefined as string | undefined,
  productId: undefined as number | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

const placeholder = computed(() => { // 搜索条件文案
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`固件名称:${formData.name}`)
  }
  if (formData.productId) {
    conditions.push(`产品:${findProductName(formData.productId)}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索固件'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name || undefined,
    productId: formData.productId,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.productId = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}

/** 获取产品名称 */
function findProductName(productId?: number) {
  return productOptions.value.find(item => String(item.id) === String(productId))?.name || String(productId || '')
}

/** 初始化 */
onMounted(async () => {
  productOptions.value = await getSimpleProductList()
})
</script>
