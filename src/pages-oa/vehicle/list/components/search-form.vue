<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search placeholder="搜索车辆" hide-cancel disabled />
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
          车牌号
        </view>
        <wd-input
          v-model="formData.no"
          placeholder="请输入车牌号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          车辆名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入车辆名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          车辆分类
        </view>
        <yd-search-picker
          v-model="formData.category"
          :columns="getStrDictOptions(DICT_TYPE.OA_VEHICLE_CATEGORY)"
          all-option
          all-label="全部分类"
          placeholder="请选择车辆分类"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          状态
        </view>
        <yd-search-picker
          v-model="formData.status"
          :columns="getIntDictOptions(DICT_TYPE.OA_VEHICLE_STATUS)"
          all-option
          all-label="全部状态"
          placeholder="请选择状态"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          车型
        </view>
        <wd-input
          v-model="formData.type"
          placeholder="请输入车型"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          品牌型号
        </view>
        <wd-input
          v-model="formData.brandModel"
          placeholder="请输入品牌型号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          所属部门
        </view>
        <DeptSearchPicker v-model="formData.deptId" placeholder="请选择所属部门" />
      </view>
      <yd-search-date-range v-model="formData.compulsoryInsuranceExpireTime" label="交强险到期" />
      <yd-search-date-range v-model="formData.commercialInsuranceExpireTime" label="商业险到期" />
      <yd-search-date-range v-model="formData.inspectionExpireTime" label="年检到期" />
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
import { DeptSearchPicker } from '@/components/system-select'
import { getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  type: undefined as string | undefined,
  brandModel: undefined as string | undefined,
  deptId: undefined as number | undefined,
  compulsoryInsuranceExpireTime: [undefined, undefined] as [number | undefined, number | undefined],
  commercialInsuranceExpireTime: [undefined, undefined] as [number | undefined, number | undefined],
  inspectionExpireTime: [undefined, undefined] as [number | undefined, number | undefined],
  no: undefined as string | undefined,
  name: undefined as string | undefined,
  category: undefined as string | undefined,
  status: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    type: formData.type || undefined,
    brandModel: formData.brandModel || undefined,
    deptId: formData.deptId,
    compulsoryInsuranceExpireTime: formatDateRange(formData.compulsoryInsuranceExpireTime),
    commercialInsuranceExpireTime: formatDateRange(formData.commercialInsuranceExpireTime),
    inspectionExpireTime: formatDateRange(formData.inspectionExpireTime),
    no: formData.no || undefined,
    name: formData.name || undefined,
    category: formData.category,
    status: formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.type = undefined
  formData.brandModel = undefined
  formData.deptId = undefined
  formData.compulsoryInsuranceExpireTime = [undefined, undefined]
  formData.commercialInsuranceExpireTime = [undefined, undefined]
  formData.inspectionExpireTime = [undefined, undefined]
  formData.no = undefined
  formData.name = undefined
  formData.category = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
