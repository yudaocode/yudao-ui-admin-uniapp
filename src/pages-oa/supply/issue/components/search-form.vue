<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search placeholder="搜索发放明细" hide-cancel disabled />
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
          物品名称
        </view>
        <wd-input
          v-model="formData.itemName"
          placeholder="请输入物品名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          申请人
        </view>
        <wd-input
          v-model="formData.creatorName"
          placeholder="请输入申请人"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          管理类型
        </view>
        <yd-search-picker
          v-model="formData.manageType"
          :columns="getIntDictOptions(DICT_TYPE.OA_SUPPLY_MANAGE_TYPE)"
          all-option
          all-label="全部管理类型"
          placeholder="请选择管理类型"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          使用类型
        </view>
        <yd-search-picker
          v-model="formData.useType"
          :columns="getIntDictOptions(DICT_TYPE.OA_SUPPLY_USE_TYPE)"
          all-option
          all-label="全部使用类型"
          placeholder="请选择使用类型"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          明细状态
        </view>
        <yd-search-picker
          v-model="formData.status"
          :columns="getIntDictOptions(DICT_TYPE.OA_SUPPLY_ITEM_STATUS)"
          all-option
          all-label="全部状态"
          placeholder="请选择明细状态"
        />
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
import { reactive, ref } from 'vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  itemName: undefined as string | undefined,
  creatorName: undefined as string | undefined,
  manageType: undefined as number | undefined,
  useType: undefined as number | undefined,
  status: undefined as number | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    itemName: formData.itemName || undefined,
    creatorName: formData.creatorName || undefined,
    manageType: formData.manageType,
    useType: formData.useType,
    status: formData.status,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.itemName = undefined
  formData.creatorName = undefined
  formData.manageType = undefined
  formData.useType = undefined
  formData.status = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
