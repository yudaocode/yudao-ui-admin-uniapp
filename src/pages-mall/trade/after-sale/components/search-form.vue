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
          售后单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入售后单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          订单号
        </view>
        <wd-input v-model="formData.orderNo" placeholder="请输入订单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          商品名称
        </view>
        <wd-input v-model="formData.spuName" placeholder="请输入商品名称" clearable />
      </view>
      <yd-search-picker v-model="formData.status" label="售后状态" :dict-type="DICT_TYPE.TRADE_AFTER_SALE_STATUS" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          售后方式
        </view>
        <wd-radio-group v-model="formData.way" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.TRADE_AFTER_SALE_WAY)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          售后类型
        </view>
        <wd-radio-group v-model="formData.type" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.TRADE_AFTER_SALE_TYPE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <yd-search-date-range v-model="formData.createTime" label="申请时间" />
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
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  no: undefined as string | undefined,
  orderNo: undefined as string | undefined,
  spuName: undefined as string | undefined,
  status: undefined as number | undefined,
  way: -1,
  type: -1,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`售后单号:${formData.no}`)
  }
  if (formData.orderNo) {
    conditions.push(`订单号:${formData.orderNo}`)
  }
  if (formData.spuName) {
    conditions.push(`商品:${formData.spuName}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.TRADE_AFTER_SALE_STATUS, formData.status)}`)
  }
  if (formData.way !== -1) {
    conditions.push(`方式:${getDictLabel(DICT_TYPE.TRADE_AFTER_SALE_WAY, formData.way)}`)
  }
  if (formData.type !== -1) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.TRADE_AFTER_SALE_TYPE, formData.type)}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索售后单'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    orderNo: formData.orderNo || undefined,
    spuName: formData.spuName || undefined,
    status: formData.status,
    way: formData.way === -1 ? undefined : formData.way,
    type: formData.type === -1 ? undefined : formData.type,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.orderNo = undefined
  formData.spuName = undefined
  formData.status = undefined
  formData.way = -1
  formData.type = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
