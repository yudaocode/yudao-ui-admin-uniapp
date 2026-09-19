<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search placeholder="搜索办公用品" hide-cancel disabled />
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
          v-model="formData.name"
          placeholder="请输入物品名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          物品编码
        </view>
        <wd-input
          v-model="formData.no"
          placeholder="请输入物品编码"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          类别
        </view>
        <yd-search-picker
          v-model="formData.category"
          :columns="getIntDictOptions(DICT_TYPE.OA_SUPPLY_CATEGORY)"
          all-option
          all-label="全部类别"
          placeholder="请选择类别"
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
          状态
        </view>
        <yd-search-picker
          v-model="formData.status"
          :columns="statusOptions"
          all-option
          all-label="全部状态"
          placeholder="请选择状态"
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
import { reactive, ref } from 'vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const statusOptions = [ // 用品状态选项：0 正常 1 停用
  { label: '正常', value: 0 },
  { label: '停用', value: 1 },
]
const formData = reactive({
  name: undefined as string | undefined,
  no: undefined as string | undefined,
  category: undefined as number | undefined,
  manageType: undefined as number | undefined,
  status: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name || undefined,
    no: formData.no || undefined,
    category: formData.category,
    manageType: formData.manageType,
    status: formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.no = undefined
  formData.category = undefined
  formData.manageType = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
