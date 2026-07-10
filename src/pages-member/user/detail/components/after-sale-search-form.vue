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
        <wd-input v-model="formData.spuName" placeholder="请输入商品名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          退款编号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入退款编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          订单编号
        </view>
        <wd-input v-model="formData.orderNo" placeholder="请输入订单编号" clearable />
      </view>
      <yd-search-picker v-model="formData.status" label="售后状态" :dict-type="DICT_TYPE.TRADE_AFTER_SALE_STATUS" all-option />
      <yd-search-picker v-model="formData.way" label="售后方式" :dict-type="DICT_TYPE.TRADE_AFTER_SALE_WAY" all-option />
      <yd-search-picker v-model="formData.type" label="售后类型" :dict-type="DICT_TYPE.TRADE_AFTER_SALE_TYPE" all-option />
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
import { computed, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  spuName: undefined as string | undefined,
  no: undefined as string | undefined,
  orderNo: undefined as string | undefined,
  status: -1,
  way: -1,
  type: -1,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.spuName) {
    conditions.push(`商品:${formData.spuName}`)
  }
  if (formData.no) {
    conditions.push(`退款:${formData.no}`)
  }
  if (formData.orderNo) {
    conditions.push(`订单:${formData.orderNo}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.TRADE_AFTER_SALE_STATUS, formData.status)}`)
  }
  if (formData.way !== -1) {
    conditions.push(`方式:${getDictLabel(DICT_TYPE.TRADE_AFTER_SALE_WAY, formData.way)}`)
  }
  if (formData.type !== -1) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.TRADE_AFTER_SALE_TYPE, formData.type)}`)
  }
  if (formData.createTime[0] && formData.createTime[1]) {
    conditions.push(`创建:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索售后记录'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    status: formData.status === -1 ? undefined : formData.status,
    way: formData.way === -1 ? undefined : formData.way,
    type: formData.type === -1 ? undefined : formData.type,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.spuName = undefined
  formData.no = undefined
  formData.orderNo = undefined
  formData.status = -1
  formData.way = -1
  formData.type = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
