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
      <yd-search-picker v-model="formData.type" label="工单类型" :dict-type="DICT_TYPE.MES_PRO_WORK_ORDER_TYPE" all-option :all-value="undefined" />
      <yd-search-picker v-model="formData.status" label="工单状态" :dict-type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" all-option :all-value="undefined" />
      <yd-search-date-range v-model="requestDateRange" label="需求日期" />
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
import type { ProWorkOrderQueryParams } from '@/api/mes/pro/workorder'
import { computed, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Partial<ProWorkOrderQueryParams>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const requestDateRange = ref<[number | undefined, number | undefined]>() // 需求日期范围
const formData = reactive({
  code: '',
  name: '',
  orderSourceCode: '',
  type: undefined as number | undefined,
  status: undefined as number | undefined,
}) // 搜索表单数据

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
  if (formData.type != null) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_PRO_WORK_ORDER_TYPE, formData.type)}`)
  }
  if (formData.status != null) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_PRO_WORK_ORDER_STATUS, formData.status)}`)
  }
  if (requestDateRange.value?.length === 2) {
    conditions.push('需求日期')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索生产工单'
})

/** 构造搜索参数 */
function buildParams(): Partial<ProWorkOrderQueryParams> {
  const params: Partial<ProWorkOrderQueryParams> = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.name) {
    params.name = formData.name
  }
  if (formData.orderSourceCode) {
    params.orderSourceCode = formData.orderSourceCode
  }
  if (formData.type != null) {
    params.type = formData.type
  }
  if (formData.status != null) {
    params.status = formData.status
  }
  const range = formatDateRange(requestDateRange.value)
  if (range) {
    params.requestDate = range
  }
  return params
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildParams())
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.orderSourceCode = undefined
  formData.productId = undefined
  formData.clientId = undefined
  formData.type = undefined
  formData.status = undefined
  requestDateRange.value = [undefined, undefined]
  visible.value = false
  emit('reset')
}

/** 加载搜索选项 */
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
