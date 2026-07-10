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
          订单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入订单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          用户编号
        </view>
        <wd-input v-model="formData.userId" type="number" placeholder="请输入用户编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          用户昵称
        </view>
        <wd-input v-model="formData.userNickname" placeholder="请输入用户昵称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          用户手机
        </view>
        <wd-input v-model="formData.userMobile" placeholder="请输入用户手机" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          订单状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.TRADE_ORDER_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <PickUpStoreSearchPicker v-model="formData.pickUpStoreId" />
      <yd-search-date-range v-model="formData.createTime" label="下单时间" />
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
import PickUpStoreSearchPicker from '../../pick-up-store/components/pick-up-store-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  no: undefined as string | undefined,
  userId: undefined as string | undefined,
  userNickname: undefined as string | undefined,
  userMobile: undefined as string | undefined,
  status: -1,
  pickUpStoreId: -1, // 单选自提门店，提交时转 pickUpStoreIds 数组
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`订单号:${formData.no}`)
  }
  if (formData.userNickname) {
    conditions.push(`昵称:${formData.userNickname}`)
  }
  if (formData.userMobile) {
    conditions.push(`手机:${formData.userMobile}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.TRADE_ORDER_STATUS, formData.status)}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索核销订单'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    userId: formData.userId ? Number(formData.userId) : undefined,
    userNickname: formData.userNickname || undefined,
    userMobile: formData.userMobile || undefined,
    status: formData.status === -1 ? undefined : formData.status,
    pickUpStoreIds: formData.pickUpStoreId === -1 ? undefined : [formData.pickUpStoreId],
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.userId = undefined
  formData.userNickname = undefined
  formData.userMobile = undefined
  formData.status = -1
  formData.pickUpStoreId = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
