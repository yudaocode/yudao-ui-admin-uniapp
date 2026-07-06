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
          工单编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入工单编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工单名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入工单名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          来源单据
        </view>
        <wd-input v-model="formData.orderSourceCode" placeholder="请输入来源单据编号" clearable />
      </view>
      <yd-search-picker v-model="formData.productId" label="产品" :columns="productOptions" label-key="name" value-key="id" placeholder="请选择产品" />
      <yd-search-picker v-model="formData.clientId" label="客户" :columns="clientOptions" label-key="name" value-key="id" placeholder="请选择客户" />
      <yd-search-date-range v-model="formData.requestDate" label="需求日期" />
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
import { computed, onMounted, reactive, ref } from 'vue'
import { getClientPage } from '@/api/mes/md/client'
import { getItemPage } from '@/api/mes/md/item'
import { CommonStatusEnum } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

interface SearchFormData {
  code?: string
  name?: string
  orderSourceCode?: string
  productId?: number
  clientId?: number
  requestDate?: [number | undefined, number | undefined]
}

interface SearchOption {
  id?: number
  name: string
}

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const productOptions = ref<SearchOption[]>([]) // 产品选项
const clientOptions = ref<SearchOption[]>([]) // 客户选项
const formData = reactive<SearchFormData>({
  code: undefined,
  name: undefined,
  orderSourceCode: undefined,
  productId: undefined,
  clientId: undefined,
  requestDate: [undefined, undefined],
})

/** 获取选项名称 */
function getOptionLabel(options: SearchOption[], id?: number) {
  if (!id) {
    return ''
  }
  return options.find(item => String(item.id) === String(id))?.name || String(id)
}

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.orderSourceCode) {
    conditions.push(`来源:${formData.orderSourceCode}`)
  }
  if (formData.productId) {
    conditions.push(`产品:${getOptionLabel(productOptions.value, formData.productId)}`)
  }
  if (formData.clientId) {
    conditions.push(`客户:${getOptionLabel(clientOptions.value, formData.clientId)}`)
  }
  if (formData.requestDate?.[0] && formData.requestDate?.[1]) {
    conditions.push(`需求日期:${formatDate(formData.requestDate[0])}~${formatDate(formData.requestDate[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索待排产工单'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    orderSourceCode: formData.orderSourceCode || undefined,
    productId: formData.productId,
    clientId: formData.clientId,
    requestDate: formatDateRange(formData.requestDate),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.orderSourceCode = undefined
  formData.productId = undefined
  formData.clientId = undefined
  formData.requestDate = [undefined, undefined]
  visible.value = false
  emit('reset')
}

/** 加载搜索下拉选项 */
onMounted(async () => {
  const [products, clients] = await Promise.all([
    getItemPage({
      itemOrProduct: 'PRODUCT',
      status: CommonStatusEnum.ENABLE,
      pageNo: 1,
      pageSize: 100,
    }),
    getClientPage({
      status: CommonStatusEnum.ENABLE,
      pageNo: 1,
      pageSize: 100,
    }),
  ])
  productOptions.value = products.list
  clientOptions.value = clients.list
})
</script>
